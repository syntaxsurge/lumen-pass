#!/usr/bin/env bash
set -euo pipefail

# Deploy all Soroban contracts to TESTNET and print .env lines.
# Requirements:
#  - stellar CLI (cargo install --locked stellar-cli)
#  - stellar-registry CLI (cargo install --locked stellar-registry-cli)
#  - curl (for friendbot)

# Resolve repo root early so we can safely reference it in defaults
ROOT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)

ACCOUNT_NAME=${ACCOUNT_NAME:-deploy}
NETWORK="testnet"

# Crate versions (override via env if needed)
LUMEN_VERSION=${LUMEN_VERSION:-0.0.1}
REGISTRY_VERSION=${REGISTRY_VERSION:-0.1.1}
REGISTRAR_VERSION=${REGISTRAR_VERSION:-0.1.0}
MARKETPLACE_VERSION=${MARKETPLACE_VERSION:-0.1.0}
SPLIT_VERSION=${SPLIT_VERSION:-0.1.0}
BADGE_VERSION=${BADGE_VERSION:-0.1.1}

# Optional: generate TS clients after build (development env)
BUILD_CLIENTS=${BUILD_CLIENTS:-false}

# Optional: path to env file to update with deployed ids
ENV_FILE=${ENV_FILE:-"$ROOT_DIR/apps/web/.env"}

# User-supplied inputs (export before running or pass inline)
CREATOR_G=${CREATOR_G:-""}         # G... account that owns LumenPass
PLATFORM_G=${PLATFORM_G:-""}        # Mandatory G... platform treasury
REGISTRAR_OWNER_G=${REGISTRAR_OWNER_G:-""} # G... owner for Registrar

# Small helper to keep env files fresh even if later steps fail
update_env() {
  local key=$1
  local value=$2
  local file=$3
  if [ ! -f "$file" ]; then echo "Creating $file"; touch "$file"; fi
  if grep -q "^$key=" "$file"; then
    sed -i.bak "s|^$key=.*|$key=\"$value\"|" "$file"
    rm -f "$file.bak"
  else
    echo "$key=\"$value\"" >> "$file"
  fi
}

PRICE_STROOPS=${PRICE_STROOPS:-2500000}      # 0.25 XLM in stroops (7 decimals)
# Default to 30 days at ~5s per ledger: 30 * 24 * 60 * 60 / 5 = 518400
DURATION_LEDGERS=${DURATION_LEDGERS:-518400}
FEE_BPS=${FEE_BPS:-250}                      # 2.5% platform fee

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing $1"; exit 1; }; }

need stellar

echo "==> Building Wasm artifacts"
stellar scaffold build --package lumen-pass
stellar scaffold build --package invoice-registry
stellar scaffold build --package registrar
stellar scaffold build --package marketplace
stellar scaffold build --package split-router
stellar scaffold build --package lumenpass-badges

if [ "$BUILD_CLIENTS" = "true" ]; then
  echo "==> Generating TypeScript clients (development env)"
  stellar scaffold build --package marketplace --build-clients || true
  stellar scaffold build --package registrar --build-clients || true
  stellar scaffold build --package split-router --build-clients || true
fi

echo "==> Ensuring $ACCOUNT_NAME key exists"
if ! stellar keys address "$ACCOUNT_NAME" >/dev/null 2>&1; then
  stellar keys generate "$ACCOUNT_NAME"
fi

# Ensure creator / registrar_owner / platform keys exist locally if aliases provided
ensure_key() {
  local alias=$1
  if [ -z "$alias" ]; then return 0; fi
  if ! stellar keys address "$alias" >/dev/null 2>&1; then
    stellar keys generate "$alias"
  fi
}

ensure_key creator
ensure_key registrar_owner
ensure_key platform

echo "==> Funding $ACCOUNT_NAME on Testnet (friendbot)"
DEPLOYER_ADDR=$(stellar keys address "$ACCOUNT_NAME")
curl -fsS "https://friendbot.stellar.org?addr=${DEPLOYER_ADDR}" >/dev/null || true

# Also attempt to friendbot fund auxiliary aliases (ignore 400 Already Funded)
for ALIAS in creator registrar_owner platform; do
  if stellar keys address "$ALIAS" >/dev/null 2>&1; then
    ADDR=$(stellar keys address "$ALIAS")
    curl -fsS "https://friendbot.stellar.org?addr=${ADDR}" >/dev/null || true
  fi
done

echo "==> Resolving SAC (native XLM) contract id"
SAC_ID=$(stellar contract id asset --network "$NETWORK" --asset native | tr -d '\n' )
echo "     SAC: $SAC_ID"

publish_deploy() {
  local WASM_PATH=$1
  local NAME=$2
  local BINVER=$3
  local CONTRACT_NAME="${NAME}-main"
  echo "==> Publishing $NAME (binver=$BINVER)" >&2
  if ! stellar registry publish --wasm "$WASM_PATH" --wasm-name "$NAME" --binver "$BINVER" --source-account "$ACCOUNT_NAME" --network "$NETWORK" >/dev/null 2>&1; then
    echo "   ↳ publish failed (likely already published); continuing" >&2
  fi
  echo "==> Deploying $NAME" >&2
  # Capture contract id from deploy output
  local OUT
  if ! OUT=$(stellar registry deploy --wasm-name "$NAME" --contract-name "$CONTRACT_NAME" --version "$BINVER" --network "$NETWORK" --source-account "$ACCOUNT_NAME" 2>&1); then
    if echo "$OUT" | grep -q "Error(Contract, #5)"; then
      echo "   ↳ contract name already deployed; reusing existing instance" >&2
    else
      echo "$OUT" >&2
      exit 1
    fi
  else
    echo "$OUT" | sed -n '1,120p' >&2
  fi

  if ! stellar registry create-alias --network "$NETWORK" --source-account "$ACCOUNT_NAME" "$CONTRACT_NAME" >/dev/null 2>&1; then
    echo "   ↳ alias creation skipped (likely exists)" >&2
  fi

  local ID
  ID=$(stellar contract alias show "$CONTRACT_NAME" | head -n1 | tr -d '\r\n')
  if [[ -z "$ID" ]]; then
    echo "Failed to resolve contract id for $CONTRACT_NAME" >&2
    exit 1
  fi
  echo "$CONTRACT_NAME Contract ID: $ID" >&2
  echo "$ID"
}

LUMEN_WASM="$ROOT_DIR/target/stellar/local/lumen_pass.wasm"
REGISTRY_WASM="$ROOT_DIR/target/stellar/local/invoice_registry.wasm"
REGISTRAR_WASM="$ROOT_DIR/target/stellar/local/registrar.wasm"
MARKET_WASM="$ROOT_DIR/target/stellar/local/marketplace.wasm"
SPLIT_WASM="$ROOT_DIR/target/stellar/local/split_router.wasm"
BADGE_WASM="$ROOT_DIR/target/stellar/local/lumenpass_badges.wasm"

# Publish + deploy (with versions)
LUMEN_ID=$(publish_deploy "$LUMEN_WASM" lumen-pass "$LUMEN_VERSION")
REGISTRY_ID=$(publish_deploy "$REGISTRY_WASM" invoice-registry "$REGISTRY_VERSION")
REGISTRAR_ID=$(publish_deploy "$REGISTRAR_WASM" registrar "$REGISTRAR_VERSION")
MARKETPLACE_ID=$(publish_deploy "$MARKET_WASM" marketplace "$MARKETPLACE_VERSION")
SPLIT_ID=$(publish_deploy "$SPLIT_WASM" split-router "$SPLIT_VERSION")
BADGE_ID=$(publish_deploy "$BADGE_WASM" lumenpass-badges "$BADGE_VERSION")

echo "==> Updating env file: $ENV_FILE"
update_env NEXT_PUBLIC_LUMENPASS_CONTRACT_ID "$LUMEN_ID" "$ENV_FILE"
update_env NEXT_PUBLIC_INVOICE_REGISTRY_CONTRACT_ID "$REGISTRY_ID" "$ENV_FILE"
update_env NEXT_PUBLIC_REGISTRAR_CONTRACT_ID "$REGISTRAR_ID" "$ENV_FILE"
update_env NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID "$MARKETPLACE_ID" "$ENV_FILE"
update_env NEXT_PUBLIC_SPLIT_ROUTER_CONTRACT_ID "$SPLIT_ID" "$ENV_FILE"
update_env NEXT_PUBLIC_NATIVE_ASSET_CONTRACT_ID "$SAC_ID" "$ENV_FILE"
update_env NEXT_PUBLIC_BADGE_CONTRACT_ID "$BADGE_ID" "$ENV_FILE"
update_env NEXT_PUBLIC_PLATFORM_TREASURY_ADDRESS "$PLATFORM_G" "$ENV_FILE"

invoke_allowing_init_skip() {
  local label=$1
  shift
  if ! OUT=$("$@" 2>&1); then
    if echo "$OUT" | grep -Eq 'Error\(Contract, #1\)|already initialized|UnreachableCodeReached'; then
      echo "   ↳ $label already initialized; skipping"
    else
      echo "$OUT"
      exit 1
    fi
  else
    echo "$OUT"
  fi
}

echo "==> Initializing contracts"
# Attempt to derive missing addresses from local key aliases
CREATOR_G=${CREATOR_G:-$(stellar keys address creator 2>/dev/null || echo "")}
REGISTRAR_OWNER_G=${REGISTRAR_OWNER_G:-$(stellar keys address registrar_owner 2>/dev/null || echo "")}
PLATFORM_G=${PLATFORM_G:-$(stellar keys address platform 2>/dev/null || echo "")}

if [[ -z "$CREATOR_G" ]]; then echo "Set CREATOR_G=G... and rerun"; exit 1; fi
if [[ -z "$REGISTRAR_OWNER_G" ]]; then echo "Set REGISTRAR_OWNER_G=G... and rerun"; exit 1; fi
if [[ -z "${PLATFORM_G:-}" ]]; then echo "Set PLATFORM_G=G... (platform treasury) and rerun"; exit 1; fi

echo "-- LumenPass.init (signed by creator)"
invoke_allowing_init_skip "LumenPass" \
  stellar contract invoke --id "$LUMEN_ID" --network "$NETWORK" --source creator -- \
  init \
  --creator "$CREATOR_G" \
  --token "$SAC_ID" \
  --price "$PRICE_STROOPS" \
  --duration-ledgers "$DURATION_LEDGERS" \
  --platform "$PLATFORM_G" \
  --fee-bps "$FEE_BPS"

echo "-- Registrar.init (signed by registrar_owner)"
invoke_allowing_init_skip "Registrar" \
  stellar contract invoke --id "$REGISTRAR_ID" --network "$NETWORK" --source registrar_owner -- \
  init --owner "$REGISTRAR_OWNER_G"

echo "-- Marketplace.init"
invoke_allowing_init_skip "Marketplace" \
  stellar contract invoke --id "$MARKETPLACE_ID" --network "$NETWORK" --source "$ACCOUNT_NAME" -- \
  init --platform "$PLATFORM_G" --fee-bps "$FEE_BPS"

echo "-- Badges.init (signed by creator)"
invoke_allowing_init_skip "Badges" \
  stellar contract invoke --id "$BADGE_ID" --network "$NETWORK" --source creator -- \
  init --owner "$CREATOR_G" --base-uri "https://lumenpass.app/badges" --name "LumenPass Badges" --symbol "LPB"

echo "==> Local aliases registered"
stellar contract alias ls | sed -n '1,40p'

cat <<EOF

All contracts deployed to Testnet.

Add these to your .env or apps/web/.env:

NEXT_PUBLIC_LUMENPASS_CONTRACT_ID="$LUMEN_ID"
NEXT_PUBLIC_INVOICE_REGISTRY_CONTRACT_ID="$REGISTRY_ID"
NEXT_PUBLIC_REGISTRAR_CONTRACT_ID="$REGISTRAR_ID"
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID="$MARKETPLACE_ID"
NEXT_PUBLIC_SPLIT_ROUTER_CONTRACT_ID="$SPLIT_ID"
NEXT_PUBLIC_NATIVE_ASSET_CONTRACT_ID="$SAC_ID"
NEXT_PUBLIC_BADGE_CONTRACT_ID="$BADGE_ID"
NEXT_PUBLIC_PLATFORM_TREASURY_ADDRESS="$PLATFORM_G"

Then restart the app: npm run dev
EOF
