'use client'

import { Horizon } from '@stellar/stellar-sdk'

import { STELLAR_HORIZON_URL } from '@/lib/stellar/config'
import { stroopsFromAmountString } from '@/lib/stellar/paylink-service'

const horizonServer = new Horizon.Server(STELLAR_HORIZON_URL, {
  allowHttp: STELLAR_HORIZON_URL.startsWith('http://')
})

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForTransaction(hash: string, timeoutMs = 20000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const tx = await horizonServer.transactions().transaction(hash).call()
      if ((tx as any).successful === true) {
        return tx
      }
    } catch (error) {
      // swallow and retry until timeout
      console.warn('[waitForTransaction]', error)
    }
    await delay(1200)
  }
  throw new Error('Timed out waiting for transaction confirmation')
}

export async function verifyNativePayment(params: {
  hash: string
  to: string
  from?: string | null
  amountStroops?: bigint | null
  memoText?: string | null
}) {
  const tx = await waitForTransaction(params.hash)

  if (params.memoText && tx.memo_type === 'text') {
    const txMemo = (tx.memo as string) ?? ''
    if (txMemo !== params.memoText.slice(0, 28)) {
      return { ok: false as const, reason: 'memo_mismatch' }
    }
  }

  const ops = await horizonServer.operations().forTransaction(params.hash).call()
  const expectedAmount = params.amountStroops ?? null

  const match = ops.records.find(record => {
    if (record.type !== 'payment') return false
    if (record.asset_type !== 'native') return false
    const toMatches =
      record.to?.toUpperCase() === params.to.toUpperCase()
    const fromMatches = params.from
      ? record.from?.toUpperCase() === params.from.toUpperCase()
      : true
    const amountMatches = expectedAmount
      ? stroopsFromAmountString(record.amount) === expectedAmount
      : true
    return toMatches && fromMatches && amountMatches
  })

  if (!match) {
    return { ok: false as const, reason: 'no_matching_payment' }
  }

  return {
    ok: true as const,
    closedAt: tx.closed_at as string,
    operationId: match.id as string
  }
}
