import { describe, it, expect } from 'vitest';
import { parseTransactions } from '@/lib/transactionParser';
import { 
  sampleColumnFormatText, 
  sampleLineFormatText, 
  sampleMixedFormatText 
} from '../fixtures/sample-transactions';

describe('Transaction Parser', () => {
  describe('parseTransactions - Column Format (ANZ Official)', () => {
    it('should extract transactions from ANZ column format statement', () => {
      const result = parseTransactions(sampleColumnFormatText);
      
      expect(result.transactions.length).toBeGreaterThan(0);
      expect(result.transactions.length).toBeLessThan(15);
    });

    it('should correctly identify debit transactions', () => {
      const result = parseTransactions(sampleColumnFormatText);
      const debits = result.transactions.filter(t => t.type === 'debit');
      
      expect(debits.length).toBeGreaterThan(0);
      debits.forEach(t => {
        expect(t.amount).toBeGreaterThan(0);
      });
    });

    it('should correctly identify credit transactions', () => {
      const result = parseTransactions(sampleColumnFormatText);
      const credits = result.transactions.filter(t => t.type === 'credit');
      
      expect(credits.length).toBeGreaterThan(0);
      credits.forEach(t => {
        expect(t.amount).toBeGreaterThan(0);
      });
    });

    it('should parse dates correctly', () => {
      const result = parseTransactions(sampleColumnFormatText);
      
      result.transactions.forEach(t => {
        expect(t.date).toMatch(/^\d{1,2}\s+[A-Za-z]{3}$/);
      });
    });

    it('should include description for each transaction', () => {
      const result = parseTransactions(sampleColumnFormatText);
      
      result.transactions.forEach(t => {
        expect(t.description).toBeTruthy();
        expect(t.description.length).toBeGreaterThan(0);
      });
    });

    it('should calculate balance when available', () => {
      const result = parseTransactions(sampleColumnFormatText);
      
      const transactionsWithBalance = result.transactions.filter(t => t.balance !== undefined);
      expect(transactionsWithBalance.length).toBeGreaterThan(0);
    });
  });

  describe('parseTransactions - Line Format (Transaction Report)', () => {
    it('should extract transactions from line format statement', () => {
      const result = parseTransactions(sampleLineFormatText);
      
      expect(result.transactions.length).toBeGreaterThan(0);
      expect(result.transactions.length).toBeLessThan(15);
    });

    it('should detect debit transactions from description keywords', () => {
      const result = parseTransactions(sampleLineFormatText);
      const debits = result.transactions.filter(t => t.type === 'debit');
      
      expect(debits.length).toBeGreaterThan(0);
    });

    it('should detect credit transactions from description keywords', () => {
      const result = parseTransactions(sampleLineFormatText);
      const credits = result.transactions.filter(t => t.type === 'credit');
      
      expect(credits.length).toBeGreaterThan(0);
      const salaryTransaction = credits.find(t => t.description.toLowerCase().includes('salary'));
      expect(salaryTransaction).toBeDefined();
    });

    it('should extract amounts with $ symbol', () => {
      const result = parseTransactions(sampleLineFormatText);
      
      result.transactions.forEach(t => {
        expect(t.amount).toBeGreaterThan(0);
      });
    });
  });

  describe('parseTransactions - Mixed Format', () => {
    it('should handle mixed format bank statements', () => {
      const result = parseTransactions(sampleMixedFormatText);
      
      expect(result.transactions.length).toBeGreaterThan(0);
    });

    it('should categorize transactions', () => {
      const result = parseTransactions(sampleMixedFormatText);
      
      result.transactions.forEach(t => {
        expect(t.category).toBeTruthy();
        expect(typeof t.category).toBe('string');
      });
    });

    it('should calculate summary correctly', () => {
      const result = parseTransactions(sampleMixedFormatText);
      
      expect(result.summary).toBeDefined();
      expect(result.summary.totalTransactions).toBe(result.transactions.length);
      expect(result.summary.totalDeposits).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalWithdrawals).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Summary Calculations', () => {
    it('should calculate total deposits correctly', () => {
      const result = parseTransactions(sampleColumnFormatText);
      
      const calculatedDeposits = result.transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      expect(result.summary.totalDeposits).toBeCloseTo(calculatedDeposits, 2);
    });

    it('should calculate total withdrawals correctly', () => {
      const result = parseTransactions(sampleColumnFormatText);
      
      const calculatedWithdrawals = result.transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      expect(result.summary.totalWithdrawals).toBeCloseTo(calculatedWithdrawals, 2);
    });

    it('should calculate net amount correctly', () => {
      const result = parseTransactions(sampleColumnFormatText);
      
      const expectedNet = result.summary.totalDeposits - result.summary.totalWithdrawals;
      expect(result.summary.netAmount).toBeCloseTo(expectedNet, 2);
    });
  });

  describe('Filtering', () => {
    it('should exclude TOTAL rows from transactions', () => {
      const result = parseTransactions(sampleColumnFormatText);
      
      const hasTotalKeyword = result.transactions.some(
        t => t.description.toLowerCase().includes('total')
      );
      expect(hasTotalKeyword).toBe(false);
    });

    it('should exclude page headers', () => {
      const textWithPageHeaders = sampleColumnFormatText + '\nPage 2 of 5';
      const result = parseTransactions(textWithPageHeaders);
      
      const hasPageKeyword = result.transactions.some(
        t => /page \d+/i.test(t.description)
      );
      expect(hasPageKeyword).toBe(false);
    });
  });

  describe('Categorization', () => {
    it('should categorize PTV transactions as transport', () => {
      const result = parseTransactions(sampleColumnFormatText);
      
      const ptvTransactions = result.transactions.filter(
        t => t.description.toUpperCase().includes('PTV')
      );
      
      ptvTransactions.forEach(t => {
        expect(t.category).toBe('transport');
      });
    });

    it('should categorize COLES as groceries', () => {
      const result = parseTransactions(sampleColumnFormatText);
      
      const colesTransactions = result.transactions.filter(
        t => t.description.toUpperCase().includes('COLES')
      );
      
      colesTransactions.forEach(t => {
        expect(t.category).toBe('groceries');
      });
    });

    it('should categorize UNIVERSITY as education', () => {
      const result = parseTransactions(sampleColumnFormatText);
      
      const uniTransactions = result.transactions.filter(
        t => t.description.toUpperCase().includes('UNIVERSITY')
      );
      
      uniTransactions.forEach(t => {
        expect(t.category).toBe('education');
      });
    });
  });

  describe('Grouped Data', () => {
    it('should group transactions by category', () => {
      const result = parseTransactions(sampleColumnFormatText);
      
      expect(Object.keys(result.categorized).length).toBeGreaterThan(0);
      
      const totalCategorized = Object.values(result.categorized).reduce(
        (sum, txns) => sum + txns.length, 0
      );
      expect(totalCategorized).toBe(result.transactions.length);
    });

    it('should group transactions by month', () => {
      const result = parseTransactions(sampleColumnFormatText);
      
      expect(Object.keys(result.monthlyGrouped).length).toBeGreaterThan(0);
      
      Object.values(result.monthlyGrouped).forEach(monthTxns => {
        monthTxns.forEach(t => {
          expect(t.date).toMatch(/[A-Za-z]{3}/);
        });
      });
    });
  });
});
