---
doc: scope
status: approved
---

# Fine Print

Read the contract before you sign it, in about a minute and in plain English.

## The Unique Kernel
Fine Print doesn't summarize the contract. It marks the risky clauses **on the contract text itself** (red, yellow, green) and turns them into one number: **what the contract will really cost you** over its full term. That's different from "ask a chatbot about my PDF": you see where the traps are and what they cost.

## Who It's For
Adults (18+) who sign everyday contracts without reading them: a lease, a gym membership, a phone or internet plan, a buy-now-pay-later or installment loan. The sharpest case is someone signing one of these for the first time, standing at a counter with a pen and no lawyer. Today they skim it, sign, and find out about the auto-renewal or cancellation fee a year later.

## The Core Loop
Before signing, they open Fine Print on their phone, snap a photo of the contract (or upload a PDF, or paste the text), and within seconds see:
1. The contract with risky clauses highlighted. Tapping a highlight shows a plain-language explanation.
2. The true cost over the term, next to the advertised price.
3. A fairness score and the questions to ask before signing.
4. A ready-to-send letter (to cancel or to request a change).

They come back every time a new contract shows up.

## Inspiration & Identity
- **Must feel human-made, not AI-generated.** No purple gradients, no emoji headings, no generic "AI-powered" hype copy. It should look like something a careful designer built: paper-and-ink feel, a real document look with highlighter marks, editorial typography.
- Tone: a sharp friend who's read a lot of contracts. Direct, a bit dry, never a lawyer, never scary.
- Mobile-first web app. It should work in a phone browser (camera upload) and look good on a laptop for judges.

## Why This Matters to the Learner
They want to win the Build With AI: Basics hackathon with something that has real impact and a demo people remember.

## What "Working" Looks Like
A judge opens the link, picks one of the sample contracts (or uploads their own), and within seconds sees the document with highlights, the true cost, a score, and a letter they can copy.
**The "oh, that's cool" moment:** "$29/month" next to "**$1,140 over 24 months**," with the auto-renewal clause glowing red on the page.

## The POC Boundary
- Input: photo/image, PDF, or pasted text; one contract at a time.
- Several contract types (lease, gym, phone/internet, installment loan). One sample contract per type ships with the app for the demo.
- AI analysis returns: highlighted clauses with severity and plain-language explanations, a true-cost calculation, a fairness score, and questions to ask.
- One generated letter (cancellation or change request) to copy.
- Mobile-first responsive UI. A short disclaimer that this is not legal advice.
- UI and outputs in English.

## Later
- Calendar reminder (.ics) for the cancellation-notice deadline.
- Explanations in the user's language (e.g., a Polish contract explained in Polish).
- Side-by-side comparison of two offers.
- Installable PWA.

## Explicitly Cut
- **Accounts and saved history.** Contracts are private documents, and storing them adds risk and work without proving the kernel.
- **Country-specific legal rules / legal database.** It's too big for a PoC, and we're not giving legal advice.
- **Native mobile app.** Judges need a link they can open, and the phone camera already works in the browser.
- **Negotiation chat / back-and-forth assistant.** It doesn't prove the kernel, and it's easy to get wrong in 2–4 hours.
