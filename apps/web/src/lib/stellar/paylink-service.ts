'use client'

import {
  Asset,
  Horizon,
  Memo,
  Operation,
  TransactionBuilder
} from '@stellar/stellar-sdk'

import {
  STELLAR_HORIZON_URL,
  STELLAR_NETWORK_PASSPHRASE
} from '@/lib/stellar/config'
import { SETTLEMENT_TOKEN_DECIMALS } from '@/lib/config'
import type { StellarSigner } from '@/lib/stellar/lumen-pass-service'

const DECIMAL_FACTOR = 10n ** BigInt(SETTLEMENT_TOKEN_DECIMALS)

export function formatStroopsAsDecimal(amount: bigint): string {
  const sign = amount < 0n ? '-' : ''
  const abs = amount < 0n ? -amount : amount
  const whole = abs / DECIMAL_FACTOR
  const fraction = abs % DECIMAL_FACTOR
  let fractionStr = fraction.toString().padStart(SETTLEMENT_TOKEN_DECIMALS, '0')
  fractionStr = fractionStr.replace(/0+$/, '')
  const decimal = fractionStr ? `${whole}.${fractionStr}` : `${whole}`
  return `${sign}${decimal}`
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
  const signedXdr = await signTransaction(tx.toEnvelope().toXDR('base64'))
  const signed = TransactionBuilder.fromXDR(
    signedXdr,
    STELLAR_NETWORK_PASSPHRASE
  )
  const resp = await server.submitTransaction(signed)
  return resp.hash
}
