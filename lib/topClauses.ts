import type { LocatedClause, Report } from './schema';

const rank = { red: 0, yellow: 1, green: 2 } as const;

/** The few clauses worth reading first: traps before watch-outs, in contract order. Never the fair ones. */
export function topClauses(report: Pick<Report, 'clauses'>, n = 3): LocatedClause[] {
  return report.clauses
    .filter((c) => c.severity !== 'green')
    .sort((a, b) => rank[a.severity] - rank[b.severity] || a.start - b.start)
    .slice(0, n);
}
