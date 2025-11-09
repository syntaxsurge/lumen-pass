import { Client as InvoiceRegistryClient, type Invoice } from 'invoice_registry'

import { getInvoiceRegistryAddress } from '@/lib/config'
import {
  STELLAR_NETWORK_PASSPHRASE,
  STELLAR_RPC_URL
} from '@/lib/stellar/config'
import type { StellarSigner } from '@/lib/stellar/lumen-pass-service'

type ClientOptions = {
  publicKey?: string
  signTransaction?: StellarSigner['signTransaction']
}

function ensureRegistryId(): string {
  const id =
    getInvoiceRegistryAddress() ||
    process.env.NEXT_PUBLIC_INVOICE_REGISTRY_CONTRACT_ID ||
    ''
  if (!id) {
    throw new Error('Invoice registry contract id is not configured.')
  }
  return id
}

function createClient(options?: ClientOptions) {
  return new InvoiceRegistryClient({
    contractId: ensureRegistryId(),
    rpcUrl: STELLAR_RPC_URL,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    publicKey: options?.publicKey,
    signTransaction: options?.signTransaction as any
  })
}

export type IssueInvoiceArgs = {
  signer: StellarSigner
  amount: bigint
  payer?: string | null
  reference?: string | null
}

export type IssueInvoiceResult = {
  invoiceId: bigint
  txHash: string | null
}

export async function issueInvoice({
  signer,
  amount,
  payer,
  reference
}: IssueInvoiceArgs): Promise<IssueInvoiceResult> {
  if (!signer.signTransaction) {
    throw new Error('Wallet must support signTransaction to issue invoices.')
  }
  const client = createClient({
    publicKey: signer.publicKey,
    signTransaction: signer.signTransaction
  })
  const tx = await client.issue({
    issuer: signer.publicKey,
    payer: payer ?? undefined,
    amount,
    reference: reference ?? undefined
  })
  const sent = await tx.signAndSend()
  const invoiceId = BigInt(sent.result ?? 0)
  const txHash =
    sent.getTransactionResponse?.txHash ??
    sent.sendTransactionResponse?.hash ??
    null
  return { invoiceId, txHash }
}

export type MarkPaidArgs = {
  signer: StellarSigner
  invoiceId: bigint
}

export async function markInvoicePaid({
  signer,
  invoiceId
}: MarkPaidArgs): Promise<string | null> {
  if (!signer.signTransaction) {
    throw new Error('Wallet must support signTransaction to mark invoices.')
  }
  const client = createClient({
    publicKey: signer.publicKey,
    signTransaction: signer.signTransaction
  })
  const tx = await client.mark_paid({
    id: invoiceId,
    issuer: signer.publicKey
  })
  const sent = await tx.signAndSend()
  return (
    sent.getTransactionResponse?.txHash ??
    sent.sendTransactionResponse?.hash ??
    null
  )
}

export async function fetchInvoice(id: bigint | number | string) {
  const client = createClient()
  const numericId = typeof id === 'bigint' ? id : BigInt(id)
  const { result } = await client.get({ id: numericId })
  return result ?? null
}

export type RegistryInvoice = Invoice
