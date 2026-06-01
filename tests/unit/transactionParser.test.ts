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

    it('should ignore ANZ row years and transfer reference numbers when parsing amounts', () => {
      const text = `
ANZ Bank Statement

Date Transaction Details             Withdrawal  Deposit  Balance
-----------------------------------------------------------------------
08 JUL 2024 VISA DEBIT PURCHASE CARD 2606 MACS SNACK BAR MULGRAVE EFFECTIVE DATE 04 JUL $20.24 0.00 $1,024.00
09 JUL 2024 ANZ M-BANKING FUNDS TFER TRANSFER 311463 FROM 432919512 43.29 0.00 980.71
10 JUL 2024 Salary Deposit 0.00 +$500.00 1480.71
`;
      const result = parseTransactions(text);

      expect(result.transactions).toHaveLength(3);
      expect(result.transactions[0].date).toBe('08 JUL');
      expect(result.transactions[0].amount).toBeCloseTo(20.24, 2);
      expect(result.transactions[0].description).toContain('EFFECTIVE DATE 04 JUL');
      expect(result.transactions[1].amount).toBeCloseTo(43.29, 2);
      expect(result.transactions[1].amount).not.toBeCloseTo(2024, 2);
      expect(result.transactions[1].amount).not.toBeCloseTo(432919512, 2);
      expect(result.transactions[2].type).toBe('credit');
      expect(result.transactions[2].amount).toBeCloseTo(500.00, 2);
    });

    it('should parse official ANZ table-style rows with category lines and placeholders', () => {
      const text = `
Date
Description
Category
Withdrawal
Deposit
Amount
08 JUL
VISA DEBIT PURCHASE CARD 2606 MACS SNACK BAR MULGRAVE EFFECTIVE DATE 04 JUL
food
-$20.24
-
$-20.24
09 JUL
ANZ M-BANKING FUNDS TFER TRANSFER 311463 FROM 432919512
friends
-$43.29
-
$-43.29
10 JUL
ANZ M-BANKING FUNDS TFER TRANSFER 180049 FROM 432919512
friends
-
+$2000.00
+$2000.00
`;
      const result = parseTransactions(text);

      expect(result.transactions).toHaveLength(3);
      expect(result.transactions[0].description).toContain('EFFECTIVE DATE 04 JUL');
      expect(result.transactions[0].amount).toBeCloseTo(20.24, 2);
      expect(result.transactions[0].amount).not.toBeCloseTo(2024, 2);
      expect(result.transactions[1].amount).toBeCloseTo(43.29, 2);
      expect(result.transactions[1].amount).not.toBeCloseTo(432919512, 2);
      expect(result.transactions[2].type).toBe('credit');
      expect(result.transactions[2].amount).toBeCloseTo(2000.00, 2);
    });

    it('should reject official ANZ rows when displayed amounts are leaked description numbers', () => {
      const text = `
Date
Description
Category
Withdrawal
Deposit
Amount
08 JUL
VISA DEBIT PURCHASE CARD 2606 MACS SNACK BAR MULGRAVE EFFECTIVE DATE 04 JUL
food
-$2024.00
-
$-2024.00
09 JUL
ANZ M-BANKING FUNDS TFER TRANSFER 311463 FROM 432919512
friends
-$432919512.00
-
$-432919512.00
`;
      const result = parseTransactions(text);

      expect(result.transactions).toHaveLength(0);
    });

    it('should normalize merged ANZ date and transaction prefixes before parsing', () => {
      const text = `
ANZ Bank Statement

Date Transaction Details             Withdrawal  Deposit  Balance
-----------------------------------------------------------------------
05 MARANZ MOBILE BANKING PAYMENT 181846 TO GREAT JOURNEY MIGRATION -$23.32 0.00 1976.68
05 MARANZ M-BANKING FUNDS TFER TRANSFER 180049 FROM 432919512 0.00 +$2,000.00 3976.68
04 MARVISA DEBIT PURCHASE CARD 1127 PUBLIC TRANSPORT VICTORIA DOCKLANDS $10.00 0.00 3966.68
02 MARPAYMENT TO OURPROPERTY COM RNT THHGRP 02MAR 701.00 0.00 3265.68
`;
      const result = parseTransactions(text);

      expect(result.transactions).toHaveLength(4);
      expect(result.transactions[0].date).toBe('05 MAR');
      expect(result.transactions[0].description).toContain('ANZ MOBILE BANKING PAYMENT');
      expect(result.transactions[0].type).toBe('debit');
      expect(result.transactions[0].amount).toBeCloseTo(23.32, 2);
      expect(result.transactions[1].type).toBe('credit');
      expect(result.transactions[1].amount).toBeCloseTo(2000.00, 2);
      expect(result.transactions[1].amount).not.toBeCloseTo(432919512, 2);
      expect(result.transactions[2].description).toContain('VISA DEBIT PURCHASE CARD');
      expect(result.transactions[3].description).toContain('PAYMENT TO OURPROPERTY');
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
