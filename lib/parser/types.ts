export type FormatType = 'column' | 'line' | 'commonwealth' | 'nab' | 'unknown';
export type Bank = 'anz' | 'commonwealth' | 'nab';

export interface HeaderInfo {
  headerLine: string;
  headerIndex: number;
  format: FormatType;
  startIndex: number;
  sampleLines: string[];
}
