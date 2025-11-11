import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { requireUserByWallet } from './utils'

export const listActive = query({
  args: {},
  handler: async ctx => {
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

export const getUserStats = query({
  args: { ownerAddress: v.string() },
  handler: async (ctx, { ownerAddress }) => {
    const owner = await requireUserByWallet(ctx, ownerAddress)
    const stats = await ctx.db
      .query('marketplaceUserStats')
      .withIndex('by_userId', q => q.eq('userId', owner._id))
      .unique()
    return stats ?? null
  }
})

export const createListing = mutation({
  args: {
    ownerAddress: v.string(),
    listingId: v.string(),
    price: v.string(),
    txHash: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    // Anti-abuse: enforce cooldowns on listing
    const now = Date.now()
    const stats = await ctx.db
      .query('marketplaceUserStats')
      .withIndex('by_userId', q => q.eq('userId', owner._id))
      .unique()
    const LIST_COOLDOWN_MS = 60 * 1000
    if (stats && stats.lastListAt && now - stats.lastListAt < LIST_COOLDOWN_MS) {
      throw new Error('Please wait before creating another listing.')
    }
    const existing = await ctx.db
      .query('marketplaceListings')
      .withIndex('by_listingId', q => q.eq('listingId', args.listingId))
      .unique()
    if (existing && existing.active) return
    if (existing) {
      await ctx.db.patch(existing._id, {
        active: true,
        price: args.price,
        updatedAt: now,
        lastTxHash: args.txHash?.toLowerCase()
      })
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
    if (stats) {
      await ctx.db.patch(stats._id, { lastListAt: now })
    } else {
      await ctx.db.insert('marketplaceUserStats', {
        userId: owner._id,
        lastListAt: now,
        lastCancelAt: undefined,
        lastBuyAt: undefined,
        dailyBuyCount: 0,
        buyDayKey: undefined
      })
    }
  }
})

export const cancelListing = mutation({
  args: {
    ownerAddress: v.string(),
    listingId: v.string(),
    txHash: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const existing = await ctx.db
      .query('marketplaceListings')
      .withIndex('by_listingId', q => q.eq('listingId', args.listingId))
      .unique()
    if (!existing || existing.sellerId !== owner._id)
      throw new Error('Listing not found')
    const now = Date.now()
    // Anti-abuse: cancel cooldown
    const stats = await ctx.db
      .query('marketplaceUserStats')
      .withIndex('by_userId', q => q.eq('userId', owner._id))
      .unique()
    const CANCEL_COOLDOWN_MS = 30 * 1000
    if (stats && stats.lastCancelAt && now - stats.lastCancelAt < CANCEL_COOLDOWN_MS) {
      throw new Error('Please wait before canceling again.')
    }
    await ctx.db.patch(existing._id, {
      active: false,
      updatedAt: now,
      lastTxHash: args.txHash?.toLowerCase()
    })
    if (stats) {
      await ctx.db.patch(stats._id, { lastCancelAt: now })
    } else {
      await ctx.db.insert('marketplaceUserStats', {
        userId: owner._id,
        lastListAt: undefined,
        lastCancelAt: now,
        lastBuyAt: undefined,
        dailyBuyCount: 0,
        buyDayKey: undefined
      })
    }
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
    const now = Date.now()
    await ctx.db.patch(existing._id, {
      lastTxHash: args.txHash.toLowerCase(),
      active: false,
      updatedAt: now
    })
    // anti-abuse: buy daily limits
    const BUY_DAILY_LIMIT = 50
    const buyerDayKey = new Date(now).toISOString().slice(0, 10)
    const buyer = await ctx.db
      .query('users')
      .withIndex('by_wallet', q => q.eq('walletAddress', args.txHash.slice(0,0)))
      .first()
    // Note: buyer resolution from tx is not tracked here; enforce limits via UI.
  }
})
