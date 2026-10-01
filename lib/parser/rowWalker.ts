import type { Transaction } from '../types';

export interface RowParseResult {
  amount: number;
  type: 'debit' | 'credit';
  balance?: number;
  description: string;
}

export interface RowWalkerConfig {
  rowStart: RegExp;
  yearLine: RegExp;
  continuationStops: RegExp[];
  ignoredContinuation: RegExp;
  parseRow: (fullLine: string, fullDate: string, date: string) => RowParseResult;
}

export function walkRows(lines: string[], startIndex: number, config: RowWalkerConfig): Transaction[] {
  const transactions: Transaction[] = [];
  let currentYear: number | null = null;

  let i = startIndex;
  while (i < lines.length) {
    if (config.yearLine.test(lines[i])) {
      currentYear = parseInt(lines[i], 10);
      i++;
      continue;
    }

    if (!config.rowStart.test(lines[i])) {
      i++;
      continue;
    }

    let fullLine = lines[i];
    let nextIndex = i + 1;
    while (nextIndex < lines.length &&
           !config.rowStart.test(lines[nextIndex]) &&
           !config.continuationStops.some(stop => stop.test(lines[nextIndex]))) {
      if (!config.ignoredContinuation.test(lines[nextIndex])) {
        fullLine += ' ' + lines[nextIndex];
      }
      nextIndex++;
    }

    const transaction = buildTransaction(fullLine, config);
    if (transaction) {
      if (currentYear !== null) {
        transaction.date = `${transaction.date} ${currentYear}`;
      }
      transactions.push(transaction);
      i = nextIndex;
    } else {
      i++;
    }
  }

  return transactions;
}

export function findLineBeforeFirstRow(lines: string[], rowStart: RegExp): { headerIndex: number; headerLine: string } {
  for (let i = 0; i < Math.min(lines.length, 200); i++) {
    if (rowStart.test(lines[i])) {
      return { headerIndex: i - 1, headerLine: lines[i - 1] || 'Unknown header' };
    }
  }
  return { headerIndex: -1, headerLine: '' };
}

function buildTransaction(fullLine: string, config: RowWalkerConfig): Transaction | null {
  const parts = fullLine.split(/\s+/);
  if (parts.length < 3) {
    return null;
  }

  const dateParts = /^\d{4}$/.test(parts[2]) ? 3 : 2;
  const fullDate = parts.slice(0, dateParts).join(' ');
  const date = fullDate.replace(/\s+\d{4}$/, '');
  const { amount, type, balance, description } = config.parseRow(fullLine, fullDate, date);

  if (amount === 0) {
    return null;
  }

  return { date, description: description.trim(), amount, type, balance };
}
