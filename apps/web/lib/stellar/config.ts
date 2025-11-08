const DEFAULT_RPC = 'https://soroban-testnet.stellar.org:443'
const DEFAULT_NETWORK = 'Test SDF Network ; September 2015'

export const STELLAR_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL?.trim() || DEFAULT_RPC

export const STELLAR_NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE?.trim() || DEFAULT_NETWORK

function optionalEnv(key: string) {
  return process.env[key]?.trim() || ''
}

export const LUMENPASS_CONTRACT_ID = optionalEnv(
  'NEXT_PUBLIC_LUMENPASS_CONTRACT_ID'
)

export const NATIVE_ASSET_CONTRACT_ID = optionalEnv(
  'NEXT_PUBLIC_NATIVE_ASSET_CONTRACT_ID'
)

if (typeof window === 'undefined') {
  if (!LUMENPASS_CONTRACT_ID) {
    console.warn(
      '[config] NEXT_PUBLIC_LUMENPASS_CONTRACT_ID is empty. UI will prompt before interacting.'
    )
  }
  if (!NATIVE_ASSET_CONTRACT_ID) {
    console.warn(
      '[config] NEXT_PUBLIC_NATIVE_ASSET_CONTRACT_ID is empty. UI will prompt before interacting.'
    )
  }
}

export const LEDGER_DURATION_SECONDS = 5
