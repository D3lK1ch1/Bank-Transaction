import type { Transaction } from '../types';

export type FormatType = 'column' | 'line' | 'commonwealth' | 'nab' | 'unknown';
export type Bank = 'anz' | 'commonwealth' | 'nab';

export interface HeaderInfo {
  headerLine: string;
  headerIndex: number;
  format: FormatType;
  startIndex: number;
  sampleLines: string[];
}

export interface BankParser {
  normalizeLine: (line: string) => string;
  findHeader: (lines: string[]) => HeaderInfo;
  extractTransactions: (lines: string[], header: HeaderInfo) => Transaction[];
}
