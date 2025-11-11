'use client'

import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk'
import { Client as RegistrarClient } from 'registrar'

import {
  getMembershipContractAddress,
  getRegistrarContractAddress
} from '@/lib/config'
import {
  STELLAR_NETWORK_PASSPHRASE,
  STELLAR_RPC_URL
} from '@/lib/stellar/config'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – the generated client is provided by scaffold at build time.

export type StellarSigner = (xdr: string) => Promise<unknown>

function ensureRegistrarId(): string {
  const id = getRegistrarContractAddress()
  if (!id) throw new Error('Registrar contract not configured')
  return id
}

export async function resolveMapping(name: string): Promise<string | null> {
  const registrarId = ensureRegistrarId()
  const client = new RegistrarClient({
    contractId: registrarId,
    rpcUrl: STELLAR_RPC_URL,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE
  })
  try {
    const { result } = await client.resolve({ name })
    if (!result) return null
    // result may be returned as string already, or as a Bytes->string representation
    return String(result)
  } catch {
    return null
  }
}

export async function registerMapping(params: {
  name: string
  publicKey: string
  signTransaction: StellarSigner
}): Promise<{ txHash: string | null }> {
  const registrarId = ensureRegistrarId()
  const contractId = getMembershipContractAddress()
  if (!contractId) throw new Error('Membership contract not configured')

  const client = new RegistrarClient({
    contractId: registrarId,
    rpcUrl: STELLAR_RPC_URL,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    publicKey: params.publicKey,
    signTransaction: params.signTransaction as any
  })

  const tx = await client.set({ name: params.name, contract_id: contractId })
  const sent = await tx.signAndSend()
  const txHash =
    sent.getTransactionResponse?.txHash ??
    sent.sendTransactionResponse?.hash ??
    null
  return { txHash }
}

export async function registerMappingWithOwnerSecret(params: {
  name: string
  ownerSecret: string
}): Promise<{ txHash: string | null }> {
  const registrarId = ensureRegistrarId()
  const contractId = getMembershipContractAddress()
  if (!contractId) throw new Error('Membership contract not configured')

  const keypair = Keypair.fromSecret(params.ownerSecret)
  const publicKey = keypair.publicKey()

  const client = new RegistrarClient({
    contractId: registrarId,
    rpcUrl: STELLAR_RPC_URL,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    publicKey,
    signTransaction: async (xdr: string) => {
      const tx = TransactionBuilder.fromXDR(xdr, STELLAR_NETWORK_PASSPHRASE)
      // @ts-ignore sign exists on both Transaction and FeeBumpTransaction
      tx.sign(keypair)
      return tx.toEnvelope().toXDR('base64')
    }
  })

  const tx = await client.set({ name: params.name, contract_id: contractId })
  const sent = await tx.signAndSend()
  const txHash =
    sent.getTransactionResponse?.txHash ??
    sent.sendTransactionResponse?.hash ??
    null
  return { txHash }
}
