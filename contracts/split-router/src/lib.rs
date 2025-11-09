#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec};

#[contract]
pub struct SplitRouter;

#[derive(Clone)]
#[contracttype]
pub enum Event {
    SplitExecuted,
}

fn assert_bps_valid(bps: &Vec<u32>) {
    let mut sum: u32 = 0;
    for v in bps.iter() {
        sum = sum.checked_add(v).expect("bps overflow");
    }
    if sum != 10_000 {
        panic!("recipient shares must sum to 10000 bps")
    }
}

#[contractimpl]
impl SplitRouter {
    /// Split `amount` of the given `token` (SAC or issued asset) from `payer`
    /// to the list of `recipients`, using basis points in `shares_bps`.
    /// The `payer` must authorize this call.
    pub fn split(
        env: Env,
        token: Address,
        payer: Address,
        recipients: Vec<Address>,
        shares_bps: Vec<u32>,
        amount: i128,
    ) {
        if amount <= 0 {
            panic!("amount must be positive");
        }
        if recipients.len() == 0 {
            panic!("at least one recipient required");
        }
        if recipients.len() != shares_bps.len() {
            panic!("recipients and shares length mismatch");
        }
        payer.require_auth();

        assert_bps_valid(&shares_bps);

        let sac = soroban_sdk::token::TokenClient::new(&env, &token);

        // Compute per-recipient amounts; distribute remainder to the last one.
        let mut computed: Vec<i128> = Vec::new(&env);
        let mut acc: i128 = 0;
        for b in shares_bps.iter() {
            let part = amount * (b as i128) / 10_000i128;
            computed.push_back(part);
            acc += part;
        }
        let remainder = amount - acc;
        if remainder != 0 && computed.len() > 0 {
            let last_idx = computed.len() - 1;
            let mut last = computed.get(last_idx).unwrap();
            last += remainder;
            computed.set(last_idx, last);
        }

        // Execute transfers from payer to each recipient.
        for i in 0..recipients.len() {
            let to = recipients.get(i).unwrap();
            let amt = computed.get(i).unwrap();
            if amt > 0 {
                sac.transfer(&payer, &to, &amt);
            }
        }

        env.events().publish(
            (Symbol::new(&env, "split"), Event::SplitExecuted),
            (payer, amount),
        );
    }
}
