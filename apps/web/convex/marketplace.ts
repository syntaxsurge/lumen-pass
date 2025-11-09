import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { requireUserByWallet } from './utils'

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('marketplaceListings')
      .collect()
      .then(rows => rows.filter(r => r.active))
  }
})

export const listMine = query({
  args: { ownerAddress: v.string() },
  handler: async (ctx, { ownerAddress }) => {
    const owner = await requireUserByWallet(ctx, ownerAddress)
    return await ctx.db
      .query('marketplaceListings')
      .withIndex('by_sellerId', q => q.eq('sellerId', owner._id))
      .collect()
  }
})

export const createListing = mutation({
  args: { ownerAddress: v.string(), listingId: v.string(), price: v.string(), txHash: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const existing = await ctx.db
      .query('marketplaceListings')
      .withIndex('by_listingId', q => q.eq('listingId', args.listingId))
      .unique()
    if (existing && existing.active) return
    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, { active: true, price: args.price, updatedAt: now, lastTxHash: args.txHash?.toLowerCase() })
    } else {
      await ctx.db.insert('marketplaceListings', {
        listingId: args.listingId,
        sellerId: owner._id,
        price: args.price,
        active: true,
        lastTxHash: args.txHash?.toLowerCase(),
        createdAt: now,
        updatedAt: now
      })
    }
  }
})

export const cancelListing = mutation({
  args: { ownerAddress: v.string(), listingId: v.string(), txHash: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const existing = await ctx.db
      .query('marketplaceListings')
      .withIndex('by_listingId', q => q.eq('listingId', args.listingId))
      .unique()
    if (!existing || existing.sellerId !== owner._id) throw new Error('Listing not found')
    await ctx.db.patch(existing._id, { active: false, updatedAt: Date.now(), lastTxHash: args.txHash?.toLowerCase() })
  }
})

export const recordTx = mutation({
  args: { listingId: v.string(), txHash: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('marketplaceListings')
      .withIndex('by_listingId', q => q.eq('listingId', args.listingId))
      .unique()
    if (!existing) return
    await ctx.db.patch(existing._id, { lastTxHash: args.txHash.toLowerCase(), active: false, updatedAt: Date.now() })
  }
})

