'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { useMutation } from 'convex/react'
import {
  ArrowRight,
  Sparkles,
  Wallet,
  Link2,
  Split,
  ShieldCheck,
  Users,
  BookOpen,
  Coins,
  BarChart3,
  CheckCircle2,
  Rocket,
  Star,
  Play
} from 'lucide-react'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import { useWalletAccount } from '@/hooks/use-wallet-account'

const rawDemoVideoUrl = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || ''

const stats = [
  {
    icon: Wallet,
    label: 'Settlement token',
    value: 'XLM',
    description: 'Every checkout clears to your wallet on Stellar.'
  },
  {
    icon: Link2,
    label: 'Pay handles',
    value: 'Satspay',
    description: 'Share direct support links with live receipt tracking.'
  },
  {
    icon: Split,
    label: 'Recurring payouts',
    value: 'Multi-wallet',
    description: 'Automate collaborator splits in a single transaction.'
  }
]

const features = [
  {
    icon: Coins,
    title: 'Payments toolkit',
    description:
      'Spin up pay handles, invoices, and checkout pages that settle straight to your wallet. Convex keeps receipts and balances in sync in real time.',
    highlight: 'Direct XLM settlement'
  },
  {
    icon: Users,
    title: 'Memberships & access',
    description:
      'Group dashboards, gated feeds, and pass-aware classrooms keep your community organized. Wallet checks and registrar sync ensure the right people get in.',
    highlight: 'Wallet-native access control'
  },
  {
    icon: BookOpen,
    title: 'Creator operations',
    description:
      'Schedule recurring payouts, reconcile invoices, and tag save goals without touching spreadsheets. Everything routes through the same on-chain primitives.',
    highlight: 'Automated collaborator splits'
  },
  {
    icon: ShieldCheck,
    title: 'Built on Stellar',
    description:
      'LumenPass runs on Stellar so you get BTC-backed security, predictable fees, and non-custodial control. No bridges, no wrapped assets, no hidden custody.',
    highlight: 'Non-custodial by design'
  }
]

const testimonials = [
  {
    name: 'Jamie Ortiz',
    role: 'Community Lead, Mosaic Club',
    avatar: 'JO',
    quote:
      'Pay handles replaced our manual invoices. Supporters settle in XLM, receipts update instantly, and we never leave the LumenPass dashboard.',
    metrics: [
      { label: 'Active pay handles', value: '3' },
      { label: 'Payout cadence', value: 'Weekly splits' }
    ]
  },
  {
    name: 'Riley Chen',
    role: 'Creator, Studio 27',
    avatar: 'RC',
    quote:
      'Memberships, classroom drops, and treasury automations all live together. Wallet gating keeps premium content exclusive without extra tooling.',
    metrics: [
      { label: 'Members onboarded', value: '140' },
      { label: 'Courses live', value: '6' }
    ]
  },
  {
    name: 'Morgan Patel',
    role: 'Producer, Signal Guild',
    avatar: 'MP',
    quote:
      'Recurring payouts run through the split router in one click. Everyone gets their share in XLM and the ledger stays aligned with Stellar automatically.',
    metrics: [
      { label: 'Collaborators paid', value: '5 wallets' },
      { label: 'Processing time', value: '< 30 sec' }
    ]
  }
]

const howItWorks = [
  {
    step: '01',
    title: 'Launch your LumenPass',
    description:
      'Create a group, set pricing, and connect your Stellar wallet. Add courses, modules, resources, and branding in the same flow.',
    details: ['No-code setup', 'Stellar-native by default', 'Custom branding']
  },
  {
    step: '02',
    title: 'Publish pay links & invoices',
    description:
      'Generate Satspay handles, invoices, and storefront checkouts. Share a single URL and LumenPass watches for XLM transfers automatically.',
    details: ['Pay handles & QR codes', 'Invoice tracking', 'Live receipt sync']
  },
  {
    step: '03',
    title: 'Manage memberships & payouts',
    description:
      'Gate feeds and classrooms, schedule recurring payouts, and monitor treasury balances. Everything stays synchronized between Convex and Stellar.',
    details: [
      'Recurring split payouts',
      'Membership insights',
      'Treasury visibility'
    ]
  }
]

const heroHighlights = [
  'Instant XLM settlement',
  'Recurring payouts without spreadsheets',
  'Memberships, classrooms, and storefronts together'
]

const demoVideoEmbedUrl = buildEmbedUrl(rawDemoVideoUrl)

function buildEmbedUrl(input: string): string {
  if (!input) return ''
  try {
    const parsed = new URL(input)
    const host = parsed.hostname.replace(/^www\./, '')
    let videoId = ''
    if (host === 'youtu.be') {
      videoId = parsed.pathname.replace('/', '')
    } else if (host.includes('youtube.com')) {
      videoId =
        parsed.searchParams.get('v') ??
        parsed.pathname.split('/').filter(Boolean).pop() ??
        ''
    }
    if (!videoId) {
      return input
    }
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1'
    })
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
  } catch {
    return input
  }
}

export default function HomePageClient() {
  const { address } = useWalletAccount()
  const storeUser = useMutation(api.users.store)

  useEffect(() => {
    if (!address) return
    storeUser({ address }).catch(() => {
      /* ignore duplicate upsert errors */
    })
  }, [address, storeUser])

  return (
    <main className='relative overflow-hidden bg-gradient-to-b from-background via-background to-secondary/15'>
      <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
        <div className='absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(circle_at_top_right,_hsl(var(--brand-teal)/0.12),_transparent_55%)]' />
        <div className='absolute right-0 top-[780px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-orange)/0.08),_transparent_70%)] blur-3xl' />
        <div className='absolute left-0 top-[1380px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-teal)/0.08),_transparent_70%)] blur-3xl' />
      </div>

      <section className='relative'>
        <div className='mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pb-32 sm:pt-28 lg:px-8'>
          <div className='grid gap-12 lg:grid-cols-2 lg:gap-16'>
            <div className='flex flex-col justify-center space-y-8'>
              <div className='inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm'>
                <Sparkles className='h-4 w-4' />
                <span>LumenPass on Stellar</span>
              </div>

              <div className='space-y-6'>
                <h1 className='text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl'>
                  <span className='text-foreground'>Own your</span>
                  <br />
                  <span className='bg-gradient-to-r from-brand-teal-dark via-brand-teal to-accent bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]'>
                    Payments & Memberships
                  </span>
                </h1>

                <p className='text-xl leading-relaxed text-muted-foreground lg:text-2xl'>
                  LumenPass settles every checkout in XLM on Stellar, keeps your
                  community gated, and automates collaborator payouts—all from a
                  single dashboard.
                </p>
              </div>

              <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
                <Button
                  size='lg'
                  className='bg-gradient-to-r from-brand-teal to-brand-teal-light text-base shadow-lg shadow-primary/20 hover:opacity-90'
                  asChild
                >
                  <Link href='/create'>
                    Start Building
                    <Rocket className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='border-primary/30 text-base hover:bg-primary/5'
                  asChild
                >
                  <Link href='/payments'>
                    Explore Payments
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
              </div>

              <div className='flex flex-wrap gap-4 pt-4'>
                {heroHighlights.map(highlight => (
                  <div
                    key={highlight}
                    className='flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground'
                  >
                    <CheckCircle2 className='h-4 w-4 text-primary' />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className='relative'>
              <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-transparent blur-3xl' />
              <div className='relative space-y-6'>
                <div className='grid gap-4'>
                  <div className='group rounded-2xl border border-primary/20 bg-card/90 p-6 backdrop-blur-xl transition-all hover:scale-105 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-muted-foreground'>
                          Demo dashboard
                        </p>
                        <h3 className='text-xl font-semibold text-foreground'>
                          Payments overview
                        </h3>
                      </div>
                      <BarChart3 className='h-6 w-6 text-primary' />
                    </div>
                    <div className='mt-4 grid grid-cols-3 gap-4'>
                      {stats.map(({ icon: Icon, label, value }) => (
                        <div key={label} className='space-y-1'>
                          <div className='flex items-center gap-2'>
                            <Icon className='h-4 w-4 text-primary' />
                            <span className='text-xs text-muted-foreground'>
                              {label}
                            </span>
                          </div>
                          <p className='text-lg font-semibold'>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='rounded-2xl border border-accent/20 bg-card/90 p-6 backdrop-blur-xl'>
                    <div className='flex items-center gap-3'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-accent/15'>
                        <Star className='h-5 w-5 text-accent' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-muted-foreground'>
                          New: Wallet-gated classrooms
                        </p>
                        <h3 className='text-lg font-semibold text-foreground'>
                          Drop lessons to members only
                        </h3>
                      </div>
                    </div>
                    <div className='mt-4'>
                      <AspectRatio ratio={16 / 9}>
                        {demoVideoEmbedUrl ? (
                          <iframe
                            title='LumenPass demo video'
                            src={demoVideoEmbedUrl}
                            className='h-full w-full rounded-xl border border-accent/20 bg-black'
                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                            allowFullScreen
                            loading='lazy'
                          />
                        ) : (
                          <div className='flex h-full w-full items-center justify-center rounded-xl border border-accent/20 bg-muted'>
                            <Play className='h-10 w-10 text-accent' />
                          </div>
                        )}
                      </AspectRatio>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='mt-20 grid gap-6 md:grid-cols-2 lg:gap-10'>
            {features.map(({ icon: Icon, title, description, highlight }) => (
              <div
                key={title}
                className='rounded-2xl border border-primary/10 bg-card/90 p-6 backdrop-blur-xl transition-all hover:border-primary/30 hover:shadow-md'
              >
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10'>
                    <Icon className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold'>{title}</h3>
                    <p className='text-xs font-medium text-primary'>
                      {highlight}
                    </p>
                  </div>
                </div>
                <p className='mt-4 text-muted-foreground'>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='relative border-t border-border/50 bg-background/60 py-24'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='grid gap-8 lg:grid-cols-3'>
            {testimonials.map(t => (
              <div
                key={t.name}
                className='rounded-2xl border border-border/40 bg-card/90 p-6 shadow-sm backdrop-blur-md'
              >
                <div className='flex items-center gap-4'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary'>
                    {t.avatar}
                  </div>
                  <div>
                    <p className='font-medium'>{t.name}</p>
                    <p className='text-sm text-muted-foreground'>{t.role}</p>
                  </div>
                </div>
                <p className='mt-4 text-muted-foreground'>“{t.quote}”</p>
                <div className='mt-4 grid grid-cols-2 gap-4 text-sm'>
                  {t.metrics.map(m => (
                    <div
                      key={m.label}
                      className='rounded-lg border border-border/30 bg-muted/40 p-3'
                    >
                      <p className='text-muted-foreground'>{m.label}</p>
                      <p className='font-semibold'>{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='relative bg-gradient-to-b from-background via-background to-secondary/10 py-24'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-3xl font-bold sm:text-4xl'>How it works</h2>
            <p className='mt-3 text-muted-foreground'>
              Launch with no code. Own your payments and membership data end to
              end.
            </p>
          </div>
          <div className='mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {howItWorks.map(item => (
              <div
                key={item.step}
                className='rounded-2xl border border-border/40 bg-card/90 p-6 shadow-sm backdrop-blur-md'
              >
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                    {item.step}
                  </div>
                  <h3 className='text-lg font-semibold'>{item.title}</h3>
                </div>
                <p className='mt-4 text-muted-foreground'>{item.description}</p>
                <ul className='mt-4 list-inside list-disc text-sm text-muted-foreground'>
                  {item.details.map(d => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
