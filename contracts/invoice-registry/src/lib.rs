#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Env, Symbol};

#[contracterror]
pub enum Error {
    AlreadyPaid = 1,
    NotIssuer = 2,
    NotFound = 3,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Invoice(u64),
    NextId,
}

#[derive(Clone)]
#[contracttype]
pub struct Invoice {
    pub id: u64,
    pub issuer: Address,
    pub payer: Option<Address>,
    pub amount: i128,
    pub paid: bool,
    pub reference: Option<Symbol>,
}

#[contract]
pub struct InvoiceRegistry;

#[contractimpl]
impl InvoiceRegistry {
    pub fn __constructor(env: Env) {
        if !env.storage().persistent().has(&DataKey::NextId) {
            env.storage().persistent().set(&DataKey::NextId, &0u64);
        }
    }

    pub fn issue(
        env: Env,
        issuer: Address,
        payer: Option<Address>,
        amount: i128,
        reference: Option<Symbol>,
    ) -> u64 {
        issuer.require_auth();

        let mut next: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::NextId)
            .unwrap_or(0u64);
        let id = next;
        next = next.saturating_add(1);
        env.storage().persistent().set(&DataKey::NextId, &next);

        let invoice = Invoice {
            id,
            issuer: issuer.clone(),
            payer,
            amount,
            paid: false,
            reference,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Invoice(id), &invoice);

        id
    }

    pub fn get(env: Env, id: u64) -> Option<Invoice> {
        env.storage().persistent().get(&DataKey::Invoice(id))
    }

    pub fn mark_paid(env: Env, id: u64, issuer: Address) {
        let key = DataKey::Invoice(id);
        let mut inv: Invoice = match env.storage().persistent().get(&key) {
            Some(v) => v,
            None => panic_with_error!(&env, Error::NotFound),
        };
        issuer.require_auth();
        if inv.issuer != issuer {
            panic_with_error!(&env, Error::NotIssuer);
        }
        if inv.paid {
            panic_with_error!(&env, Error::AlreadyPaid);
        }
        inv.paid = true;
        env.storage().persistent().set(&key, &inv);
    }

    // Simple count to support pagination by the client if needed.
    pub fn count(env: Env) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::NextId)
            .unwrap_or(0u64)
    }
}
