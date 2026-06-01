import type { Transaction } from '../types';
import { getMonthNumber } from './utils';

export function categorizeTransactions(transactions: Transaction[]): Record<string, Transaction[]> {
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

export function groupByMonth(transactions: Transaction[]): Record<string, Transaction[]> {
  const grouped: Record<string, Transaction[]> = {};
  
  transactions.forEach(t => {
    const parts = t.date.split(/\s+/);
    const monthStr = parts[1];
    const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
    const monthNum = getMonthNumber(monthStr);
    const key = `${year}-${monthNum.toString().padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });
  
  return grouped;
}
