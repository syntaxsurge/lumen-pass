'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { GroupSwitcher } from './group-switcher'
import { HeaderUtilityMenu } from './header-utility-menu'
import { ThemeToggle } from './theme-toggle'
import { WalletMenu } from './wallet-menu'

export function AppNavbar() {
  const pathname = usePathname()
  const isPayments = pathname?.startsWith('/payments')

  return (
    <header className='sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60'>
      {/* Subtle gradient overlay */}
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5' />

      <div className='relative mx-auto flex h-20 w-full items-center justify-between gap-4 px-4 sm:gap-6 sm:px-8'>
        <div className='flex items-center gap-4 sm:gap-8'>
          <Link
            href='/'
            aria-label='LumenPass home'
            className='group relative flex items-center gap-3 rounded-2xl border border-border/40 bg-card/80 px-3 py-2 text-left shadow-sm transition-all hover:border-primary/50 hover:bg-card/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
          >
            <div className='relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/60 bg-background/80 p-1.5 shadow-inner transition group-hover:border-primary/50 sm:h-12 sm:w-12'>
              <Image
                src='/images/lumenpass-logo.png'
                alt='LumenPass logo'
                width={292}
                height={293}
                priority
                sizes='(max-width: 640px) 40px, 48px'
                className='h-full w-full object-contain drop-shadow-sm transition group-hover:drop-shadow-lg'
              />
            </div>
            <div className='flex flex-col leading-tight'>
              <span className='text-sm font-semibold tracking-tight text-foreground sm:text-base'>
                LumenPass
              </span>
              <span className='text-[10px] font-medium uppercase text-muted-foreground sm:text-xs'>
                Stellar Commerce
              </span>
            </div>
          </Link>

          <div className='h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent' />

          <GroupSwitcher />

          <nav className='flex items-center gap-1'>
            <Link
              href='/payments'
              className={`group relative rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                isPayments
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isPayments && (
                <span className='absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 ring-1 ring-primary/20' />
              )}
              <span className='relative'>Payments</span>
            </Link>
            <Link
              href='/marketplace'
              className={`group relative rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                pathname?.startsWith('/marketplace')
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {pathname?.startsWith('/marketplace') && (
                <span className='absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 ring-1 ring-primary/20' />
              )}
              <span className='relative'>Marketplace</span>
            </Link>
          </nav>
        </div>

        <div className='flex items-center gap-2'>
          <ThemeToggle />
          <div className='h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent' />
          <HeaderUtilityMenu />
          <WalletMenu />
        </div>
      </div>
    </header>
  )
}
