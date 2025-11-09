import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { normalizeAddress, requireUserByWallet } from './utils'

function normalizeHandle(handle: string) {
  return handle.trim().toLowerCase()
}

export const listForOwner = query({
  args: { ownerAddress: v.string() },
  handler: async (ctx, { ownerAddress }) => {
    const owner = await requireUserByWallet(ctx, ownerAddress)
    const paylinks = await ctx.db
      .query('paylinks')
      .withIndex('by_ownerId', q => q.eq('ownerId', owner._id))
      .collect()
    return paylinks.filter(paylink => paylink.isActive)
  }
})

export const getByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    return await ctx.db
      .query('paylinks')
      .withIndex('by_handle', q => q.eq('handle', normalizeHandle(handle)))
      .unique()
  }
})

export const create = mutation({
  args: {
    ownerAddress: v.string(),
    handle: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    receivingAddress: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)

    const handle = normalizeHandle(args.handle)
    if (!handle) {
      throw new Error('Handle is required')
    }

    const existing = await ctx.db
      .query('paylinks')
      .withIndex('by_handle', q => q.eq('handle', handle))
      .unique()
    if (existing) {
      throw new Error('Handle already in use')
    }

    const now = Date.now()
    await ctx.db.insert('paylinks', {
      handle,
      ownerId: owner._id,
      receivingAddress: normalizeAddress(
        args.receivingAddress ?? args.ownerAddress
      ),
      title: args.title,
      description: args.description,
      createdAt: now,
      updatedAt: now,
      isActive: true
    })
  }
})

export const archive = mutation({
  args: {
    ownerAddress: v.string(),
    paylinkId: v.id('paylinks')
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const paylink = await ctx.db.get(args.paylinkId)

    if (!paylink || paylink.ownerId !== owner._id) {
      throw new Error('Paylink not found')
    }

    if (!paylink.isActive && paylink.archivedAt) {
      return
    }

    await ctx.db.patch(args.paylinkId, {
      isActive: false,
      archivedAt: Date.now(),
      updatedAt: Date.now()
    })
  }
})
