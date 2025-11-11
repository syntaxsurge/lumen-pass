'use client'

import React, { useCallback, useState } from 'react'

import { useMutation } from 'convex/react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { api } from '@/convex/_generated/api'
import { useStellarWallet } from '@/hooks/use-stellar-wallet'
import { useWalletAccount } from '@/hooks/use-wallet-account'
import { parseSettlementTokenAmount } from '@/lib/settlement-token'
import { submitNativePaymentViaWallet } from '@/lib/stellar/paylink-service'

import { useGroupContext } from '../context/group-context'
import { formatGroupPriceLabel } from '../utils/price'

function LeaveGroupButton() {
  const { group, membership } = useGroupContext()
  const { address, isConnected, connect } = useWalletAccount()
  const leaveGroup = useMutation(api.groups.leave)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isWorking, setIsWorking] = useState(false)

  const handleLeave = useCallback(async () => {
    if (!isConnected || !address) {
      connect()
      return
    }
    setIsWorking(true)
    try {
      await leaveGroup({
        groupId: group._id,
        memberAddress: address,
        passExpiresAt: membership.passExpiresAt ?? undefined
      })
      toast.success('You have left this group.')
      setDialogOpen(false)
    } catch (err) {
      console.error(err)
      toast.error('Unable to leave the group. Please try again.')
    } finally {
      setIsWorking(false)
    }
  }, [
    address,
    connect,
    group._id,
    isConnected,
    leaveGroup,
    membership.passExpiresAt
  ])

  return (
    <>
      <Button
        type='button'
        variant='outline'
        className='h-10 px-6'
        onClick={() => setDialogOpen(true)}
      >
        Leave group
      </Button>
      <Dialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => setDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave {group.name}</DialogTitle>
            <DialogDescription>
              Leaving removes your access immediately. You can rejoin later if
              you still have an active pass.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setDialogOpen(false)}
              disabled={isWorking}
            >
              Stay in group
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={handleLeave}
              disabled={isWorking}
            >
              {isWorking ? 'Leaving…' : 'Confirm leave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function JoinGroupButton() {
  const { group, isOwner, isMember, owner } = useGroupContext()
  const { address, isConnected, connect } = useWalletAccount()
  const stellar = useStellarWallet()
  const joinGroup = useMutation(api.groups.join)

  const [isWorking, setIsWorking] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const priceLabel = formatGroupPriceLabel(group.price, group.billingCadence, {
    includeCadence: true
  })

  const handleJoin = useCallback(async () => {
    if (!isConnected || !address) {
      connect()
      return
    }
    if (!stellar.signTransaction) {
      toast.error('Wallet not ready. Please reconnect.')
      return
    }
    setIsWorking(true)
    try {
      const requiresPayment =
        (group.price ?? 0) > 0 && group.billingCadence === 'monthly'
      let txHash: string | null = null
      if (requiresPayment) {
        const dest = owner?.walletAddress?.trim()
        if (!dest) throw new Error('Group owner wallet not available.')
        const amount = parseSettlementTokenAmount(String(group.price ?? 0))
        const memo = `GROUP-${group._id}`.slice(0, 28)
        txHash = await submitNativePaymentViaWallet({
          publicKey: address,
          destination: dest,
          amount,
          memo,
          signTransaction: stellar.signTransaction
        })
      }

      const defaultExpiry =
        group.billingCadence === 'monthly'
          ? Date.now() + 30 * 24 * 60 * 60 * 1000
          : undefined

      await joinGroup({
        groupId: group._id,
        memberAddress: address,
        hasActivePass: false,
        passExpiresAt: defaultExpiry,
        txHash: txHash ?? undefined
      })
      toast.success('Membership activated!')
      setDialogOpen(false)
    } catch (err) {
      console.error(err)
      toast.error('Unable to complete membership. Please try again.')
    } finally {
      setIsWorking(false)
    }
  }, [
    address,
    connect,
    group._id,
    isConnected,
    joinGroup,
    stellar.signTransaction,
    group.billingCadence,
    group.price,
    owner?.walletAddress
  ])

  if (isOwner) return null
  if (isMember) return <LeaveGroupButton />

  return (
    <>
      <Button
        type='button'
        variant='default'
        className='h-10 px-6'
        onClick={() => setDialogOpen(true)}
      >
        Join {priceLabel}
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => setDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm membership</DialogTitle>
            <DialogDescription>
              We will connect your Stellar wallet and activate your membership
              using the LumenPass contract. Network fees apply.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type='button'
              className='h-10 px-6'
              onClick={handleJoin}
              disabled={isWorking}
            >
              {isWorking ? 'Processing…' : 'Pay and join'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
