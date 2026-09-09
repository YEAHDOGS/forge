# Forge

A guided "start your business" wizard for forming an LLC. V1 covers **Oklahoma only** — more states drop in as their fee data gets verified, never before.

**Live:** https://yeahdogs.github.io/forge/

## What it does

An 8-step mobile-friendly wizard: state picker → Texas check → LLC name → registered agent → principal address → contact email → structure → a printable **Articles of Organization worksheet** with exact filing instructions, a live fee total, and a persistent post-filing checklist (EIN → operating agreement → bank account → business card → domain).

## What it does NOT do

- **Forge files nothing.** It submits nothing to any state. You take the worksheet and file at [sos.ok.gov](https://www.sos.ok.gov/) yourself. This is stated in the UI.
- **Not legal advice, not a law firm.** Stated in the UI.
- **No fake data.** Unverified states are marked "coming soon" with no fee fields at all — the test suite enforces this.

## Verified data

Oklahoma fee/rule data verified against sos.ok.gov on **2026-09-09**:

| Item | Verified value |
|---|---|
| Articles of Organization (SOS Form 0074) | $100 |
| Online filing | ~1 business day, sos.ok.gov |
| Mail filing | 7–10 business days |
| In-person expedite | +$25 same-day |
| Annual Certificate | $25/yr, due on formation anniversary (file up to 60 days early; 60 days late = lose good standing; 3 years = dissolved; notices go ONLY to email on file) |
| Name reservation | $10, 60 days, optional |
| Registered agent | OK resident or qualified entity, OK street address, no PO boxes, business-hours availability; commercial services ~$50–125/yr |
| Principal address | Street address wherever located, no PO boxes |
| Name rules | Must contain LLC/Limited Liability Company (or LC, Ltd., Co. variants); must be distinguishable |
| Member/manager names on articles | Not required |
| Term | Perpetual (standard) |
| Publication / franchise tax | None / none for most LLCs |
| EIN | Free from the IRS |

Texas warning: an Oklahoma LLC transacting business in Texas must register as a foreign LLC — **$750** (+2.7% card fee), plus late fees after 90 days. The wizard flags this and advises talking to a Texas business attorney before choosing Oklahoma.

## Adding a state

1. Verify every fee and rule against that state's Secretary of State site. Record the verification date.
2. Add a full entry to `STATES` in `logic.js` with `live: true`, `verified`, and `source`.
3. Until then, the state stays `{ live: false, comingSoon: true }` with **no fee data** — the test suite fails the build if a coming-soon state carries any.

## Files

- `index.html` — shell + intro
- `styles.css` — mobile-first dark theme, print stylesheet for the worksheet
- `logic.js` — pure logic: `STATES` table, `calcFees`, validators (shared with tests)
- `app.js` — wizard DOM layer, localStorage persistence
- `forge-test.js` — `node forge-test.js` → 19 assertions (fee math, validation, honesty checks)

## Dev

```sh
node --check logic.js && node --check app.js
node forge-test.js
```

Static, zero dependencies. Deploys via GitHub Pages from `master`.
