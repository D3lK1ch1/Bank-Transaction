import { describe, it, expect } from 'vitest';
import { groupByDay } from '@/lib/parser';
import { Transaction } from '@/lib/transactionParser';

describe('groupByDay', () => {
  it('should bucket transactions by day of month', () => {
    const transactions: Transaction[] = [
      { date: '1 Jan', description: 'EFTPOS COLES SUPERMARKET', amount: 50, type: 'debit', category: 'groceries' },
      { date: '15 Jan', description: 'EFTPOS KMART', amount: 20, type: 'debit', category: 'shopping' },
    ];

    const result = groupByDay(transactions);

    expect(Object.keys(result).map(Number)).toEqual([1, 15]);
    expect(result[1]).toHaveLength(1);
    expect(result[15]).toHaveLength(1);
  });

  it('should stack multiple transactions on the same day', () => {
    const transactions: Transaction[] = [
      { date: '5 Jan', description: 'EFTPOS COLES SUPERMARKET', amount: 50, type: 'debit', category: 'groceries' },
      { date: '5 Jan', description: 'EFTPOS KMART', amount: 20, type: 'debit', category: 'shopping' },
    ];

    const result = groupByDay(transactions);

    expect(result[5]).toHaveLength(2);
    expect(result[5][0].description).toBe('EFTPOS COLES SUPERMARKET');
    expect(result[5][1].description).toBe('EFTPOS KMART');
  });

  it('should attach a merchant name derived from the description', () => {
    const transactions: Transaction[] = [
      { date: '1 Jan', description: 'EFTPOS COLES SUPERMARKET', amount: 50, type: 'debit', category: 'groceries' },
    ];

    const result = groupByDay(transactions);

    expect(result[1][0].merchant).toBe('COLES SUPERMARKET');
  });

  it('should preserve all original transaction fields alongside merchant', () => {
    const transactions: Transaction[] = [
      { date: '1 Jan', description: 'EFTPOS COLES SUPERMARKET', amount: 50, type: 'debit', category: 'groceries', balance: 900 },
    ];

    const result = groupByDay(transactions);
    const entry = result[1][0];

    expect(entry.date).toBe('1 Jan');
    expect(entry.description).toBe('EFTPOS COLES SUPERMARKET');
    expect(entry.amount).toBe(50);
    expect(entry.type).toBe('debit');
    expect(entry.category).toBe('groceries');
    expect(entry.balance).toBe(900);
  });
});
