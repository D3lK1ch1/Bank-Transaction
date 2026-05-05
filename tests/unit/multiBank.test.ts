import { describe, it, expect } from 'vitest';
import { parseTransactions } from '@/lib/transactionParser';
import { sampleCBAFormatText, sampleNABFormatText } from '../fixtures/sample-transactions';

// ─── CBA ────────────────────────────────────────────────────────────────────

describe('CBA format', () => {
  describe('year does not leak into amounts', () => {
    it('no transaction has amount equal to a calendar year', () => {
      const result = parseTransactions(sampleCBAFormatText);
      result.transactions.forEach(t => {
        expect(t.amount).not.toBe(2021);
        expect(t.amount).not.toBe(2020);
        expect(t.amount).not.toBe(2022);
      });
    });

    it('all amounts are plausible transaction values (under 100,000)', () => {
      const result = parseTransactions(sampleCBAFormatText);
      result.transactions.forEach(t => {
        expect(t.amount).toBeLessThan(100_000);
        expect(t.amount).toBeGreaterThan(0);
      });
    });
  });

  describe('amounts extracted correctly', () => {
    it('should extract 5 transactions', () => {
      const result = parseTransactions(sampleCBAFormatText);
      expect(result.transactions.length).toBe(5);
    });

    it('Cash Deposit should be credit 4700.00', () => {
      const result = parseTransactions(sampleCBAFormatText);
      const t = result.transactions.find(t => t.description.toLowerCase().includes('cash deposit'));
      expect(t).toBeDefined();
      expect(t!.type).toBe('credit');
      expect(t!.amount).toBeCloseTo(4700.00, 2);
    });

    it('TPG Internet should be debit 59.99', () => {
      const result = parseTransactions(sampleCBAFormatText);
      const t = result.transactions.find(t => t.description.toLowerCase().includes('tpg'));
      expect(t).toBeDefined();
      expect(t!.type).toBe('debit');
      expect(t!.amount).toBeCloseTo(59.99, 2);
    });

    it('Credit Interest should be credit 3.21', () => {
      const result = parseTransactions(sampleCBAFormatText);
      const t = result.transactions.find(t => t.description.toLowerCase().includes('interest'));
      expect(t).toBeDefined();
      expect(t!.type).toBe('credit');
      expect(t!.amount).toBeCloseTo(3.21, 2);
    });
  });

  describe('descriptions are populated', () => {
    it('no transaction has an empty description', () => {
      const result = parseTransactions(sampleCBAFormatText);
      result.transactions.forEach(t => {
        expect(t.description.trim().length).toBeGreaterThan(0);
      });
    });

    it('description does not contain the year', () => {
      const result = parseTransactions(sampleCBAFormatText);
      result.transactions.forEach(t => {
        expect(t.description).not.toMatch(/\b20\d{2}\b/);
      });
    });

    it('date field contains only DD MMM (no year)', () => {
      const result = parseTransactions(sampleCBAFormatText);
      result.transactions.forEach(t => {
        expect(t.date).toMatch(/^\d{1,2}\s+[A-Za-z]{3}$/);
      });
    });
  });
});

// ─── NAB ────────────────────────────────────────────────────────────────────

describe('NAB format', () => {
  describe('header detection handles Particulars column', () => {
    it('should extract 5 transactions', () => {
      const result = parseTransactions(sampleNABFormatText);
      expect(result.transactions.length).toBe(5);
    });

    it('no transaction has an empty description', () => {
      const result = parseTransactions(sampleNABFormatText);
      result.transactions.forEach(t => {
        expect(t.description.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('amounts extracted correctly', () => {
    it('Salary Credit should be credit 2000.00', () => {
      const result = parseTransactions(sampleNABFormatText);
      const t = result.transactions.find(t => t.description.toLowerCase().includes('salary'));
      expect(t).toBeDefined();
      expect(t!.type).toBe('credit');
      expect(t!.amount).toBeCloseTo(2000.00, 2);
    });

    it('Coles should be debit 100.50', () => {
      const result = parseTransactions(sampleNABFormatText);
      const t = result.transactions.find(t => t.description.toLowerCase().includes('coles'));
      expect(t).toBeDefined();
      expect(t!.type).toBe('debit');
      expect(t!.amount).toBeCloseTo(100.50, 2);
    });

    it('no amount equals 20000 (balance leaked as transaction amount)', () => {
      const result = parseTransactions(sampleNABFormatText);
      result.transactions.forEach(t => {
        expect(t.amount).not.toBeCloseTo(20000, 0);
      });
    });
  });

  describe('debit/credit type detection', () => {
    it('should have both debits and credits', () => {
      const result = parseTransactions(sampleNABFormatText);
      const debits = result.transactions.filter(t => t.type === 'debit');
      const credits = result.transactions.filter(t => t.type === 'credit');
      expect(debits.length).toBeGreaterThan(0);
      expect(credits.length).toBeGreaterThan(0);
    });
  });
});
