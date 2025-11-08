import Link from 'next/link'

import { LumenPassSection } from '@/components/lumen-pass-section'

import styles from './page.module.css'

export default function LumenPassPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href='/' className={styles.backlink}>
          ← Back home
        </Link>
        <h1>Interact with the Soroban membership contract</h1>
        <p>
          Connect a Stellar wallet, review your membership status, and trigger a `subscribe`
          transaction compiled from the Rust contract inside this repo.
        </p>
      </header>
      <LumenPassSection />
    </div>
  )
}
