import { describe, it, expect } from 'vitest';
import { findTransactionHeader, parseTransactions } from '@/lib/parser';
import { sampleNabFormatText, sampleColumnFormatText } from '../fixtures/sample-transactions';

describe('Header Detection - NAB Format', () => {
  it('should find the page 1 NAB header in the real statement excerpt', () => {
    const lines = sampleNabFormatText.split('\n');
    const header = findTransactionHeader(lines, 'nab');

    expect(header.headerLine).toBe('Date Particulars Debits Credits Balance');
    expect(header.format).toBe('nab');
    expect(header.startIndex).toBe(header.headerIndex + 1);
    expect(lines[header.startIndex]).toMatch(/7 Sep 2022 Brought forward/);
  });

  it('should accept the page 2 header where Date and Particulars have no space between them', () => {
    const header = findTransactionHeader(['Transaction Details (continued)', 'DateParticulars  Debits Credits Balance '], 'nab');

    expect(header.headerIndex).toBe(1);
  });

  it('should throw when NAB is selected but the statement has no NAB header', () => {
    const lines = sampleColumnFormatText.split('\n');

    expect(() => findTransactionHeader(lines, 'nab')).toThrow('NAB transaction header not found');
  });
});

describe('Transaction Parser - NAB Format', () => {
  it('should extract every transaction and match the statement totals', () => {
    const result = parseTransactions(sampleNabFormatText, 'nab');

    expect(result.transactions).toHaveLength(28);
    expect(result.summary.totalDeposits).toBeCloseTo(12242.57);
    expect(result.summary.totalWithdrawals).toBeCloseTo(6632.00);
  });

  it('should not produce Brought forward or Carried forward rows as transactions', () => {
    const result = parseTransactions(sampleNabFormatText, 'nab');

    expect(result.transactions.some(t => /forward/i.test(t.description))).toBe(false);
  });

  it('should infer credits from the balance going up', () => {
    const result = parseTransactions(sampleNabFormatText, 'nab');
    const credits = result.transactions.filter(t => t.type === 'credit');

    expect(credits.map(t => t.amount)).toEqual([12240, 2.57]);
    expect(credits[1].description).toBe('Interest');
  });

  it('should keep the page 1 date for transactions continued after the page 2 header', () => {
    const result = parseTransactions(sampleNabFormatText, 'nab');
    const afterPageBreak = result.transactions.filter(t => t.date === '30 Sep 2022' && t.type === 'debit');

    expect(afterPageBreak.map(t => t.amount)).toEqual([50, 90]);
    expect(afterPageBreak[1].balance).toBeCloseTo(35679.58);
  });

  it('should throw when the amounts do not add up to the printed balance', () => {
    const corrupted = sampleNabFormatText.replace('................................................................................................40.00  26,009.01 Cr', '................................................................................................45.00  26,009.01 Cr');

    expect(corrupted).not.toBe(sampleNabFormatText);
    expect(() => parseTransactions(corrupted, 'nab')).toThrow(/does not match/);
  });
});
