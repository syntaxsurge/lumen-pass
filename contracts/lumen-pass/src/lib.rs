#![no_std]

use core::cmp::max;
use soroban_sdk::token::TokenClient;
use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, panic_with_error, Address,
    Env,
};

#[contracterror]
pub enum Error {
    AlreadyInitialized = 1,
    InvalidPrice = 2,
    InvalidDuration = 3,
    FeeBpsTooHigh = 4,
}

#[derive(Clone)]
#[contractevent]
pub struct SubscriptionEvent {
    #[topic]
    pub user: Address,
    pub amount: i128,
    pub expiry: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct Config {
    pub creator: Address,
    pub token: Address,
    pub price: i128,
    pub duration_ledgers: u32,
    pub platform: Option<Address>,
    pub fee_bps: u32,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Creator,
    Token,
    Price,
    Duration,
    Platform,
    FeeBps,
    Expiry(Address),
}

#[contract]
pub struct LumenPass;

#[contractimpl]
impl LumenPass {
    pub fn init(
        env: Env,
        creator: Address,
        token: Address,
        price: i128,
        duration_ledgers: u32,
        platform: Option<Address>,
        fee_bps: u32,
    ) {
        if env.storage().persistent().has(&DataKey::Creator) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }

        if price <= 0 {
            panic_with_error!(&env, Error::InvalidPrice);
        }

        if duration_ledgers == 0 {
            panic_with_error!(&env, Error::InvalidDuration);
        }

        if fee_bps > 10_000 {
            panic_with_error!(&env, Error::FeeBpsTooHigh);
        }

        creator.require_auth();

        let store = env.storage().persistent();
        store.set(&DataKey::Creator, &creator);
        store.set(&DataKey::Token, &token);
        store.set(&DataKey::Price, &price);
        store.set(&DataKey::Duration, &duration_ledgers);
        store.set(&DataKey::FeeBps, &fee_bps);
        if let Some(address) = platform {
            store.set(&DataKey::Platform, &address);
        }
    }

    pub fn subscribe(env: Env, user: Address) -> u32 {
        let price: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Price)
            .expect("price missing");
        let token: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Token)
            .expect("token missing");
        let creator: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Creator)
            .expect("creator missing");
        let duration: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::Duration)
            .expect("duration missing");
        let fee_bps: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::FeeBps)
            .expect("fee missing");
        let platform: Option<Address> = env.storage().persistent().get(&DataKey::Platform);

        user.require_auth();

        let fee = if fee_bps == 0 {
            0
        } else {
            price * (fee_bps as i128) / 10_000
        };
        let platform_share = if fee > 0 && platform.is_some() {
            fee
        } else {
            0
        };
        let to_creator = price - platform_share;

        let sac = TokenClient::new(&env, &token);
        sac.transfer(&user, &creator, &to_creator);
        if platform_share > 0 {
            sac.transfer(&user, platform.as_ref().unwrap(), &platform_share);
        }

        let key = DataKey::Expiry(user.clone());
        let now = env.ledger().sequence();
        let current: Option<u32> = env.storage().persistent().get(&key);
        let base = max(current.unwrap_or(now), now);
        let new_expiry = base.saturating_add(duration);
        env.storage().persistent().set(&key, &new_expiry);

        SubscriptionEvent {
            user,
            amount: price,
            expiry: new_expiry,
        }
        .publish(&env);

        new_expiry
    }

    pub fn is_member(env: Env, user: Address) -> bool {
        match env
            .storage()
            .persistent()
            .get::<_, u32>(&DataKey::Expiry(user))
        {
            Some(expiry) => env.ledger().sequence() <= expiry,
            None => false,
        }
    }

    pub fn expires_at(env: Env, user: Address) -> Option<u32> {
        env.storage().persistent().get(&DataKey::Expiry(user))
    }

    pub fn price(env: Env) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Price)
            .expect("price missing")
    }

    pub fn config(env: Env) -> Config {
        Config {
            creator: env
                .storage()
                .persistent()
                .get(&DataKey::Creator)
                .expect("creator missing"),
            token: env
                .storage()
                .persistent()
                .get(&DataKey::Token)
                .expect("token missing"),
            price: env
                .storage()
                .persistent()
                .get(&DataKey::Price)
                .expect("price missing"),
            duration_ledgers: env
                .storage()
                .persistent()
                .get(&DataKey::Duration)
                .expect("duration missing"),
            platform: env.storage().persistent().get(&DataKey::Platform),
            fee_bps: env
                .storage()
                .persistent()
                .get(&DataKey::FeeBps)
                .expect("fee missing"),
        }
    }
}
