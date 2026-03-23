export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance?: number;
  category?: string;
}

export interface Summary {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netAmount: number;
}

export interface ParsedData {
  transactions: Transaction[];
  categorized: Record<string, Transaction[]>;
  monthlyGrouped: Record<string, Transaction[]>;
  summary: Summary;
}
