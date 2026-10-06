---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Paste a contract (or tap a sample) and see its traps highlighted on the page**
  Becomes usable: A running app with the paper-and-ink Start screen, a paste box, and four sample cards. Analyzing shows the contract text with red/yellow/green highlights that come from a real model call, verified as verbatim quotes. Tapping a highlight shows its note.
  Why now: This is the kernel and the biggest risk at once (does the model quote verbatim, does the Gateway call work?). Everything else hangs off the Report data it produces. Bootstrapping is folded in here.
  PRD ref: `prd.md > The Core Journey` (steps 1, 2, 4), `prd.md > Highlighted contract (the kernel)`, `prd.md > Contract types`
  Spec ref: `spec.md > Analyze route`, `spec.md > Analysis prompt`, `spec.md > Report schema`, `spec.md > Report checker`, `spec.md > Highlighted document`, `spec.md > Clause note`, `spec.md > Sample cards`, `spec.md > Look and Feel`, `spec.md > File Structure`
  Build: Scaffold Next.js + TypeScript (no Tailwind), add `ai` + `zod`, `.env.example`, MIT `LICENSE`. Write the four fictional sample contracts. Implement the schema, prompt, `/api/analyze` (text input), the checker (quote location + cost total) with unit tests, the Start screen (paste + samples), and the Report with the highlighted document and clause note. Apply the global design tokens and fonts from the start.
  Verify (mechanical): `npm run build` passes; checker unit tests pass; `curl` each of the 4 samples to `/api/analyze` and confirm valid JSON, `isContract: true`, ≥ 4 clauses located (start/end set) with at least one red, and record the share of quotes that matched.
  Learner check: Run `npm run dev`, open http://localhost:3000, tap the Gym sample, and see the contract with highlighter marks; tap a red one and read the note. Does it look human-made and like you pictured?
  Commit: `Analyze pasted contracts and highlight traps on the page`

- [x] **2. The full report: true cost, score, questions, and a letter you can copy**
  Becomes usable: Above the document, the verdict strip shows advertised price vs true cost (with breakdown lines linked to their clauses), the 0–10 score, the verdict, and counts. Below it are "Before you sign, ask" and the letter with a working Copy button. The no-money case says so plainly.
  Why now: It completes the "oh, that's cool" beat ($29/month vs $1,140) on the data slice 1 already returns, and finishes the core journey for pasted text and samples.
  PRD ref: `prd.md > True cost`, `prd.md > Fairness score and verdict`, `prd.md > Before you sign, ask`, `prd.md > Your letter`, `prd.md > States and Boundaries` (no money terms)
  Spec ref: `spec.md > Verdict strip`, `spec.md > Questions and Letter`, `spec.md > Report checker`, `spec.md > Data Model`
  Build: VerdictStrip, AskList, Letter (Clipboard API + "Copied"), breakdown lines that scroll to and select their clause, no-money message, "Scan another", the "Not legal advice" footer.
  Verify (mechanical): `npm run build` passes; checker tests cover the totals (including a null total for no items); for each sample, the API's `trueCost` equals the sum of `amount × times`; pasting a short non-financial text produces the no-money message and no crash.
  Learner check: Open the Gym sample: is the true cost believable and does the breakdown add up? Copy the letter and paste it into a notes app.
  Commit: `Add true cost, score, questions and copyable letter`

- [x] **3. Snap a photo or upload a PDF, with honest waiting and error states**
  Becomes usable: On a phone, "Scan a contract" opens the camera; photos (resized in the browser) and PDFs are analyzed like pasted text. The reading state shows rotating lines with Cancel. Unreadable/non-contract, too-long, and failed requests show the PRD messages with the input kept and Retry.
  Why now: Photo input is the real-world story for the video, but it builds on a working report, so a failure here never blocks the kernel.
  PRD ref: `prd.md > Contract input`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Contract input`, `spec.md > Reading state`, `spec.md > Error and empty messages`, `spec.md > Analyze route`, `spec.md > Important Failure Modes`
  Build: `prepareFiles` (resize to ≤1600px JPEG, limits), file parts in `/api/analyze` (images and PDF), the Reading component with AbortController, error views with Retry, the retry-once rule when fewer than 2 quotes match.
  Verify (mechanical): `npm run build` passes; send a generated PDF of a sample and a photo-like image of a sample to the API and confirm located clauses; send a non-contract image and confirm `not_a_contract`; send an oversized payload and confirm `too_long`.
  Learner check: Take a phone photo of a printed/on-screen sample (or any real contract you have) and upload it through the app on your laptop. Try a random photo too and read the error.
  Commit: `Accept photos and PDFs with reading and error states`

- [x] **4. Feels right on a phone and on a laptop**
  Becomes usable: Phone: single column with the clause note as a bottom sheet. Laptop (≥1024px): sheet on the left, sticky analysis panel on the right. Keyboard-focusable highlights, a basic dark mode, favicon/OG image, and copy polish in the Fine Print voice.
  Why now: Layout polish matters for Design and Presentation scores, but only once the behavior is final, so nothing gets restyled twice.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Look and Feel`, `spec.md > Report screen`, `spec.md > Clause note`
  Build: Responsive grid and sticky panel, bottom sheet on phone, focus styles, dark-mode tokens, metadata/OG image, review all UI strings against the anti-AI-look rules (no gradients, no emoji, "AI" at most once).
  Verify (mechanical): `npm run build` passes; screenshot the Report at 390px and 1280px widths (headless browser) and check there's no horizontal scroll, the note opens as a bottom sheet on phone and in the panel on desktop; grep the UI for banned words/emoji.
  Learner check: Open the app on your laptop and in the phone-sized view (or your phone, after deploy). Would a stranger think a person designed this?
  Commit: `Responsive layout, bottom sheet and finishing touches`

- [x] **5. Fine Print on your phone**
  Becomes usable: The site is live on Vercel and installable; an Android app with the Fine Print icon is installed on the learner's connected phone and runs the full journey, camera included.
  Why now: The learner asked for it at the first checkpoint, and it is also the most convincing setting for the demo video (snap a contract at the counter).
  PRD ref: `prd.md > Phone app`
  Spec ref: `spec.md > Android app`, `spec.md > Installable web app`, `spec.md > Where It Runs and How Someone Tries It`
  Build: PWA manifest and icons, deploy to Vercel, Capacitor Android shell pointing at the deployed URL, camera permission, launcher icons, debug APK installed with adb.
  Verify (mechanical): `npm run build` passes; the deployed `/api/analyze` returns a located report for the PDF test input; `gradlew assembleDebug` succeeds; `adb install` succeeds and `adb shell am start` launches the app; a screenshot from the phone shows the Start screen.
  Learner check: On your phone, open Fine Print from the home screen, tap "Scan a contract", photograph any contract (or a sample shown on your laptop screen), and read the report.
  Commit: `Add installable web app and Android app`

- [x] **6. The web version, expanded: your language, a calendar reminder, and a printable report**
  Becomes usable: Pick a language and get the whole report in it; add the notice deadline to your calendar; save the report as a PDF. Plus the share image and app icons.
  Why now: The learner asked to expand the web version after the first look; these are the cheapest additions that strengthen Impact (non-native speakers) and the demo.
  PRD ref: `prd.md > Explain it in my language`, `prd.md > Calendar reminder`, `prd.md > Save as PDF`
  Spec ref: `spec.md > Language`, `spec.md > Reminder`, `spec.md > Print`, `spec.md > Installable web app`
  Build: i18n labels and prompt language, language picker, notice/counterparty in the schema, ics builder with tests, Reminder component, print styles, OG image, deploy.
  Verify (mechanical): `npm test` and `npm run build` pass; the lease sample in English and Polish returns located quotes in the original language and Polish notes; the reminder shows the right deadline; the deployed site renders on the real phone (adb screenshot).
  Learner check: Choose Polski, open the lease sample, read a note, add the reminder to your calendar, and try Save as PDF.
  Commit: `Report in five languages, calendar reminder, printable report`

- [x] **7. Compare two offers, the three things that matter, and read it out loud**
  Becomes usable: Two contracts side by side with "Cheaper by" and "Fairer deal"; a top-three summary under the verdict; the report read aloud.
  Why now: The learner asked to keep expanding; comparison turns the report into a buying decision (Impact), and read-aloud makes the tagline literal.
  PRD ref: `prd.md > Compare two offers`, `prd.md > If you read nothing else`, `prd.md > Read it out loud`
  Spec ref: `spec.md > Compare`, `spec.md > Top three and read aloud`
  Build: second phone sample, compare logic with tests, CompareSetup and CompareView, page states, TopThree, ReadAloud, strings in five languages.
  Verify (mechanical): `npm test` (16 pass) and `npm run build` pass; the two-phone-plan demo returns Orbit cheaper by $130.76 and fairer; "Open the full report" shows the top three and "Back to the comparison"; speech voices exist for pl/en/de/es in Chrome.
  Learner check: Tap "Compare them side by side" → "try it with two phone plans", open one report, tap "Read it out loud".
  Commit: `Compare two offers, top three summary, read aloud`

- [x] **8. Send it to someone, recent reads, and a German contract**
  Becomes usable: Share a report as a link that carries the report itself; reopen recent reports on this device; try a German lease explained in any of the five languages.
  Why now: The learner asked to keep expanding; sharing fits the real moment (ask someone before you sign) without breaking "nothing is stored", and the German sample proves "the contract can be in any language".
  PRD ref: `prd.md > Send it to someone`, `prd.md > Your recent reads`, `prd.md > A contract in another language`
  Spec ref: `spec.md > Sharing and recent reads`
  Build: share encode/decode with tests, ShareButton, shared-report banner, history storage and RecentReads, German sample, prompt rule for translated cost labels.
  Verify (mechanical): `npm test` (19 pass) and `npm run build` pass; a shared link (≈5 KB) reopens the report in a clean browser with the banner and isn't saved to history; a run appears in recent reads; the German lease in Ukrainian and English returns German quotes (0 dropped), a German letter, and €70,080 over 48 months.
  Learner check: Open the Mietvertrag sample in Polski or Українська; tap "Send it to someone" and open the link on another device.
  Commit: `Share reports by link, recent reads on this device, German sample`

- [x] **9. Native share and voice in the Android app, and a fair-use limit**
  Becomes usable: In the app, sharing opens WhatsApp/Messenger/SMS and the report can be read aloud by the phone; the public API turns away an address after 20 reads an hour.
  Why now: The learner asked to keep expanding and to update the phone; the app's WebView lacked both features, and the public link is backed by the learner's card.
  PRD ref: `prd.md > Phone app`, `prd.md > Fair use`
  Spec ref: `spec.md > Native share and speech in the app`, `spec.md > Rate limit`
  Build: Capacitor Share and TextToSpeech plugins, `lib/native.ts`, native paths in ShareButton and ReadAloud, rate limiter with tests and a friendly message, version 1.9.0, new APK.
  Verify (mechanical): `npm test` (21 pass) and `npm run build` pass; 21 local requests from one address give 20 normal responses then 429 with `retry-after: 3600`, another address unaffected; the new APK installs; in the app's WebView `Capacitor.isPluginAvailable('Share')` and `('TextToSpeech')` are true (checked over adb DevTools).
  Learner check: In the app, open a sample, tap "Send it to someone" (share sheet appears) and "Read it out loud" (the phone speaks).
  Commit: `Native share and speech in the app; rate limit the analyze API`

- [x] **10. The whole app in your language, an honesty note, and an accessibility pass**
  Becomes usable: Picking Українська (or any of the five) changes the entire interface, not only the report; the Start screen explains how the app keeps itself honest; text contrast meets WCAG AA.
  Why now: The learner asked to keep expanding; a half-translated interface undercut the "your language" feature, and Design is a judging criterion.
  PRD ref: `prd.md > Explain it in my language`
  Spec ref: `spec.md > Language`, `spec.md > Look and Feel`
  Build: `lib/ui.ts` in five languages, all start/reading/compare/recent components on it, `<html lang>` synced, honesty section, `--ink-faint` darkened (#6e665a light, #a39a8c dark).
  Verify (mechanical): `npm run build` passes; Lighthouse mobile before → after: accessibility 96 → 100 (contrast 3.57 → 5.34), performance 92, best practices 100, SEO 100; desktop performance 100; the Start screen renders fully in Ukrainian with `html lang="uk"`.
  Learner check: Switch the language to Українська or Deutsch and walk from the Start screen to a report.
  Commit: `Whole interface in five languages, honesty section, contrast fix`

- [x] **11. Marks on your own photo**
  Becomes usable: A report made from photos can show its highlights over the original photo, with tappable marks.
  Why now: The learner asked to keep expanding; this was the biggest deferred "wow" item for the video.
  PRD ref: `prd.md > On your photo`
  Spec ref: `spec.md > Photo boxes`
  Build: separate detection request, `cleanBoxes` with a test, PhotoView, text/photo toggle, strings in five languages.
  Verify (mechanical): `npm test` (22 pass) and `npm run build` pass; boxes drawn onto the test photo with a script: in-analysis boxes ~1 paragraph off (rejected), separate request mostly on the right sections; end to end in the browser the photo report shows 10 tappable marks and the note opens. Accuracy varies between runs, recorded in the spec.
  Learner check: Upload a photo of a contract, switch to "On your photo", tap a mark.
  Commit: `Show marks on the original photo (approximate)`

- [x] **12. Photo marks you can trust: on-device OCR**
  Becomes usable: The photo view places every mark exactly on the quoted lines, found by reading the photo on the device.
  Why now: Slice 11's model-guessed boxes contradicted "every mark is checked"; the learner asked to keep improving.
  PRD ref: `prd.md > On your photo`
  Spec ref: `spec.md > Photo boxes`
  Build: `lib/align.ts` with tests, `lib/ocr.ts` (lazy Tesseract.js, language by script), Report/PhotoView status and messages in five languages; removed the model box request and `cleanBoxes`.
  Verify (mechanical): `npm test` (24 pass) and `npm run build` pass; Node script: 10/10 quotes placed line-accurately on the test photo (drawn and inspected); browser end to end: photo report → "On your photo" → OCR ~6 s → 25 line marks on the right sentences.
  Learner check: Photograph a contract, open "On your photo", and check the marks sit on the right lines.
  Commit: `Place photo marks with on-device OCR instead of model guesses`

- [x] **13. Twice as fast, and instant the second time**
  Becomes usable: A report takes about 10–20 seconds instead of 30; a sample (or any pasted contract) opened again in the same language appears instantly.
  Why now: The learner asked to keep expanding; the wait was the weakest part of the demo and of a judge's first click.
  PRD ref: `prd.md > States and Boundaries`
  Spec ref: `spec.md > Speed: thinking budget and result cache`
  Build: thinking budget 512 + temperature 0, stricter `costItems` rule, `lib/resultCache.ts` with tests, cache before the rate limit, updated wait copy in five languages.
  Verify (mechanical): benchmark on four samples (default 27–35 s → 512 budget 12–18 s, all totals right, 0 dropped quotes); loan run 4× → 4/4 correct; photo 16.7 s and PDF 16.5 s correct; same request twice → 14.8 s then 0.01 s with `x-fineprint-cache: hit`; `npm test` (27 pass) and `npm run build` pass.
  Learner check: Tap a sample, go back, tap it again.
  Commit: `Faster analysis: capped thinking, temperature 0, result cache`
  Follow-up: the in-memory cache missed in production (requests landed on different instances), so Vercel Runtime Cache was added as a shared level; warming the samples showed the Polish loan double-counting a financed fee, so `dropFinancedFees` now removes it in code, and the cache key carries a version.

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 3 the learner tried it and asked for a phone version and an expanded web version (slices 5–6)
- [x] Final kick-the-tires exploration and feedback completed — learner tried the web app and the installed Android app on their phone: "jest ok"

## Final Review

- No revisions requested at final review.
- [x] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [x] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [x] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: Brief evidence-based recap (learner asked to keep moving). Practice connected: "let the model write, let code check" — `spec.md > Report checker`, `lib/checkReport.ts`, `lib/checkReport.test.ts`, and the sample runs that exposed the double-counted deposit/fee (`Revisions`).
Route and stops: Reference route only, not toured live — `app/api/analyze/route.ts` analyze(), `lib/checkReport.ts` locateQuotes()/totalCost(), `components/HighlightedDoc.tsx`.
Edit outcome: Not applicable (no live tour).
Reflection: Offered once in chat.
Activity mode: Recap. Map checked in a browser; all paths and symbols verified against source.

## Revisions

- Model switched to Gemini 2.5 Flash — the AI Gateway free tier blocks the originally planned model; the learner chose a different AI over buying credits. Quality checked on all samples, a PDF and a photo (100% quotes located, totals correct).
- Samples live in `lib/samples.ts` instead of `samples/*.txt` — the page imports them directly, so no file reading on the server.
- Slices 1–3 landed in one commit — the model was blocked by billing while slices 2–3 were built, so all three were verified together once it worked.
- The prompt now excludes refundable deposits and already-financed fees from the true cost, and uses the purchase price as the headline for loans — the first real runs counted the lease deposit and the loan origination fee twice.
- The letter's repeated "Subject:" line is stripped in code (`buildReport`) — the model kept repeating it despite the prompt.
- Reading-state Cancel and the bottom sheet / two-column layout were built early alongside slices 1 and 3; slice 4 keeps the polish and verification.
- Added slice 5 (phone app) — scope change requested by the learner at the first checkpoint; reverses the "Native mobile app" cut in a thin form (Capacitor shell around the deployed site + PWA).
- Android APK built with a portable JDK 21 (Eclipse Temurin, kept outside the repo) because Capacitor 8 needs Java 21 and the system has 17. Build: set `JAVA_HOME` to a JDK 21, then `cd android && gradlew assembleDebug`. Installed with `adb install -r` and launched on the learner's phone.
- Added slice 6 (web expansion) — learner asked to "expand the web version"; the agent proposed language, calendar reminder and printable report, and cut offer comparison as too big.
- Added slice 7 (compare, top three, read aloud) after the final review — learner asked to keep expanding; "Side-by-side comparison" moved from Later into the build.
- Added slice 8 (sharing, recent reads, German sample) — learner asked to keep expanding. Sharing is done inside the URL fragment and history in localStorage, so "nothing stored on a server" still holds; the PRD's persistence line was updated.
- Photo boxes moved to a separate request — boxes requested inside the main analysis landed about a paragraph below the quoted text; a dedicated detection prompt placed them far better, though still not exactly, so the photo view is optional and labelled approximate.
- Photo marks now come from on-device OCR + alignment; the model-box request was removed — measured: model boxes ~paragraph off or ~half exact, OCR alignment 10/10 line-accurate on the test photo.
- Thinking budget capped at 512 and temperature 0 — measured 2× faster; budget 0 was faster still but miscounted a loan fee, so it was rejected.
- Shared cache via Vercel Runtime Cache — the per-instance cache missed when requests hit different instances.
- `dropFinancedFees` in the checker — prompt rules alone left the loan's financed fee double-counted in some languages; totals are now guarded in code.
