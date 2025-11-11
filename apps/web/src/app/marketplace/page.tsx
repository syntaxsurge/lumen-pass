'use client'
export const dynamic = 'force-dynamic'

import nextDynamic from 'next/dynamic'

const MarketplacePageClient = nextDynamic(() => import('./page.client'), {
  ssr: false
})

export default function MarketplacePage() {
  return <MarketplacePageClient />
}
