import { Transaction } from '@/lib/transactionParser';

export const sampleColumnFormatText = `
ANZ Bank Statement

Date Transaction Details             Withdrawal  Deposit  Balance
-----------------------------------------------------------------------
 2 Jan CARDLESS CREDIT               345.67       0.00    123456.78
 5 Jan GOOGLE CLOUD GCP-ONLINE        50.00       0.00    123406.78
 8 Jan Transfer to Jane Smith        120.00       0.00    123286.78
12 Jan Salary Deposit                  0.00    3500.00    126786.78
15 Jan COLES SUPERMARKET             156.23       0.00    126630.55
18 Jan PTV MYKI TOP UP               20.00       0.00    126610.55
20 Jan UBER TRIP                     35.50       0.00    126575.05
22 Jan ELECTRICITY BILL              89.99       0.00    126485.06
25 Jan UNIVERSITY OF MELBOURNE       450.00       0.00    126035.06
28 Jan MCDONALDS CAMBERWELL          15.80       0.00    126019.26
30 Jan CAFE LATTITUDE                28.50       0.00    125990.76
-----------------------------------------------------------------------
TOTAL                                861.02    3500.00
`;

export const sampleLineFormatText = `
Transaction Report

Date    Transaction Description              Amount
------------------------------------------------------------
 3 Feb  PTV MYKI TOP UP                     $20.00
 5 Feb  COLES SUPERMARKET SHOP 1234         $156.23
 8 Feb  UBER TRIP MELBOURNE                 $35.50
12 Feb  Salary from employer                $3500.00
15 Feb  GOOGLE PLAYSTORE                   $12.99
18 Feb  NETFLIX SUBSCRIPTION                 $15.99
20 Feb  SPOTIFY PREMIUM                     $11.99
22 Feb  Transfer to John Smith              $200.00
25 Feb  WOOLWORTHS SUPERMARKET              $89.45
28 Feb  KFC CAMBERWELL                     $18.50

FEB 2026
`;

export const sampleMixedFormatText = `
Bank Statement

Date Transaction Detail             Withdrawal  Deposit  Balance
-----------------------------------------------------------------
 1 Jan Opening Balance                                    5000.00
 3 Jan TOLL TAG AUSTRALIA              15.00           4985.00
 5 Jan CHEMIST WAREHOUSE               45.67           4939.33
 8 Jan Transfer from Mum                          500.00  5439.33
10 Jan Kmart Family Shopping           89.99           5349.34
12 Jan BAKERY CAFE SOUTH YARRA         32.00           5317.34
15 Jan CINEMA ENTERTAINMENT           25.00           5292.34
18 Jan MYER DEPARTMENT STORE          156.00          5136.34
20 Jan Interest Credit                             12.34  5148.68
22 Jan Medical Clinic                  65.00          5083.68
25 Jan Mobile Banking Payment         300.00          4783.68
28 Jan PTV CONCESSION                  45.00          4738.68
30 Jan BIG W RETAIL                   78.99           4659.69
-----------------------------------------------------------------
JAN 2026
`;

export const sampleTransactionsColumn: Transaction[] = [
  { date: '2 Jan', description: 'CARDLESS CREDIT', amount: 345.67, type: 'debit', balance: 123456.78, category: 'misc' },
  { date: '5 Jan', description: 'GOOGLE CLOUD GCP-ONLINE', amount: 50.00, type: 'credit', balance: 123406.78, category: 'utilities' },
  { date: '8 Jan', description: 'Transfer to Jane Smith', amount: 120.00, type: 'debit', balance: 123286.78, category: 'friends' },
  { date: '12 Jan', description: 'Salary Deposit', amount: 3500.00, type: 'credit', balance: 126786.78, category: 'misc' },
  { date: '15 Jan', description: 'COLES SUPERMARKET', amount: 156.23, type: 'debit', balance: 126630.55, category: 'groceries' },
  { date: '18 Jan', description: 'PTV MYKI TOP UP', amount: 20.00, type: 'debit', balance: 126610.55, category: 'transport' },
  { date: '20 Jan', description: 'UBER TRIP', amount: 35.50, type: 'debit', balance: 126575.05, category: 'transport' },
  { date: '22 Jan', description: 'ELECTRICITY BILL', amount: 89.99, type: 'debit', balance: 126485.06, category: 'utilities' },
  { date: '25 Jan', description: 'UNIVERSITY OF MELBOURNE', amount: 450.00, type: 'debit', balance: 126035.06, category: 'education' },
  { date: '28 Jan', description: 'MCDONALDS CAMBERWELL', amount: 15.80, type: 'debit', balance: 126019.26, category: 'food' },
  { date: '30 Jan', description: 'CAFE LATTITUDE', amount: 28.50, type: 'debit', balance: 125990.76, category: 'food' },
];

export const sampleTransactionsLine: Transaction[] = [
  { date: '3 Feb', description: 'PTV MYKI TOP UP', amount: 20.00, type: 'debit', category: 'transport' },
  { date: '5 Feb', description: 'COLES SUPERMARKET SHOP 1234', amount: 156.23, type: 'debit', category: 'groceries' },
  { date: '8 Feb', description: 'UBER TRIP MELBOURNE', amount: 35.50, type: 'debit', category: 'transport' },
  { date: '12 Feb', description: 'Salary from employer', amount: 3500.00, type: 'credit', category: 'misc' },
  { date: '15 Feb', description: 'GOOGLE PLAYSTORE', amount: 12.99, type: 'debit', category: 'misc' },
  { date: '18 Feb', description: 'NETFLIX SUBSCRIPTION', amount: 15.99, type: 'debit', category: 'entertainment' },
  { date: '20 Feb', description: 'SPOTIFY PREMIUM', amount: 11.99, type: 'debit', category: 'entertainment' },
  { date: '22 Feb', description: 'Transfer to John Smith', amount: 200.00, type: 'debit', category: 'friends' },
  { date: '25 Feb', description: 'WOOLWORTHS SUPERMARKET', amount: 89.45, type: 'debit', category: 'groceries' },
  { date: '28 Feb', description: 'KFC CAMBERWELL', amount: 18.50, type: 'debit', category: 'food' },
];

export const categorizationTestCases: { description: string; expectedCategory: string }[] = [
  { description: 'COLES SUPERMARKET', expectedCategory: 'groceries' },
  { description: 'WOOLWORTHS MARKET', expectedCategory: 'groceries' },
  { description: 'IGA GROCERY STORE', expectedCategory: 'groceries' },
  { description: 'PTV MYKI TOP UP', expectedCategory: 'transport' },
  { description: 'UBER TRIP MELBOURNE', expectedCategory: 'transport' },
  { description: 'DIDI RIDE', expectedCategory: 'transport' },
  { description: 'ELECTRICITY BILL', expectedCategory: 'utilities' },
  { description: 'TELSTRA MOBILE', expectedCategory: 'utilities' },
  { description: 'OPTUS INTERNET', expectedCategory: 'utilities' },
  { description: 'RENT PAYMENT', expectedCategory: 'rent' },
  { description: 'UNIVERSITY FEE', expectedCategory: 'education' },
  { description: 'Kmart Shopping', expectedCategory: 'shopping' },
  { description: 'MYER DEPARTMENT STORE', expectedCategory: 'shopping' },
  { description: 'MCDONALDS CAMBERWELL', expectedCategory: 'food' },
  { description: 'CAFE LATTE', expectedCategory: 'food' },
  { description: 'NETFLIX SUBSCRIPTION', expectedCategory: 'entertainment' },
  { description: 'CINEMA TICKETS', expectedCategory: 'entertainment' },
  { description: 'CHEMIST WAREHOUSE', expectedCategory: 'healthcare' },
  { description: 'Transfer to John Smith', expectedCategory: 'friends' },
  { description: 'Mobile Banking Payment', expectedCategory: 'friends' },
  { description: 'Random Description XYZ', expectedCategory: 'misc' },
];

export const summaryTestData: { transactions: Transaction[]; expected: { totalDeposits: number; totalWithdrawals: number; netAmount: number } }[] = [
  {
    transactions: [
      { date: '1 Jan', description: 'Deposit', amount: 1000.00, type: 'credit' },
      { date: '2 Jan', description: 'Purchase', amount: 50.00, type: 'debit' },
      { date: '3 Jan', description: 'Purchase', amount: 25.00, type: 'debit' },
    ],
    expected: { totalDeposits: 1000.00, totalWithdrawals: 75.00, netAmount: 925.00 },
  },
  {
    transactions: [
      { date: '1 Jan', description: 'Salary', amount: 3500.00, type: 'credit' },
      { date: '5 Jan', description: 'Rent', amount: 1200.00, type: 'debit' },
      { date: '10 Jan', description: 'Groceries', amount: 156.23, type: 'debit' },
      { date: '15 Jan', description: 'Transfer In', amount: 500.00, type: 'credit' },
      { date: '20 Jan', description: 'Entertainment', amount: 45.00, type: 'debit' },
    ],
    expected: { totalDeposits: 4000.00, totalWithdrawals: 1401.23, netAmount: 2598.77 },
  },
];

export const monthlyGroupingTestData: { transactions: Transaction[]; expectedMonths: string[]; expectedCounts: Record<string, number> }[] = [
  {
    transactions: [
      { date: '1 Jan', description: 'Transaction 1', amount: 100, type: 'debit' },
      { date: '15 Jan', description: 'Transaction 2', amount: 200, type: 'debit' },
      { date: '1 Feb', description: 'Transaction 3', amount: 300, type: 'credit' },
      { date: '15 Feb', description: 'Transaction 4', amount: 400, type: 'credit' },
      { date: '1 Mar', description: 'Transaction 5', amount: 500, type: 'debit' },
    ],
    expectedMonths: [`${new Date().getFullYear()}-01`, `${new Date().getFullYear()}-02`, `${new Date().getFullYear()}-03`],
    expectedCounts: {
      [`${new Date().getFullYear()}-01`]: 2,
      [`${new Date().getFullYear()}-02`]: 2,
      [`${new Date().getFullYear()}-03`]: 1
    },
  },
];
