import Link from 'next/link'

import { LumenPassSection } from '@/components/lumen-pass-section'

import styles from './page.module.css'

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>Scaffold Stellar Toolkit</p>
        <h1>LumenPass</h1>
        <p className={styles.subtitle}>
          Prototype Soroban contracts in Rust, generate typed TypeScript clients, and ship
          wallet-ready Stellar apps without reinventing your stack.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href='/lumenpass'>
            Launch demo
          </Link>
          <Link className={styles.secondary} href='https://github.com/theahaco/scaffold-stellar' target='_blank'>
            View Scaffold Stellar docs
          </Link>
        </div>
      </section>

      <section className={styles.features}>
        <article>
          <h3>Rust → Wasm</h3>
          <p>
            Contracts compile with `stellar scaffold build` and expose schema-driven clients usable
            directly inside Next.js.
          </p>
        </article>
        <article>
          <h3>Wallets Kit</h3>
          <p>Freighter and all Wallets Kit integrations work instantly via the shared provider.</p>
        </article>
        <article>
          <h3>Native XLM</h3>
          <p>
            Payments route through the Stellar Asset Contract, so you can accept native Lumens without
            extra bridges or wrappers.
          </p>
        </article>
      </section>

      <LumenPassSection />

      <footer>Built with ❤️ on Stellar • Apache-2.0</footer>
    </div>
  )
}
