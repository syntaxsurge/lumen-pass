use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, panic_with_error, Address,
    Env, String,
};
use stellar_macros::default_impl;
use stellar_tokens::non_fungible::{
    burnable::NonFungibleBurnable,
    enumerable::{Enumerable, NonFungibleEnumerable},
    Base, NonFungibleToken,
};

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Error {
    AlreadyInitialized = 1,
    NotAuthorized = 2,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Owner,
}

#[derive(Clone)]
#[contractevent]
pub struct BadgeIssuedEvent {
    pub recipient: Address,
    pub token_id: u32,
}

#[contract]
pub struct LumenPassBadges;

#[contractimpl]
impl LumenPassBadges {
    pub fn init(env: Env, owner: Address, base_uri: String, name: String, symbol: String) {
        if env.storage().instance().has(&DataKey::Owner) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }

        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
        Base::set_metadata(&env, base_uri, name, symbol);
    }

    pub fn mint_badge(env: Env, to: Address) -> u32 {
        let owner = Self::read_owner(&env);
        owner.require_auth();

        let token_id = Enumerable::sequential_mint(&env, &to);
        BadgeIssuedEvent { recipient: to, token_id }.publish(&env);
        token_id
    }

    pub fn set_metadata(env: Env, base_uri: String, name: String, symbol: String) {
        let owner = Self::read_owner(&env);
        owner.require_auth();
        Base::set_metadata(&env, base_uri, name, symbol);
    }

    pub fn owner(env: Env) -> Address {
        Self::read_owner(&env)
    }

    fn read_owner(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Owner)
            .expect("contract not initialized")
    }
}

#[default_impl]
#[contractimpl]
impl NonFungibleToken for LumenPassBadges {
    type ContractType = Enumerable;
}

#[default_impl]
#[contractimpl]
impl NonFungibleEnumerable for LumenPassBadges {}

#[default_impl]
#[contractimpl]
impl NonFungibleBurnable for LumenPassBadges {}
