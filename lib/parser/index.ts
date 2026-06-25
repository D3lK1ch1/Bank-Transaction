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

const MERGED_ANZ_PREFIX_REGEX = /^(\d{1,2}\s+[A-Z]{3})(ANZ|VISA|EFTPOS|PAYMENT|MTS)\b/i;
const CATEGORY_LINE_REGEX = /^(groceries|food|transport|utilities|rent|education|shopping|entertainment|healthcare|friends|misc)$/i;

export function parseTransactions(rawText: string): ParsedData {
  const lines = rawText.split('\n').map(line => normalizeLine(line.trim())).filter(l => l);
  
  const headerInfo = findTransactionHeader(lines);
  
  const transactions: Transaction[] = [];
  let currentYear: number | null = null;

  let i = headerInfo.startIndex;
  while (i < lines.length) {
    if (/^\d{4}$/.test(lines[i])) {
      currentYear = parseInt(lines[i], 10);
      i++;
      continue;
    }
    const transaction = extractTransaction(lines, i, headerInfo.format);
    if (transaction.parsed) {
      if (currentYear !== null) {
        transaction.transaction.date = `${transaction.transaction.date} ${currentYear}`;
      }
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

function normalizeLine(line: string): string {
  if (CATEGORY_LINE_REGEX.test(line)) {
    return '';
  }

  if (/^totals at end of page|^anz access advantage statement|^account number \d|^page \d+ of \d+$/i.test(line)) {
    return '';
  }

  if (line === '-' || line.toLowerCase() === 'blank') {
    return '0.00';
  }

  return line.replace(MERGED_ANZ_PREFIX_REGEX, '$1 $2');
}
