# Fine Print

Read the contract before you sign it. Fine Print takes a photo, PDF or pasted text of an everyday contract (gym membership, lease, phone plan, pay-over-time loan), marks risky clauses on the contract text in red / yellow / green, adds up what it really costs over the term, and drafts the letter you'd need to get out.

**Live:** https://fine-print-khaki.vercel.app

Built for [Build With AI: Basics](https://learn-ai-basics.devpost.com/) with the Devpost Learn skill pack. The planning documents live in [`devpost/`](devpost/): [scope](devpost/scope.md), [PRD](devpost/prd.md), [spec](devpost/spec.md), [build checklist](devpost/checklist.md), and an [app map](devpost/app-map.html).

> Not legal advice. Nothing you upload is stored on a server.

## Features

- **Highlights on the contract itself.** Every highlight is a verbatim quote that the server finds in the contract text; quotes the model can't back up are dropped.
- **Hard words explained on the page.** Jargon like "arbitration" or "Nettokaltmiete" gets a dotted underline; tap it for one plain sentence. Only words found in the contract are marked.
- **True cost.** The model lists the money items; the total is added up in code (`lib/checkReport.ts`), not by the model.
- **What leaving early costs:** drag a slider to any month and see what you'd have paid, what getting out costs (exit fee, share of what's left, months of rent, device balance), and the total. Rules are read by the model and checked against the contract's numbers; the money is added up in code (`lib/exit.ts`).
- **Month by month:** a bar chart of each month's payments (step-ups, yearly fees, one-offs); it follows the exit slider. Shown only when the bars add up exactly to the true cost.
- **Every amount from the contract:** an amount the AI worked out itself (not written in the contract) is caught and read again; a paid add-on the contract signs you up for is put back if the AI missed it.
- **How it was checked:** each report ends with what the code verified and threw out for that contract (quotes not found, a refundable deposit left out of the total, exit rules that didn't match the contract's numbers).
- **Fairness score, questions to ask, and a ready-to-send letter** with a copy button.
- **Pick your letter:** cancel, ask to change the clauses you tick, or complain about what went wrong (write it in any language). Every letter comes out in the contract's language, and code checks it: no amounts that aren't in the contract or your note, no wrong language, nothing cut off.
- **Compare two offers** side by side: which one is really cheaper (by total, or by monthly average when the terms differ), which is fairer, and which is cheaper if you leave after a given month.
- **"If you read nothing else":** the three most serious clauses, right under the verdict.
- **Read it out loud** with the browser's built-in voices, in the report's language.
- **Send it to someone:** the link carries the report itself (compressed into the `#fragment`), so nothing is stored on a server.
- **Recent reads** kept on your device only, with "Forget".
- **Any contract language:** try the German lease sample explained in English, Polish or Ukrainian.
- **On your photo:** for photo input, the marks can also be shown over your own photo, placed line by line with on-device OCR (Tesseract.js) — the photo isn't sent anywhere for this.
- **Photo, PDF or text.** Photos are resized in the browser before upload.
- **Five languages** for the report: English, Polski, Українська, Español, Deutsch. Quotes stay in the contract's language.
- **Your dates:** from the start date, every price change, yearly fee, the last day to give notice and the end of the term, all in one calendar file (.ics).
- **Save as PDF** with the highlights kept.
- **Phone:** installable web app, plus an Android app (Capacitor shell around the live site).
- Fictional sample contracts to try without your own. Their reports (real model output, checked) ship with the app, so a sample opens instantly in every language without calling the AI.

## Run it locally

Requirements: Node.js 22+ and a [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) API key (the Gateway needs a card on file even for its free tier).

```bash
npm install
cp .env.example .env.local   # then put your key in AI_GATEWAY_API_KEY
npm run dev                  # http://localhost:3000
```

Other commands:

```bash
npm run samples  # remake the samples' reports (needs a local server: FINEPRINT_FRESH=1 npm start)
npm test         # unit tests (quote matching, cost totals, letters, calendar file, comparison, share links)
npm run build    # production build
```

The model defaults to `google/gemini-2.5-flash` (available on the Gateway free tier, which allows 5 requests a minute; one analysis uses 1–3). Set `FINEPRINT_MODEL` to use another Gateway model, e.g. `google/gemini-2.5-pro`.

## Deploy

```bash
vercel deploy --prod
```

On Vercel the AI Gateway authenticates through the project's OIDC token, so no key is needed in project settings.

## Android app

The app in `android/` loads the deployed site (`capacitor.config.ts` → `server.url`). Capacitor 8 needs **JDK 21**.

```bash
cd android
# JAVA_HOME must point to a JDK 21
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## How it works

```
Browser (Next.js page) ──► POST /api/analyze ──► AI SDK + AI Gateway (structured output, lib/schema.ts)
                                   │
                                   ▼
                       lib/checkReport.ts: find each quote in the text,
                       drop the ones that aren't there, total the cost
                                   │
Report on screen ◄─────────────────┘  (components/Report.tsx, HighlightedDoc.tsx)
```

| Path | What it does |
|---|---|
| `app/api/analyze/route.ts` | Validates input, calls the model, runs the checker |
| `lib/prompt.ts` | Instructions and voice for the model |
| `lib/schema.ts` | The shape the model must return |
| `lib/checkReport.ts` | Quote matching and cost totals (tested) |
| `app/api/letter/route.ts` | Writes the other letters on request, with one checked retry |
| `lib/letter.ts` | Letter prompt, amount and language checks (tested) |
| `lib/i18n.ts` | Report labels in five languages |
| `lib/ics.ts` | Notice deadline and calendar file (tested) |
| `lib/align.ts` | Quote ⇄ OCR word alignment for photo marks (tested) |
| `lib/exit.ts` | Early-exit cost by month, and the rule checks (tested) |
| `lib/compare.ts` | Which of two offers is cheaper / fairer (tested) |
| `lib/share.ts` | Report ⇄ link encoding (tested) |
| `lib/history.ts` | Recent reads in localStorage |
| `lib/samples.ts` | Fictional sample contracts (incl. a German lease and a second phone plan) |
| `components/` | Start screen, report, highlighted contract, letter, reminder |

Stack: Next.js 16, React 19, TypeScript, AI SDK 7, Zod, Tesseract.js 7, plain CSS modules, Capacitor 8.

## License

[MIT](LICENSE)
