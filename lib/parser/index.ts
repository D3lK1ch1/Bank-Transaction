import type { Transaction, ParsedData } from '../types';

export type { Transaction, ParsedData } from '../types';

export type { FormatType, HeaderInfo } from './types';

export { getMonthNumber } from './utils';
export { findTransactionHeader } from './detector';
export { extractTransaction } from './extractor';
export type { ExtractionResult } from './extractor';
export { filterSummaryRows } from './filter';
export { categorizeTransactions, groupByMonth } from './group';
export { generateSummary } from './summarize';

import { findTransactionHeader } from './detector';
import { extractTransaction } from './extractor';
import { filterSummaryRows } from './filter';
import { categorizeTransactions, groupByMonth } from './group';
import { generateSummary } from './summarize';
import { getCategoryFromDescription } from '../categories';

export function parseTransactions(rawText: string): ParsedData {
  const lines = rawText.split('\n').map(line => line.trim()).filter(l => l);
  
  const headerInfo = findTransactionHeader(lines);
  
  const transactions: Transaction[] = [];
  
  let i = headerInfo.startIndex;
  while (i < lines.length) {
    const transaction = extractTransaction(lines, i, headerInfo.format);
    if (transaction.parsed) {
      transactions.push(transaction.transaction);
      i = transaction.nextIndex;
    } else {
      i++;
    }
  }
  
  const filtered = filterSummaryRows(transactions);

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
