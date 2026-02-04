// Transaction types and interfaces
export interface Transaction {
  description: string;
  withdrawal: number;
  deposit: number;
  amount: number; // negative for withdrawal, positive for deposit
  date?: string;
  category?: string;
}

export interface ParsedTransactions {
  transactions: Transaction[];
  monthlyGrouped: Record<string, Transaction[]>;
  categorized: Record<string, Transaction[]>;
  summary: {
    totalDeposits: number;
    totalWithdrawals: number;
    netAmount: number;
  };
}

// Category keywords mapping
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  groceries: [
    "supermarket",
    "grocery",
    "tesco",
    "coles",
    "woolworths",
    "aldi",
    "fresh",
    "markets",
    "food store",
  ],
  transport: [
    "uber",
    "lyft",
    "taxi",
    "bus",
    "train",
    "railway",
    "ptv",
    "metro",
    "parking",
    "gas station",
    "fuel",
    "petrol",
    "diesel",
  ],
  utilities: [
    "electricity",
    "water",
    "gas",
    "internet",
    "phone",
    "mobile",
    "telecom",
    "utility",
  ],
  rent: ["rent", "landlord", "property", "housing"],
  education: [
    "tuition",
    "school",
    "university",
    "college",
    "course",
    "training",
    "books",
    "education",
  ],
  shopping: [
    "mall",
    "store",
    "amazon",
    "ebay",
    "shopping",
    "boutique",
    "fashion",
    "retail",
    "target",
    "walmart",
  ],
  food: [
    "restaurant",
    "cafe",
    "coffee",
    "pizza",
    "burger",
    "diner",
    "bistro",
    "bar",
    "pub",
    "fast food",
    "delivery",
  ],
  entertainment: [
    "cinema",
    "movie",
    "theater",
    "concert",
    "music",
    "gaming",
    "netflix",
    "spotify",
    "game",
  ],
  healthcare: [
    "pharmacy",
    "hospital",
    "doctor",
    "clinic",
    "medical",
    "dental",
    "health",
  ],
};

/**
 * Categorize a transaction based on its description
 */
export function categorizeTransaction(description: string): string {
  const lowerDesc = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lowerDesc.includes(keyword))) {
      return category;
    }
  }

  return "misc";
}

/**
 * Extract date from a transaction line
 * Supports various date formats: DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY, etc.
 * If date mentioned is DD-MMM (e.g., 04-JUL)
 */
export function extractDate(line: string): string | undefined {
  // Match various date formats
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /(\d{1,2})\s([A-Za-z]{3})/, 
  ];

  for (const pattern of datePatterns) {
    const match = line.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return undefined;
}

/**
 * Convert month name to number
 */
function monthNameToNumber(monthName: string): string {
  const months: Record<string, string> = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
    JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12"
  };
  return months[monthName.toUpperCase()] || "01";
}

/**
 * Extract month-year key for grouping (e.g., "2024-01")
 */
export function extractMonthKey(dateStr: string | undefined): string {
  if (!dateStr) return "unknown";

  // Handle ANZ format: DD MMM YYYY (e.g., "08 JUL 2024")
  const anzMatch = dateStr.match(/(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/i);
  if (anzMatch) {
    const [, , month, year] = anzMatch;
    const monthNum = monthNameToNumber(month);
    return `${year}-${monthNum}`;
  }

  // Handle other formats
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // DD/MM/YYYY
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD
  ];

  for (const pattern of datePatterns) {
    const match = dateStr.match(pattern);
    if (match) {
      const [, part1, part2, part3] = match;

      // Determine format
      if (parseInt(part3) > 1900) {
        // YYYY is at the end (DD/MM/YYYY)
        const month = part2.padStart(2, "0");
        const year = part3;
        return `${year}-${month}`;
      } else {
        // YYYY is at the start (YYYY/MM/DD)
        const month = part2.padStart(2, "0");
        const year = part1;
        return `${year}-${month}`;
      }
    }
  }

  return "unknown";
}

/**
 * Check if a line is metadata/header/summary that should be skipped
 */
function isMetadataLine(line: string): boolean {
  const lower = line.toLowerCase();
  
  // Skip lines containing these keywords
  const skipPatterns = [
    /^TOTALS AT END OF PAGE/i,
    /^\s*TOTALS\s*\$/,
    /^OPENING BALANCE/i,
    /^CLOSING BALANCE/i,
    /^Total\s+(Deposits|Withdrawals)/i,
    /^---+/,
    /Page.*of|Break/i,
    /^Account (Number|Details|Name)/i,
    /^Branch Number/i,
    /^Statement (Number|Period)/i,
    /^STATEMENT NUMBER/i,
    /^Need to Get In Touch/i,
    /^ANZ (Internet|ACCESS)/i,
    /^Welcome|AT A GLANCE/i,
    /^EFFECTIVE DATE/i,
    /^Enquiries|Lost\/Stolen/i,
    /^Australia and New Zealand/i,
    /^Transaction Details/i,
    /^Please retain/i,
    /^Date\s+Transaction Details/i,
    /Withdrawals.*Deposits/i,
    /^blank\s*$/i,
  ];
  
  return skipPatterns.some(pattern => pattern.test(line));
}

/**
 * Check if a line appears to be a valid transaction line
 * Valid transaction lines start with a date and contain transaction keywords
 */
function isTransactionLine(line: string): boolean {
  // Must start with a date (DD MMM or similar)
  if (!line.match(/^\s*\d{1,2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i)) {
    return false;
  }
  
  // Must contain transaction type indicators or valid currency amount
  const hasTransactionType = /VISA|EFTPOS|TRANSFER|BANKING|DEBIT|PAYMENT|PURCHASE/i.test(line);
  const hasCurrency = /\$|AUD|[0-9]+\.[0-9]{2}/i.test(line);
  
  return hasTransactionType || hasCurrency;
}

/**
 * Extract withdrawal and deposit from a line with proper column detection
 * Looks for amounts separated by spaces or "blank" placeholders
 */
function extractAmounts(line: string): { withdrawal: number; deposit: number } {
  // Pattern to find monetary amounts (e.g., 123.45 or 1,234.56)
  const moneyPattern = /\d+(?:[,\.]\d{2,3})*[.,]\d{2}|\d+\.\d{2}/g;
  const amounts = line.match(moneyPattern) || [];
  
  // Remove items that are definitely not amounts (like account numbers)
  const validAmounts = amounts.filter(amt => {
    const num = parseFloat(amt.replace(/,/g, ""));
    // Valid transaction amounts are typically < 100,000
    return num < 100000;
  });

  let withdrawal = 0;
  let deposit = 0;

  if (validAmounts.length >= 2) {
    // Try to identify which is withdrawal and which is deposit
    // ANZ format: withdrawal column comes before deposit column
    const first = parseFloat(validAmounts[0].replace(/,/g, ""));
    const second = parseFloat(validAmounts[1].replace(/,/g, ""));
    
    // Check for "blank" keyword to determine which column is empty
    const hasBlankBefore = /blank\s+\d/.test(line);
    const hasBlankAfter = /\d\s+blank/.test(line);
    
    if (hasBlankBefore) {
      // blank in withdrawal, amount in deposit
      withdrawal = 0;
      deposit = second;
    } else if (hasBlankAfter) {
      // amount in withdrawal, blank in deposit
      withdrawal = first;
      deposit = 0;
    } else {
      // Both have amounts - first is withdrawal, second is deposit
      withdrawal = first;
      deposit = second;
    }
  } else if (validAmounts.length === 1) {
    const amount = parseFloat(validAmounts[0].replace(/,/g, ""));
    // If "blank" appears before the amount, it's a deposit
    // If "blank" appears after, it's a withdrawal
    if (line.includes("blank")) {
      const beforeBlank = line.substring(0, line.indexOf("blank"));
      const amountStr = validAmounts[0];
      if (beforeBlank.includes(amountStr)) {
        withdrawal = amount;
      } else {
        deposit = amount;
      }
    } else {
      // Default: assume it's a withdrawal
      withdrawal = amount;
    }
  }

  return { 
    withdrawal: parseFloat(withdrawal.toFixed(2)),
    deposit: parseFloat(deposit.toFixed(2))
  };
}

/**
 * Parse a multi-line transaction block from ANZ statement
 * Transactions span multiple lines with date on first line
 */
function parseMultilineTransaction(lines: string[]): Transaction | null {
  if (lines.length === 0) return null;

  const firstLine = lines[0].trim();
  
  // Extract date from first line
  const dateMatch = firstLine.match(/^(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})/i);
  if (!dateMatch) return null;
  
  const date = `${dateMatch[1]} ${dateMatch[2].toUpperCase()} ${dateMatch[3]}`;
  
  // Extract transaction type and begin building description
  let description = firstLine.replace(dateMatch[0], "").trim();
  
  // Collect description from all lines (skip EFFECTIVE DATE lines)
  let withdrawal = 0;
  let deposit = 0;
  
  for (let idx = 1; idx < lines.length; idx++) {
    const line = lines[idx].trim();
    
    if (!line) continue;
    
    // Skip EFFECTIVE DATE lines
    if (line.match(/^EFFECTIVE DATE/i)) continue;
    
    // Check if this line contains amounts
    const moneyPattern = /\d+(?:[,\.]\d{2,3})*[.,]\d{2}|\d+\.\d{2}/g;
    const amounts = line.match(moneyPattern) || [];
    
    // If we found amounts on this line, parse them
    if (amounts.length > 0) {
      const validAmounts = amounts.filter(amt => {
        const num = parseFloat(amt.replace(/,/g, ""));
        return num < 100000; // Filter out unreasonable amounts
      });
      
      if (validAmounts.length >= 1) {
        // Determine which column is which based on "blank" indicators
        if (line.includes("blank")) {
          // Has explicit "blank" - determine which column
          if (/blank\s+\d/.test(line)) {
            // blank comes before amount -> amount is deposit
            deposit = parseFloat(validAmounts[validAmounts.length - 1].replace(/,/g, ""));
          } else if (/\d\s+blank/.test(line)) {
            // amount comes before blank -> amount is withdrawal
            withdrawal = parseFloat(validAmounts[0].replace(/,/g, ""));
          } else {
            // "blank" somewhere else, assume first amount is withdrawal
            withdrawal = parseFloat(validAmounts[0].replace(/,/g, ""));
          }
        } else if (validAmounts.length >= 2) {
          // No blank indicator, use both amounts
          const firstAmt = parseFloat(validAmounts[0].replace(/,/g, ""));
          const secondAmt = parseFloat(validAmounts[1].replace(/,/g, ""));
          withdrawal = firstAmt;
          deposit = secondAmt;
        } else {
          // Single amount with no blank - check context
          const amount = parseFloat(validAmounts[0].replace(/,/g, ""));
          if (/TRANSFER|TFER|DEPOSIT/i.test(description + lines.slice(1, idx).join(" "))) {
            deposit = amount;
          } else {
            withdrawal = amount;
          }
        }
      }
    } else {
      // No amounts on this line, add to description
      if (!description) {
        description = line;
      } else {
        description += " " + line;
      }
    }
  }
  
  // Clean up description
  description = description
    .replace(/EFFECTIVE DATE.*/i, "")
    .replace(/blank/gi, "")
    .replace(/\$?\d+(?:[,\.]\d{2,3})*[.,]\d{2}|\d+\.\d{2}/g, "")
    .trim()
    .replace(/\s+/g, " ");
  
  // Must have meaningful description and at least one amount
  if (!description || description.length < 2 || (withdrawal === 0 && deposit === 0)) {
    return null;
  }
  
  const amount = deposit - withdrawal;
  const category = categorizeTransaction(description);
  
  return {
    description,
    withdrawal: parseFloat(withdrawal.toFixed(2)),
    deposit: parseFloat(deposit.toFixed(2)),
    amount,
    date,
    category,
  };
}

/**
 * Parse transaction line to extract description, withdrawal, and deposit
 * Handles ANZ bank statement format specifically
 */
export function parseTransactionLine(line: string): Transaction | null {
  if (!line.trim()) return null;

  // Skip metadata and non-transaction lines
  if (isMetadataLine(line)) return null;
  if (!isTransactionLine(line)) return null;

  const trimmed = line.trim();

  // Extract date
  const date = extractDate(trimmed);
  if (!date) return null;

  // Extract amounts
  const { withdrawal, deposit } = extractAmounts(trimmed);

  // Only keep lines that have at least one amount
  if (withdrawal === 0 && deposit === 0) return null;

  // Extract description (everything between date and amounts)
  // Remove date from start
  let description = trimmed.replace(/^\s*\d{1,2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{4}/, "");
  
  // Remove "EFFECTIVE DATE" lines and dates
  description = description.replace(/EFFECTIVE DATE.*/, "");
  
  // Remove amounts and "blank" from description
  description = description
    .replace(/\$?\d+(?:[,\.]\d{2,3})*[.,]\d{2}|\d+\.\d{2}/g, "")
    .replace(/blank/gi, "")
    .trim()
    .replace(/\s+/g, " ");

  // Must have a meaningful description
  if (!description || description.length < 2) return null;

  const amount = deposit - withdrawal;
  const category = categorizeTransaction(description);

  return {
    description,
    withdrawal,
    deposit,
    amount,
    date,
    category,
  };
}

/**
 * Parse extracted PDF text into structured transactions
 * Handles ANZ statements where transactions span multiple lines
 */
export function parseTransactions(text: string): ParsedTransactions {
  const lines = text.split("\n");
  const transactions: Transaction[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line starts a transaction (date at beginning)
    if (line.match(/^\s*\d{1,2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i)) {
      // Collect all related lines for this transaction
      const transactionLines: string[] = [line];
      let j = i + 1;
      
      // Collect next lines until we hit another transaction date or end of text
      while (j < lines.length) {
        const nextLine = lines[j];
        
        // Stop if we hit another transaction date (at start of line)
        if (nextLine.match(/^\s*\d{1,2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i)) {
          break;
        }
        
        // Stop if we hit metadata lines
        if (isMetadataLine(nextLine)) {
          break;
        }
        
        // Include this line
        transactionLines.push(nextLine);
        j++;
        
        // Stop after collecting enough lines (most transactions are 2-4 lines)
        if (transactionLines.length > 5) break;
      }
      
      // Parse the collected transaction lines
      const transaction = parseMultilineTransaction(transactionLines);
      if (transaction) {
        transactions.push(transaction);
      }
      
      i = j;
    } else {
      i++;
    }
  }

  // Group by month
  const monthlyGrouped: Record<string, Transaction[]> = {};
  for (const transaction of transactions) {
    const monthKey = extractMonthKey(transaction.date);
    if (!monthlyGrouped[monthKey]) {
      monthlyGrouped[monthKey] = [];
    }
    monthlyGrouped[monthKey].push(transaction);
  }

  // Group by category
  const categorized: Record<string, Transaction[]> = {};
  for (const transaction of transactions) {
    const category = transaction.category || "misc";
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(transaction);
  }

  // Calculate summary
  const totalDeposits = transactions.reduce((sum, t) => sum + t.deposit, 0);
  const totalWithdrawals = transactions.reduce((sum, t) => sum + t.withdrawal, 0);
  const netAmount = totalDeposits - totalWithdrawals;

  return {
    transactions,
    monthlyGrouped,
    categorized,
    summary: {
      totalDeposits: parseFloat(totalDeposits.toFixed(2)),
      totalWithdrawals: parseFloat(totalWithdrawals.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
    },
  };
}
