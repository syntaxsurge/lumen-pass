import {
  STELLAR_EXPLORER_BASE_URL,
  STELLAR_EXPLORER_NETWORK,
  STELLAR_HORIZON_URL
} from './config'

function normalizeBaseUrl() {
  return STELLAR_HORIZON_URL.replace(/\/$/, '')
}

function normalizeExplorerBase() {
  return STELLAR_EXPLORER_BASE_URL.replace(/\/$/, '')
}

export function getTransactionUrl(hash?: string | null) {
  if (!hash) return null
  return `${normalizeBaseUrl()}/transactions/${hash}`
}

export function getAccountUrl(address?: string | null) {
  if (!address) return null
  return `${normalizeBaseUrl()}/accounts/${address}`
}

export function getContractUrl(contractId?: string | null) {
  if (!contractId) return null
  return `${normalizeExplorerBase()}/${STELLAR_EXPLORER_NETWORK}/contract/${contractId}`
}
