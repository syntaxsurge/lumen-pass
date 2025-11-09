import { v } from 'convex/values'

import { Client as InvoiceRegistryClient } from 'invoice_registry'

import type { Doc } from './_generated/dataModel'
import { api as generatedApi } from './_generated/api'
import { action } from './_generated/server'

const api = generatedApi as any

const STELLAR_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL ||
  'https://soroban-testnet.stellar.org:443'
const STELLAR_NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
  'Test SDF Network ; September 2015'

type SettlementResult =
  | { ok: true; payer: string | null; amount: string }
  | { ok: false; reason: string }

export const recordSettlement = action({
  args: {
    slug: v.string(),
    txHash: v.string()
  },
  handler: async (ctx, args): Promise<SettlementResult> => {
    const invoice = (await ctx.runQuery(api.invoices.getBySlug, {
      slug: args.slug
    })) as Doc<'invoices'> | null

    if (!invoice) {
      return { ok: false, reason: 'invoice_not_found' }
    }

    if (!invoice.registryAddress || !invoice.registryInvoiceId) {
      return { ok: false, reason: 'invoice_not_registered' }
    }

    const registryInvoiceId = BigInt(invoice.registryInvoiceId)

    const ir = new InvoiceRegistryClient({
      contractId: invoice.registryAddress,
      rpcUrl: STELLAR_RPC_URL,
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE
    })

    const resp = await ir.get({ id: registryInvoiceId })
    const onchain = resp.result

    if (!onchain) {
      return { ok: false, reason: 'invoice_not_found_onchain' }
    }

    if (!onchain.paid) {
      return { ok: false, reason: 'invoice_unpaid' }
    }

    const amountStr = BigInt(onchain.amount).toString()
    if (amountStr !== invoice.totalAmount) {
      return { ok: false, reason: 'amount_mismatch' }
    }

    const owner = (await ctx.runQuery(api.users.getById, {
      userId: invoice.ownerId
    })) as Doc<'users'> | null

    if (!owner) {
      return { ok: false, reason: 'owner_missing' }
    }

    await ctx.runMutation(api.invoices.markPaid, {
      ownerAddress: owner.walletAddress,
      slug: args.slug,
      paymentTxHash: args.txHash,
      paidAt: Date.now()
    })

    return {
      ok: true,
      payer: (onchain.payer ?? null) as string | null,
      amount: amountStr
    }
  }
})
