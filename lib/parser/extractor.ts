import type { Transaction } from '../types';
import type { DateFormat, FormatType } from './types';

const MONTH_HEADER_REGEX = /^[A-Z]{3}\s+\d{4}$/i;
const BLANK_LINE_REGEX = /^blank$/i;

export interface ExtractionResult {
  parsed: boolean;
  transaction: Transaction;
  nextIndex: number;
}

function TRANSACTION_REGEX(dateFormat: DateFormat): RegExp {
  switch (dateFormat) {
    case 'DD MMM':
      return /^\d{1,2}\s+[A-Z]{3}(?:\s+\d{4})?/i;
    case 'DD MMM YYYY':
      return /^\d{1,2}\s+[A-Z]{3}\s+\d{4}/i;
    case 'DD/MM/YYYY':
      return /^\d{1,2}\/\d{1,2}\/\d{4}/;
    case 'DD/MM/YY':
      return /^\d{1,2}\/\d{1,2}\/\d{2}/;
    case 'YYYY-MM-DD':
      return /^\d{4}-\d{1,2}-\d{1,2}/;
    case 'MMM DD, YYYY':
      return /^[A-Z]{3}\s+\d{1,2},\s+\d{4}/i;
    default:
      return /^\d{1,2}\s+[A-Z]{3}/i; // Fallback to common format
  } 
}

export function extractTransaction(
  lines: string[],
  startIndex: number,
  format: FormatType = 'column',
  columnMap: Record<string, number> = {},
  dateFormat: DateFormat = 'unknown'
): ExtractionResult {
  if (BLANK_LINE_REGEX.test(lines[startIndex])) {
    return { parsed: false, transaction: {} as Transaction, nextIndex: startIndex + 1 };
  }
  
  if (MONTH_HEADER_REGEX.test(lines[startIndex])) {
    return { parsed: false, transaction: {} as Transaction, nextIndex: startIndex + 1 };
  }
  
  if (!TRANSACTION_REGEX(dateFormat).test(lines[startIndex])) {
    return { parsed: false, transaction: {} as Transaction, nextIndex: startIndex + 1 };
  }
  
  let fullLine = lines[startIndex];
  let nextIndex = startIndex + 1;
  
  while (nextIndex < lines.length && 
         !TRANSACTION_REGEX(dateFormat).test(lines[nextIndex]) && 
         !MONTH_HEADER_REGEX.test(lines[nextIndex])) {
    if (!BLANK_LINE_REGEX.test(lines[nextIndex])) {
      fullLine += ' ' + lines[nextIndex];
    }
    nextIndex++;
  }
  
  const parts = fullLine.split(/\s+/);
  if (parts.length < 3) {
    return { parsed: false, transaction: {} as Transaction, nextIndex };
  }
  
  let dateParts = 2;
  if (dateFormat === 'DD MMM YYYY' || dateFormat === 'YYYY-MM-DD' || dateFormat === 'MMM DD, YYYY') {
    dateParts = 3;
  }
  const fullDate = parts.slice(0, dateParts).join(' ');
  const date = fullDate.replace(/\s+\d{4}$/, '');
  let amount = 0;
  let type: 'debit' | 'credit';
  let balance: number | undefined;
  let description: string;
  
  if (format === 'line') {
    ({ amount, type, description } = extractLineFormat(fullLine, date));
  } else {
    ({ amount, type, balance, description } = extractColumnFormat(fullLine, parts, columnMap, dateFormat));
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
  const amountPattern = /\$\d[\d,]*/;
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
  parts: string[],
  columnMap: Record<string, number> = {},
  dateFormat: DateFormat = 'unknown',
): { amount: number; type: 'debit' | 'credit'; balance?: number; description: string } {
  const amountRegex = /(\d[\d,]*(?:\.\d{1,2})?)/g;
  const matches = fullLine.match(amountRegex) || [];
  const dayNum = parseInt(parts[0]);
  const yearNum = parts.length >= 3 && /^\d{4}$/.test(parts[2]) ? parseFloat(parts[2]) : NaN;
  const numericTokens = matches.filter(m => {
    const val = parseFloat(m.replace(/,/g, ''));
    return val >= 0 && val !== dayNum && (isNaN(yearNum) || val !== yearNum);
  });
  if (numericTokens.length < 2) {
    return { amount: 0, type: 'debit', description: '' };
  }
  
  const firstAmountMatch = fullLine.indexOf(numericTokens[0]);
  const datePattern = dateFormat === 'DD MMM YYYY' ? /^\d+\s+[A-Za-z]+\s+\d{4}/ : /^\d+\s+[A-Za-z]+/;
  const description = fullLine.substring(0, firstAmountMatch).replace(datePattern, '').trim();
  
  const parseNum = (s: string) => parseFloat(s.replace(/,/g, ''));
  const descLower = description.toLowerCase();
  const isCreditTransaction = /credit|deposit|interest|salary/i.test(descLower);
  
  const withdrawalCol = columnMap['withdrawal'] ?? -1;
  const depositCol = columnMap['deposit'] ?? -1;
  // CBA/NAB format (has Debit/Credit columns)
  if (withdrawalCol !== -1 && depositCol !== -1) {
    if (numericTokens.length >= 3) {
      // 3 tokens: debit, credit, balance
      const debitAmt = parseNum(numericTokens[numericTokens.length - 3]);
      const creditAmt = parseNum(numericTokens[numericTokens.length - 2]);
      const balanceAmt = parseNum(numericTokens[numericTokens.length - 1]);
      
      if (creditAmt > 0) {
        return { amount: creditAmt, type: 'credit', balance: balanceAmt, description };
      } else if (debitAmt > 0) {
        return { amount: debitAmt, type: 'debit', balance: balanceAmt, description };
      }
    } else if (numericTokens.length === 2) {
      // 2 tokens: amount + balance (one column is empty)
      const amount = parseNum(numericTokens[0]);
      const balance = parseNum(numericTokens[1]);
      
      if (amount > 0 && isCreditTransaction) {
        return { amount, type: 'credit', balance, description };
      } else if (amount > 0) {
        return { amount, type: 'debit', balance, description };
      }
    }
  }
  
  // ANZ format (withdrawal/deposit columns)
  if (numericTokens.length === 2) {
    const num0 = parseNum(numericTokens[0]);
    const num1 = parseNum(numericTokens[1]);
    const type = isCreditTransaction ? 'credit' : 'debit';
    if (num1 > num0 * 3) {
      // num1 is balance
      return { amount: num0, type, balance: num1, description };
    } else {
      return { amount: num0, type, balance: num1, description };
    }
  } else if (numericTokens.length >= 3) {
    const withdrawalAmt = parseNum(numericTokens[numericTokens.length - 3]);
    const depositAmt = parseNum(numericTokens[numericTokens.length - 2]);
    const balanceAmt = parseNum(numericTokens[numericTokens.length - 1]);
    
    if (depositAmt > 0) {
      return { amount: depositAmt, type: 'credit', balance: balanceAmt, description };
    } else if (withdrawalAmt > 0) {
      return { amount: withdrawalAmt, type: 'debit', balance: balanceAmt, description };
    }
  }
  
  return { amount: 0, type: 'debit', description };
}
