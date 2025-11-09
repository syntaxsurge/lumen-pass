#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Listing(u128),
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

#[contractimpl]
impl Marketplace {
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
        env.events().publish((Symbol::new(&env, "list"), id), (seller, price));
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
        env.events().publish((Symbol::new(&env, "cancel"), id), seller);
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
        sac.transfer(&buyer, &listing.seller, &listing.price);

        listing.active = false;
        env.storage().persistent().set(&key, &listing);
        env.events()
            .publish((Symbol::new(&env, "buy"), id), (buyer, listing.price));
    }

    pub fn get(env: Env, id: u128) -> Option<Listing> {
        env.storage().persistent().get(&DataKey::Listing(id))
    }
}

