'use client'

import {
  Asset,
  Horizon,
  Memo,
  Operation,
  TransactionBuilder
} from '@stellar/stellar-sdk'

import { SETTLEMENT_TOKEN_DECIMALS } from '@/lib/config'
import {
  STELLAR_HORIZON_URL,
  STELLAR_NETWORK_PASSPHRASE
} from '@/lib/stellar/config'
import type { StellarSigner } from '@/lib/stellar/lumen-pass-service'

const DECIMAL_FACTOR = 10n ** BigInt(SETTLEMENT_TOKEN_DECIMALS)

export function formatStroopsAsDecimal(amount: bigint): string {
  const sign = amount < 0n ? '-' : ''
  const abs = amount < 0n ? -amount : amount
  const whole = abs / DECIMAL_FACTOR
  const fraction = abs % DECIMAL_FACTOR
  const fractionStr = fraction
    .toString()
    .padStart(SETTLEMENT_TOKEN_DECIMALS, '0')
  if (fraction === 0n) {
    return `${sign}${whole}.0000000`
  }
  const trimmed = fractionStr.replace(/0+$/, '')
  return `${sign}${whole}.${trimmed}`
}

export function stroopsFromAmountString(value: string): bigint {
  const [wholePart, fractionPart = ''] = value.split('.')
  const sanitizedWhole = wholePart.trim() || '0'
  const paddedFraction = (
    fractionPart + '0'.repeat(SETTLEMENT_TOKEN_DECIMALS)
  ).slice(0, SETTLEMENT_TOKEN_DECIMALS)
  return BigInt(sanitizedWhole) * DECIMAL_FACTOR + BigInt(paddedFraction || '0')
}

type PaylinkPaymentParams = {
  publicKey: string
  destination: string
  amount: bigint
  memo?: string | null
  signTransaction?: StellarSigner['signTransaction']
}

export async function submitNativePaymentViaWallet({
  publicKey,
  destination,
  amount,
  memo,
  signTransaction
}: PaylinkPaymentParams) {
  if (!signTransaction) {
    throw new Error('Wallet must support transaction signing.')
  }

  if (amount <= 0n) {
    throw new Error('Amount must be positive.')
  }

  const server = new Horizon.Server(STELLAR_HORIZON_URL, {
    allowHttp: STELLAR_HORIZON_URL.startsWith('http://')
  })
  const account = await server.loadAccount(publicKey)
  const baseFee = await server.fetchBaseFee()
  let builder = new TransactionBuilder(account, {
    fee: (Number(baseFee) * 2).toString(),
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE
  }).addOperation(
    Operation.payment({
      destination,
      asset: Asset.native(),
      amount: formatStroopsAsDecimal(amount)
    })
  )

  if (memo) {
    builder = builder.addMemo(Memo.text(memo.slice(0, 28)))
  }

  const tx = builder.setTimeout(180).build()
  // Provide the transaction envelope (base64) to the wallet
  const unsignedBase64 = tx.toEnvelope().toXDR('base64')
  const signedRaw: unknown = await signTransaction(unsignedBase64)

  // Normalize the wallet response into a base64 envelope string.
  const signedBase64 = (() => {
    if (typeof signedRaw === 'string') return signedRaw.trim()
    const obj = signedRaw as any
    const candidate =
      obj?.signedTxXdr ??
      obj?.signedXDR ??
      obj?.signed_xdr ??
      obj?.envelope_xdr ??
      obj?.signedTx ??
      obj?.tx ??
      obj?.xdr
    return typeof candidate === 'string' ? candidate.trim() : ''
  })()

  if (!signedBase64) {
    throw new Error('Wallet returned no signed XDR payload')
  }

  // First, try the SDK submit path which validates structure client-side.
  try {
    const signed = TransactionBuilder.fromXDR(
      signedBase64,
      STELLAR_NETWORK_PASSPHRASE
    )
    const resp = await server.submitTransaction(signed)
    return resp.hash
  } catch (_) {
    // Fallback: post to Horizon directly
    const endpoint = `${STELLAR_HORIZON_URL.replace(/\/$/, '')}/transactions`
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    const body = new URLSearchParams({ tx: signedBase64 })
    const res = await fetch(endpoint, { method: 'POST', headers, body })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const extras = (json as any)?.extras
      console.error('[horizon-submit]', {
        envelope_xdr: extras?.envelope_xdr,
        result_codes: extras?.result_codes,
        result_xdr: extras?.result_xdr
      })
      const reason =
        (json && (json.detail || json.title || json.status)) || 'submit_failed'
      throw new Error(`Horizon submit failed: ${reason}`)
    }
    return (json as any).hash as string
  }
}
