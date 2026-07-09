# Changelog

All notable changes to this project will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.3.0] - 2027-07-09 — Calendar feature

### Added
- Calendar View — a day-by-day monthly grid showing every transaction on its actual date, colour-coded by category, each line reading `Merchant - Category - ±$Amount`; navigate across every month present in a statement (`components/CalendarView.tsx`)
- `groupByDay` (`lib/parser/group.ts`) — buckets a month's transactions by day of month and attaches the extracted merchant name to each

### Fixed
- `groupByMonth` stamped every transaction with today's real-world calendar year instead of the statement's actual year, since ANZ dates never carry a year token in the common extraction path. An initial rollover-detection fix assumed statements always list transactions in ascending chronological order; real ANZ statements can list months descending (most recent first), which made the year run away by one on every month step. Now only an actual Dec↔Jan adjacency shifts the year, in whichever direction the statement is ordered — a real year token on the date, when present, is still trusted over any guess.

---

## [0.2.0] - 2026-06-02 — Beta release

### Added
- CSV export per month in the monthly breakdown section
- CSV export all transactions button in the transaction table
- Transaction count label in the transaction table (previously silently capped at 50)
- Privacy notice on the upload zone: PDF is processed in memory and not stored
- Security headers via `next.config.ts`: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Deployed to Vercel: [bank-transaction-taupe.vercel.app](https://bank-transaction-taupe.vercel.app)

### Fixed
- Double file picker on upload click — caused by `htmlFor` on the dropzone label conflicting with react-dropzone's own click handler
- Removed silent 50-row cap on the transaction table

### Removed
- `@prisma/client` dependency — no database in use
- `pdf2json` dependency — replaced by pdf-parse, no longer needed
- `lib/tempFile.ts` — dead code, never imported
- `console.log` leaking uploaded file metadata to server logs

---

## [0.1.0] - 2026-05-19 — Initial working build

### Added
- PDF upload and validation (ANZ bank statements only, rejects other PDFs and files over 8MB)
- ANZ bank statement parser supporting column and line format detection
- Transaction categorisation: groceries, food, transport, utilities, rent, education, shopping, friends, misc
- Monthly grouping of transactions
- Deposit/withdrawal summary with colour coding (green/red)
- Merchant extraction for cleaner category matching
- CI pipeline via GitHub Actions
- 148 passing unit and integration tests via Vitest
- Dynamic year handling in tests (no hardcoded year)

### Architecture
- Modular parser pipeline: `detector` → `extractor` → `filter` → `group` → `summarise`
- Single source of truth for category keywords (`lib/categories.ts`)
- Shared TypeScript interfaces (`lib/types/index.ts`)
- Backward-compatible re-export layer (`lib/transactionParser.ts`)
- Switched from pdf2json to pdf-parse for simpler text extraction
- Removed rawText from API response to reduce payload size

### Fixed
- ANZ credit detection and opening balance filters
- Hardcoded year in group keys replaced with runtime year
- Column format parsing for 2-column vs 3-column ANZ statements
