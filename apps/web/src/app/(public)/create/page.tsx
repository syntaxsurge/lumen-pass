'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from 'convex/react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import { GroupMediaFields } from '@/features/groups/components/group-media-fields'
import {
  isValidMediaReference,
  normalizeMediaInput
} from '@/features/groups/utils/media'
import { generateMembershipCourseId } from '@/features/groups/utils/membership'
import { useAppRouter } from '@/hooks/use-app-router'
import { usePlatformFeeQuote } from '@/hooks/use-platform-fee-quote'
import { useStellarWallet } from '@/hooks/use-stellar-wallet'
import { getPlatformTreasuryAddress } from '@/lib/config'
import { submitNativePaymentViaWallet } from '@/lib/stellar/paylink-service'

const createGroupSchema = z
  .object({
    name: z.string().min(2, 'Group name is required').max(80),
    shortDescription: z
      .string()
      .min(20, 'Describe the group in at least 20 characters')
      .max(200, 'Keep the summary under 200 characters'),
    aboutUrl: z
      .string()
      .trim()
      .url('Enter a valid URL')
      .optional()
      .or(z.literal('')),
    thumbnailUrl: z.string().optional(),
    galleryUrls: z.array(z.string()).default([]),
    tags: z.string().optional(),
    visibility: z.enum(['public', 'private']).default('private'),
    billingCadence: z.enum(['free', 'monthly']).default('free'),
    price: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.billingCadence === 'monthly') {
      if (!data.price || data.price.trim() === '') {
        ctx.addIssue({
          path: ['price'],
          code: z.ZodIssueCode.custom,
          message: 'Monthly pricing is required'
        })
      } else if (Number.isNaN(Number(data.price))) {
        ctx.addIssue({
          path: ['price'],
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid number'
        })
      } else if (Number(data.price) <= 0) {
        ctx.addIssue({
          path: ['price'],
          code: z.ZodIssueCode.custom,
          message: 'Price must be greater than zero'
        })
      }

      if (data.visibility !== 'private') {
        ctx.addIssue({
          path: ['visibility'],
          code: z.ZodIssueCode.custom,
          message: 'Paid memberships must be private.'
        })
      }
    }

    if (!isValidMediaReference(data.thumbnailUrl)) {
      ctx.addIssue({
        path: ['thumbnailUrl'],
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid image URL or upload a file.'
      })
    }

    data.galleryUrls.forEach((value, index) => {
      if (!isValidMediaReference(value)) {
        ctx.addIssue({
          path: ['galleryUrls', index],
          code: z.ZodIssueCode.custom,
          message: 'Provide a valid image URL or upload a file.'
        })
      }
    })
  })

export type CreateGroupFormValues = z.infer<typeof createGroupSchema>

const DEFAULT_VALUES: CreateGroupFormValues = {
  name: '',
  shortDescription: '',
  aboutUrl: '',
  thumbnailUrl: '',
  galleryUrls: [],
  tags: '',
  visibility: 'private',
  billingCadence: 'free',
  price: ''
}

export default function Create() {
  const router = useAppRouter()
  const wallet = useStellarWallet()
  const platformTreasuryAddress = useMemo(
    () => getPlatformTreasuryAddress(),
    []
  )
  const {
    quote: platformFeeQuote,
    usdLabel: platformFeeUsdLabel,
    settlementLabel: platformFeeSettlementLabel,
    refresh: refreshPlatformFee
  } = usePlatformFeeQuote({ autoFetch: true })
  const createGroup = useMutation(api.groups.create)
  const generateUploadUrl = useMutation(api.media.generateUploadUrl)
  const requestUploadUrl = useCallback(
    () => generateUploadUrl({}),
    [generateUploadUrl]
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: DEFAULT_VALUES
  })

  const billingCadence = form.watch('billingCadence')

  useEffect(() => {
    if (
      billingCadence === 'monthly' &&
      form.getValues('visibility') !== 'private'
    ) {
      form.setValue('visibility', 'private', {
        shouldDirty: true,
        shouldValidate: true
      })
    }
  }, [billingCadence, form])

  const isProcessing = form.formState.isSubmitting || isSubmitting

  const handleSubmit = useCallback(
    async (values: CreateGroupFormValues) => {
      if (!wallet.address) {
        await wallet.connect()
      }

      if (!wallet.address) {
        toast.error('Connect your Stellar wallet to continue.')
        return
      }

      setIsSubmitting(true)
      try {
        const feeQuote =
          platformFeeQuote ?? (await refreshPlatformFee().catch(() => null))
        if (!feeQuote || feeQuote.amount <= 0n) {
          throw new Error(
            'Unable to resolve the platform fee quote. Please try again.'
          )
        }

        if (!platformTreasuryAddress) {
          throw new Error('Platform treasury address is not configured.')
        }

        if (!wallet.signTransaction) {
          throw new Error(
            'Connected wallet cannot sign transactions. Reconnect your wallet.'
          )
        }

        const feeMemo = `GROUP-${values.name.trim().slice(0, 18)}`.replace(
          /[^ -~]/g,
          ''
        )

        const feeTxHash = await submitNativePaymentViaWallet({
          publicKey: wallet.address,
          destination: platformTreasuryAddress,
          amount: feeQuote.amount,
          memo: feeMemo || undefined,
          signTransaction: wallet.signTransaction
        })

        toast.success('Platform fee paid', { description: feeTxHash })

        const priceNumeric =
          values.billingCadence === 'monthly'
            ? Number(values.price ?? 0)
            : 0
        const formattedPrice = Number.isFinite(priceNumeric)
          ? Math.max(0, priceNumeric)
          : 0

        const thumbnailSource = normalizeMediaInput(values.thumbnailUrl)
        const gallery = (values.galleryUrls ?? [])
          .map(entry => normalizeMediaInput(entry))
          .filter(Boolean)

        const tags = values.tags
          ?.split(',')
          .map(tag => tag.trim().toLowerCase())
          .filter(Boolean)

        const resolvedVisibility =
          values.billingCadence === 'monthly' ? 'private' : values.visibility

        const subscriptionId = generateMembershipCourseId()

        const groupId = await createGroup({
          ownerAddress: wallet.address,
          name: values.name.trim(),
          description: undefined,
          shortDescription: values.shortDescription.trim(),
          aboutUrl: normalizeMediaInput(values.aboutUrl) || undefined,
          thumbnailUrl: thumbnailSource || undefined,
          galleryUrls: gallery.length ? gallery : undefined,
          tags,
          visibility: resolvedVisibility,
          billingCadence:
            formattedPrice > 0 ? 'monthly' : values.billingCadence,
          price: formattedPrice,
          subscriptionId,
          subscriptionPaymentTxHash: feeTxHash
        } as any)

        toast.success('Your group is live!')
        router.push(`/${groupId}/about`)
      } catch (error) {
        console.error('Failed to create group', error)
        toast.error(
          error instanceof Error
            ? error.message
            : 'Unable to deploy your community right now.'
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      createGroup,
      platformFeeQuote,
      platformTreasuryAddress,
      refreshPlatformFee,
      router,
      wallet
    ]
  )

  const onSubmit = form.handleSubmit(values => handleSubmit(values))

  const heroDescription = useMemo(
    () =>
      'Launch a Stellar-native community hub. Invite free or paid members with wallet-gated access, Passport-enabled wallets, and native XLM settlement—no bridges required.',
    []
  )

  return (
    <div className='relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20'>
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -left-4 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-teal)/0.15),_transparent_65%)] blur-3xl' />
        <div className='absolute -right-4 top-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-orange)/0.08),_transparent_65%)] blur-3xl' />
        <div className='absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-teal)/0.1),_transparent_70%)] blur-3xl' />
      </div>

      <div className='relative mx-auto max-w-6xl px-6 py-12'>
        <div className='mb-12 text-center'>
          <div className='mb-6 flex justify-center'>
            <Logo className='text-2xl' />
          </div>
          <h1 className='mb-4 text-5xl font-bold tracking-tight md:text-6xl'>
            <span className='text-foreground'>
              Create Your{' '}
              <span className='bg-gradient-to-r from-brand-teal to-accent bg-clip-text text-transparent drop-shadow-sm'>
                Creator Group
              </span>
            </span>
          </h1>
          <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
            {heroDescription}
          </p>
        </div>

        <div className='mx-auto max-w-3xl'>
          <div className='mb-8 rounded-2xl border border-border/50 bg-card/80 p-6 shadow-lg backdrop-blur-sm'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Platform fee
                </p>
                <h2 className='text-2xl font-bold text-foreground'>
                  {platformFeeUsdLabel}
                </h2>
                <p className='text-sm text-muted-foreground'>
                  {platformFeeSettlementLabel ?? 'Resolving settlement amount…'}
                </p>
              </div>
              <div className='rounded-full border border-border/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                Billed monthly
              </div>
            </div>
          </div>

          <div className='rounded-3xl border border-border/60 bg-background/80 p-8 shadow-xl backdrop-blur-xl'>
            <Form {...form}>
              <form className='space-y-8' onSubmit={onSubmit}>
                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group name</FormLabel>
                        <FormControl>
                          <Input placeholder='Creator Ops Collective' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='visibility'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select visibility' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='private'>Private (wallet-gated)</SelectItem>
                            <SelectItem value='public'>Public</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Paid memberships are automatically private to enforce wallet gating.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='shortDescription'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tagline</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder='Summarize your community in a sentence or two.'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='aboutUrl'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Introduction video URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='https://www.youtube.com/watch?v=...'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional. Shown on your group about page as an embedded
                        video.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <GroupMediaFields form={form} requestUploadUrl={requestUploadUrl} />

                <FormField
                  control={form.control}
                  name='tags'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder='community, education, ops' {...field} />
                      </FormControl>
                      <FormDescription>
                        Separate tags with commas to help members discover you.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='billingCadence'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing cadence</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Choose how you bill' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='free'>Free</SelectItem>
                            <SelectItem value='monthly'>Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Monthly memberships require a price and remain private.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='price'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly price (XLM)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            placeholder='99'
                            disabled={form.watch('billingCadence') !== 'monthly'}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='flex flex-col gap-6 rounded-2xl border border-border/50 bg-muted/10 p-6'>
                  <div>
                    <h3 className='text-lg font-semibold text-foreground'>Deployment checklist</h3>
                    <p className='text-sm text-muted-foreground'>We publish your group to the LumenPass registry and make it instantly available to Stellar wallets.</p>
                  </div>
                  <ul className='space-y-3 text-sm text-muted-foreground'>
                    <li>• Upload hero and gallery assets for your community</li>
                    <li>• Set pricing or keep things free for open onboarding</li>
                    <li>• Connect your Stellar wallet to finalize deployment</li>
                  </ul>
                  <div className='flex flex-col gap-2'>
                    <Button type='submit' disabled={isProcessing}>
                      {isProcessing ? 'Creating Community...' : 'Create Community'}
                    </Button>
                    <p className='text-center text-xs text-muted-foreground'>
                      By deploying, you agree to our terms. Your app will be accessible to Stellar wallets you onboard.
                    </p>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
