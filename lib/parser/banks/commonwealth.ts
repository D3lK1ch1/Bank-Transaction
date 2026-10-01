import type { BankParser, HeaderInfo } from '../types';
import type { RowParseResult } from '../rowWalker';
import { walkRows, findLineBeforeFirstRow } from '../rowWalker';

const HEADER_DATE_LINE_REGEX = /^date$/i;
const HEADER_COLUMNS_LINE_PATTERNS = [/transaction/i, /debit/i, /credit/i, /balance/i];

const ROW_START_REGEX = /^\d{1,2}\s+[A-Z]{3}(?:\s+\d{4})?/i;
const YEAR_LINE_REGEX = /^\d{4}$/;
const MONTH_HEADER_REGEX = /^[A-Z]{3}\s+\d{4}$/i;
const SECTION_BREAK_REGEX = /^date\s+(transaction|description)/i;
const BLANK_LINE_REGEX = /^blank$/i;

const AMOUNT_REGEX = /(\d[\d,]*\.\d{2})\s+\$(\d[\d,]*\.\d{2})\s+(CR|DR)/;
const CREDIT_KEYWORDS_REGEX = /credit|interest|refund|deposit|from|intl payment/i;

export const commonwealthParser: BankParser = {
  normalizeLine: line => line,
  findHeader,
  extractTransactions: (lines, header) => walkRows(lines, header.startIndex, {
    rowStart: ROW_START_REGEX,
    yearLine: YEAR_LINE_REGEX,
    continuationStops: [MONTH_HEADER_REGEX, SECTION_BREAK_REGEX],
    ignoredContinuation: BLANK_LINE_REGEX,
    parseRow: (fullLine, fullDate) => parseRow(fullLine, fullDate),
  }),
};

function findHeader(lines: string[]): HeaderInfo {
  let headerIndex = -1;
  let headerLine = '';

  for (let i = 0; i < Math.min(lines.length, 100) - 1; i++) {
    if (HEADER_DATE_LINE_REGEX.test(lines[i]) && HEADER_COLUMNS_LINE_PATTERNS.every(p => p.test(lines[i + 1]))) {
      headerIndex = i + 1;
      headerLine = `${lines[i]} ${lines[i + 1]}`;
      break;
    }
  }

  if (headerIndex === -1) {
    ({ headerIndex, headerLine } = findLineBeforeFirstRow(lines, ROW_START_REGEX));
  }

  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
  const sampleLines = lines.slice(startIndex, startIndex + 50);

  return { headerLine, headerIndex, format: 'commonwealth', startIndex, sampleLines };
}

function parseRow(fullLine: string, fullDate: string): RowParseResult {
  const match = fullLine.match(AMOUNT_REGEX);
  if (!match) {
    return { amount: 0, type: 'debit', description: '' };
  }

  const amount = parseFloat(match[1].replace(/,/g, ''));
  const balance = parseFloat(match[2].replace(/,/g, ''));
  const amountStart = match.index ?? fullLine.length;
  const description = fullLine.slice(fullDate.length, amountStart).trim();

  const isCredit = CREDIT_KEYWORDS_REGEX.test(description);
  const type: 'debit' | 'credit' = isCredit ? 'credit' : 'debit';

  return { amount, type, balance, description };
}
