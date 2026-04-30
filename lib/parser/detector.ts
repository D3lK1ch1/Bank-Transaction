import type { HeaderInfo, FormatType, DateFormat } from './types';

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
  const columnMap : Record<string, number> = {};
  const headerTokens = headerLine.toLowerCase().split(/\s+/);
  columnMap['date'] = headerTokens.indexOf('date');
  columnMap['description'] = headerTokens.indexOf('description');
  columnMap['withdrawal'] = headerTokens.indexOf('withdrawal');
  columnMap['deposit'] = headerTokens.indexOf('deposit');
  columnMap['amount'] = headerTokens.indexOf('amount');
  columnMap['balance'] = headerTokens.indexOf('balance');
  const format = detectFormat(headerLine);
  const dateFormat = detectDateFormat(sampleLines);

  return { headerLine, headerIndex, columnMap, format, startIndex, sampleLines, dateFormat };
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

function detectDateFormat(sampleLines: string[]): DateFormat {
  const datePatterns = [
    { pattern: /^\d{1,2}\s+[A-Z]{3}/i, format: 'DD MMM' },
    { pattern: /^\d{1,2}\/\d{1,2}\/\d{4}/i, format: 'DD/MM/YYYY' },
    { pattern: /^\d{1,2}\/\d{1,2}\/\d{2}/i, format: 'DD/MM/YY' },
    { pattern: /^\d{4}-\d{2}-\d{2}/i, format: 'YYYY-MM-DD' },
    { pattern: /^[A-Z]{3}\s+\d{1,2},\s+\d{4}/i, format: 'MMM DD, YYYY' },
  ];

  for (const { pattern, format } of datePatterns) {
    if (sampleLines.some(line => pattern.test(line))) 
      return format as DateFormat;
  }
  return 'unknown';
}
