import { describe, it, expect } from 'vitest';
import { parseTransactions } from '@/lib/transactionParser';
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

    it('should sort months chronologically', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         5 Dec Transaction Dec              100.00    0.00    1000.00
         1 Jan Transaction Jan               50.00    0.00     950.00
         1 Nov Transaction Nov              200.00    0.00     750.00
      `;
      
      const result = parseTransactions(text);
      const months = Object.keys(result.monthlyGrouped);
      
      const currentYear = new Date().getFullYear().toString();
      expect(months).toEqual([`${currentYear}-12`, `${currentYear}-01`, `${currentYear}-11`]);
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
