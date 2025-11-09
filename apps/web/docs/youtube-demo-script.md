# LumenPass Demo Video Script

This script outlines a 7–8 minute walkthrough of LumenPass on the Stellar network. Each voice-over line is paired with the visual or interaction the audience should see at that moment.

---

## Segment 1 – Ecosystem Intro

1. **On-screen:** Start on the LumenPass landing hero (`/`), slowly pan across the headline, feature cards, and primary CTA.
   - **Voice-over 1:** “LumenPass helps creators launch paid communities, teach members, and manage revenue on the Stellar network.”

## Segment 2 – Connect Wallet & Network Choice

1. **On-screen:** Click `Connect wallet`, open the Stellar Wallets Kit modal, select **Freighter**, approve in the wallet, and show the navbar updating with the connected address and XLM balance.
   - **Voice-over 2:** “Connect through Stellar Wallets Kit—Freighter, Lobstr, and other wallets plug in instantly, and the header reflects the active account plus live XLM balance.”

## Segment 3 – Payments Dashboard Tour

1. **On-screen:** Navigate to `/payments`; let the overview banner animate in.
   - **Voice-over 3:** “The payments dashboard is the command center—status, pay links, invoices, and save goals in one place.”
2. **On-screen:** Open the `SatsPay Links` tab, create a handle, and copy the generated pay URL.
   - **Voice-over 4:** “SatsPay Links turn any handle into a payable URL—perfect for donations or tips.”
   - Field inputs — type exactly:
     - Handle: `lumenpassdemo`
     - Title: `Creator Ops 101 — Tip Jar`
     - Description: `Support the Creator Ops 101 cohort with a quick tip.`
3. **On-screen:** Open the `Get XLM` tab and reveal the Stellar testnet hub buttons for Swap and Borrow.
   - **Voice-over 5:** “When a wallet needs funds, the Get XLM tab deep‑links to the Stellar hub’s swap and borrow flows.”
4. **On-screen:** Open the `Invoices` tab, add one line item, set an optional `Payer wallet`, attach a SatsPay handle, and click `Issue invoice`.
   - **Voice-over 6:** “Invoices are issued on-chain via the Invoice Registry. LumenPass hashes the invoice slug, records the native asset amount, and keeps the registry ID for verification.”
   - Field inputs — type exactly:
     - Invoice title: `Pilot Package — Northstar Labs`
     - Paylink handle: `@lumenpassdemo`
     - Customer name: `Northstar Labs Ltd.`
     - Customer email: `ops@northstarlabs.test`
     - Payer wallet (optional): Leave blank
     - Due date: `2025-12-12`
     - Notes: `Scope: pilot deliverables and async support.`
     - Line items:
       - 1) Description: `Pilot deliverables (flat)` — Qty: `1` — Unit price (XLM): `8.00`
5. **On-screen:** Open `Save Goals`, create an “Equipment Fund” with a target amount, and save.
   - **Voice-over 7:** “Save Goals track earmarked XLM while funds stay in your wallet.”
   - Field inputs — type exactly:
     - Goal name: `Equipment Fund`
     - Target amount (XLM): `850.00`
     - Target date (optional): `2025-12-31`
     - Notes (optional): `Camera upgrade + mic kit`
   - (Optional) Log contribution right after creating:
     - Add to goal — Amount (XLM): `150.00` — Transaction hash (optional): `3f4abc9012def67890fedcba1234567890abcdef1234567890abcdef12345678` — Memo: `Initial contribution`

## Segment 4 – Invoice Checkout

1. **On-screen:** In `Payments → Invoices`, click `Copy payment link` on the newly issued invoice and show the URL.
2. **On-screen:** Switch to another browser profile with a different wallet connected. Paste the copied payment URL to open `/pay/lumenpassdemo?invoice=<invoice-slug>`; show the invoice card with number, amount due, and status “Awaiting payment”.
3. **On-screen:** Click `Pay invoice`, sign the Soroban transaction in the wallet, show the success toast, then hop back to `Payments → Invoices` to confirm the row now shows `Paid` with the tx hash pill.
   - **Voice-over 8:** “Copy the payment link, settle it from a second wallet, and LumenPass auto-updates status the moment Stellar confirms.”

## Segment 5 – Create a Paid Community

1. **On-screen:** Navigate to `/create`, highlight the platform fee quote (XLM/month), then complete the form.
   - Field inputs — type exactly:
     - Group name: `Telusko Group`
     - Tagline: `Learn Java, Spring/Spring Boot/Spring AI, DevOps (with AWS), REST API/Web Services, Hibernate/ORM frameworks, and microservices live and self-paced from telusko`
     - Membership pricing: `Paid (Monthly)`
     - Monthly price (USD): `5.00`
     - Thumbnail (link tab): paste any YouTube thumbnail URL
     - Intro Video URL (optional): `https://www.youtube.com/watch?v=7xIpeyBc-jY`
     - Tags (optional): `tech`
     - Gallery image (link): any public image URL
   - **Voice-over 9:** “Enter the brand, pricing, and media, click Create Community, approve the single Stellar transaction, and the space is live.”

## Segment 6 – About, Verify, Edit Details

1. **On-screen:** Land on the group About tab showing membership summary and latest payout stats.
   - **Voice-over 10:** “The About page surfaces the on-chain contract ID with an explorer link. Edit lets me tweak pricing, copy, media, intro video, and administrator shares in one place.”

## Segment 7 – Classroom: Create Course, Modules, Lessons

1. **On-screen:** Switch to the Classroom tab and click `Create a course`.
   - **Voice-over 11:** “I create a course that will hold modules and lessons. For the demo I paste sample content from a public YouTube playlist so you can see the flow.”

## Segment 8 – Join the Paid Community as a Member

1. **On-screen:** In a second browser profile or incognito window, connect a different wallet via Stellar Wallets Kit, navigate to the community page, and click `Join`.
   - **Voice-over 12:** “I switch to a second wallet and join the paid group. Approve once and the pass is minted immediately.”

## Segment 9 – Feed: Admin & Member Engagement

1. **On-screen:** Back on the creator wallet, open the `Feed` tab, publish a welcome post with links, then switch to the member profile, like the post, and drop a comment.
   - **Voice-over 13:** “Admins publish updates, members react in real time—likes and comments sync instantly through Convex.”

## Segment 10 – Classroom: Member Learning

1. **On-screen:** Staying on the member wallet, open the `Classroom` tab, enter the course created earlier, click the “Introduction” module, and select the “Welcome” lesson.
   - **Voice-over 14:** “Members who hold an active pass can dive straight into gated lessons—videos, notes, and resources stay in one flow.”

## Segment 11 – Discover & Join a Free Community

1. **On-screen:** Open `/groups`, show a mix of free and paid groups, click a free group, and join instantly to reveal Feed + Classroom without prompts.
   - **Voice-over 15:** “The Discover page mixes free and paid communities. Joining a free group is one click, and the same tabs appear immediately.”

## Segment 12 – Thank You

- **Voice-over 16:** “Thanks for watching the LumenPass demo—go build your own Stellar-native membership in minutes.”
