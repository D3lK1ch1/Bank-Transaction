import type { Transaction } from '../types';
import type { Summary } from '../types';

export function generateSummary(transactions: Transaction[]): Summary {
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
