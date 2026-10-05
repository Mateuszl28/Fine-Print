import { z } from 'zod';

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
        clauseId: z.string().nullable().describe('id of the clause this comes from, if flagged'),
      }),
    )
    .describe('Every money item the signer will pay over the minimum term. Empty if none.'),
  costAssumption: z
    .string()
    .describe('One sentence, e.g. "Assuming you stay the minimum 24 months and never freeze."'),
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
  questions: z.array(z.string()),
  letter: z.object({
    kind: z.enum(['cancellation', 'change_request']),
    subject: z.string(),
    body: z.string(),
  }),
});

export type Analysis = z.infer<typeof analysisSchema>;
export type Severity = 'red' | 'yellow' | 'green';

export type LocatedClause = Analysis['clauses'][number] & { start: number; end: number };

export type Report = Omit<Analysis, 'transcript' | 'clauses'> & {
  text: string;
  clauses: LocatedClause[];
  trueCost: number | null;
  droppedQuotes: number;
};

export type AnalyzeError = { error: 'not_a_contract' | 'too_long' | 'bad_input' | 'failed' };
