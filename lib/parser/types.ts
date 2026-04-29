export type FormatType = 'column' | 'line' | 'unknown';
export type DateFormat = 'DD MMM' | 'DD/MM/YYYY' | 'DD/MM/YY' | 'YYYY-MM-DD' | 'MMM DD, YYYY' | 'unknown';

export interface HeaderInfo {
  headerLine: string;
  headerIndex: number;
  columnMap: Record<string, number>;
  dateFormat: DateFormat;
  format: FormatType;
  startIndex: number;
  sampleLines: string[];
}
