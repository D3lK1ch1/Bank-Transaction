import type { BankParser, FormatType, HeaderInfo } from '../types';
import type { RowParseResult } from '../rowWalker';
import { walkRows, findLineBeforeFirstRow } from '../rowWalker';

const HEADER_PATTERNS = [
  /date.*transaction.*withdrawal.*deposit/i,
  /date.*transaction.*detail.*withdrawal.*deposit/i,
  /date.*description.*withdrawal.*deposit/i,
  /date.*transaction.*description.*amount/i,
  /date.*transaction.*amount/i,
];

const ROW_START_REGEX = /^\d{1,2}\s+[A-Z]{3}(?:\s+\d{4})?/i;
const YEAR_LINE_REGEX = /^\d{4}$/;
const MONTH_HEADER_REGEX = /^[A-Z]{3}\s+\d{4}$/i;
const SECTION_BREAK_REGEX = /^date\s+(transaction|description)/i;
const BLANK_LINE_REGEX = /^blank$/i;

const AMOUNT_TOKEN_REGEX = '[+-]?\\$?[+-]?\\d[\\d,]*(?:\\.\\d{1,2})?';
const TRAILING_AMOUNT_REGEX = new RegExp(`(?:^|\\s)(${AMOUNT_TOKEN_REGEX}|-)\\s+(${AMOUNT_TOKEN_REGEX}|-)\\s+(${AMOUNT_TOKEN_REGEX}|-)$`);
const LINE_FORMAT_AMOUNT_REGEX = /\$\d[\d,]*(?:\.\d{1,2})?/;
const CREDIT_KEYWORDS_REGEX = /credit|interest|refund|deposit|from|intl payment/i;

const MERGED_PREFIX_REGEX = /^(\d{1,2}\s+[A-Z]{3})(ANZ|VISA|EFTPOS|PAYMENT|MTS)\b/i;
const CATEGORY_LINE_REGEX = /^(groceries|food|transport|utilities|rent|education|shopping|entertainment|healthcare|friends|misc)$/i;
const PAGE_NOISE_REGEX = /^totals at end of page|^anz access advantage statement|^account number \d|^page \d+ of \d+$/i;

export const anzParser: BankParser = {
  normalizeLine,
  findHeader,
  extractTransactions: (lines, header) => walkRows(lines, header.startIndex, {
    rowStart: ROW_START_REGEX,
    yearLine: YEAR_LINE_REGEX,
    continuationStops: [MONTH_HEADER_REGEX, SECTION_BREAK_REGEX],
    ignoredContinuation: BLANK_LINE_REGEX,
    parseRow: header.format === 'line'
      ? (fullLine, _fullDate, date) => parseLineFormatRow(fullLine, date)
      : (fullLine, fullDate) => parseColumnFormatRow(fullLine, fullDate),
  }),
};

function normalizeLine(line: string): string {
  if (CATEGORY_LINE_REGEX.test(line)) {
    return '';
  }

  if (PAGE_NOISE_REGEX.test(line)) {
    return '';
  }

  if (line === '-' || line.toLowerCase() === 'blank') {
    return '0.00';
  }

  return line.replace(MERGED_PREFIX_REGEX, '$1 $2');
}

function findHeader(lines: string[]): HeaderInfo {
  let headerIndex = -1;
  let headerLine = '';

  for (let i = 0; i < Math.min(lines.length, 100); i++) {
    const line = lines[i];
    if (HEADER_PATTERNS.some(p => p.test(line))) {
      headerIndex = i;
      headerLine = line;
      break;
    }

    const headerWindow = lines.slice(i, i + 6).map(l => l.toLowerCase());
    if (
      headerWindow[0] === 'date' &&
      headerWindow[1] === 'description' &&
      headerWindow.includes('withdrawal') &&
      headerWindow.includes('deposit') &&
      headerWindow.includes('amount')
    ) {
      headerIndex = i + headerWindow.indexOf('amount');
      headerLine = 'Date Description Withdrawal Deposit Balance';
      break;
    }
  }

  if (headerIndex === -1) {
    ({ headerIndex, headerLine } = findLineBeforeFirstRow(lines, ROW_START_REGEX));
  }

  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
  const sampleLines = lines.slice(startIndex, startIndex + 50);
  const format = detectFormat(headerLine);

  return { headerLine, headerIndex, format, startIndex, sampleLines };
}

function detectFormat(headerLine: string): FormatType {
  const hasBalance = /balance/i.test(headerLine);
  const hasWithdrawals = /withdrawal/i.test(headerLine);
  const hasDeposits = /deposit/i.test(headerLine);
  const hasAmount = /amount/i.test(headerLine);

  if (hasBalance && hasWithdrawals && hasDeposits) {
    return 'column';
  } else if ((hasWithdrawals && hasDeposits && !hasBalance) || (hasAmount && !hasBalance)) {
    return 'line';
  }

  return 'unknown';
}

function parseLineFormatRow(fullLine: string, date: string): RowParseResult {
  const amountMatches = fullLine.match(LINE_FORMAT_AMOUNT_REGEX);

  if (!amountMatches || amountMatches.length === 0) {
    return { amount: 0, type: 'debit', description: '' };
  }

  const amountStr = amountMatches[amountMatches.length - 1].replace('$', '').replace(/,/g, '');
  const amount = parseFloat(amountStr);

  const isCredit = CREDIT_KEYWORDS_REGEX.test(fullLine.toLowerCase());
  const type: 'debit' | 'credit' = isCredit ? 'credit' : 'debit';

  const amountIndex = fullLine.indexOf(amountMatches[amountMatches.length - 1]);
  const description = fullLine.substring(date.length, amountIndex).trim();

  return { amount, type, description };
}

function parseColumnFormatRow(fullLine: string, fullDate: string): RowParseResult {
  const amountMatch = fullLine.match(TRAILING_AMOUNT_REGEX);
  if (!amountMatch) {
    return { amount: 0, type: 'debit', description: '' };
  }

  const parseNum = (s: string) => {
    if (s === '-') {
      return 0;
    }

    return Math.abs(parseFloat(s.replace(/[$,]/g, '')));
  };
  const withdrawalAmt = parseNum(amountMatch[1]);
  const depositAmt = parseNum(amountMatch[2]);
  const balanceAmt = parseNum(amountMatch[3]);
  const amountStart = amountMatch.index ?? fullLine.length;
  const description = fullLine.slice(fullDate.length, amountStart).trim();

  if (withdrawalAmt > 0) {
    if (isLeakedDescriptionNumber(withdrawalAmt, description)) {
      return { amount: 0, type: 'debit', description };
    }

    return { amount: withdrawalAmt, type: 'debit', balance: balanceAmt, description };
  }

  if (depositAmt > 0) {
    if (isLeakedDescriptionNumber(depositAmt, description)) {
      return { amount: 0, type: 'credit', description };
    }

    return { amount: depositAmt, type: 'credit', balance: balanceAmt, description };
  }

  return { amount: 0, type: 'debit', description };
}

function isLeakedDescriptionNumber(amount: number, description: string): boolean {
  const hasEffectiveDate = /effective date/i.test(description);
  const hasTransferReference = /m-banking funds tfer|transfer/i.test(description);

  return (hasEffectiveDate && amount >= 2020 && amount <= 2030) || (hasTransferReference && amount >= 100000);
}
