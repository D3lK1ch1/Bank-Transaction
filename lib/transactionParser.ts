import type { Transaction, ParsedData, Summary } from './types';
import { getCategoryFromDescription } from './categories';

export type { Transaction, ParsedData } from './types';

type FormatType = 'column' | 'line' | 'unknown';

interface HeaderInfo {
  headerLine: string;
  headerIndex: number;
  format: FormatType;
  startIndex: number;
  sampleLines: string[];
}

function findTransactionHeader(lines: string[]): HeaderInfo {
  const headerPatterns = [
    /date.*transaction.*withdrawal.*deposit/i,
    /date.*transaction.*detail.*withdrawal.*deposit/i,
    /date.*description.*withdrawal.*deposit/i,
    /date.*transaction.*description.*amount/i,
    /date.*transaction.*amount/i,
  ];
  
  let headerIndex = -1;
  let headerLine = '';
  
  for (let i = 0; i < Math.min(lines.length, 100); i++) {
    const line = lines[i];
    if (headerPatterns.some(p => p.test(line))) {
      headerIndex = i;
      headerLine = line;
      break;
    }
  }
  
  if (headerIndex === -1) {
    console.log('No standard header found, searching for date patterns...');
    for (let i = 0; i < Math.min(lines.length, 200); i++) {
      if (/^\d{1,2}\s+[A-Z]{3}/i.test(lines[i])) {
        headerIndex = i - 1;
        headerLine = lines[i - 1] || 'Unknown header';
        break;
      }
    }
  }
  
  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
  const sampleLines = lines.slice(startIndex, startIndex + 50);
  
  let format: FormatType = 'unknown';
  const hasBalance = /balance/i.test(headerLine);
  const hasWithdrawals = /withdrawal/i.test(headerLine);
  const hasDeposits = /deposit/i.test(headerLine);
  const hasAmount = /amount/i.test(headerLine);
  
  if (hasBalance && hasWithdrawals && hasDeposits) {
    format = 'column';
  } else if ((hasWithdrawals && hasDeposits && !hasBalance) || (hasAmount && !hasBalance)) {
    format = 'line';
  }
  
  return { headerLine, headerIndex, format, startIndex, sampleLines };
}

export function parseTransactions(rawText: string): ParsedData {
  const lines = rawText.split('\n').map(line => line.trim()).filter(l => l);
  
  // Find header line and detect format
  const headerInfo = findTransactionHeader(lines);
  console.log('=== FORMAT DETECTION ===');
  console.log('Header line:', headerInfo.headerLine);
  console.log('Header index:', headerInfo.headerIndex);
  console.log('Format detected:', headerInfo.format);
  headerInfo.sampleLines.forEach((line, i) => console.log(`  ${i}: "${line}"`));
  console.log('=======================');
  
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
  
  // Filter out page totals and summaries
  const filtered = filterSummaryRows(transactions);

  // Add category to each transaction
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

function extractTransaction(
  lines: string[],
  startIndex: number,
  format: FormatType = 'column'
): { parsed: boolean; transaction: Transaction; nextIndex: number } {
  const transactionRegex = /^\d{1,2}\s+[A-Z]{3}/i;
  const monthHeaderRegex = /^[A-Z]{3}\s+\d{4}$/i;
  const blankLineRegex = /^blank$/i;
  
  if (blankLineRegex.test(lines[startIndex])) {
    return { parsed: false, transaction: {} as Transaction, nextIndex: startIndex + 1 };
  }
  
  if (monthHeaderRegex.test(lines[startIndex])) {
    return { parsed: false, transaction: {} as Transaction, nextIndex: startIndex + 1 };
  }
  
  if (!transactionRegex.test(lines[startIndex])) {
    return { parsed: false, transaction: {} as Transaction, nextIndex: startIndex + 1 };
  }
  
  let fullLine = lines[startIndex];
  let nextIndex = startIndex + 1;
  
  while (nextIndex < lines.length && !transactionRegex.test(lines[nextIndex]) && !monthHeaderRegex.test(lines[nextIndex])) {
    if (!blankLineRegex.test(lines[nextIndex])) {
      fullLine += ' ' + lines[nextIndex];
    }
    nextIndex++;
  }
  
  const parts = fullLine.split(/\s+/);
  if (parts.length < 3) {
    return { parsed: false, transaction: {} as Transaction, nextIndex };
  }
  
  const date = parts[0] + ' ' + parts[1];
  let amount = 0;
  let type: 'debit' | 'credit';
  let balance: number | undefined;
  let description: string;
  
  if (format === 'line') {
    // Line format: single $ amount at end, detect type from description
    const amountPattern = /\$\d[\d,]*/;
    const amountMatches = fullLine.match(amountPattern);
    
    if (amountMatches && amountMatches.length > 0) {
      const amountStr = amountMatches[amountMatches.length - 1].replace('$', '').replace(/,/g, '');
      amount = parseFloat(amountStr);
      
      // Detect debit/credit from description keywords
      const descLower = fullLine.toLowerCase();
      const isCredit = /credit|interest|refund|deposit|from|intl payment/i.test(descLower);
      type = isCredit ? 'credit' : 'debit';
      
      // Description is everything between date and amount
      const amountIndex = fullLine.indexOf(amountMatches[amountMatches.length - 1]);
      description = fullLine.substring(date.length, amountIndex).trim();
    } else {
      return { parsed: false, transaction: {} as Transaction, nextIndex };
    }
  } else {
    // Column format: extract amounts from the line using regex to preserve position
    const amountRegex = /(\d[\d,]*(?:\.\d{1,2})?)/g;
    const matches = fullLine.match(amountRegex) || [];
    
    // Remove the date number (first token if it's just a day)
    const dayNum = parseInt(parts[0]);
    const numericTokens = matches.filter(m => {
      const val = parseFloat(m.replace(/,/g, ''));
      return val >= 0 && val !== dayNum;
    });
    
    if (numericTokens.length < 2) {
      return { parsed: false, transaction: {} as Transaction, nextIndex };
    }
    
    // Description is between date and first amount
    const firstAmountMatch = fullLine.indexOf(numericTokens[0]);
    description = fullLine.substring(0, firstAmountMatch).replace(/^\d+\s+\w+\s+/, '').trim();
    
    const parseNum = (s: string) => parseFloat(s.replace(/,/g, ''));
    
    let withdrawalAmt = NaN;
    let depositAmt = NaN;
    let balanceAmt = NaN;
    
    if (numericTokens.length === 2) {
      const num0 = parseNum(numericTokens[0]);
      const num1 = parseNum(numericTokens[1]);
      // Larger value is typically balance (cumulative)
      if (num1 > num0 * 3) {
        balanceAmt = num1;
        withdrawalAmt = num0;
      } else {
        withdrawalAmt = num0;
        balanceAmt = num1;
      }
    } else if (numericTokens.length >= 3) {
      // Take the last 3 amounts
      withdrawalAmt = parseNum(numericTokens[numericTokens.length - 3]);
      depositAmt = parseNum(numericTokens[numericTokens.length - 2]);
      balanceAmt = parseNum(numericTokens[numericTokens.length - 1]);
    }
    
    if (!isNaN(withdrawalAmt) && withdrawalAmt > 0) {
      amount = withdrawalAmt;
      type = 'debit';
      if (!isNaN(balanceAmt)) balance = balanceAmt;
    } else if (!isNaN(depositAmt) && depositAmt > 0) {
      amount = depositAmt;
      type = 'credit';
      if (!isNaN(balanceAmt)) balance = balanceAmt;
    } else {
      return { parsed: false, transaction: {} as Transaction, nextIndex };
    }
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

function filterSummaryRows(transactions: Transaction[]): Transaction[] {
  const excludePatterns = [
    /total/i,
    /subtotal/i,
    /^balance/i,
    /previous balance/i,
    /closing balance/i,
    /page \d+/i,
  ];
  
  return transactions.filter(t => 
    !excludePatterns.some(pattern => pattern.test(t.description))
  );
}

function categorizeTransactions(transactions: Transaction[]): Record<string, Transaction[]> {
  const grouped: Record<string, Transaction[]> = {};
  
  transactions.forEach(t => {
    const category = t.category || 'misc';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(t);
  });
  return grouped;
}

function groupByMonth(transactions: Transaction[]): Record<string, Transaction[]> {
  const grouped: Record<string, Transaction[]> = {};
  
  transactions.forEach(t => {
    const [, monthStr] = t.date.split(/\s+/);
    const monthNum = getMonthNumber(monthStr);
    const key = `${new Date().getFullYear()}-${monthNum.toString().padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });
  
  return grouped;
}

function getMonthNumber(monthStr: string): number {
  const months = {
    JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
    JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
  };
  return months[monthStr.toUpperCase() as keyof typeof months] || 1;
}

function generateSummary(transactions: Transaction[]): Summary {
  const totalDebit = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalCredit = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return {
    totalTransactions: transactions.length,
    totalDeposits: parseFloat(totalCredit.toFixed(2)),
    totalWithdrawals: parseFloat(totalDebit.toFixed(2)),
    netAmount: parseFloat((totalCredit - totalDebit).toFixed(2)),
  };
}
