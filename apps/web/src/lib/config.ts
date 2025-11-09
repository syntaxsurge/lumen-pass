import {
  LUMENPASS_CONTRACT_ID,
  NATIVE_ASSET_CONTRACT_ID
} from './stellar/config'

export function getMembershipContractAddress(): string {
  return LUMENPASS_CONTRACT_ID
}

export function getInvoiceRegistryAddress(): string {
  return (
    process.env.NEXT_PUBLIC_INVOICE_REGISTRY_CONTRACT_ID?.trim() ??
    process.env.NEXT_PUBLIC_INVOICE_REGISTRY_CONTRACT_ADDRESS?.trim() ??
    ''
  )
}

export function getNativeAssetContractAddress(): string {
  return NATIVE_ASSET_CONTRACT_ID || 'native'
}

export function getMarketplaceContractAddress(): string {
  return process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID?.trim() ?? ''
}

export function getBadgeContractAddress(): string {
  return process.env.NEXT_PUBLIC_BADGE_CONTRACT_ID?.trim() ?? ''
}

export function getRegistrarContractAddress(): string {
  return process.env.NEXT_PUBLIC_REGISTRAR_CONTRACT_ID?.trim() ?? ''
}

export function getSplitRouterContractAddress(): string {
  return process.env.NEXT_PUBLIC_SPLIT_ROUTER_CONTRACT_ID?.trim() ?? ''
}

export const SUBSCRIPTION_PRICE_USD =
  process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_USD ?? '99'

export const SETTLEMENT_TOKEN_SYMBOL = 'XLM'
export const SETTLEMENT_TOKEN_DECIMALS = 7

export const STELLAR_TESTNET_HUB_URL = 'https://laboratory.stellar.org/'

const DEFAULT_MEMBERSHIP_DURATION_SECONDS = 60 * 60 * 24 * 30
const DEFAULT_MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS = 60 * 60 * 24

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

export const MEMBERSHIP_DURATION_SECONDS = parsePositiveInt(
  process.env.NEXT_PUBLIC_MEMBERSHIP_DURATION_SECONDS,
  DEFAULT_MEMBERSHIP_DURATION_SECONDS
)

export const MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS = parsePositiveInt(
  process.env.NEXT_PUBLIC_MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS,
  DEFAULT_MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS
)
