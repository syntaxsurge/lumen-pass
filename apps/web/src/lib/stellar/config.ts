// Centralized Stellar frontend configuration helpers.
// Always prefer passphrases over symbolic names like "TESTNET".

export const STELLAR_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL ||
  'https://soroban-testnet.stellar.org:443'

export const STELLAR_HORIZON_URL =
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ||
  'https://horizon-testnet.stellar.org'

export const STELLAR_NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
  'Test SDF Network ; September 2015'

export const LUMENPASS_CONTRACT_ID =
  process.env.NEXT_PUBLIC_LUMENPASS_CONTRACT_ID || ''

export const NATIVE_ASSET_CONTRACT_ID =
  process.env.NEXT_PUBLIC_NATIVE_ASSET_CONTRACT_ID || ''

// Some environments mistakenly set NEXT_PUBLIC_STELLAR_NETWORK to values like
// "TESTNET" or "PUBLIC". Map those to proper passphrases to avoid Wallets Kit
// throwing "Wallet network 'TESTNET' is not supported" errors.
function normalizeWalletNetwork(): string {
  const raw = (process.env.NEXT_PUBLIC_STELLAR_NETWORK || '').toUpperCase()
  switch (raw) {
    case 'PUBLIC':
      return 'Public Global Stellar Network ; September 2015'
    case 'TESTNET':
      return 'Test SDF Network ; September 2015'
    case 'LOCAL':
      return 'Standalone Network ; February 2017'
    default:
      // If a custom passphrase was provided, prefer it; otherwise default to
      // Testnet.
      return STELLAR_NETWORK_PASSPHRASE
  }
}

export const STELLAR_WALLET_NETWORK = normalizeWalletNetwork()

