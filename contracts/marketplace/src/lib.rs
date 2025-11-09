#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, contracttype, Address, Env};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Listing(u128),
    Platform,
    FeeBps,
    Initialized,
}

#[derive(Clone)]
#[contracttype]
pub struct Listing {
    pub seller: Address,
    pub price: i128,
    pub active: bool,
}

#[contract]
pub struct Marketplace;

#[derive(Clone)]
#[contractevent]
pub struct ListedEvent {
    pub id: u128,
    pub seller: Address,
    pub price: i128,
}

#[derive(Clone)]
#[contractevent]
pub struct CanceledEvent {
    pub id: u128,
    pub seller: Address,
}

#[derive(Clone)]
#[contractevent]
pub struct BoughtEvent {
    pub id: u128,
    pub buyer: Address,
    pub price: i128,
}

#[contractimpl]
impl Marketplace {
    pub fn init(env: Env, platform: Address, fee_bps: u32) {
        if env.storage().persistent().has(&DataKey::Initialized) {
            panic!("already initialized");
        }
        if fee_bps > 10_000 {
            panic!("fee too high");
        }
        env.storage().persistent().set(&DataKey::Platform, &platform);
        env.storage().persistent().set(&DataKey::FeeBps, &fee_bps);
        env.storage().persistent().set(&DataKey::Initialized, &true);
    }
    pub fn list(env: Env, id: u128, seller: Address, price: i128) {
        if price <= 0 {
            panic!("price must be positive");
        }
        seller.require_auth();
        let key = DataKey::Listing(id);
        let existing: Option<Listing> = env.storage().persistent().get(&key);
        if let Some(l) = existing {
            if l.active {
                panic!("listing already active")
            }
        }
        let listing = Listing { seller: seller.clone(), price, active: true };
        env.storage().persistent().set(&key, &listing);
        ListedEvent { id, seller, price }.publish(&env);
    }

    pub fn cancel(env: Env, id: u128, seller: Address) {
        seller.require_auth();
        let key = DataKey::Listing(id);
        let mut listing: Listing = env
            .storage()
            .persistent()
            .get(&key)
            .expect("listing not found");
        if listing.seller != seller {
            panic!("only seller can cancel");
        }
        listing.active = false;
        env.storage().persistent().set(&key, &listing);
        CanceledEvent { id, seller }.publish(&env);
    }

    /// Buyer purchases a listing with native/issued token via SAC.
    pub fn buy(env: Env, token: Address, id: u128, buyer: Address) {
        buyer.require_auth();
        let key = DataKey::Listing(id);
        let mut listing: Listing = env
            .storage()
            .persistent()
            .get(&key)
            .expect("listing not found");
        if !listing.active {
            panic!("listing inactive")
        }

        let sac = soroban_sdk::token::TokenClient::new(&env, &token);
        let fee_bps: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::FeeBps)
            .expect("fee missing");
        let platform: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Platform)
            .expect("platform missing");
        let fee: i128 = listing.price * (fee_bps as i128) / 10_000;
        let to_seller = listing.price - fee;
        if fee > 0 {
            sac.transfer(&buyer, &platform, &fee);
        }
        sac.transfer(&buyer, &listing.seller, &to_seller);

        listing.active = false;
        let price = listing.price;
        env.storage().persistent().set(&key, &listing);
        BoughtEvent { id, buyer, price }.publish(&env);
    }

    pub fn get(env: Env, id: u128) -> Option<Listing> {
        env.storage().persistent().get(&DataKey::Listing(id))
    }
}
