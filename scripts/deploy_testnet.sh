#!/usr/bin/env bash
set -euo pipefail

# Deploy all Soroban contracts to TESTNET and print .env lines.
# Requirements:
#  - stellar CLI (cargo install --locked stellar-cli)
#  - stellar-registry CLI (cargo install --locked stellar-registry-cli)
#  - curl (for friendbot)

ACCOUNT_NAME=${ACCOUNT_NAME:-deploy}
NETWORK="testnet"

# User-supplied inputs (export before running or pass inline)
CREATOR_G=${CREATOR_G:-""}         # G... account that owns LumenPass
PLATFORM_G=${PLATFORM_G:-""}        # Optional G... platform treasury
REGISTRAR_OWNER_G=${REGISTRAR_OWNER_G:-""} # G... owner for Registrar

PRICE_STROOPS=${PRICE_STROOPS:-2500000}      # 0.25 XLM in stroops (7 decimals)
DURATION_LEDGERS=${DURATION_LEDGERS:-17280}  # ~1 day at 5s/ledger; set to 17280 for 1 day
FEE_BPS=${FEE_BPS:-250}                      # 2.5% platform fee

ROOT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing $1"; exit 1; }; }

need stellar

echo "==> Building Wasm artifacts"
stellar scaffold build --package lumen-pass
stellar scaffold build --package invoice-registry
stellar scaffold build --package registrar
stellar scaffold build --package marketplace
stellar scaffold build --package split-router

echo "==> Ensuring $ACCOUNT_NAME key exists"
if ! stellar keys address "$ACCOUNT_NAME" >/dev/null 2>&1; then
  stellar keys generate "$ACCOUNT_NAME"
fi

echo "==> Funding $ACCOUNT_NAME on Testnet (friendbot)"
DEPLOYER_ADDR=$(stellar keys address "$ACCOUNT_NAME")
curl -fsS "https://friendbot.stellar.org?addr=${DEPLOYER_ADDR}" >/dev/null || true

echo "==> Resolving SAC (native XLM) contract id"
SAC_ID=$(stellar contract id asset --network "$NETWORK" --asset native | tr -d '\n' )
echo "     SAC: $SAC_ID"

publish_deploy() {
  local WASM_PATH=$1
  local NAME=$2
echo "==> Publishing $NAME"
stellar registry publish --wasm "$WASM_PATH" --wasm-name "$NAME" --source-account "$ACCOUNT_NAME" --network "$NETWORK" >/dev/null
  echo "==> Deploying $NAME"
  # Capture contract id from deploy output
  local OUT
  if ! OUT=$(stellar registry deploy --wasm-name "$NAME" --contract-name "$NAME-main" --network "$NETWORK" --source-account "$ACCOUNT_NAME" 2>&1); then
    echo "$OUT"; exit 1;
  fi
  echo "$OUT" | sed -n '1,120p'
  local ID
  ID=$(echo "$OUT" | grep -Eo 'C[A-Z0-9]{55}' | tail -1)
  echo "$NAME Contract ID: $ID"
  echo "$ID"
}

LUMEN_WASM="$ROOT_DIR/target/stellar/local/lumen_pass.wasm"
REGISTRY_WASM="$ROOT_DIR/target/stellar/local/invoice_registry.wasm"
REGISTRAR_WASM="$ROOT_DIR/target/stellar/local/registrar.wasm"
MARKET_WASM="$ROOT_DIR/target/stellar/local/marketplace.wasm"
SPLIT_WASM="$ROOT_DIR/target/stellar/local/split_router.wasm"

# Publish + deploy
LUMEN_ID=$(publish_deploy "$LUMEN_WASM" lumen-pass)
REGISTRY_ID=$(publish_deploy "$REGISTRY_WASM" invoice-registry)
REGISTRAR_ID=$(publish_deploy "$REGISTRAR_WASM" registrar)
MARKETPLACE_ID=$(publish_deploy "$MARKET_WASM" marketplace)
SPLIT_ID=$(publish_deploy "$SPLIT_WASM" split-router)

echo "==> Initializing contracts"
if [[ -z "$CREATOR_G" ]]; then echo "Set CREATOR_G=G... and rerun"; exit 1; fi
if [[ -z "$REGISTRAR_OWNER_G" ]]; then echo "Set REGISTRAR_OWNER_G=G... and rerun"; exit 1; fi

echo "-- LumenPass.init"
stellar contract invoke --id "$LUMEN_ID" --network "$NETWORK" --source "$ACCOUNT_NAME" -- \
  init \
  --creator "$CREATOR_G" \
  --token "$SAC_ID" \
  --price "$PRICE_STROOPS" \
  --duration-ledgers "$DURATION_LEDGERS" \
  --platform ${PLATFORM_G:-null} \
  --fee-bps "$FEE_BPS"

echo "-- Registrar.init"
stellar contract invoke --id "$REGISTRAR_ID" --network "$NETWORK" --source "$ACCOUNT_NAME" -- \
  init --owner "$REGISTRAR_OWNER_G"

echo "==> Installation (local CLI aliases)"
stellar registry install lumen-pass-main || true
stellar registry install invoice-registry-main || true
stellar registry install registrar-main || true
stellar registry install marketplace-main || true
stellar registry install split-router-main || true

cat <<EOF

All contracts deployed to Testnet.

Add these to your .env or apps/web/.env:

NEXT_PUBLIC_LUMENPASS_CONTRACT_ID="$LUMEN_ID"
NEXT_PUBLIC_INVOICE_REGISTRY_CONTRACT_ID="$REGISTRY_ID"
NEXT_PUBLIC_REGISTRAR_CONTRACT_ID="$REGISTRAR_ID"
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID="$MARKETPLACE_ID"
NEXT_PUBLIC_SPLIT_ROUTER_CONTRACT_ID="$SPLIT_ID"
NEXT_PUBLIC_NATIVE_ASSET_CONTRACT_ID="$SAC_ID"

Then restart the app: npm run dev
EOF
