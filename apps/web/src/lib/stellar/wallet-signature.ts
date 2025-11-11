import type { StellarSigner } from '@/lib/stellar/lumen-pass-service'

export type WalletSignedEnvelope =
  | string
  | {
      signedTxXdr?: string
      signedXDR?: string
      signed_xdr?: string
      envelope_xdr?: string
      signedTx?: string
      tx?: string
      xdr?: string
    }

export function extractSignedEnvelope(payload: WalletSignedEnvelope): string {
  if (typeof payload === 'string') {
    return payload.trim()
  }
  const candidate =
    payload?.signedTxXdr ??
    payload?.signedXDR ??
    payload?.signed_xdr ??
    payload?.envelope_xdr ??
    payload?.signedTx ??
    payload?.tx ??
    payload?.xdr
  return typeof candidate === 'string' ? candidate.trim() : ''
}

/**
 * Normalizes wallet `signTransaction` responses so Soroban clients always
 * receive a base64-encoded transaction envelope string.
 */
export function normalizeSigner(
  signTransaction?: StellarSigner['signTransaction']
) {
  if (!signTransaction) return undefined
  return async (xdr: string) => {
    const raw = (await signTransaction(xdr)) as WalletSignedEnvelope
    const base64 = extractSignedEnvelope(raw)
    if (!base64) throw new Error('Wallet returned no signed XDR payload')
    return { signedTxXdr: base64 }
  }
}
