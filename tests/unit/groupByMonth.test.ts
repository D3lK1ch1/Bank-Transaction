import { describe, it, expect } from 'vitest';
import { parseTransactions } from '@/lib/transactionParser';
import { groupByMonth } from '@/lib/parser';
import { monthlyGroupingTestData } from '../fixtures/sample-transactions';
import { Transaction } from '@/lib/transactionParser';

describe('Monthly Grouping', () => {
  describe('groupByMonth', () => {
    it('should group transactions by correct month', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan COLES SUPERMARKET         156.23      0.00   10000.00
         5 Jan PTV MYKI TOP UP            20.00      0.00    9980.00
        10 Jan CAFE LATTITUDE             28.50      0.00    9951.50
        15 Jan Transfer from Jane           0.00    500.00  10451.50
        20 Jan UBER TRIP                  35.50      0.00   10416.00
        25 Jan UNIVERSITY FEE            450.00      0.00    9966.00
      `;
      
      const result = parseTransactions(text);
      
      expect(result.monthlyGrouped).toBeDefined();
      expect(Object.keys(result.monthlyGrouped).length).toBe(1);
      const currentYear = new Date().getFullYear().toString();
      expect(result.monthlyGrouped[`${currentYear}-01`]).toBeDefined();
      expect(result.monthlyGrouped[`${currentYear}-01`].length).toBe(6);
    });

    it('should handle multiple months', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Transaction Jan 1            100.00    0.00    5000.00
        15 Jan Transaction Jan 2            200.00    0.00    4800.00
         5 Feb Transaction Feb 1            300.00    0.00    4500.00
        20 Feb Transaction Feb 2            400.00     0.00    4100.00
         3 Mar Transaction Mar 1            500.00     0.00    3600.00
      `;
      
      const result = parseTransactions(text);
      
      const currentYear = new Date().getFullYear().toString();
      expect(Object.keys(result.monthlyGrouped).length).toBe(3);
      expect(result.monthlyGrouped[`${currentYear}-01`].length).toBe(2);
      expect(result.monthlyGrouped[`${currentYear}-02`].length).toBe(2);
      expect(result.monthlyGrouped[`${currentYear}-03`].length).toBe(1);
    });

    it('should preserve chronological insertion order', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Nov Transaction Nov              200.00    0.00     750.00
         5 Dec Transaction Dec              100.00    0.00    1000.00
         1 Jan Transaction Jan               50.00    0.00     950.00
      `;

      const result = parseTransactions(text);
      const months = Object.keys(result.monthlyGrouped);

      const currentYear = new Date().getFullYear();
      expect(months).toEqual([`${currentYear}-11`, `${currentYear}-12`, `${currentYear + 1}-01`]);
    });

    it('should carry the year forward across a Dec→Jan rollover', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Nov Transaction Nov              200.00    0.00     750.00
         5 Dec Transaction Dec              100.00    0.00    1000.00
         1 Jan Transaction Jan               50.00    0.00     950.00
        15 Jan Transaction Jan 2            75.00    0.00     875.00
      `;

      const result = parseTransactions(text);
      const currentYear = new Date().getFullYear();

      expect(result.monthlyGrouped[`${currentYear}-11`].length).toBe(1);
      expect(result.monthlyGrouped[`${currentYear}-12`].length).toBe(1);
      expect(result.monthlyGrouped[`${currentYear}-01`]).toBeUndefined();
      expect(result.monthlyGrouped[`${currentYear + 1}-01`]).toBeDefined();
      expect(result.monthlyGrouped[`${currentYear + 1}-01`].length).toBe(2);
    });

    it('should trust an explicit year on the date over rollover guessing', () => {
      const transactions: Transaction[] = [
        { date: '5 Dec 2025', description: 'Transaction Dec', amount: 100, type: 'debit', category: 'misc' },
        { date: '1 Jan 2026', description: 'Transaction Jan', amount: 50, type: 'debit', category: 'misc' },
      ];

      const result = groupByMonth(transactions);

      expect(Object.keys(result)).toEqual(['2025-12', '2026-01']);
    });

    it('should not treat a normal month-to-month step backward as a year rollover (descending statement order)', () => {
      const transactions: Transaction[] = [
        { date: '20 Jul', description: 'Transaction Jul', amount: 100, type: 'debit', category: 'misc' },
        { date: '15 Jun', description: 'Transaction Jun', amount: 50, type: 'debit', category: 'misc' },
        { date: '10 May', description: 'Transaction May', amount: 25, type: 'debit', category: 'misc' },
        { date: '5 Apr', description: 'Transaction Apr', amount: 10, type: 'debit', category: 'misc' },
      ];

      const result = groupByMonth(transactions);
      const currentYear = new Date().getFullYear();

      expect(Object.keys(result)).toEqual([
        `${currentYear}-07`,
        `${currentYear}-06`,
        `${currentYear}-05`,
        `${currentYear}-04`,
      ]);
    });

    it('should carry the year backward across a Jan→Dec rollover in descending order', () => {
      const transactions: Transaction[] = [
        { date: '15 Jan', description: 'Transaction Jan', amount: 50, type: 'debit', category: 'misc' },
        { date: '20 Dec', description: 'Transaction Dec', amount: 100, type: 'debit', category: 'misc' },
        { date: '10 Nov', description: 'Transaction Nov', amount: 200, type: 'debit', category: 'misc' },
      ];

      const result = groupByMonth(transactions);
      const currentYear = new Date().getFullYear();

      expect(Object.keys(result)).toEqual([
        `${currentYear}-01`,
        `${currentYear - 1}-12`,
        `${currentYear - 1}-11`,
      ]);
    });

    it('should handle all months of the year', () => {
      const transactions: Transaction[] = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      months.forEach((month, index) => {
        transactions.push({
          date: `1 ${month}`,
          description: `Transaction ${month}`,
          amount: 100,
          type: 'debit',
          category: 'misc'
        });
      });
      
      const result = parseTransactions(`
        Date Transaction Detail             Withdrawal  Deposit  Balance
        ${transactions.map(t => ` 1 ${t.date.split(' ')[1]} ${t.description} ${t.amount} 0.00 1000`).join('\n')}
      `);
      
      expect(Object.keys(result.monthlyGrouped).length).toBe(12);
    });

    it('should preserve transaction data in grouped results', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         5 Jan COLES SUPERMARKET         156.23     0.00   10000.00
        10 Jan PTV MYKI TOP UP            20.00      0.00   9980.00
      `;
      
      const result = parseTransactions(text);
      const currentYear = new Date().getFullYear().toString();
      const janTransactions = result.monthlyGrouped[`${currentYear}-01`];
      
      expect(janTransactions).toBeDefined();
      
      janTransactions.forEach(t => {
        expect(t.date).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.amount).toBeGreaterThan(0);
        expect(['debit', 'credit']).toContain(t.type);
      });
    });

    it('should handle empty months', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Transaction Jan              100.00    0.00    1000.00
         1 Mar Transaction Mar              200.00    0.00     800.00
      `;
      
      const result = parseTransactions(text);
      
      const currentYear = new Date().getFullYear().toString();
      expect(result.monthlyGrouped[`${currentYear}-02`]).toBeUndefined();
    });
  });

  describe('Comprehensive Test Cases', () => {
    monthlyGroupingTestData.forEach(({ transactions, expectedMonths, expectedCounts }, index) => {
      it(`should handle test case ${index + 1}`, () => {
        const text = `
          Date Transaction Detail             Withdrawal  Deposit  Balance
          ${transactions.map(t => ` ${t.date} ${t.description} ${t.type === 'debit' ? `${t.amount} 0.00` : `0.00 ${t.amount}`} 1000`).join('\n')}
        `;
        
        const result = parseTransactions(text);
        
        expectedMonths.forEach(month => {
          expect(result.monthlyGrouped[month]).toBeDefined();
          expect(result.monthlyGrouped[month].length).toBe(expectedCounts[month]);
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle single transaction', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Single Transaction            100.00    0.00    1000.00
      `;
      
      const result = parseTransactions(text);
      
      const currentYear = new Date().getFullYear().toString();
      expect(Object.keys(result.monthlyGrouped).length).toBe(1);
      expect(result.monthlyGrouped[`${currentYear}-01`].length).toBe(1);
    });

    it('should handle many transactions in one month', () => {
      const lines = ['Date Transaction Detail             Withdrawal  Deposit  Balance', '-----------------------------------------------------------------'];
      for (let i = 1; i <= 50; i++) {
        lines.push(` ${i} Jan Transaction ${i}            100.00    0.00    ${10000 - i * 100}`);
      }
      
      const text = lines.join('\n');
      const result = parseTransactions(text);
      
      const currentYear = new Date().getFullYear().toString();
      expect(result.monthlyGrouped[`${currentYear}-01`].length).toBe(50);
    });
  });
});
