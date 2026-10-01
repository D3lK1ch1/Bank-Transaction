import type { Transaction } from '../../types';
import type { BankParser, HeaderInfo } from '../types';

const HEADER_REGEX = /^\s*date\s*particulars\s+debits\s+credits\s+balance\s*$/i;
const DATE_PREFIX_REGEX = /^(\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4})\s*(.*)$/;
const BALANCE_SUFFIX_REGEX = /(?:^|\s)(\d[\d,]*\.\d{2})\s+(Cr|Dr)$/i;
const AMOUNT_SUFFIX_REGEX = /(?:^|[\s.])(\d[\d,]*\.\d{2})$/;
const NON_TRANSACTION_TEXT_REGEX = /^(statement number|transaction details|brought forward|carried forward|interest rate brought forward|date\s*particulars)/i;
const MAX_UNRESOLVED_AMOUNTS = 16;
const CENT_TOLERANCE = 0.005;

interface PendingTransaction {
  date: string;
  description: string;
  amount: number;
}

export const nabParser: BankParser = {
  normalizeLine: line => line,
  findHeader,
  extractTransactions: (lines, header) => extractTransactions(lines, header.startIndex),
};

function findHeader(lines: string[]): HeaderInfo {
  const headerIndex = lines.findIndex(line => HEADER_REGEX.test(line));
  if (headerIndex === -1) {
    throw new Error('NAB transaction header not found');
  }

  const startIndex = headerIndex + 1;
  return {
    headerLine: lines[headerIndex].trim(),
    headerIndex,
    format: 'nab',
    startIndex,
    sampleLines: lines.slice(startIndex, startIndex + 50),
  };
}

function extractTransactions(lines: string[], startIndex: number): Transaction[] {
  const transactions: Transaction[] = [];
  let pending: PendingTransaction[] = [];
  let descriptionBuffer: string[] = [];
  let currentDate = '';
  let lastBalance: number | null = null;

  for (const rawLine of lines.slice(startIndex)) {
    let line = rawLine.trim();

    const dateMatch = line.match(DATE_PREFIX_REGEX);
    if (dateMatch) {
      currentDate = dateMatch[1];
      line = dateMatch[2];
    }

    let balance: number | null = null;
    const balanceMatch = line.match(BALANCE_SUFFIX_REGEX);
    if (balanceMatch) {
      const value = parseAmount(balanceMatch[1]);
      balance = balanceMatch[2].toLowerCase() === 'dr' ? -value : value;
      line = line.slice(0, balanceMatch.index).trim();
    }

    let amount: number | null = null;
    const amountMatch = line.match(AMOUNT_SUFFIX_REGEX);
    if (amountMatch) {
      amount = parseAmount(amountMatch[1]);
      line = line.slice(0, amountMatch.index);
    }

    const text = line.replace(/\.{2,}/g, ' ').replace(/\s+/g, ' ').trim();
    const isNonTransactionText = NON_TRANSACTION_TEXT_REGEX.test(text);

    if (amount !== null && !isNonTransactionText) {
      if (!currentDate) {
        throw new Error('NAB transaction found before any date');
      }
      const description = [...descriptionBuffer, text].filter(Boolean).join(' ');
      pending.push({ date: currentDate, description, amount });
      descriptionBuffer = [];
    } else if (text && !isNonTransactionText) {
      descriptionBuffer.push(text);
    }

    if (balance !== null) {
      if (lastBalance !== null) {
        const resolvedCount = resolvePending(pending, balance - lastBalance, lastBalance, transactions);
        pending = pending.slice(resolvedCount);
      }
      lastBalance = balance;
    }
  }

  if (pending.length > 0) {
    throw new Error(`${pending.length} NAB transaction(s) could not be matched to a balance`);
  }

  return transactions;
}

function resolvePending(
  pending: PendingTransaction[],
  balanceChange: number,
  openingBalance: number,
  output: Transaction[]
): number {
  for (let count = 0; count <= Math.min(pending.length, MAX_UNRESOLVED_AMOUNTS); count++) {
    const group = pending.slice(0, count);
    const isCredit = findSigns(group.map(t => t.amount), balanceChange);
    if (!isCredit) {
      continue;
    }

    let runningBalance = openingBalance;
    group.forEach((t, i) => {
      runningBalance += isCredit[i] ? t.amount : -t.amount;
      output.push({
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: isCredit[i] ? 'credit' : 'debit',
        balance: Math.round(runningBalance * 100) / 100,
      });
    });
    return count;
  }

  throw new Error(`NAB balance change of ${balanceChange.toFixed(2)} does not match the transactions before it`);
}

function findSigns(amounts: number[], target: number): boolean[] | null {
  for (let mask = 0; mask < 2 ** amounts.length; mask++) {
    const isCredit = amounts.map((_, i) => (mask & (1 << i)) !== 0);
    const total = amounts.reduce((sum, amount, i) => sum + (isCredit[i] ? amount : -amount), 0);
    if (Math.abs(total - target) < CENT_TOLERANCE) {
      return isCredit;
    }
  }
  return null;
}

function parseAmount(value: string): number {
  return parseFloat(value.replace(/,/g, ''));
}
