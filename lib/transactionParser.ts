export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance?: number;
  category?: string;
}

interface ParsedData {
  transactions: Transaction[];
  categorized: Record<string, Transaction[]>;
  monthlyGrouped: Record<string, Transaction[]>;
  summary: Record<string, any>;
}

export function parseTransactions(rawText: string): ParsedData {
  const lines = rawText.split('\n').map(line => line.trim()).filter(l => l);
  console.log('First 30 lines after slicing:', lines.slice(0, 30));
  const transactions: Transaction[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const transaction = extractTransaction(lines, i);
    if (transaction.parsed) {
      transactions.push(transaction.transaction);
      i = transaction.nextIndex;
    } else {
      i++;
    }
  }
  
  // Filter out page totals and summaries
  const filtered = filterSummaryRows(transactions);
  
  return {
    transactions: filtered,
    categorized: categorizeTransactions(filtered),
    monthlyGrouped: groupByMonth(filtered),
    summary: generateSummary(filtered),
  };
}

function extractTransaction(
  lines: string[],
  startIndex: number
): { parsed: boolean; transaction: Transaction; nextIndex: number } {
  const transactionRegex = /^(\d{1,2}\s+[A-Z]{3})/i;

  
  if (!transactionRegex.test(lines[startIndex])) {
    return { parsed: false, transaction: {} as Transaction, nextIndex: startIndex + 1 };
  }
  
  let fullLine = lines[startIndex];
  let nextIndex = startIndex + 1;
  
  // Collect continuation lines (lines without dates)
  while (nextIndex < lines.length && !transactionRegex.test(lines[nextIndex])) {
    fullLine += ' ' + lines[nextIndex];
    nextIndex++;
  }
  
  const parts = fullLine.split(/\s+/);
  if (parts.length < 3) {
    return { parsed: false, transaction: {} as Transaction, nextIndex };
  }
  
  const date = parts[0] + ' ' + parts[1];
  const amounts = parts.slice(-3);
  const withdrawalStr = amounts[0];
  const depositStr = amounts[1];
  const balanceStr = amounts[2];
  const description = parts.slice(2, -3).join(' ');
  
  let amount = 0;
  let type: 'debit' | 'credit';
  if (withdrawalStr && withdrawalStr !== 'blank' && !isNaN(parseFloat(withdrawalStr.replace(/,/g, '')))) {
    amount = parseFloat(withdrawalStr.replace(/,/g, ''));
    type = 'debit';
  } else if (depositStr && depositStr !== 'blank' && !isNaN(parseFloat(depositStr.replace(/,/g, '')))) {
    amount = parseFloat(depositStr.replace(/,/g, ''));
    type = 'credit';
  } else {
    // Skip if no amount
    return { parsed: false, transaction: {} as Transaction, nextIndex };
  }
  
  const balance = balanceStr && balanceStr !== 'blank' ? parseFloat(balanceStr.replace(/,/g, '')) : undefined;
  
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
  return {
    deposits: transactions.filter(t => t.type === 'credit'),
    withdrawals: transactions.filter(t => t.type === 'debit'),
  };
}

function groupByMonth(transactions: Transaction[]): Record<string, Transaction[]> {
  const grouped: Record<string, Transaction[]> = {};
  
  transactions.forEach(t => {
    const [, monthStr] = t.date.split(/\s+/);
    const monthNum = getMonthNumber(monthStr);
    const key = `2025-${monthNum.toString().padStart(2, '0')}`;
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

function generateSummary(transactions: Transaction[]): Record<string, any> {
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

function isDebit(description: string): boolean {
  const debitPatterns = /withdrawal|purchase|payment|debit|charge/i;
  return debitPatterns.test(description);
}

