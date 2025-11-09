#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, contracttype, Address, Env, String};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Owner,
    Entry(String),
}

#[contract]
pub struct Registrar;

#[derive(Clone)]
#[contractevent]
pub struct SetEvent {
    pub name: String,
    pub contract: Address,
}

#[contractimpl]
impl Registrar {
    pub fn init(env: Env, owner: Address) {
        if env.storage().persistent().has(&DataKey::Owner) {
            panic!("already initialized");
        }
        owner.require_auth();
        env.storage().persistent().set(&DataKey::Owner, &owner);
    }

    pub fn set(env: Env, name: String, contract_id: Address) {
        let owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Owner)
            .expect("owner not set");
        owner.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::Entry(name.clone()), &contract_id);
        SetEvent { name, contract: contract_id }.publish(&env);
    }

    pub fn remove(env: Env, name: String) {
        let owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Owner)
            .expect("owner not set");
        owner.require_auth();
        env.storage().persistent().remove(&DataKey::Entry(name));
    }

    pub fn resolve(env: Env, name: String) -> Option<Address> {
        env.storage().persistent().get(&DataKey::Entry(name))
    }
}
