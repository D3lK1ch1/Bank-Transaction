# Changelog

All notable changes to this project will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## Session 2026-10-02 — NAB support and per-bank parsers

### Added
- National Australia Bank (NAB) option in the bank selector and the `/api/parse-data` bank allowlist (`components/FileUploader.tsx`, `app/api/parse-data/route.ts`)
- NAB parsing (`lib/parser/banks/nab.ts`):
  - `Date Particulars Debits Credits Balance` header detection, including page 2's `DateParticulars` with no space
  - two-line rows (the description, then a dot-leader amount line), with the date carried forward to every transaction on the same day
  - `Brought forward` / `Carried forward` rows used for their balances only
- NAB debit/credit inferred from the printed balance. When a balance appears, the pending amounts whose +/− combination matches the balance change are resolved. This also works on page 2, where each balance is printed one row late. Parsing throws if the amounts don't reconcile, rather than guessing.
- NAB tests (`tests/unit/nabParser.test.ts`) against a verbatim pdf-parse fixture of the real sample statement. The 28 transactions match the statement's own totals (credits $12,242.57, debits $6,632.00).

### Changed
- Each bank now has its own regexes and parsing in `lib/parser/banks/{anz,commonwealth,nab}.ts`, each exporting a `BankParser` (`normalizeLine`, `findHeader`, `extractTransactions`). `detector.ts` is now only the `getBankParser(bank)` switch, and a missing bank fails to compile.
- ANZ and CBA share the date-line/continuation loop in `lib/parser/rowWalker.ts`, but each passes in its own regexes. `lib/parser/extractor.ts` was removed.
- ANZ line clean-up (merged prefixes, category lines, page noise) no longer runs on CBA or NAB statements
- A statement that parses to zero transactions now throws, so `/api/parse-data` returns 422 instead of an empty $0 result. This applies to every bank, including a PDF uploaded under the wrong bank.
- The refactor was checked by snapshotting the parse output of all 7 sample PDFs × 3 banks before and after: all 21 were identical

### Known issues
- The upload error path in `FileUploader.tsx` shows the raw JSON error, then fails `JSON.parse` in `HomePage.tsx`
- "Internet Transfer" is categorised as utilities through the `internet` keyword
- Category cards count deposits as spending
- CBA debit/credit is still guessed from description keywords. CBA prints a balance on every row, so balance matching could replace this.
- pdf-parse 1.1.1 logs a `Buffer()` deprecation warning from its bundled pdf.js

---

## Session 2026-09-21 — Multi-bank support (Commonwealth Bank)

### Added
- Bank selector on the upload zone (ANZ or Commonwealth Bank) — the dropzone stays disabled until a bank is chosen, and the selection is sent to the API as a `bank` form field (`components/FileUploader.tsx`)
- Commonwealth Bank (CBA) parsing: two-line `Date` / `Transaction Debit Credit Balance` header detection, and row extraction for the `amount $balance CR/DR` layout (`lib/parser/detector.ts`, `lib/parser/extractor.ts`)
- `Bank` type (`'anz' | 'commonwealth'`) exported from `lib/parser/types.ts`
- Clear 422 errors from `/api/parse-data` when a PDF can't be read (corrupted or password-protected) or contains no transaction data
- CBA parser tests (`tests/unit/commonwealthParser.test.ts`) and CBA fixtures

### Changed
- `parseTransactions(rawText, bank)` and `findTransactionHeader(lines, bank)` now require a bank; ANZ header detection is unchanged
- `/api/parse-data` returns 400 if `bank` is missing or not one of `anz` / `commonwealth`
- Upload copy is no longer ANZ-specific

---

## [0.3.0] - 2026-07-09 — Calendar feature

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
