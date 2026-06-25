import type { Transaction } from '../types';
import type { FormatType } from './types';

const MONTH_HEADER_REGEX = /^[A-Z]{3}\s+\d{4}$/i;
const BLANK_LINE_REGEX = /^blank$/i;
const TRANSACTION_REGEX = /^\d{1,2}\s+[A-Z]{3}(?:\s+\d{4})?/i;
const SECTION_BREAK_REGEX = /^date\s+(transaction|description)/i;
const AMOUNT_TOKEN_REGEX = '[+-]?\\$?[+-]?\\d[\\d,]*(?:\\.\\d{1,2})?';
const TRAILING_AMOUNT_REGEX = new RegExp(`(?:^|\\s)(${AMOUNT_TOKEN_REGEX}|-)\\s+(${AMOUNT_TOKEN_REGEX}|-)\\s+(${AMOUNT_TOKEN_REGEX}|-)$`);

export interface ExtractionResult {
  parsed: boolean;
  transaction: Transaction;
  nextIndex: number;
}

export function extractTransaction(
  lines: string[],
  startIndex: number,
  format: FormatType = 'column'
): ExtractionResult {
  if (BLANK_LINE_REGEX.test(lines[startIndex])) {
    return { parsed: false, transaction: {} as Transaction, nextIndex: startIndex + 1 };
  }
  
  if (MONTH_HEADER_REGEX.test(lines[startIndex])) {
    return { parsed: false, transaction: {} as Transaction, nextIndex: startIndex + 1 };
  }
  
  if (!TRANSACTION_REGEX.test(lines[startIndex])) {
    return { parsed: false, transaction: {} as Transaction, nextIndex: startIndex + 1 };
  }
  
  let fullLine = lines[startIndex];
  let nextIndex = startIndex + 1;
  
  while (nextIndex < lines.length &&
         !TRANSACTION_REGEX.test(lines[nextIndex]) &&
         !MONTH_HEADER_REGEX.test(lines[nextIndex]) &&
         !SECTION_BREAK_REGEX.test(lines[nextIndex])) {
    if (!BLANK_LINE_REGEX.test(lines[nextIndex])) {
      fullLine += ' ' + lines[nextIndex];
    }
    nextIndex++;
  }
  
  const parts = fullLine.split(/\s+/);
  if (parts.length < 3) {
    return { parsed: false, transaction: {} as Transaction, nextIndex };
  }
  
  const dateParts = parts.length >= 3 && /^\d{4}$/.test(parts[2]) ? 3 : 2;
  const fullDate = parts.slice(0, dateParts).join(' ');
  const date = fullDate.replace(/\s+\d{4}$/, '');
  let amount = 0;
  let type: 'debit' | 'credit';
  let balance: number | undefined;
  let description: string;
  
  if (format === 'line') {
    ({ amount, type, description } = extractLineFormat(fullLine, date));
  } else {
    ({ amount, type, balance, description } = extractColumnFormat(fullLine, fullDate));
  }
  
  if (amount === 0) {
    return { parsed: false, transaction: {} as Transaction, nextIndex };
  }
  
  return {
    parsed: true,
    transaction: {
      date,
      description: description.trim(),
      amount,
      type,
      balance,
    },
    nextIndex,
  };
}

function extractLineFormat(fullLine: string, date: string): 
  { amount: number; type: 'debit' | 'credit'; description: string } {
  const amountPattern = /\$\d[\d,]*(?:\.\d{1,2})?/;
  const amountMatches = fullLine.match(amountPattern);
  
  if (!amountMatches || amountMatches.length === 0) {
    return { amount: 0, type: 'debit', description: '' };
  }
  
  const amountStr = amountMatches[amountMatches.length - 1].replace('$', '').replace(/,/g, '');
  const amount = parseFloat(amountStr);
  
  const descLower = fullLine.toLowerCase();
  const isCredit = /credit|interest|refund|deposit|from|intl payment/i.test(descLower);
  const type: 'debit' | 'credit' = isCredit ? 'credit' : 'debit';
  
  const amountIndex = fullLine.indexOf(amountMatches[amountMatches.length - 1]);
  const description = fullLine.substring(date.length, amountIndex).trim();
  
  return { amount, type, description };
}

function extractColumnFormat(
  fullLine: string, 
  fullDate: string
): { amount: number; type: 'debit' | 'credit'; balance?: number; description: string } {
  const amountMatch = fullLine.match(TRAILING_AMOUNT_REGEX);
  if (!amountMatch) {
    return { amount: 0, type: 'debit', description: '' };
  }
  
  const parseNum = (s: string) => {
    if (s === '-') {
      return 0;
    }

    return Math.abs(parseFloat(s.replace(/[$,]/g, '')));
  };
  const withdrawalAmt = parseNum(amountMatch[1]);
  const depositAmt = parseNum(amountMatch[2]);
  const balanceAmt = parseNum(amountMatch[3]);
  const amountStart = amountMatch.index ?? fullLine.length;
  const description = fullLine.slice(fullDate.length, amountStart).trim();

  if (withdrawalAmt > 0) {
    if (isLeakedDescriptionNumber(withdrawalAmt, description)) {
      return { amount: 0, type: 'debit', description };
    }

    return { amount: withdrawalAmt, type: 'debit', balance: balanceAmt, description };
  }

  if (depositAmt > 0) {
    if (isLeakedDescriptionNumber(depositAmt, description)) {
      return { amount: 0, type: 'credit', description };
    }

    return { amount: depositAmt, type: 'credit', balance: balanceAmt, description };
  }
  
  return { amount: 0, type: 'debit', description };
}

function isLeakedDescriptionNumber(amount: number, description: string): boolean {
  const hasEffectiveDate = /effective date/i.test(description);
  const hasTransferReference = /m-banking funds tfer|transfer/i.test(description);

  return (hasEffectiveDate && amount >= 2020 && amount <= 2030) || (hasTransferReference && amount >= 100000);
}
