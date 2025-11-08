# LumenPass · Soroban-Native Memberships

LumenPass is a stripped-down showcase of the Scaffold Stellar workflow:

- **Rust contract** (`contracts/lumen-pass`) that charges native XLM, distributes fees, and emits events.
- **Generated TypeScript client** (`packages/lumen_pass`) produced from the Soroban spec.
- **Next.js frontend** (`apps/web`) using Stellar Wallets Kit to connect wallets and call the contract.

The goal is to help Stellar hackathon teams go from contract idea to fully working demo with minimal setup.

---

## 1. Prerequisites

- Rust toolchain + `wasm32-unknown-unknown` target
- `stellar` CLI ≥ 23.1 and `stellar-scaffold-cli`
- Node.js 22+ with npm
- Docker (optional; only needed if you want local quickstart instead of Testnet)

Install the Stellar tooling with Cargo:

```bash
cargo install --locked stellar-cli
cargo install --locked stellar-scaffold-cli
```

---

## 2. Install dependencies

```bash
npm install
```

This installs the root workspace, the Soroban client package, and the Next.js frontend.

---

## 3. Environment variables

Duplicate the example file and adjust as needed:

```bash
cp .env.example .env
```

Important variables:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | RPC endpoint (defaults to Soroban Testnet) |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | Network passphrase |
| `NEXT_PUBLIC_LUMENPASS_CONTRACT_ID` | Registry alias or contract ID to call |
| `NEXT_PUBLIC_NATIVE_ASSET_CONTRACT_ID` | Native SAC contract ID (use `stellar contract id asset --asset native`) |

If the contract IDs are blank the UI will still load but the “Activate membership” button stays disabled.

---

## 4. Run the dev server

```bash
npm run dev
```

The root script runs two commands in parallel:

1. `stellar scaffold watch --build-clients` recompiles the Soroban workspace and regenerates `packages/lumen_pass`.
2. `next dev` serves the UI from `apps/web` on http://localhost:3000.

Open the site, connect a Wallets Kit-compatible wallet (Freighter, Lobstr, etc.), and invoke the contract.

---

## 5. Production build

```bash
npm run build
```

- Rebuilds all Soroban contracts via `stellar scaffold build`.
- Runs `next build` in `apps/web` and outputs to `apps/web/.next`.

Serve the optimized build with `npm run start`.

---

## 6. Publishing / deploying the contract

```bash
stellar scaffold build --package lumen-pass
stellar registry publish --wasm target/stellar/local/lumen_pass.wasm --wasm-name lumen-pass
stellar registry deploy \
  --wasm-name lumen-pass \
  --contract-name lumenpass-demo \
  -- \
  --creator <G...creator> \
  --token $(stellar contract id asset --network testnet --asset native) \
  --price 2500000 \
  --duration-ledgers 17280 \
  --platform <G...platform> \
  --fee-bps 250
stellar registry install lumenpass-demo
```

Update `.env` with the new contract ID when redeploying.

---

## 7. Repository layout

```
contracts/                # Soroban workspace
packages/lumen_pass       # Generated TypeScript bindings
apps/web                  # Next.js frontend (App Router)
```

---

## 8. Scripts cheat sheet

| Command | Description |
| --- | --- |
| `npm run dev` | Watch contracts + run Next dev server |
| `npm run build` | Build Soroban Wasm + Next production bundle |
| `npm run start` | Serve the built Next app |
| `npm run lint --workspace=@lumen-pass/web` | Lint the frontend |
| `npm run install:contracts` | Install + build generated TS clients only |

---

Questions or improvements? Open an issue or PR—everything is released under Apache-2.0. Happy building on Stellar!
