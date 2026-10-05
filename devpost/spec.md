---
doc: spec
status: approved
---

# Fine Print — Technical Spec

> Technical choices here are agent recommendations. The learner asked the agent to proceed ("działaj"), and agreement is recorded on approval of this spec. See **Decisions and Open Issues**.

## How This Works, In Plain Language
Fine Print is one website with two halves:

- **The page you see** (the "frontend"): the Start screen and the Report. It runs in your browser. When you snap a photo, the browser shrinks it a bit so it uploads fast, then sends it to the other half.
- **A small helper on the server** (an "API route": a door on our server that the page knocks on). It takes the contract, sends it to a language model with strict instructions, and gets back structured data: the contract text, the risky clauses quoted word for word, the money items, a score, questions, and a letter.

The helper then **checks the model's work**: every quoted clause must actually appear in the contract text (otherwise it's thrown away), and **the true cost is added up by our code, not by the model**, so the arithmetic is always right. The page draws the contract and paints the highlights over the quoted passages.

Nothing is saved anywhere. The report lives only in the open browser tab.

Why this shape: one project, one service (the model), no database, no login. It's the smallest thing that can prove the kernel: real highlights on a real contract, plus an honest number.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. User opens `/` → the **Start screen** renders with four **sample cards** (data from `samples/*.txt`).
2. User picks a photo/PDF or pastes text → **Contract input** prepares it: images are resized to ≤1600px JPEG in the browser; a PDF is sent as is (≤4 MB); pasted text is sent as text.
3. Page sends `POST /api/analyze` with the file(s) or text → the **Reading state** shows rotating progress lines.
4. The **Analyze route** calls the language model via the AI SDK with the **Analysis prompt** and a **Report schema** → the model returns JSON.
5. The **Report checker** matches every clause quote to the contract text (tolerant of spacing/line breaks), drops quotes it can't find, totals the cost items, and returns the final `Report`.
6. Page swaps to the **Report screen**: the verdict strip, the **Highlighted document**, the **Clause note** on tap, the questions, and the **Letter**.
7. "Scan another" clears the report and returns to step 1.

```
Browser (Next.js page)                    Server (API route)               Model 
──────────────────────                    ──────────────────               ──────
photo / PDF / text ──resize──► POST /api/analyze ──AI SDK, schema──►  reads contract
                                         ◄────── JSON report ─────────
                               check quotes + add up cost
Report screen  ◄──────── final Report JSON
```

## Stack
- **Next.js 16 (App Router) + React + TypeScript**: page and API route in one project, one-click deploy to Vercel. Docs: https://nextjs.org/docs
- **AI SDK 7 (`ai`)**: `generateObject`-style structured output validated by a schema; supports image and PDF inputs. Docs: https://ai-sdk.dev/docs. *Verify the exact v7 API names against `node_modules/ai/docs/` at the start of the build.*
- **Model: Gemini 2.5 Flash** (`google/gemini-2.5-flash`) through **Vercel AI Gateway**, set in `app/api/analyze/route.ts` and overridable with `FINEPRINT_MODEL`. It reads photos and PDFs directly (no separate OCR). Docs: https://vercel.com/docs/ai-gateway
  - Learner decision during the build ("inne AI"): the Gateway free tier doesn't include the originally planned model, so we use a free-tier model instead of buying credits. Tested on all four samples, a PDF and a photo: 100% of quotes located, totals correct.
- **Zod**: the Report schema (shape the model must return). Docs: https://zod.dev
- **Styling: plain CSS (CSS Modules + global tokens)**, no UI kit. A hand-written stylesheet is what keeps it from looking like every other AI app (see **Look and Feel**).
- **Fonts via `next/font/google`**: Fraunces (serif headlines), Source Serif 4 (contract text), Inter Tight (UI and numbers). Self-hosted at build time, no runtime font CDN.
- Node.js 24 (installed: v24.15.0).

## Where It Runs and How Someone Tries It
- **Local:** `npm install`, put the key in `.env.local` (`AI_GATEWAY_API_KEY=...`), run `npm run dev`, open http://localhost:3000. Record the demo from here or from the deployed URL.
- **Deployed (recommended; learner chose a web app so judges can click a link):** Vercel, Hobby plan. Import the GitHub repo, add `AI_GATEWAY_API_KEY` in project settings (or rely on Vercel's built-in AI Gateway auth), deploy. The URL goes in the README and the Devpost submission.
- **Required for submission regardless:** a public GitHub repo with an open-source license (MIT) and a demo video under 3 minutes on YouTube/Vimeo. Deployment does not replace either.
- **Phone testing:** open the deployed URL on a phone (the camera works over HTTPS; localhost on a phone needs the same Wi-Fi and won't get the camera over plain HTTP, so use the deploy).

## Look and Feel
From `prd.md > Look and Feel` and `scope.md > Inspiration & Identity`.

- **Tokens (CSS custom properties in `app/globals.css`):**
  - `--paper: #F4EFE6` (warm off-white), `--paper-sheet: #FBF8F2`, `--ink: #1C1A17`, `--ink-soft: #5B554C`, `--rule: #D9D1C3`.
  - Highlighters (the only bright colours): `--hl-red: #FF8A7A`, `--hl-yellow: #FFE066`, `--hl-green: #A8E6A1`, applied with `mix-blend-mode: multiply` and slightly irregular edges (a rotated, padded background with rounded, uneven `border-radius`), so they look hand-drawn rather than like UI badges.
  - Dark mode: `--paper: #1A1815`, `--ink: #EDE6DA`, with the highlighters dimmed (and the blend switched to `screen`/opacity). Supported, not polished.
- **Paper texture:** a tiny inline SVG noise pattern on the background at ~4% opacity. The contract sheet has margins, a hairline border, and a soft shadow.
- **Typography:** Fraunces for the masthead and verdict numbers (big, tight, confident), Source Serif 4 at 17–18px for contract text with comfortable line height, Inter Tight for labels/buttons with small caps-style uppercase letter-spacing on section labels.
- **Layout:** generous whitespace, a narrow reading column on phone; a two-column grid at ≥1024px (sheet left, sticky panel right).
- **No:** gradients, glassmorphism, emoji, sparkle/robot icons, "AI-powered" copy, rounded pill-everything. Buttons are flat ink rectangles with a slight offset shadow, like a rubber stamp.
- **Copy voice:** short, dry, direct. Examples live in the prompt's instructions and the UI strings.

## Components

### Start screen
`app/page.tsx` (client view state) + `components/StartScreen.tsx`. Masthead, promise line, the **Contract input**, the **Sample cards**, the "Not legal advice · Nothing is stored" line.
PRD ref: `prd.md > Screens and Layout`, `prd.md > States and Boundaries` (first use).

### Contract input
`components/ContractInput.tsx` + `lib/prepareFiles.ts`. A "Scan a contract" button backed by `<input type="file" accept="image/*,application/pdf" capture="environment" multiple>`; a "Paste text instead" toggle with a textarea (Analyze disabled under 200 characters). `prepareFiles` resizes images to ≤1600px longest side, JPEG q≈0.82, max 4 images; rejects PDFs over 4 MB with the "Too long" message (keeps under Vercel's 4.5 MB request limit).
PRD ref: `prd.md > Contract input`.

### Sample cards
`components/SampleCards.tsx`, data in `samples/` (gym, lease, phone, loan): fictional, realistic contracts with real traps. Tapping a card sends that sample's text to `/api/analyze` like pasted text: a live analysis, not canned.
PRD ref: `prd.md > Contract types`.

### Reading state
`components/Reading.tsx`. Rotating lines ("Reading the small print…", "Looking for the auto-renewal…", "Adding up what it really costs…") and a Cancel link (aborts the fetch via `AbortController`).
PRD ref: `prd.md > States and Boundaries` (reading).

### Analyze route
`app/api/analyze/route.ts`. Accepts JSON: `{ text?: string, files?: { mediaType: string, data: base64 }[] }`. Builds an AI SDK message with the text or the image/PDF parts, calls the model with the **Report schema** and the **Analysis prompt**, runs the **Report checker**, and returns `Report` JSON. `maxDuration` 60s. Errors map to `{ error: 'not_a_contract' | 'too_long' | 'failed' }`.
PRD ref: `prd.md > Features and Behavior` (all).

### Analysis prompt
`lib/prompt.ts`. System instructions: transcribe the full contract text faithfully (for images/PDFs); quote flagged passages **exactly** as they appear in that text; classify severity red/yellow/green; write notes in the Fine Print voice (plain, short, dry, no legalese, no legal advice); list every money item with amount, how many times it's paid over the minimum term, and the clause it comes from; say when there is no money info; set `isContract=false` for non-contracts; write 3–5 questions; write one letter (cancellation if a cancellation clause exists, otherwise a change request for the worst clause) with [placeholders] for unknowns.
PRD ref: `prd.md > Highlighted contract (the kernel)`, `prd.md > Your letter`.

### Report schema
`lib/schema.ts` (Zod). See **Data Model**.

### Report checker
`lib/checkReport.ts`. Pure functions, unit-tested:
- `locateQuotes(text, clauses)`: normalizes whitespace/quotes/dashes, finds each quote's character range in the contract text, drops quotes not found, drops overlaps (keeping the higher severity).
- `totalCost(costItems)`: sums `amount × times`, rounds to cents, returns the total and line items; returns `null` total when there are no items.
- `score`: uses the model's score, clamped to 0–10.
PRD ref: `prd.md > Highlighted contract (the kernel)`, `prd.md > True cost`.

### Report screen
`components/Report.tsx`: the layout (single column on phone; two columns on desktop), plus a "Scan another" button and the "Not legal advice" footer.
PRD ref: `prd.md > Screens and Layout`.

### Verdict strip
`components/VerdictStrip.tsx`: advertised price vs true cost (big numbers), cost breakdown (each line links/scrolls to its clause), the score "4/10" with a one-line verdict, the counts of traps/watch-outs/fair, and the detected type and term.
PRD ref: `prd.md > True cost`, `prd.md > Fairness score and verdict`.

### Highlighted document
`components/HighlightedDoc.tsx`: renders the contract text as paragraphs on a "sheet", splitting the text at the located ranges into `<mark>` spans with a severity class. Marks are buttons (keyboard-focusable) that set the selected clause.
PRD ref: `prd.md > Highlighted contract (the kernel)`.

### Clause note
`components/ClauseNote.tsx`: the selected clause's title, plain meaning, why it matters, and what to do. A bottom sheet on phone; a section in the sticky panel on desktop.
PRD ref: `prd.md > Highlighted contract (the kernel)`.

### Questions and Letter
`components/AskList.tsx`, `components/Letter.tsx`: the question list; the letter in a paper-styled block with a Copy button (Clipboard API, "Copied" confirmation for 2s).
PRD ref: `prd.md > Before you sign, ask`, `prd.md > Your letter`.

### Error and empty messages
Inline in `app/page.tsx` view state: not-a-contract, too long, failed (with Retry); the input is kept. The no-money case is shown inside the **Verdict strip**.
PRD ref: `prd.md > States and Boundaries`.

## Data Model
Everything is in memory in the browser tab (React state in `app/page.tsx`): `view: 'start' | 'reading' | 'report' | 'error'`, the last input (for Retry), the `Report`, and the selected clause id. A refresh clears it all, which is intended (PRD: nothing is stored).

`Report` (returned by `/api/analyze`):
```ts
{
  isContract: boolean
  contractType: 'gym' | 'lease' | 'phone_internet' | 'installment_loan' | 'other'
  title: string                       // "Gym membership · 24-month term"
  text: string                        // full contract text (transcribed or pasted)
  termMonths: number | null
  advertised: { label: string; amount: number | null } // "$29.99 / month"
  currency: string                    // "USD", "EUR", "PLN"…
  costItems: { label: string; amount: number; times: number; clauseId?: string }[]
  costAssumption: string              // "Assuming you stay the minimum 24 months"
  trueCost: number | null             // computed by checkReport, not the model
  score: number                       // 0–10
  verdict: string                     // "Fine if you never want to leave."
  clauses: {
    id: string
    severity: 'red' | 'yellow' | 'green'
    quote: string                     // verbatim from text
    title: string                     // "Auto-renews for 12 months"
    meaning: string
    whyItMatters: string
    whatToDo: string
    start?: number; end?: number      // added by checkReport
  }[]
  questions: string[]
  letter: { kind: 'cancellation' | 'change_request'; subject: string; body: string }
}
```

## File Structure
```
fine-print/                     (repo root = this folder)
├── app/
│   ├── layout.tsx              # fonts, <html>, metadata
│   ├── globals.css             # tokens, paper texture, base typography
│   ├── page.tsx                # view state: start → reading → report / error
│   ├── page.module.css
│   └── api/analyze/route.ts    # Analyze route (server)
├── components/
│   ├── StartScreen.tsx         # masthead + input + samples
│   ├── ContractInput.tsx       # camera/upload/paste
│   ├── SampleCards.tsx
│   ├── Reading.tsx
│   ├── Report.tsx              # report layout
│   ├── VerdictStrip.tsx
│   ├── HighlightedDoc.tsx      # the kernel: highlighted contract
│   ├── ClauseNote.tsx
│   ├── AskList.tsx
│   ├── Letter.tsx
│   └── *.module.css
├── lib/
│   ├── schema.ts               # Zod Report schema + types
│   ├── prompt.ts               # Analysis prompt
│   ├── checkReport.ts          # quote matching + cost total (pure)
│   ├── checkReport.test.ts     # unit tests (node:test or vitest)
│   └── prepareFiles.ts         # client-side image resize / limits
├── public/                     # favicon, OG image
├── devpost/                    # planning docs (scope, prd, spec, checklist)
├── .env.example                # AI_GATEWAY_API_KEY=
├── LICENSE                     # MIT
├── README.md
└── package.json
```

## External Services and Dependencies
- **Vercel AI Gateway → Google Gemini 2.5 Flash**
  - Called through the AI SDK with the model string `google/gemini-2.5-flash` (`FINEPRINT_MODEL` overrides it); auth via `AI_GATEWAY_API_KEY` locally, OIDC/key on Vercel. The Gateway needs a card on file even for the free tier.
  - Input: system prompt + one user message with either text, or 1–4 image parts, or 1 PDF file part. Output: JSON matching the Report schema.
  - Cost: a few cents per analysis (a contract is a few thousand tokens in and out). Gateway gives free starter credit; set a budget limit in the dashboard to protect against abuse of the public URL.
  - Docs: https://vercel.com/docs/ai-gateway, https://ai-sdk.dev/docs
  - *To verify early in the build:* PDF file parts pass through the Gateway to the model provider; the exact AI SDK 7 structured-output function name.
- **Vercel hosting** (optional, recommended): Hobby plan, free. Function request body limit 4.5 MB (handled by client-side resize and the PDF cap). Docs: https://vercel.com/docs/functions/limitations

## Important Failure Modes
- **Model paraphrases instead of quoting** → the checker drops unmatched quotes; if fewer than 2 survive, the route retries once with a stricter reminder; the report always shows only verified highlights.
- **Blurry photo / not a contract** → `isContract=false` or very short text → "I couldn't read a contract here. Try a sharper photo in good light, or paste the text."
- **Slow or failed model call** (timeout 60s) → "Something went wrong on our side." + Retry with the kept input.
- **Wrong arithmetic** → impossible by design: totals are computed in code from itemized amounts.

## What Was Simplified and Why
- **Highlights on transcribed text** instead of on the original photo: positioning marks on a photo needs layout/OCR coordinates. Transcribed text proves the same kernel. The fuller version would need an OCR service returning bounding boxes.
- **No storage, no accounts**: privacy and time; reports live in the tab only.
- **One model call** returns everything (transcript + analysis + letter) instead of a multi-step pipeline: simpler and faster; the checker covers the reliability gap.
- **Samples are fictional contracts analyzed live** (not pre-baked results), so the demo shows the real system.

## Decisions and Open Issues
- **Next.js + AI SDK + a language model via AI Gateway, plain CSS, deploy on Vercel**: agent recommendation; recorded as accepted on approval. Tradeoff: needs an API key and has a small per-use cost; in return one project covers page + server and deploys in one click.
- **Code adds up the money, the model only lists items**: implementation detail derived from `prd.md > True cost` (numbers must be right).
- **One useful unknown:** none raised by the learner (they skipped the questions). The agent's own unknown: whether the model reliably quotes verbatim from photos. *Investigation in the build:* run all four samples and one real photo; check how many quotes survive the checker; tighten the prompt if fewer than ~80% match.
- **AI provider: Vercel AI Gateway** — learner chose it by showing their existing Vercel account (team `mateuszl28`). The key goes in `.env.local` as `AI_GATEWAY_API_KEY`, never in chat.
- Carried from `prd.md > Open Questions`: none.
