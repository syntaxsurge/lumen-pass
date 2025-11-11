'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  ShieldCheck,
  Tag,
  Users
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useStellarWallet } from '@/hooks/use-stellar-wallet'
import { getMembershipContractAddress } from '@/lib/config'
import { formatSettlementToken } from '@/lib/settlement-token'
import { getContractUrl, getTransactionUrl } from '@/lib/stellar/explorer'
import { summarizeAccount } from '@/lib/stellar/format'
import {
  getConfig as getLumenPassConfig,
  getExpiryMs
} from '@/lib/stellar/lumen-pass-service'
import { formatTimestampRelative } from '@/lib/time'

import { GroupDescriptionEditor } from './group-description-editor'
import { GroupMediaCarousel } from './group-media-carousel'
import { useGroupContext } from '../context/group-context'
import { formatGroupPriceLabel } from '../utils/price'

export function GroupAboutSection() {
  const {
    group,
    owner,
    isOwner,
    memberCount,
    membership,
    currentUser,
    administrators,
    subscription
  } = useGroupContext()
  const wallet = useStellarWallet()
  const viewerAddress = wallet.address ?? currentUser?.walletAddress ?? null
  const [passExpiryMs, setPassExpiryMs] = useState<number | null>(
    typeof membership.passExpiresAt === 'number'
      ? membership.passExpiresAt
      : null
  )
  const [isResolvingExpiry, setIsResolvingExpiry] = useState(false)
  const [contractConfig, setContractConfig] =
    useState<Awaited<ReturnType<typeof getLumenPassConfig>>>(null)

  useEffect(() => {
    let cancelled = false
    getLumenPassConfig()
      .then(config => {
        if (!cancelled) {
          setContractConfig(config)
        }
      })
      .catch(error => {
        console.error('Failed to load LumenPass config', error)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (typeof membership.passExpiresAt === 'number') {
      setPassExpiryMs(membership.passExpiresAt)
      setIsResolvingExpiry(false)
    } else if (membership.status !== 'active') {
      setPassExpiryMs(null)
      setIsResolvingExpiry(false)
    }
  }, [membership.passExpiresAt, membership.status])

  useEffect(() => {
    if (!viewerAddress) return
    if (membership.status !== 'active') return
    if (typeof membership.passExpiresAt === 'number') return
    let cancelled = false
    setIsResolvingExpiry(true)
    getExpiryMs(viewerAddress)
      .then(expiry => {
        if (!cancelled) {
          setPassExpiryMs(expiry ?? null)
          setIsResolvingExpiry(false)
        }
      })
      .catch(error => {
        console.error('Failed to resolve latest pass expiry', error)
        if (!cancelled) {
          setIsResolvingExpiry(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [membership.passExpiresAt, membership.status, viewerAddress])

  const mediaSources = useMemo(() => {
    const sources: string[] = []
    if (group.aboutUrl) sources.push(group.aboutUrl)
    if (Array.isArray(group.galleryUrls)) {
      sources.push(...group.galleryUrls)
    }
    return sources
  }, [group.aboutUrl, group.galleryUrls])

  const privacy =
    group.visibility === 'public'
      ? { icon: Globe, label: 'Public community' }
      : { icon: Lock, label: 'Private community' }

  const totalMembers =
    typeof memberCount === 'number' ? memberCount : (group.memberNumber ?? 0)

  const priceLabel = formatGroupPriceLabel(group.price, group.billingCadence, {
    includeCadence: true,
    usdRate: 1
  })

  const creatorName =
    owner?.displayName ??
    summarizeAccount(owner?.walletAddress, { fallback: 'Unknown creator' })

  const creatorInitials = useMemo(() => {
    if (!creatorName) return '?'
    const parts = creatorName.split(' ').filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }, [creatorName])

  const isAdmin = useMemo(() => {
    if (isOwner) return true
    if (!currentUser) return false
    return administrators?.some(a => a.user._id === currentUser._id) ?? false
  }, [administrators, currentUser, isOwner])

  const adminPrivilegeMessage = useMemo(() => {
    if (!isAdmin) return null
    return isOwner
      ? 'You own this group. Owner privileges include full administrative control without relying on a membership pass.'
      : 'You are an administrator for this group. Admin privileges provide full access without relying on a membership pass.'
  }, [isAdmin, isOwner])

  const membershipExpiryLabel = useMemo(() => {
    if (membership.status !== 'active' || isAdmin) return null
    if (!passExpiryMs) {
      return 'No expiry scheduled'
    }

    const expirySeconds = Math.floor(passExpiryMs / 1000)
    const relative = formatTimestampRelative(expirySeconds)
    const absolute = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(passExpiryMs))

    return `${absolute} (${relative})`
  }, [isAdmin, membership.status, passExpiryMs])

  const memberCountLabel = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    })
    const value = Number.isFinite(totalMembers) ? totalMembers : 0
    const membersLabel = value === 1 ? 'member' : 'members'
    return `${formatter.format(value)} ${membersLabel}`
  }, [totalMembers])

  const transactionHash = subscription.lastPaymentTxHash?.trim()
  const paymentExplorerUrl = useMemo(
    () => getTransactionUrl(transactionHash),
    [transactionHash]
  )
  const membershipContractId = useMemo(
    () => getMembershipContractAddress()?.trim() ?? '',
    []
  )
  const contractPriceLabel = useMemo(() => {
    if (!contractConfig?.price) return 'Loading price…'
    try {
      return formatSettlementToken(BigInt(contractConfig.price))
    } catch {
      return `${contractConfig.price} stroops`
    }
  }, [contractConfig?.price])
  const membershipDurationLabel = useMemo(() => {
    if (!contractConfig?.duration_ledgers) return 'Loading duration…'
    const seconds = Number(contractConfig.duration_ledgers) * 5
    const days = Math.max(1, Math.round(seconds / 86_400))
    return `${days} day${days === 1 ? '' : 's'}`
  }, [contractConfig?.duration_ledgers])
  type MembershipStatusDescriptor = {
    variant: 'active' | 'syncing' | 'inactive'
    label: string
    description?: string
    icon: LucideIcon
    spinning?: boolean
  }

  const membershipStatus = useMemo<MembershipStatusDescriptor | null>(() => {
    if (isAdmin) return null

    if (membership.status !== 'active') {
      return {
        variant: 'inactive',
        label: 'No active LumenPass detected.',
        description: 'Activate your pass to unlock gated content.',
        icon: AlertCircle
      }
    }

    if (passExpiryMs && membershipExpiryLabel) {
      return {
        variant: 'active',
        label: `Membership active through ${membershipExpiryLabel}`,
        description: 'You can keep participating until the pass expires.',
        icon: CheckCircle2
      }
    }

    return {
      variant: 'syncing',
      label: isResolvingExpiry
        ? 'Pass confirmed. Syncing expiry with Stellar…'
        : 'Waiting for pass expiry from chain…',
      description:
        'This usually finalizes once Horizon confirms the latest ledger.',
      icon: Loader2,
      spinning: true
    }
  }, [
    isAdmin,
    isResolvingExpiry,
    membership.status,
    membershipExpiryLabel,
    passExpiryMs
  ])

  const membershipStatusTone = useMemo(() => {
    switch (membershipStatus?.variant) {
      case 'active':
        return {
          bg: 'bg-emerald-500/10',
          icon: 'text-emerald-500'
        }
      case 'syncing':
        return {
          bg: 'bg-amber-500/10',
          icon: 'text-amber-500'
        }
      case 'inactive':
      default:
        return {
          bg: 'bg-rose-500/10',
          icon: 'text-rose-500'
        }
    }
  }, [membershipStatus?.variant])
  const MembershipStatusIcon = membershipStatus?.icon

  return (
    <div className='space-y-8'>
      <div className='space-y-4'>
        <h1 className='text-4xl font-bold text-foreground'>{group.name}</h1>
        <GroupMediaCarousel
          sources={mediaSources}
          fallbackImage={group.thumbnailUrl}
        />
      </div>

      <div className='flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card px-5 py-3'>
        <div className='flex items-center gap-2 text-sm text-foreground'>
          <privacy.icon className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium'>{privacy.label}</span>
        </div>
        <div className='h-4 w-px bg-border' />
        <div className='flex items-center gap-2 text-sm text-foreground'>
          <Users className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium'>{memberCountLabel}</span>
        </div>
        <div className='h-4 w-px bg-border' />
        <div className='flex items-center gap-2 text-sm text-foreground'>
          <Tag className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium'>{priceLabel}</span>
        </div>
        {owner ? (
          <>
            <div className='h-4 w-px bg-border' />
            <div className='flex items-center gap-2 text-sm text-foreground'>
              <Avatar className='h-6 w-6'>
                {owner.avatarUrl ? (
                  <AvatarImage src={owner.avatarUrl} alt={creatorName} />
                ) : null}
                <AvatarFallback className='text-xs font-semibold'>
                  {creatorInitials}
                </AvatarFallback>
              </Avatar>
              <span className='font-medium'>By {creatorName}</span>
            </div>
          </>
        ) : null}
      </div>

      {adminPrivilegeMessage ? (
        <div className='rounded-lg border border-border bg-card px-5 py-3 text-sm text-muted-foreground'>
          <ShieldCheck className='mr-2 inline h-4 w-4' />
          {adminPrivilegeMessage}
        </div>
      ) : membershipExpiryLabel && membership.status === 'active' ? (
        <div className='rounded-lg border border-border bg-card px-5 py-3 text-sm text-muted-foreground'>
          <Calendar className='mr-2 inline h-4 w-4' />
          Your pass expires {membershipExpiryLabel}
        </div>
      ) : null}

      <GroupDescriptionEditor
        editable={isOwner}
        groupId={group._id}
        initialContent={group.description}
      />

      <div className='grid gap-4 md:grid-cols-2'>
        {membershipStatus && MembershipStatusIcon ? (
          <div className='rounded-lg border border-border bg-card p-5'>
            <div className='space-y-3'>
              <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                Membership status
              </p>
              <div className='flex items-start gap-3'>
                <span
                  className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${membershipStatusTone.bg}`}
                >
                  <MembershipStatusIcon
                    className={`h-5 w-5 ${membershipStatusTone.icon} ${membershipStatus.spinning ? 'animate-spin' : ''}`}
                  />
                </span>
                <div className='space-y-1'>
                  <p className='font-medium text-foreground'>
                    {membershipStatus.label}
                  </p>
                  {membershipStatus.description ? (
                    <p className='text-sm text-muted-foreground'>
                      {membershipStatus.description}
                    </p>
                  ) : null}
                  {paymentExplorerUrl ? (
                    <a
                      href={paymentExplorerUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-1 text-xs font-medium text-primary underline decoration-dotted underline-offset-4'
                    >
                      Last renewal receipt
                      <ExternalLink className='h-3 w-3' />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <div className='rounded-lg border border-border bg-card p-5'>
          <div className='space-y-3'>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              LumenPass contract
            </p>
            <p className='break-all font-mono text-sm text-foreground'>
              {membershipContractId || 'Not configured'}
            </p>
            <p className='text-sm text-muted-foreground'>
              {contractPriceLabel} • {membershipDurationLabel}
            </p>
            {membershipContractId ? (
              <a
                href={getContractUrl(membershipContractId) ?? undefined}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 text-xs font-medium text-primary underline decoration-dotted underline-offset-4'
              >
                Inspect on Horizon
                <ExternalLink className='h-3 w-3' />
              </a>
            ) : null}
          </div>
        </div>
        {/* On-chain registrar UI removed as requested */}
      </div>
    </div>
  )
}
