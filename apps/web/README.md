# LumenPass: XLM‑Native Memberships on Stellar

LumenPass is a full‑stack dApp showcasing Scaffold Stellar:

- Next.js frontend with Stellar Wallets Kit.
- Soroban contracts (Rust→Wasm) with generated TypeScript clients.
- Convex backend for off‑chain data (groups, invoices, content).

## Quick start

```bash
npm install
cp ../../.env.example .env.local  # or `cp .env.example .env.local` at repo root

# Start Convex dev server alongside Next.js
npm run convex:dev --workspace=@lumen-pass/web &
npm run dev --workspace=@lumen-pass/web
```

## Environment variables (frontend)

Set the Stellar endpoints and contract IDs:

```env
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_STELLAR_RPC_URL="https://soroban-testnet.stellar.org:443"
NEXT_PUBLIC_STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
NEXT_PUBLIC_LUMENPASS_CONTRACT_ID="<contract id or registry alias>"
NEXT_PUBLIC_NATIVE_ASSET_CONTRACT_ID="<native SAC id>"
NEXT_PUBLIC_PLATFORM_TREASURY_ADDRESS="<G...address>"
NEXT_PUBLIC_SUBSCRIPTION_PRICE_USD="99"
```

## Key commands

| Command | Description |
| --- | --- |
| `npm run dev --workspace=@lumen-pass/web` | Next.js dev server |
| `npm run build --workspace=@lumen-pass/web` | Production build |
| `npm run convex:dev --workspace=@lumen-pass/web` | Launch Convex dev server |

## Notes

- Wallet onboarding uses Stellar Wallets Kit (Freighter and other wallets).
- Payments and memberships are settled in native XLM through Soroban.
3. **Invoice issuance (optional)** – issue invoices on Soroban via the Invoice Registry, then share the pay URL.
4. **Membership joins** – members activate their LumenPass by invoking the Soroban contract directly from the app.
5. **Payouts** – collaborators can record off-chain payouts or mint new contracts depending on your demo scope.

## Testing checklist

- `pnpm typecheck`
- `pnpm lint`
- `pnpm convex:dev` + `pnpm dev` for end-to-end manual testing on Stellar Testnet

## Conventions & notes

- Stellar Wallets Kit provides wallet context; avoid reintroducing legacy providers.
- Soroban client bindings live under `packages/*` and are consumed through `src/lib/stellar`.
- Prices display via `src/lib/settlement-token.ts` (XLM with 1:1 USD labels).
- Keep Convex schema changes in sync with frontend queries/mutations.

Happy building on Stellar with LumenPass!
