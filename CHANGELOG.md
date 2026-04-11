# Changelog

All notable changes to this project will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- PDF upload and validation (ANZ bank statements only, rejects other PDFs)
- ANZ bank statement parser supporting column and line format detection
- Transaction categorisation: groceries, food, transport, utilities, rent, education, shopping, friends, misc
- Monthly grouping of transactions
- Deposit/withdrawal summary with colour coding (green/red)
- 148 passing unit and integration tests via Vitest

### Architecture
- Modular parser pipeline: `detector` → `extractor` → `filter` → `group` → `summarise`
- Single source of truth for category keywords (`lib/categories.ts`)
- Shared TypeScript interfaces (`lib/types/index.ts`)
- Backward-compatible re-export layer (`lib/transactionParser.ts`)
