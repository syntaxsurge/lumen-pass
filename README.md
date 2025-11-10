# LumenPass · Soroban Membership + Marketplace Stack

LumenPass is a Next.js + Soroban dApp that recreates the full CreatorBank workflow on Stellar:

- **Memberships** — `contracts/lumen-pass` handles paid subscriptions using the native asset contract (SAC) and routes fees to the platform treasury.
- **Invoices** — `contracts/invoice-registry` issues/marks invoices directly on Soroban.
- **Marketplace** — `contracts/marketplace` lists/buys memberships with built-in platform fees.
- **Registrar & Badges** — `contracts/registrar` maps human-readable handles to deployments, and `contracts/lumenpass-badges` mints creator badges.
- **Split Router** — `contracts/split-router` pays collaborators in one transaction.
- **Next.js Frontend** — `apps/web` mirrors the CreatorBank UI, integrates Stellar Wallets Kit, and uses generated Soroban clients.

The repo contains one command that builds every contract, deploys them to Testnet, initializes them, creates local aliases, and updates `apps/web/.env`.

---

## 1. Prerequisites

| Tool | Purpose | Install |
| --- | --- | --- |
| Rust (stable) + `wasm32-unknown-unknown` | Compile Soroban contracts | https://www.rust-lang.org/tools/install |
| `stellar` CLI | Build/deploy/invoke contracts | `cargo install --locked stellar-cli` |
| `stellar-scaffold-cli` | Compile workspace + generate TS bindings | `cargo install --locked stellar-scaffold-cli` |
| `stellar-registry-cli` | Publish/deploy via the on-chain registry | `cargo install --locked stellar-registry-cli` |
| Node.js 22+ (npm) | Frontend + Convex tooling | https://nodejs.org/ |
| Docker (optional) | Only needed if you run `stellar quickstart` locally | https://www.docker.com/ |

Verify the CLIs:

```bash
stellar --version
stellar scaffold --help
stellar registry --help
```

---

## 2. Install dependencies

```bash
npm install
```

This bootstraps the workspace, including `packages/*` (Soroban TS clients) and `apps/web`.

---

## 3. Create deployment identities

You need four keys: deployer (default alias `deploy`), creator, registrar owner, and platform treasury.

```bash
stellar keys generate deploy
stellar keys generate creator
stellar keys generate registrar_owner
stellar keys generate platform
```

Fund each account on Testnet via Friendbot (ignore 400 errors; they mean “already funded”):

```bash
for alias in deploy creator registrar_owner platform; do
  ADDR=$(stellar keys address "$alias")
  curl -fsS "https://friendbot.stellar.org?addr=${ADDR}"
done
```

Grab the public keys (you’ll need them for env vars and the deploy script):

```bash
stellar keys address creator
stellar keys address registrar_owner
stellar keys address platform
```

---

## 4. Deploy everything to Testnet (one command)

The helper script builds all Wasm contracts, publishes/deploys them via the Registry, initializes each contract, creates local aliases, and writes the contract IDs to `apps/web/.env`.

```bash
CREATOR_G=$(stellar keys address creator) \
REGISTRAR_OWNER_G=$(stellar keys address registrar_owner) \
PLATFORM_G=$(stellar keys address platform) \
ENV_FILE=apps/web/.env \
bash scripts/deploy_testnet.sh
```

What the script does:

1. `stellar scaffold build --package <contract>` for every package (membership, invoices, registrar, marketplace, split router, badges).
2. `stellar registry publish` + `stellar registry deploy --version ...` for each Wasm.
3. Creates/updates contract aliases (`lumen-pass-main`, `invoice-registry-main`, etc.).
4. Invokes the required initializers:
   - `lumen-pass` → `init --creator --token <SAC> --price ... --platform --fee-bps`
   - `registrar` → `init --owner`
   - `marketplace` → `init --platform --fee-bps`
   - `lumenpass-badges` → `init --owner ...`
5. Updates `apps/web/.env` with the actual IDs:

```
NEXT_PUBLIC_LUMENPASS_CONTRACT_ID="CDOX..."
NEXT_PUBLIC_INVOICE_REGISTRY_CONTRACT_ID="CBA3..."
NEXT_PUBLIC_REGISTRAR_CONTRACT_ID="CBRR..."
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID="CDNJ..."
NEXT_PUBLIC_SPLIT_ROUTER_CONTRACT_ID="CCY5..."
NEXT_PUBLIC_BADGE_CONTRACT_ID="CD5H..."
NEXT_PUBLIC_NATIVE_ASSET_CONTRACT_ID="CDLZ..."
```

If you redeploy a single contract (e.g., update badges), bump its `BADGE_VERSION` when running the script:

```bash
BADGE_VERSION=0.1.2 bash scripts/deploy_testnet.sh
```

---

## 5. Run the app locally

```bash
npm run dev
```

The root script runs:

1. `stellar scaffold watch --build-clients` — rebuilds contracts and regenerates TS clients in `packages/*`.
2. `next dev` for the frontend (http://localhost:3000).

Open `/payments` to use the dashboard:

- Connect your wallet via Stellar Wallets Kit (Freighter, Lobstr, Albedo, etc.).
- Status tab shows all configured contract IDs with Horizon links.
- Paylinks, invoices, marketplace, payouts, and badges all call the Soroban clients generated from your deployments.

To stop the dev server use `Ctrl+C`.

---

## 6. Production build & linting

```bash
npm run build        # Rebuild contracts + Next production bundle
npm run start        # Serve the built app
npm run lint         # Frontend lint
npm run lint:fix     # Auto-fix lint issues
```

All commands operate inside `apps/web`.

---

## 7. Repository layout

```
contracts/
  lumen-pass/          # Membership contract
  invoice-registry/
  registrar/
  marketplace/
  split-router/
  lumenpass-badges/
apps/web/              # Next.js + Convex frontend
packages/*             # Generated Soroban TypeScript clients
scripts/deploy_testnet.sh
```

---

## 8. Common troubleshooting

| Issue | Fix |
| --- | --- |
| `curl ... 400` during Friendbot funding | Account already funded; safe to ignore. |
| `Error(Contract, #5)` during deploy | Contract name already exists; script reuses the existing deployment automatically. |
| Missing env vars in UI | Re-run `scripts/deploy_testnet.sh` or manually copy contract IDs into `apps/web/.env`. |
| Want to skip CI for a commit | Add `[skip ci]` to the commit message or disable workflows in GitHub Actions settings. |

---

## 9. Contributing / customizing

- Update contracts under `contracts/*`, then rerun the deploy script to push new versions.
- Generated clients live in `packages/<contract>`; run `stellar scaffold build --package <name> --build-clients` if you only need bindings.
- Frontend logic for Stellar RPC/wallets is in `apps/web/src/lib/stellar/*`.

All code is Apache-2.0. Feel free to fork, extend, and submit PRs. Happy hacking on Stellar! 🚀
