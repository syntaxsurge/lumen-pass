import { Client as LumenPassClient } from 'lumen_pass'
import type { ClientOptions as ContractClientOptions } from '@stellar/stellar-sdk/contract'

import {
  LUMENPASS_CONTRACT_ID,
  STELLAR_NETWORK_PASSPHRASE,
  STELLAR_RPC_URL,
  LEDGER_DURATION_SECONDS
} from './config'

export type StellarSigner = {
  publicKey: string
  signTransaction: NonNullable<ContractClientOptions['signTransaction']>
}

type MembershipState = {
  isActive: boolean
  expiryLedger: number | null
  expiresAtMs: number | null
}

function createClient(signer?: StellarSigner) {
  return new LumenPassClient({
    contractId: LUMENPASS_CONTRACT_ID,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    rpcUrl: STELLAR_RPC_URL,
    publicKey: signer?.publicKey,
    signTransaction: signer?.signTransaction
  })
}

function ledgerToMs(ledger: number | null) {
  if (!ledger) return null
  return ledger * LEDGER_DURATION_SECONDS * 1000
}

export async function fetchLumenPassConfig() {
  const result = await createClient().config()
  return result.result
}

export async function fetchLumenPassPrice(): Promise<bigint> {
  const result = await createClient().price()
  return BigInt(result.result)
}

export async function fetchMembershipState(user: string): Promise<MembershipState> {
  const client = createClient()
  const [membership, expiry] = await Promise.all([
    client.is_member({ user }),
    client.expires_at({ user })
  ])

  const expiryLedger = expiry.result ?? null
  return {
    isActive: Boolean(membership.result),
    expiryLedger,
    expiresAtMs: ledgerToMs(expiryLedger)
  }
}

export async function subscribeToLumenPass(signer: StellarSigner) {
  const client = createClient(signer)
  return client.subscribe({ user: signer.publicKey })
}
