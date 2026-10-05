---
doc: prd
status: approved
---

# Fine Print — Product Requirements

A mobile-first web app that reads an everyday contract (lease, gym, phone/internet, installment loan) and shows adults (18+) where the traps are and what the contract really costs, before they sign.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

> **How this PRD was made:** the learner chose to delegate product details ("działaj"). Items marked *(agent proposal)* were proposed by the agent and accepted by the learner on approval of this document.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. The user opens Fine Print on their phone (or laptop). They see one sentence about what it does, a big **"Scan a contract"** action, and four sample contracts underneath.
2. They take a photo of the contract, upload a PDF/image, or paste the text. Or they tap a sample contract.
3. While it reads, they see a short reading state that says what is happening ("Reading the small print…", "Adding up what it really costs…"). No spinner-only screen.
4. The **Report** appears:
   - At the top, the **verdict strip**: advertised price vs **true cost over the term**, a **fairness score** (0–10), and a one-line verdict in plain English.
   - Below that, the **contract itself** with risky clauses highlighted like a highlighter pen: red = trap, yellow = watch out, green = fair/in your favour.
   - Tapping a highlight opens a **clause note**: what it says in plain English, why it matters, and what to do about it.
5. Below the document: **Before you sign, ask** (3–5 questions) and **Your letter** (a ready-to-send cancellation or change-request letter with Copy button).
6. Success: in under a minute the user knows whether to sign, what to ask, and has a letter ready.

## Screens and Layout
Two surfaces, one page flow *(agent proposal)*:

- **Start screen**: masthead "Fine Print", one-line promise, the input area (camera/upload button, "or paste text" toggle), and a row of four sample contract cards (Gym, Lease, Phone plan, Installment loan). A short "Not legal advice · Nothing is stored" line at the bottom.
- **Report screen**:
  - **Phone:** a single column in this order: verdict strip → highlighted document → questions → letter. A clause note opens as a bottom sheet.
  - **Laptop (≥ 1024px):** two columns. The highlighted document on the left (like a sheet of paper); the verdict, the clause note for the selected highlight, the questions, and the letter on the right in a sticky panel.
  - "Scan another" returns to the Start screen.

## Look and Feel
Source: `scope.md > Inspiration & Identity`.

- **Human-made, not AI-generic.** No purple/blue gradients, glassmorphism, emoji headings, sparkle icons, or "AI-powered" copy. The word "AI" appears at most once, in the footer.
- **Paper and ink:** off-white paper background (warm, slightly textured), near-black ink text, the contract rendered like a printed page with margins and a subtle shadow.
- **Highlighter marks** for severity: a real highlighter look (slightly uneven, multiply blend), in red/coral, yellow, and green. These are the only bright colours in the app.
- **Typography:** an editorial serif for headlines and the contract text (newspaper/legal feel), plus a clean grotesque sans for UI labels and numbers. Big, confident numbers in the verdict strip.
- **Tone of copy:** a sharp friend who has read too many contracts. Short, direct, a bit dry ("They can raise the price whenever they like. You can't leave for 24 months."). Never alarmist, never legalese.
- Dark mode is supported but not a focus *(agent proposal)*.

## Features and Behavior

### Contract input
- As someone at a counter with a contract, I want to snap a photo so I don't have to type anything.
  - [ ] On a phone, "Scan a contract" opens the camera or the photo picker.
  - [ ] Images (JPG/PNG/HEIC where the browser supports it) and PDFs are accepted; up to 4 images or 1 PDF (max ~10 pages) per analysis *(agent proposal)*.
  - [ ] "Paste text" reveals a text box; Analyze is disabled until there are at least ~200 characters.
  - [ ] Tapping a sample card starts the analysis on that sample immediately.

### Highlighted contract (the kernel)
Source: `scope.md > The Unique Kernel`.
- As a first-time signer, I want to see the traps marked on the contract itself so I trust the result and can point at the clause.
  - [ ] The report shows the contract's text (transcribed from the photo/PDF) with flagged passages highlighted in place.
  - [ ] Each highlight has a severity: red (trap), yellow (watch out), green (fair/good for you).
  - [ ] Tapping/clicking a highlight shows its note: plain-English meaning, why it matters, what to do.
  - [ ] Every flagged passage appears verbatim in the contract text (no invented quotes).
  - [ ] A typical consumer contract yields roughly 4–10 highlights, with at least one green when something is genuinely fair.

### True cost
- As someone comparing "$29/month" to reality, I want one number for what this actually costs me.
  - [ ] The verdict strip shows the advertised price (as the contract presents it) and the true cost over the minimum term.
  - [ ] A breakdown lists what goes into it (e.g., 24 × $29, sign-up fee $49, annual fee $59 ×2, early-exit fee) with each line linked to the clause it comes from.
  - [ ] When the contract has no money terms or not enough data, it says so plainly ("No price in this document — can't total it up") instead of guessing.
  - [ ] Assumptions are stated (e.g., "assuming you stay the minimum 24 months").

### Fairness score and verdict
- [ ] A score from 0 to 10 with a one-line verdict (e.g., "4/10 — Fine if you never want to leave.").
- [ ] Shows counts: N traps, N watch-outs, N fair.

### Before you sign, ask
- [ ] 3–5 concrete questions to ask the seller/landlord, tied to the red and yellow clauses.

### Your letter
- [ ] One letter generated from the contract: a cancellation letter if the contract has a cancellation clause, otherwise a request to change the worst clause *(agent proposal)*.
- [ ] It names the actual clause, notice period, and address/method required, if the contract states them; unknown details are left as clear [placeholders].
- [ ] A Copy button copies the full letter; a confirmation appears ("Copied").

### Contract types
Source: `scope.md > The POC Boundary`.
- [ ] Works on any of: gym membership, residential lease, phone/internet plan, installment loan (and degrades gracefully on others).
- [ ] The report names the detected type ("Gym membership · 24-month term").
- [ ] Four realistic, fictional sample contracts ship with the app, one per type, each containing at least one genuine trap (auto-renewal, price-rise clause, early-exit fee, deposit deductions, etc.).

### Explain it in my language
Added during the build ("wersję web rozwiń"; features proposed by the agent, learner delegated the choice).
- [ ] The Start screen has an "Explain it to me in" picker: English, Polski, Українська, Español, Deutsch. The choice is remembered on this device.
- [ ] The whole report (labels, notes, verdict, questions, cost lines) comes back in that language; the contract text and quotes stay in the original language.
- [ ] The letter stays in the contract's language (it goes to the other side), and the report says so.

### Calendar reminder
- [ ] When the contract has a notice rule and a term, the report shows "Don't miss the way out": the notice rule, a start-date field (default today), and the computed last day to send notice.
- [ ] "Add reminder to calendar" downloads an .ics all-day event on that day with alerts 7 days and 1 day before.

### Save as PDF
- [ ] "Save as PDF" opens the print dialog; the printout shows the verdict, the highlighted contract (colours kept), every clause note, the questions, the reminder and the letter, without buttons.

### Compare two offers
Added during the build ("rozbuduj dalej"; agent proposal, learner delegated the choice).
- [ ] From the Start screen, "Compare them side by side" opens two slots (Offer A, Offer B); each takes a photo/PDF or pasted text. A one-tap demo compares two fictional phone plans.
- [ ] Both are analyzed at once; the result shows the two offers side by side: who they're with, advertised vs true cost, monthly average, score, verdict, top traps.
- [ ] The cheaper offer is marked "Cheaper by $X" (by total when the terms match, by monthly average when they don't); the higher score is marked "Fairer deal". Different currencies are flagged and not compared.
- [ ] Each side opens its full report, with a way back to the comparison.

### If you read nothing else
- [ ] Under the verdict, the three most serious clauses (traps first, then watch-outs) as cards with why they matter; tapping one jumps to it on the contract.

### Read it out loud
- [ ] "Read it out loud" speaks the verdict, the true cost and the top three in the report's language, using the device's built-in voices; it can be stopped. Hidden where the browser has no speech support.

### Send it to someone
Added during the build ("rozbuduj dalej"; agent proposal, learner delegated the choice).
- [ ] "Send it to someone" on a report opens the phone's share sheet (or copies the link). The link opens the same report for the recipient, with a note that it was sent to them and lives only in the link.
- [ ] Nothing is stored on a server: the report travels inside the link's #fragment.

### Your recent reads
- [ ] Reports you run are kept on this device only (up to 8) and listed on the Start screen with who, true cost, score and date; each can be reopened or forgotten, or all forgotten at once.
- [ ] Reports opened from someone else's link are not added.

### A contract in another language
- [ ] A fifth sample, a German lease (Mietvertrag), shows a contract in one language explained in another; quotes and the letter stay in German.

### Phone app
Added during the build at the learner's request ("zrób wersję również na telefon i zainstaluj na podpiętym tele").
- [ ] Fine Print installs on an Android phone with its own icon and opens full screen on the Start screen.
- [ ] "Scan a contract" in the app opens the phone camera; the report works the same as on the web.
- [ ] The website can also be added to a phone's home screen (installable web app).

## States and Boundaries
- **First use:** the Start screen with samples, so a judge can see the result without owning a contract.
- **Reading:** progress messages for the 5–30 seconds of analysis; the user can cancel and go back.
- **Not a contract / unreadable photo:** "I couldn't read a contract here. Try a sharper photo in good light, or paste the text." Returns to the input with the file still selected.
- **Too long:** more than the page limit → a clear message to upload fewer pages.
- **Analysis failed (network/service):** "Something went wrong on our side. Try again." with a Retry button; the input is kept.
- **No money terms:** report still shows highlights; the true-cost box explains why there's no total.
- **Persistence:** nothing is stored on a server. Reports you run are kept in this browser only ("Your recent reads"), and can be forgotten. A shared report exists only inside its link.
- **Disclaimer:** "Not legal advice" is visible on the Start screen and at the bottom of every report.

## Product Decisions
- Several contract types, not one — learner decision ("kilka typów").
- Audience is adults 18+, with first-time signers as the sharpest case — learner decision ("osoby 18+").
- Mobile-first web app, not a native app — learner decision after discussion (judges open a link; camera works in browser).
- Must look human-made, not AI-generated — learner decision ("ma być jak zrobione przez człowieka").
- Screen layout, look-and-feel details, the letter rule, and input limits — *agent proposals*, accepted by the learner on approval of this document.

## What We're Building
Start screen with photo/PDF/paste input and four sample contracts → analysis → Report with verdict strip (true cost, score, verdict), the contract text with tappable severity highlights and notes, "Before you sign, ask" questions, and a copyable letter. Responsive (phone single column, laptop two columns), with the reading, error, and no-money states above. English UI.

## Deferred From the POC
- **Highlights drawn on the original photo** (instead of the transcribed text): much harder to get right; transcribed text proves the kernel.

## Possible Later Enhancements
- Compare two offers side by side.
- Pick the letter type (cancel vs change vs complaint).

## Non-Goals
- Legal advice or country-specific legal rules: we explain the contract text, we don't judge legality.
- Accounts, login, payments.
- A chat assistant: one clear report beats a conversation for this demo.
- Editing or e-signing the contract.

## Open Questions
- None blocking `4-spec`.
