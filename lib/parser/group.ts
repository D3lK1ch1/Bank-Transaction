import type { Transaction } from '../types';
import { getMonthNumber } from './utils';
import { extractMerchant } from '../categories';

export interface DayTransaction extends Transaction {
  merchant: string;
}

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
  let year = new Date().getFullYear();
  let prevMonthNum: number | null = null;

  transactions.forEach(t => {
    const parts = t.date.split(/\s+/);
    const monthStr = parts[1];
    const monthNum = getMonthNumber(monthStr);

    if (parts[2] && /^\d{4}$/.test(parts[2])) {
      year = parseInt(parts[2], 10);
    } else if (prevMonthNum === 12 && monthNum === 1) {
      year++; // ascending order wrapped forward into a new year
    } else if (prevMonthNum === 1 && monthNum === 12) {
      year--; // descending order wrapped backward into the previous year
    }
    prevMonthNum = monthNum;

    const key = `${year}-${monthNum.toString().padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  return grouped;
}

export function groupByDay(transactions: Transaction[]): Record<number, DayTransaction[]> {
  const grouped: Record<number, DayTransaction[]> = {};

  transactions.forEach(t => {
    const day = parseInt(t.date.split(/\s+/)[0], 10);
    const merchant = extractMerchant(t.description);

    if (!grouped[day]) grouped[day] = [];
    grouped[day].push({ ...t, merchant });
  });

  return grouped;
}
