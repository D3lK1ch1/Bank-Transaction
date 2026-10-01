import type { Bank, BankParser, HeaderInfo } from './types';
import { anzParser } from './banks/anz';
import { commonwealthParser } from './banks/commonwealth';
import { nabParser } from './banks/nab';

export function getBankParser(bank: Bank): BankParser {
  switch (bank) {
    case 'anz':
      return anzParser;
    case 'commonwealth':
      return commonwealthParser;
    case 'nab':
      return nabParser;
  }
}

export function findTransactionHeader(lines: string[], bank: Bank): HeaderInfo {
  return getBankParser(bank).findHeader(lines);
}
