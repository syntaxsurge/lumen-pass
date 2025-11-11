# LumenPass Demo Video Script

This outline covers a 7–8 minute walkthrough of LumenPass on the Stellar testnet. Every voice-over line is paired with the visual or interaction the viewer should see at that moment.

---

## Segment 1 – Ecosystem Intro

1. **On-screen:** Start on the LumenPass landing hero (`/`), slowly pan across the headline, feature cards, and primary CTA.
   - **Voice-over 1:** “LumenPass helps creators launch paid communities, teach members, and manage revenue directly on Stellar with native XLM settlement.”

## Segment 2 – Connect Wallet & Network Choice

1. **On-screen:** Click `Connect wallet`, choose Stellar Wallets Kit → Freighter (or Albedo), approve the signature, then show the navbar updating with the connected wallet and network.
   - **Voice-over 2:** “Connect with Stellar Wallets Kit—here I’m using Freighter.”

## Segment 3 – Payments Dashboard Tour

1. **On-screen:** Navigate to `/payments`; the overview banner renders at the top.
   - **Voice-over 3:** “The payments dashboard is the command center—status, satspay links, invoices, payouts, and save goals in one place.”
2. **On-screen:** Open the `SatsPay Links` tab, create a handle, and copy the generated pay URL.
   - **Voice-over 4:** “SatsPay Links turn any handle into a payable URL—perfect for tips or one-off support that clears to your wallet in XLM.”
   - Field inputs — type exactly:
     - Handle: `lumenpassdemo`
     - Title: `Creator Ops 101 — Tip Jar`
     - Description: `Support the Creator Ops 101 cohort with a quick tip.`
3. **On-screen:** Open the `Get XLM` tab and reveal the bundled buttons for Lobstr, StellarX swap, and the testnet faucet.
   - **Voice-over 5:** “When a wallet needs funds, the Get XLM tab deep-links to trusted Stellar ramps plus the public faucet for testnet.”
4. **On-screen:** Open the `Invoices` tab, add one line item, set an optional `Payer wallet`, attach the SatsPay handle, and click `Issue invoice`.
   - **Voice-over 6:** “Invoices are issued on-chain via the Invoice Registry. LumenPass hashes the slug, records the token and amount, and keeps the registry ID for later verification.”
   - Field inputs — type exactly:
     - Invoice title: `Pilot Package — Northstar Labs`
     - Paylink handle: `@lumenpassdemo`
     - Customer name: `Northstar Labs Ltd.`
     - Customer email: `ops@northstarlabs.test`
     - Payer wallet (optional): Leave blank
     - Due date: `2025-12-12`
     - Notes: `Scope: pilot deliverables and async support.`
     - Line items:
       - 1) Description: `Pilot deliverables (flat)` — Qty: `1` — Unit price (XLM): `80`
5. **On-screen:** Open `Recurring Payouts`, add two collaborators with shares, and save.
   - **Voice-over 7:** “Payout schedules use the split router so one transaction pushes XLM to every collaborator with the exact split.”
   - Field inputs — type exactly:
     - Schedule name: `Creator Ops 101 — Revenue Split`
     - Recipient 1 — Wallet address: `GBSAMPLECREATORWALLET1111111111111111111111111111111111` — Share (%): `70` — Label: `Creator`
     - Recipient 2 — Wallet address: `GBSAMPLEEDITORWALLET2222222222222222222222222222222222` — Share (%): `30` — Label: `Editor`
     - Execute Payout (after saving) — Amount (XLM): `100`
6. **On-screen:** Open `Save Goals`, create an “Equipment Fund” with a target amount, and save.
   - **Voice-over 8:** “Save Goals track earmarked XLM while the funds remain in your own wallet.”
   - Field inputs — type exactly:
     - Goal name: `Equipment Fund`
     - Target amount (XLM): `850`
     - Target date (optional): `2025-12-31`
     - Notes (optional): `Camera upgrade + mic kit`
   - (Optional) Log contribution right after creating:
     - Add to goal — Amount (XLM): `150` — Transaction hash (optional): `cc6b648e5ebda9ef7112c57250753c39289fc2089803f6f984adece4d7779aa5` — Memo: `Initial contribution`

## Segment 4 – Invoice Checkout

1. **On-screen:** In `Payments → Invoices`, click `Copy payment link` on the newly issued invoice and show the URL.
2. **On-screen:** Switch to another browser profile (or incognito) with a different wallet connected. Paste the payment URL to open `/pay/lumenpassdemo?invoice=<invoice-slug>`; show the invoice card with number, amount due, and status “Awaiting payment”.
3. **On-screen:** Click `Pay with wallet`, approve the XLM transfer, then show the success toast and the status switching to “Paid”. Return to `Payments → Invoices` in the original browser to confirm the row now shows `Paid` with the tx hash.
   - **Voice-over 9:** “Open the pay link in a separate browser, sign the XLM payment, and the invoice flips to ‘Paid’ the moment Horizon sees the transaction.”

## Segment 5 – Create a Paid Community

1. **On-screen:** Navigate to `/create` with the connected wallet; show the pricing card quoting the monthly platform fee in XLM. Fill in sample details (name, tagline, pricing, media), then submit the form.
   - Field inputs — type exactly:
     - Group name: `Telusko Group`
     - Tagline: `Learn Java, Spring/Spring Boot/Spring AI, DevOps, REST, Hibernate/ORM, and microservices live and self-paced from Telusko`
     - Membership pricing: `Paid (Monthly)`
     - Monthly price (XLM): `50`
     - Thumbnail (link tab): `https://i.ytimg.com/vi/7xIpeyBc-jY/maxresdefault.jpg`
     - Intro Video URL (optional): `https://www.youtube.com/watch?v=7xIpeyBc-jY`
     - Tags (optional): `tech`
     - (Optional) Gallery image (link): `https://i.ytimg.com/vi/7xIpeyBc-jY/hqdefault.jpg`
   - **Voice-over 10:** “On the Create page I enter group details, set monthly pricing, and approve the platform fee payment to the treasury.”

## Segment 6 – About, Verify, Edit Details

1. **On-screen:** Land on the group About tab that displays the membership summary plus links to Horizon.
   - **Voice-over 11:** “The About page surfaces the pass contract and Horizon links for verification. Inside Edit group details I can update the description, tagline, pricing, thumbnail, intro video URL, tags, and add administrators with share percentages. Saving applies everything instantly.”

## Segment 7 – Classroom: Create Course, Modules, Lessons

1. **On-screen:** Switch to the Classroom tab and click `Create a course`.
   - **Voice-over 12:** “Courses hold modules and lessons. I’ll copy sample content from a public YouTube playlist so you can see how creators publish structured curriculum inside LumenPass.”

## Segment 8 – Join the Paid Community as a Member

1. **On-screen:** In a second browser profile or incognito window, connect a different wallet using Stellar Wallets Kit, navigate to the community page, and click `Join`.
   - **Voice-over 13:** “From a member wallet I open the group, click Join, and approve the native XLM payment. Membership unlocks immediately.”

## Segment 9 – Marketplace Cooldown After Joining

1. **On-screen:** With the member wallet still active, open `/marketplace` and click `List Your Membership`.
   - **Voice-over 14:** “I open the Marketplace and try to list the membership. Because I just joined there’s a transfer cooldown—this prevents quick flip abuse and keeps value aligned with course timelines.”

## Segment 10 – Feed: Admin Post

1. **On-screen:** Switch back to the creator’s wallet, open the group page, and go to the `Feed` tab.
   - **Voice-over 15:** “Back on the owner account I go to the Feed tab, click Write something, add a welcome update with key links, and publish it.”

## Segment 11 – Feed: Member Engagement

1. **On-screen:** Return to the member wallet, open the same feed, click the thumbs-up icon on the post, and add a comment.
   - **Voice-over 16:** “As a member I like the post and add a comment—the feed updates in real time for everyone.”

## Segment 12 – Classroom: Member Learning

1. **On-screen:** Staying on the member wallet, open the `Classroom` tab, enter the course created earlier, click the “Introduction” module, and select the “Welcome” lesson.
   - **Voice-over 17:** “Members consume lessons directly inside the gated classroom. Creators can embed video, text, and resources in each module.”

## Segment 13 – Discover & Join a Free Community

1. **On-screen:** Open `/groups`. Show a mix of free and paid groups. Click a free group card. On the group page, click `Join for free`, then open the Feed and Classroom tabs.
   - **Voice-over 18:** “On Discover you’ll see both paid and free groups. Free groups unlock immediately—Feed, Classroom, and Members are available without a transaction.”

## Segment 14 – Thank You

- **Voice-over 19:** “Thanks for watching the LumenPass demo. Visit lumenpass.app to launch your own Stellar-native community.”

