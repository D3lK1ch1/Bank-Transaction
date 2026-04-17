## Project: Bank Transaction Analyser

Stack: Next.js 16 · TypeScript 5 · Tailwind CSS 4 · Vitest 4 · Prisma 7 · pdf-parse/pdf2json

Phase agents in `agents/` — copy relevant file into `.claude/` at session start:
`explore.md` · `plan.md` · `implement.md` · `debug.md` · `review.md` · `testing.md` · `cicd.md`

---

## Core Instructions
- No comments in code — explain decisions in chat
- KISS: simplest solution first, no premature optimisation
- Edge cases handled explicitly; no silent failures
- No code duplication; no over-defensive type escapes
- No extra markdown files per change — summarise in chat: Problem → Solution → Result

## Code Quality Checklist
- [ ] No `any` types (PDF parser type defs only exception)
- [ ] try-catch or .catch() in async paths; try-finally for file cleanup
- [ ] No unused imports or variables
- [ ] Function parameters fully typed; exported types match backend contracts

---

## Parser Architecture
Pipeline: `detector` → `extractor` → `filter` → `group` → `summarise`

| File | Role |
|------|------|
| `lib/parser/detector.ts` | Detect column vs line format from header |
| `lib/parser/extractor.ts` | Parse each line (ANZ: `DD MMM`, last 3 tokens = withdrawal/deposit/balance) |
| `lib/parser/filter.ts` | Remove TOTAL/BALANCE/page-header rows |
| `lib/parser/group.ts` | `categorizeTransactions`, `groupByMonth` |
| `lib/parser/summarise.ts` | Totals calculation |
| `lib/categories.ts` | `CATEGORY_KEYWORDS`, `extractMerchant`, `getCategoryFromDescription` |

Categories: groceries · food · transport · utilities · rent · education · shopping · entertainment · healthcare · friends · misc

---

## PDF Processing Rules
- Validate MIME type AND filename extension before processing
- Filter summary rows: TOTAL, BALANCE, page headers
- Remove commas before `parseFloat`; parse amounts before float conversion
- Delete temp files in `try/finally`

---

## Testing Rules
- 3-column format required in fixtures: `withdrawal deposit balance` — use `0.00` for missing column
- Use `toBeCloseTo()` for float comparisons, not `toBe()`
- Dynamic year in tests: `new Date().getFullYear()` — never hardcode `2025`/`2026`
- react-dropzone won't fire via `fireEvent.change()` in jsdom — skip or mock at hook level

---

## Repeating Mistakes Log
| Mistake | Prevention |
|---------|-----------|
| Regex too strict on descriptions | Handle multi-line; collect continuation lines before parsing |
| Missing summary row filter | Always exclude TOTAL, BALANCE, page headers |
| `NaN` from amounts | Remove commas before `parseFloat` |
| No try-finally for file cleanup | Always cleanup in finally; log but don't throw from cleanup |
| Hardcoded category colours | Import from `lib/categories.ts` only |
| Tests hardcoding year | Use `new Date().getFullYear()` |
| 2-column test data vs 3-column parser | Always include `0.00` placeholder for missing column |

---

## Documentation Rule
Update CHANGELOG.md and README.md when features ship — code and docs must stay in sync.