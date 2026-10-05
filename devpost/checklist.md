---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [ ] **1. Paste a contract (or tap a sample) and see its traps highlighted on the page**
  Becomes usable: A running app with the paper-and-ink Start screen, a paste box, and four sample cards. Analyzing shows the contract text with red/yellow/green highlights that come from a real model call, verified as verbatim quotes. Tapping a highlight shows its note.
  Why now: This is the kernel and the biggest risk at once (does the model quote verbatim, does the Gateway call work?). Everything else hangs off the Report data it produces. Bootstrapping is folded in here.
  PRD ref: `prd.md > The Core Journey` (steps 1, 2, 4), `prd.md > Highlighted contract (the kernel)`, `prd.md > Contract types`
  Spec ref: `spec.md > Analyze route`, `spec.md > Analysis prompt`, `spec.md > Report schema`, `spec.md > Report checker`, `spec.md > Highlighted document`, `spec.md > Clause note`, `spec.md > Sample cards`, `spec.md > Look and Feel`, `spec.md > File Structure`
  Build: Scaffold Next.js + TypeScript (no Tailwind), add `ai` + `zod`, `.env.example`, MIT `LICENSE`. Write the four fictional sample contracts. Implement the schema, prompt, `/api/analyze` (text input), the checker (quote location + cost total) with unit tests, the Start screen (paste + samples), and the Report with the highlighted document and clause note. Apply the global design tokens and fonts from the start.
  Verify (mechanical): `npm run build` passes; checker unit tests pass; `curl` each of the 4 samples to `/api/analyze` and confirm valid JSON, `isContract: true`, ≥ 4 clauses located (start/end set) with at least one red, and record the share of quotes that matched.
  Learner check: Run `npm run dev`, open http://localhost:3000, tap the Gym sample, and see the contract with highlighter marks; tap a red one and read the note. Does it look human-made and like you pictured?
  Commit: `Analyze pasted contracts and highlight traps on the page`

- [ ] **2. The full report: true cost, score, questions, and a letter you can copy**
  Becomes usable: Above the document, the verdict strip shows advertised price vs true cost (with breakdown lines linked to their clauses), the 0–10 score, the verdict, and counts. Below it are "Before you sign, ask" and the letter with a working Copy button. The no-money case says so plainly.
  Why now: It completes the "oh, that's cool" beat ($29/month vs $1,140) on the data slice 1 already returns, and finishes the core journey for pasted text and samples.
  PRD ref: `prd.md > True cost`, `prd.md > Fairness score and verdict`, `prd.md > Before you sign, ask`, `prd.md > Your letter`, `prd.md > States and Boundaries` (no money terms)
  Spec ref: `spec.md > Verdict strip`, `spec.md > Questions and Letter`, `spec.md > Report checker`, `spec.md > Data Model`
  Build: VerdictStrip, AskList, Letter (Clipboard API + "Copied"), breakdown lines that scroll to and select their clause, no-money message, "Scan another", the "Not legal advice" footer.
  Verify (mechanical): `npm run build` passes; checker tests cover the totals (including a null total for no items); for each sample, the API's `trueCost` equals the sum of `amount × times`; pasting a short non-financial text produces the no-money message and no crash.
  Learner check: Open the Gym sample: is the true cost believable and does the breakdown add up? Copy the letter and paste it into a notes app.
  Commit: `Add true cost, score, questions and copyable letter`

- [ ] **3. Snap a photo or upload a PDF, with honest waiting and error states**
  Becomes usable: On a phone, "Scan a contract" opens the camera; photos (resized in the browser) and PDFs are analyzed like pasted text. The reading state shows rotating lines with Cancel. Unreadable/non-contract, too-long, and failed requests show the PRD messages with the input kept and Retry.
  Why now: Photo input is the real-world story for the video, but it builds on a working report, so a failure here never blocks the kernel.
  PRD ref: `prd.md > Contract input`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Contract input`, `spec.md > Reading state`, `spec.md > Error and empty messages`, `spec.md > Analyze route`, `spec.md > Important Failure Modes`
  Build: `prepareFiles` (resize to ≤1600px JPEG, limits), file parts in `/api/analyze` (images and PDF), the Reading component with AbortController, error views with Retry, the retry-once rule when fewer than 2 quotes match.
  Verify (mechanical): `npm run build` passes; send a generated PDF of a sample and a photo-like image of a sample to the API and confirm located clauses; send a non-contract image and confirm `not_a_contract`; send an oversized payload and confirm `too_long`.
  Learner check: Take a phone photo of a printed/on-screen sample (or any real contract you have) and upload it through the app on your laptop. Try a random photo too and read the error.
  Commit: `Accept photos and PDFs with reading and error states`

- [ ] **4. Feels right on a phone and on a laptop**
  Becomes usable: Phone: single column with the clause note as a bottom sheet. Laptop (≥1024px): sheet on the left, sticky analysis panel on the right. Keyboard-focusable highlights, a basic dark mode, favicon/OG image, and copy polish in the Fine Print voice.
  Why now: Layout polish matters for Design and Presentation scores, but only once the behavior is final, so nothing gets restyled twice.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Look and Feel`, `spec.md > Report screen`, `spec.md > Clause note`
  Build: Responsive grid and sticky panel, bottom sheet on phone, focus styles, dark-mode tokens, metadata/OG image, review all UI strings against the anti-AI-look rules (no gradients, no emoji, "AI" at most once).
  Verify (mechanical): `npm run build` passes; screenshot the Report at 390px and 1280px widths (headless browser) and check there's no horizontal scroll, the note opens as a bottom sheet on phone and in the panel on desktop; grep the UI for banned words/emoji.
  Learner check: Open the app on your laptop and in the phone-sized view (or your phone, after deploy). Would a stranger think a person designed this?
  Commit: `Responsive layout, bottom sheet and finishing touches`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 1 (the highlighted contract), where the look and the highlight quality can still change the rest of the build
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: 
Route and stops: 
Edit outcome: 
Reflection: 
Activity mode: 

## Revisions

