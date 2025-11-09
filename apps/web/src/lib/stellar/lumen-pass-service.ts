import { Client as LumenPassClient, type Config as LumenPassConfig } from 'lumen_pass'

import {
  LUMENPASS_CONTRACT_ID,
  STELLAR_HORIZON_URL,
  STELLAR_NETWORK_PASSPHRASE,
  STELLAR_RPC_URL
} from '@/lib/stellar/config'

const DEFAULT_LEDGER_DURATION_MS = 5_000
const HORIZON_CACHE_TTL_MS = 5_000

type LedgerSnapshot = {
  sequence: number
  closedAt: number
  fetchedAt: number
}

let latestLedgerCache: LedgerSnapshot | null = null

export type StellarSigner = {
  publicKey: string
  signTransaction: (xdr: string) => Promise<{ signedTxXdr: string }>
}

export type SubscriptionReceipt = {
  expiryLedger: number | null
  expiryMs: number | null
  txHash: string | null
}

function ensureContractId(): string {
  if (!LUMENPASS_CONTRACT_ID) {
    throw new Error('LumenPass contract id is not configured.')
  }
  return LUMENPASS_CONTRACT_ID
}

function createClient(options?: {
  publicKey?: string
  signTransaction?: StellarSigner['signTransaction']
}) {
  return new LumenPassClient({
    contractId: ensureContractId(),
    rpcUrl: STELLAR_RPC_URL,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    publicKey: options?.publicKey,
    signTransaction: options?.signTransaction as any
  })
}

async function fetchLatestLedger(): Promise<LedgerSnapshot> {
  const now = Date.now()
  if (latestLedgerCache && now - latestLedgerCache.fetchedAt < HORIZON_CACHE_TTL_MS) {
    return latestLedgerCache
  }

  const url = `${STELLAR_HORIZON_URL.replace(/\/$/, '')}/ledgers?order=desc&limit=1`
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`Unable to query Horizon ledgers (${response.status})`)
  }
  const payload = (await response.json()) as {
    _embedded?: { records?: Array<{ sequence: string; closed_at: string }> }
  }
  const record = payload._embedded?.records?.[0]
  if (!record) {
    throw new Error('Horizon ledger response missing data.')
  }
  const snapshot: LedgerSnapshot = {
    sequence: Number(record.sequence),
    closedAt: Date.parse(record.closed_at),
    fetchedAt: now
  }
  latestLedgerCache = snapshot
  return snapshot
}

async function estimateExpiryTimestamp(ledger: number | null | undefined) {
  if (!ledger || !Number.isFinite(ledger) || ledger <= 0) {
    return null
  }
  try {
    const latest = await fetchLatestLedger()
    if (ledger <= latest.sequence) {
      return latest.closedAt
    }
    const delta = ledger - latest.sequence
    return latest.closedAt + delta * DEFAULT_LEDGER_DURATION_MS
  } catch (error) {
    console.warn('[lumen-pass] falling back to best-effort expiry estimate', error)
    // Fall back to "now + duration" approximation if Horizon is unreachable.
    return Date.now() + DEFAULT_LEDGER_DURATION_MS * 6
  }
}

export async function getConfig(): Promise<LumenPassConfig | null> {
  if (!LUMENPASS_CONTRACT_ID) return null
  const client = createClient()
  const { result } = await client.config()
  return result ?? null
}

export async function getPrice(): Promise<bigint | null> {
  if (!LUMENPASS_CONTRACT_ID) return null
  const client = createClient()
  const { result } = await client.price()
  return typeof result === 'number' ? BigInt(result) : (result as unknown as bigint)
}

export async function getExpiryLedger(user: string) {
  if (!LUMENPASS_CONTRACT_ID) return null
  const client = createClient()
  const { result } = await client.expires_at({ user })
  if (result === undefined || result === null) {
    return null
  }
  return Number(result)
}

export async function getExpiryMs(user: string) {
  const ledger = await getExpiryLedger(user)
  return estimateExpiryTimestamp(ledger)
}

export async function isMember(user: string) {
  if (!LUMENPASS_CONTRACT_ID) return false
  const client = createClient()
  const { result } = await client.is_member({ user })
  return Boolean(result)
}

export async function subscribe(signer: StellarSigner): Promise<SubscriptionReceipt> {
  if (!signer.signTransaction) {
    throw new Error('Wallet must support signTransaction.')
  }
  const client = createClient({
    publicKey: signer.publicKey,
    signTransaction: signer.signTransaction
  })
  const tx = await client.subscribe({ user: signer.publicKey })
  const sent = await tx.signAndSend()
  const expiryLedger = sent.result ? Number(sent.result) : null
  const expiryMs = await estimateExpiryTimestamp(expiryLedger)
  const txHash =
    sent.getTransactionResponse?.txHash ??
    sent.sendTransactionResponse?.hash ??
    null
  return {
    expiryLedger,
    expiryMs,
    txHash
  }
}
