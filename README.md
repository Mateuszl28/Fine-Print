# Fine Print

Read the contract before you sign it. Fine Print takes a photo, PDF or pasted text of an everyday contract (gym membership, lease, phone plan, pay-over-time loan), marks risky clauses on the contract text in red / yellow / green, adds up what it really costs over the term, and drafts the letter you'd need to get out.

**Live:** https://fine-print-khaki.vercel.app

Built for [Build With AI: Basics](https://learn-ai-basics.devpost.com/) with the Devpost Learn skill pack. The planning documents live in [`devpost/`](devpost/): [scope](devpost/scope.md), [PRD](devpost/prd.md), [spec](devpost/spec.md), [build checklist](devpost/checklist.md), and an [app map](devpost/app-map.html).

> Not legal advice. Nothing you upload is stored on a server.

## Features

- **Highlights on the contract itself.** Every highlight is a verbatim quote that the server finds in the contract text; quotes the model can't back up are dropped.
- **True cost.** The model lists the money items; the total is added up in code (`lib/checkReport.ts`), not by the model.
- **Fairness score, questions to ask, and a ready-to-send letter** (cancellation or change request) with a copy button.
- **Compare two offers** side by side: which one is really cheaper (by total, or by monthly average when the terms differ) and which is fairer.
- **"If you read nothing else":** the three most serious clauses, right under the verdict.
- **Read it out loud** with the browser's built-in voices, in the report's language.
- **Send it to someone:** the link carries the report itself (compressed into the `#fragment`), so nothing is stored on a server.
- **Recent reads** kept on your device only, with "Forget".
- **Any contract language:** try the German lease sample explained in English, Polish or Ukrainian.
- **On your photo:** for photo input, the marks can also be shown over your own photo (approximate; the text view is exact).
- **Photo, PDF or text.** Photos are resized in the browser before upload.
- **Five languages** for the report: English, Polski, Українська, Español, Deutsch. Quotes stay in the contract's language.
- **Calendar reminder** (.ics) for the last day to give notice.
- **Save as PDF** with the highlights kept.
- **Phone:** installable web app, plus an Android app (Capacitor shell around the live site).
- Fictional sample contracts to try without your own.

## Run it locally

Requirements: Node.js 22+ and a [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) API key (the Gateway needs a card on file even for its free tier).

```bash
npm install
cp .env.example .env.local   # then put your key in AI_GATEWAY_API_KEY
npm run dev                  # http://localhost:3000
```

Other commands:

```bash
npm test         # unit tests (quote matching, cost totals, calendar file, comparison, share links)
npm run build    # production build
```

The model defaults to `google/gemini-2.5-flash` (available on the Gateway free tier). Set `FINEPRINT_MODEL` to use another Gateway model, e.g. `google/gemini-2.5-pro`.

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
| `lib/i18n.ts` | Report labels in five languages |
| `lib/ics.ts` | Notice deadline and calendar file (tested) |
| `lib/compare.ts` | Which of two offers is cheaper / fairer (tested) |
| `lib/share.ts` | Report ⇄ link encoding (tested) |
| `lib/history.ts` | Recent reads in localStorage |
| `lib/samples.ts` | Fictional sample contracts (incl. a German lease and a second phone plan) |
| `components/` | Start screen, report, highlighted contract, letter, reminder |

Stack: Next.js 16, React 19, TypeScript, AI SDK 7, Zod, plain CSS modules, Capacitor 8.

## License

[MIT](LICENSE)
