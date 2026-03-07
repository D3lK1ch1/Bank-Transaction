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
  const sampleLines = lines.slice(startIndex, startIndex + 5);
  
  let format: FormatType = 'unknown';
  const hasBalance = /balance/i.test(headerLine);
  const hasWithdrawals = /withdrawal/i.test(headerLine);
  const hasDeposits = /deposit/i.test(headerLine);
  
  if (hasBalance && hasWithdrawals && hasDeposits) {
    format = 'column';
  } else if (hasWithdrawals && hasDeposits && !hasBalance) {
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
    // Column format: last 3 tokens = withdrawal, deposit, balance
    const amounts = parts.slice(-3);
    const withdrawalStr = amounts[0];
    const depositStr = amounts[1];
    const balanceStr = amounts[2];
    description = parts.slice(2, -3).join(' ');
    
    if (withdrawalStr && withdrawalStr !== 'blank' && !isNaN(parseFloat(withdrawalStr.replace(/,/g, '')))) {
      amount = parseFloat(withdrawalStr.replace(/,/g, ''));
      type = 'debit';
    } else if (depositStr && depositStr !== 'blank' && !isNaN(parseFloat(depositStr.replace(/,/g, '')))) {
      amount = parseFloat(depositStr.replace(/,/g, ''));
      type = 'credit';
    } else {
      return { parsed: false, transaction: {} as Transaction, nextIndex };
    }
    
    balance = balanceStr && balanceStr !== 'blank' ? parseFloat(balanceStr.replace(/,/g, '')) : undefined;
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

function getCategoryFromDescription(description: string): string {
  const lowerDesc = description.toLowerCase();
  const categories: Record<string, string[]> = {
      groceries: ['coles', 'woolworths', 'iga', 'supermarket'],
      transport: ['ptv', 'uber', 'didi', 'ola', 'taxi', 'public transport'],
      utilities: ['energy', 'water', 'gas', 'internet', 'telstra', 'optus', 'vodafone', 'electricity'],
      rent: ['rent', 'real estate'],
      education: ['university', 'tafe', 'school', 'education'],
      shopping: ['kmart', 'target', 'big w', 'shopping', 'myer', 'david jones'],
      food: ['restaurant', 'cafe', 'mcdonalds', 'hungry jacks', 'kfc', 'snack bar', 'food', 'pizza', 'burger', 'sushi', 'noodle', 'bakery', 'coffee', 'tea', 'drink', 'ice cream', 'dessert', 'lunch', 'dinner', 'breakfast'],
      entertainment: ['entertainment', 'cinema', 'eventbrite', 'ticketmaster', 'netflix', 'spotify'],
      healthcare: ['health', 'pharmacy', 'chemist', 'doctor', 'hospital'],
      friends: ['friends', 'mobile banking payment', 'transfer to', 'transfer from', 'pay anyone', 'osko', 'pay id'],
  };

  for (const category in categories) {
      if (categories[category].some(keyword => lowerDesc.includes(keyword))) {
          return category;
      }
  }

  return 'misc';
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