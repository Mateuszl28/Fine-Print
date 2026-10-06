import { z } from 'zod';
import type { ExitPlan } from './exit.ts';

export const earlyExitSchema = z
  .object({
    noticeMonths: z
      .number()
      .nullable()
      .describe('Months of notice before leaving takes effect (payments continue meanwhile), rounded up; null if none'),
    rules: z.array(
      z.object({
        fromMonth: z.number().describe('First month (1-based) this rule applies to someone who leaves at the end of that month'),
        toMonth: z.number().nullable().describe('Last month it applies; null = until the end of the minimum term'),
        kind: z
          .enum(['not_allowed', 'free', 'fixed_fee', 'months_of_payment', 'share_of_remaining_percent', 'remaining_of_item'])
          .describe(
            'not_allowed: you cannot leave in these months. free: leaving costs nothing extra. fixed_fee: a set amount. months_of_payment: a whole number of regular payments (e.g. two months of rent). share_of_remaining_percent: a percentage of what is still left to pay (e.g. 50% of the remaining dues). remaining_of_item: everything left on one item becomes due at once.',
          ),
        value: z
          .number()
          .nullable()
          .describe('fixed_fee: the amount; months_of_payment: how many payments (e.g. 2 for "two months’ rent"); share_of_remaining_percent: the percentage as a whole number (50 for 50%); otherwise null'),
        itemIndex: z
          .number()
          .nullable()
          .describe('0-based index in costItems of the payment this rule is measured by (months_of_payment, share_of_remaining_percent, remaining_of_item); otherwise null'),
        clauseId: z.string().nullable(),
      }),
    ),
  })
  .nullable()
  .describe('What leaving before the end of the minimum term costs. null if there is no minimum term or the contract is a loan.');

// What the model must return. Anything we can compute ourselves (where a quote sits
// in the text, the true cost total) is deliberately left out and added by checkReport.
export const analysisSchema = z.object({
  isContract: z
    .boolean()
    .describe('false if the input is not a contract or agreement, or is unreadable'),
  transcript: z
    .string()
    .nullable()
    .describe(
      'Full, faithful transcription of the contract when the input is an image or PDF. null when the input was plain text.',
    ),
  contractType: z.enum(['gym', 'lease', 'phone_internet', 'installment_loan', 'other']),
  title: z.string().describe('Short label, e.g. "Gym membership · 24-month term"'),
  counterparty: z.string().describe('Who the signer is dealing with, e.g. "IronHouse Fitness"'),
  notice: z
    .object({
      daysBeforeEnd: z
        .number()
        .nullable()
        .describe('Days of notice needed before the end of the term to cancel or stop renewal; null if not stated'),
      how: z.string().describe('How to give notice, e.g. "In writing, by certified mail to P.O. Box 7781, Columbus, OH 43216"'),
    })
    .nullable()
    .describe('Cancellation / non-renewal notice rule, null if the contract has none'),
  termMonths: z.number().nullable().describe('Minimum term in months, null if none'),
  advertised: z.object({
    label: z.string().describe('The headline price as the contract presents it, e.g. "$29.99 / month"'),
    amount: z.number().nullable(),
  }),
  currency: z.string().describe('ISO code, e.g. USD'),
  costItems: z
    .array(
      z.object({
        label: z.string().describe('e.g. "Monthly dues, months 1–24"'),
        amount: z.number().describe('Amount of one payment'),
        times: z.number().describe('How many times it is paid over the minimum term'),
        fromMonth: z
          .number()
          .describe('Month of the term (1 = the first month) in which the first payment falls; 1 for anything paid at signing. Best estimate if it depends on the start date.'),
        everyMonths: z.number().describe('Months between payments: 1 monthly, 12 yearly, 0 for a one-off'),
        clauseId: z.string().nullable().describe('id of the clause this comes from, if flagged'),
      }),
    )
    .describe(
      'Every money item the signer will pay over the minimum term. Empty if none. Never list a fee the contract says is already included in, or added to, an amount being repaid in installments: the installments already contain it.',
    ),
  costAssumption: z
    .string()
    .describe('One sentence, e.g. "Assuming you stay the minimum 24 months and never freeze."'),
  earlyExit: earlyExitSchema,
  score: z.number().describe('Fairness to the signer, 0 (predatory) to 10 (genuinely fair)'),
  verdict: z.string().describe('One dry sentence verdict'),
  clauses: z.array(
    z.object({
      id: z.string().describe('Short slug, e.g. "auto-renewal"'),
      severity: z.enum(['red', 'yellow', 'green']),
      quote: z
        .string()
        .describe('Exact, verbatim passage copied character for character from the contract text'),
      title: z.string(),
      meaning: z.string(),
      whyItMatters: z.string(),
      whatToDo: z.string(),
    }),
  ),
  glossary: z
    .array(
      z.object({
        term: z.string().describe('The word or short phrase exactly as it is written in the contract, in its original language'),
        plain: z.string().describe('One short sentence: what it means here, in plain words'),
      }),
    )
    .describe('Legal or technical words a first-time signer may not know. Empty if none.'),
  questions: z.array(z.string()),
  letter: z.object({
    kind: z.enum(['cancellation', 'change_request']),
    subject: z.string(),
    body: z.string(),
  }),
});

export type Analysis = z.infer<typeof analysisSchema>;
export type Severity = 'red' | 'yellow' | 'green';

export type PhotoBox = { image: number; box: [ymin: number, xmin: number, ymax: number, xmax: number] };

export type LocatedClause = Analysis['clauses'][number] & {
  start: number;
  end: number;
  boxes: PhotoBox[];
};

export type ReportChecks = {
  quotes: { shown: number; notFound: number; overlapping: number };
  terms: { shown: number; left: number };
  payments: number;
  removed: { label: string; amount: number; times: number; reason: 'deposit' | 'financed' }[];
  /** Auto-enrolled add-ons the model left out, put back after a focused follow-up. */
  added?: { label: string; amount: number; times: number }[];
  /** Amounts the model worked out itself; the costs were read again from the contract. */
  reread?: { label: string; amount: number; times: number }[];
  /** Amounts still not found in the contract after everything else. */
  unbacked?: { label: string; amount: number; times: number }[];
  exit: 'checked' | 'rejected' | 'none';
};

export type LocatedTerm = Analysis['glossary'][number] & { start: number; end: number };

export type Report = Omit<Analysis, 'transcript' | 'clauses' | 'glossary' | 'earlyExit'> & {
  /** Missing on older reports, and when the contract's exit rules couldn't be checked. */
  earlyExit?: ExitPlan | null;
  text: string;
  clauses: LocatedClause[];
  /** Missing on reports saved or shared before the glossary existed. */
  terms?: LocatedTerm[];
  trueCost: number | null;
  droppedQuotes: number;
  /** What the code checked and threw out. Missing on reports from before it was recorded. */
  checks?: ReportChecks;
};

export type AnalyzeError = { error: 'not_a_contract' | 'too_long' | 'bad_input' | 'failed' | 'rate_limited' | 'busy' };
