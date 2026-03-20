import { describe, it, expect } from 'vitest';
import { parseTransactions } from '@/lib/transactionParser';
import { summaryTestData } from '../fixtures/sample-transactions';

describe('Summary Calculations', () => {
  describe('generateSummary', () => {
    it('should calculate total transactions correctly', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Transaction 1                100.00        1000.00
         2 Jan Transaction 2                200.00         800.00
         3 Jan Transaction 3                300.00         500.00
      `;
      
      const result = parseTransactions(text);
      
      expect(result.summary.totalTransactions).toBe(3);
    });

    it('should calculate total deposits correctly', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Deposit 1                                  1000.00  1000.00
         2 Jan Deposit 2                                  2000.00  3000.00
         3 Jan Deposit 3                                  500.00   3500.00
      `;
      
      const result = parseTransactions(text);
      
      expect(result.summary.totalDeposits).toBe(3500.00);
    });

    it('should calculate total withdrawals correctly', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Purchase 1                100.00          5000.00
         2 Jan Purchase 2                250.00          4750.00
         3 Jan Purchase 3                 50.00          4700.00
      `;
      
      const result = parseTransactions(text);
      
      expect(result.summary.totalWithdrawals).toBe(400.00);
    });

    it('should calculate net amount correctly', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Salary                                   3500.00  3500.00
         2 Jan Rent Payment             1200.00         2300.00
         3 Jan Groceries              156.23           2143.77
         4 Jan Transfer In                         500.00   2643.77
      `;
      
      const result = parseTransactions(text);
      
      const expectedNet = 4000.00 - 1356.23;
      expect(result.summary.netAmount).toBeCloseTo(expectedNet, 2);
    });

    it('should handle mixed debit and credit transactions', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Salary                                   3500.00  3500.00
         2 Jan Rent Payment             1200.00         2300.00
         3 Jan Groceries              156.23           2143.77
         4 Jan Transport                50.00          2093.77
         5 Jan Freelance                             800.00   2893.77
         6 Jan Entertainment           120.00          2773.77
      `;
      
      const result = parseTransactions(text);
      
      expect(result.summary.totalTransactions).toBe(6);
      expect(result.summary.totalDeposits).toBe(4300.00);
      expect(result.summary.totalWithdrawals).toBe(1526.23);
      expect(result.summary.netAmount).toBeCloseTo(2773.77, 2);
    });
  });

  describe('Comprehensive Test Cases', () => {
    summaryTestData.forEach(({ transactions, expected }, index) => {
      it(`should pass test case ${index + 1}`, () => {
        const text = `
          Date Transaction Detail             Withdrawal  Deposit  Balance
          ${transactions.map(t => ` 1 Jan ${t.description} ${t.type === 'debit' ? t.amount : ''} ${t.type === 'credit' ? t.amount : ''} 10000`).join('\n')}
        `;
        
        const result = parseTransactions(text);
        
        expect(result.summary.totalDeposits).toBe(expected.totalDeposits);
        expect(result.summary.totalWithdrawals).toBe(expected.totalWithdrawals);
        expect(result.summary.netAmount).toBe(expected.netAmount);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero transactions', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
      `;
      
      const result = parseTransactions(text);
      
      expect(result.summary.totalTransactions).toBe(0);
      expect(result.summary.totalDeposits).toBe(0);
      expect(result.summary.totalWithdrawals).toBe(0);
      expect(result.summary.netAmount).toBe(0);
    });

    it('should handle only deposits', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Deposit 1                                  1000.00  1000.00
         2 Jan Deposit 2                                  2000.00  3000.00
      `;
      
      const result = parseTransactions(text);
      
      expect(result.summary.totalDeposits).toBe(3000.00);
      expect(result.summary.totalWithdrawals).toBe(0);
      expect(result.summary.netAmount).toBe(3000.00);
    });

    it('should handle only withdrawals', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Purchase 1                100.00          1000.00
         2 Jan Purchase 2                200.00           800.00
      `;
      
      const result = parseTransactions(text);
      
      expect(result.summary.totalDeposits).toBe(0);
      expect(result.summary.totalWithdrawals).toBe(300.00);
      expect(result.summary.netAmount).toBe(-300.00);
    });

    it('should handle decimal amounts', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Deposit 1                                  1234.56  1234.56
         2 Jan Purchase 1                 99.99          1134.57
         3 Jan Purchase 2                  0.01          1134.56
      `;
      
      const result = parseTransactions(text);
      
      expect(result.summary.totalDeposits).toBeCloseTo(1234.56, 2);
      expect(result.summary.totalWithdrawals).toBeCloseTo(100.00, 2);
    });

    it('should handle large amounts', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Big Deposit                             1000000.00  1000000.00
         2 Jan Big Purchase            500000.00         500000.00
      `;
      
      const result = parseTransactions(text);
      
      expect(result.summary.totalDeposits).toBe(1000000.00);
      expect(result.summary.totalWithdrawals).toBe(500000.00);
      expect(result.summary.netAmount).toBe(500000.00);
    });
  });

  describe('Summary Data Structure', () => {
    it('should return all required summary fields', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Transaction                 100.00        1000.00
      `;
      
      const result = parseTransactions(text);
      
      expect(result.summary).toHaveProperty('totalTransactions');
      expect(result.summary).toHaveProperty('totalDeposits');
      expect(result.summary).toHaveProperty('totalWithdrawals');
      expect(result.summary).toHaveProperty('netAmount');
    });

    it('should return numeric values for all fields', () => {
      const text = `
        Date Transaction Detail             Withdrawal  Deposit  Balance
        -----------------------------------------------------------------
         1 Jan Transaction                 100.00        1000.00
      `;
      
      const result = parseTransactions(text);
      
      expect(typeof result.summary.totalTransactions).toBe('number');
      expect(typeof result.summary.totalDeposits).toBe('number');
      expect(typeof result.summary.totalWithdrawals).toBe('number');
      expect(typeof result.summary.netAmount).toBe('number');
    });
  });
});
