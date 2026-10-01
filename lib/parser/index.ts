import type { ParsedData } from '../types';

export type { Transaction, ParsedData } from '../types';

export type { FormatType, HeaderInfo, Bank } from './types';

export { getMonthNumber } from './utils';
export { findTransactionHeader } from './detector';
export { filterSummaryRows } from './filter';
export { categorizeTransactions, groupByMonth, groupByDay } from './group';
export type { DayTransaction } from './group';
export { generateSummary } from './summarize';

import { getBankParser } from './detector';
import { filterSummaryRows } from './filter';
import { categorizeTransactions, groupByMonth } from './group';
import { generateSummary } from './summarize';
import { getCategoryFromDescription } from '../categories';
import type { Bank } from './types';

export function parseTransactions(rawText: string, bank: Bank): ParsedData {
  const parser = getBankParser(bank);
  const lines = rawText.split('\n').map(line => parser.normalizeLine(line.trim())).filter(l => l);

  const headerInfo = parser.findHeader(lines);
  const transactions = parser.extractTransactions(lines, headerInfo);

  const filtered = filterSummaryRows(transactions);
  if (filtered.length === 0) {
    throw new Error('No transactions found in statement');
  }

  const transactionsWithCategories = filtered.map(t => ({
    ...t,
    category: getCategoryFromDescription(t.description)
  }));

  return {
    transactions: transactionsWithCategories,
    categorized: categorizeTransactions(transactionsWithCategories),
    monthlyGrouped: groupByMonth(transactionsWithCategories),
    summary: generateSummary(transactionsWithCategories),
  };
}
