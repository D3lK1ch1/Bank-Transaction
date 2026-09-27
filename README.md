# Bank Transaction Analyser

A personal finance web app that parses ANZ (and, in progress, Commonwealth Bank) statement PDFs and breaks down spending by category and month — no accounts, no storage, no data kept after upload.

**Live:** [bank-transaction-taupe.vercel.app](https://bank-transaction-taupe.vercel.app)

---

## Screenshots


![UploadScreen](./BankTransaction.png)
![Monthly breakdown](./BankTransaction1.png)

---

## Features

- Choose your bank (ANZ or Commonwealth Bank) before uploading — the upload zone stays disabled until you do
- Drag-and-drop PDF upload — non-PDFs and files over 8MB are rejected
- Commonwealth Bank support is **work in progress**: debit/credit is inferred from the description, and transactions split across a page break can be dropped. ANZ is the reliable path
- Parses transactions: date, description, withdrawal, deposit, running balance
- Categorises spending: groceries, food, transport, utilities, rent, education, shopping, friends, misc
- Monthly breakdown with deposits, withdrawals and net per month
- Calendar view — every transaction shown on its actual day, colour-coded by category, reading `Merchant - Category - ±$Amount`; step through every month a statement covers
- Export any month — or all transactions — as a CSV
- Privacy-first: PDF is processed in memory and discarded immediately after parsing, never written to disk or stored

---

## Built With

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (full-stack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + Radix UI |
| PDF Parsing | pdf-parse |
| Testing | Vitest 4 + Testing Library |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm

### Installation

```bash
git clone https://github.com/D3lK1ch1/Bank-Transaction.git
cd Bank-Transaction
npm install
```

### Running

```bash
npm run dev      # development server
npm run build    # production build
npm start        # production server
```

### Testing

```bash
npm run test          # watch mode
npm run test:run      # single run
npm run test:coverage # with coverage report
```

---

## How It Works

1. Select your bank, then upload its statement PDF
2. The server extracts the raw text with pdf-parse
3. The parser finds the transaction header for the selected bank, extracts each transaction line, filters out balance/totals rows, then categorises and groups by month
4. Results are returned as JSON and rendered — the PDF is never saved

---

## License
MIT
