import type { HeaderInfo, FormatType } from './types';

const HEADER_PATTERNS = [
  /date.*transaction.*withdrawal.*deposit/i,
  /date.*transaction.*detail.*withdrawal.*deposit/i,
  /date.*description.*withdrawal.*deposit/i,
  /date.*transaction.*description.*amount/i,
  /date.*transaction.*amount/i,
];

export function findTransactionHeader(lines: string[]): HeaderInfo {
  let headerIndex = -1;
  let headerLine = '';
  
  for (let i = 0; i < Math.min(lines.length, 100); i++) {
    const line = lines[i];
    if (HEADER_PATTERNS.some(p => p.test(line))) {
      headerIndex = i;
      headerLine = line;
      break;
    }
  }
  
  if (headerIndex === -1) {
    for (let i = 0; i < Math.min(lines.length, 200); i++) {
      if (/^\d{1,2}\s+[A-Z]{3}/i.test(lines[i])) {
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
