import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { normalizeAddress, requireUserByWallet } from './utils'

type RecipientInput = {
  address: string
  shareBps: number
  label?: string
}

function sanitizeRecipients(recipients: RecipientInput[]) {
  if (recipients.length === 0) throw new Error('At least one recipient')
  const sanitized = recipients.map(r => ({
    address: normalizeAddress(r.address),
    shareBps: Math.max(0, Math.floor(r.shareBps)),
    label: r.label?.trim()
  }))
  const total = sanitized.reduce((t, r) => t + r.shareBps, 0)
  if (total !== 10_000) throw new Error('Shares must total 100% (10000 bps).')
  return sanitized
}

export const listSchedules = query({
  args: { ownerAddress: v.string() },
  handler: async (ctx, { ownerAddress }) => {
    const owner = await requireUserByWallet(ctx, ownerAddress)
    return await ctx.db
      .query('payoutSchedules')
      .withIndex('by_ownerId', q => q.eq('ownerId', owner._id))
      .collect()
  }
})

export const createSchedule = mutation({
  args: {
    ownerAddress: v.string(),
    name: v.string(),
    recipients: v.array(
      v.object({ address: v.string(), shareBps: v.number(), label: v.optional(v.string()) })
    )
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const recipients = sanitizeRecipients(args.recipients)
    const now = Date.now()
    return await ctx.db.insert('payoutSchedules', {
      ownerId: owner._id,
      name: args.name.trim(),
      recipients,
      createdAt: now,
      updatedAt: now
    })
  }
})

export const updateSchedule = mutation({
  args: {
    ownerAddress: v.string(),
    scheduleId: v.id('payoutSchedules'),
    name: v.optional(v.string()),
    recipients: v.optional(
      v.array(
        v.object({ address: v.string(), shareBps: v.number(), label: v.optional(v.string()) })
      )
    )
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const schedule = await ctx.db.get(args.scheduleId)
    if (!schedule || schedule.ownerId !== owner._id) throw new Error('Not found')
    const payload: Record<string, unknown> = { updatedAt: Date.now() }
    if (typeof args.name !== 'undefined') payload.name = args.name.trim()
    if (typeof args.recipients !== 'undefined') payload.recipients = sanitizeRecipients(args.recipients)
    await ctx.db.patch(args.scheduleId, payload)
  }
})

export const deleteSchedule = mutation({
  args: { ownerAddress: v.string(), scheduleId: v.id('payoutSchedules') },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const schedule = await ctx.db.get(args.scheduleId)
    if (!schedule || schedule.ownerId !== owner._id) throw new Error('Not found')
    const executions = await ctx.db
      .query('payoutExecutions')
      .withIndex('by_scheduleId', q => q.eq('scheduleId', args.scheduleId))
      .collect()
    for (const e of executions) await ctx.db.delete(e._id)
    await ctx.db.delete(args.scheduleId)
  }
})

export const recordExecution = mutation({
  args: {
    ownerAddress: v.string(),
    scheduleId: v.id('payoutSchedules'),
    txHash: v.string(),
    totalAmount: v.string(),
    executedAt: v.number()
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const schedule = await ctx.db.get(args.scheduleId)
    if (!schedule || schedule.ownerId !== owner._id) throw new Error('Not found')
    const existing = await ctx.db
      .query('payoutExecutions')
      .withIndex('by_txHash', q => q.eq('txHash', args.txHash.toLowerCase()))
      .first()
    if (existing) return
    await ctx.db.insert('payoutExecutions', {
      scheduleId: args.scheduleId,
      txHash: args.txHash.toLowerCase(),
      totalAmount: BigInt(args.totalAmount).toString(),
      executedAt: args.executedAt
    })
  }
})

