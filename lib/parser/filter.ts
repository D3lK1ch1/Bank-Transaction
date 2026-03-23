import type { Transaction } from '../types';

const EXCLUDE_PATTERNS = [
  /total/i,
  /subtotal/i,
  /^balance/i,
  /previous balance/i,
  /closing balance/i,
  /page \d+/i,
];

export function filterSummaryRows(transactions: Transaction[]): Transaction[] {
  return transactions.filter(t => 
    !EXCLUDE_PATTERNS.some(pattern => pattern.test(t.description))
  );
}
