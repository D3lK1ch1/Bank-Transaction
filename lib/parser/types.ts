export type FormatType = 'column' | 'line' | 'commonwealth' | 'unknown';

export interface HeaderInfo {
  headerLine: string;
  headerIndex: number;
  format: FormatType;
  startIndex: number;
  sampleLines: string[];
}
