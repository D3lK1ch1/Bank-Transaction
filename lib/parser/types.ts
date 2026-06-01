export type FormatType = 'column' | 'line' | 'unknown';

export interface HeaderInfo {
  headerLine: string;
  headerIndex: number;
  format: FormatType;
  startIndex: number;
  sampleLines: string[];
}
