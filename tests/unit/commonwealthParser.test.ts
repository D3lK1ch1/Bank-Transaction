import { describe, it, expect } from 'vitest';
import { parseTransactions } from '@/lib/transactionParser';
import { sampleCommonwealthFormatText } from '../fixtures/sample-transactions';

// sampleCommonwealthFormatText is a verbatim pdf-parse excerpt of a real CBA statement,
// not a hand-written fixture — see the comment on the fixture itself for why that matters.
describe('Transaction Parser - Commonwealth (CBA) Format', () => {
  it('should find the two-line CBA header and extract the real transaction rows', () => {
    const result = parseTransactions(sampleCommonwealthFormatText, 'commonwealth');

    expect(result.transactions).toHaveLength(4);
  });

  it('should not produce an OPENING BALANCE row as a transaction', () => {
    const result = parseTransactions(sampleCommonwealthFormatText, 'commonwealth');

    expect(result.transactions.some(t => /opening balance/i.test(t.description))).toBe(false);
  });

  it('should correctly parse amount, balance, and type for a standard row', () => {
    const result = parseTransactions(sampleCommonwealthFormatText, 'commonwealth');
    const tpg = result.transactions.find(t => /TPG INTERNET/i.test(t.description));

    expect(tpg).toBeDefined();
    expect(tpg?.amount).toBe(59.99);
    expect(tpg?.balance).toBeCloseTo(4935.74);
    expect(tpg?.type).toBe('debit');
  });

  it('should parse every row in this excerpt as a debit (balance decreases throughout)', () => {
    const result = parseTransactions(sampleCommonwealthFormatText, 'commonwealth');

    result.transactions.forEach(t => {
      expect(t.type).toBe('debit');
    });
  });

  it('drops a transaction split across a page/line boundary with no trailing balance figure (known gap)', () => {
    // The excerpt's last row (a second WORLDREMIT payment) is cut off before its "$balance CR"
    // line — same shape as the CREDIT INTEREST EARNED row, which never has one at all.
    // Both get silently dropped rather than parsed with amount 0. Documented, not fixed here.
    const result = parseTransactions(sampleCommonwealthFormatText, 'commonwealth');

    expect(result.transactions.some(t => /INTEREST EARNED/i.test(t.description))).toBe(false);
  });
});
