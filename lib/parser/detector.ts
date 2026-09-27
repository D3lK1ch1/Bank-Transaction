import type { HeaderInfo, FormatType, Bank } from './types';

const ANZ_HEADER_PATTERNS = [
  /date.*transaction.*withdrawal.*deposit/i,
  /date.*transaction.*detail.*withdrawal.*deposit/i,
  /date.*description.*withdrawal.*deposit/i,
  /date.*transaction.*description.*amount/i,
  /date.*transaction.*amount/i,
];

const TRANSACTION_DATE_LINE_REGEX = /^\d{1,2}\s+[A-Z]{3}/i;

export function findTransactionHeader(lines: string[], bank: Bank): HeaderInfo {
  if (bank === 'commonwealth') {
    return findCommonwealthHeader(lines);
  }

  return findAnzHeader(lines);
}

function findAnzHeader(lines: string[]): HeaderInfo {
  let headerIndex = -1;
  let headerLine = '';

  for (let i = 0; i < Math.min(lines.length, 100); i++) {
    const line = lines[i];
    if (ANZ_HEADER_PATTERNS.some(p => p.test(line))) {
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
    for (let i = 0; i < Math.min(lines.length, 200); i++) {
      if (TRANSACTION_DATE_LINE_REGEX.test(lines[i])) {
        headerIndex = i - 1;
        headerLine = lines[i - 1] || 'Unknown header';
        break;
      }
    }
  }

  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
  const sampleLines = lines.slice(startIndex, startIndex + 50);
  const format = detectFormat(headerLine);

  return { headerLine, headerIndex, format, startIndex, sampleLines };
}

// CBA's header is split across two lines: "Date" then "Transaction Debit Credit Balance".
function findCommonwealthHeader(lines: string[]): HeaderInfo {
  let headerIndex = -1;
  let headerLine = '';

  for (let i = 0; i < Math.min(lines.length, 100) - 1; i++) {
    if (/^date$/i.test(lines[i]) && /transaction/i.test(lines[i + 1]) && /debit/i.test(lines[i + 1]) && /credit/i.test(lines[i + 1]) && /balance/i.test(lines[i + 1])) {
      headerIndex = i + 1;
      headerLine = `${lines[i]} ${lines[i + 1]}`;
      break;
    }
  }

  if (headerIndex === -1) {
    for (let i = 0; i < Math.min(lines.length, 200); i++) {
      if (TRANSACTION_DATE_LINE_REGEX.test(lines[i])) {
        headerIndex = i - 1;
        headerLine = lines[i - 1] || 'Unknown header';
        break;
      }
    }
  }

  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
  const sampleLines = lines.slice(startIndex, startIndex + 50);

  return { headerLine, headerIndex, format: 'commonwealth', startIndex, sampleLines };
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
