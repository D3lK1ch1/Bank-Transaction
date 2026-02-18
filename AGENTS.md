## Agents Used
* Windsurf
* GitHub Copilot
* Gemini CLI
* Codex

This markdown is used throughout all projects, as rules and regulations to project across.

---

## Agent Guidelines
- Chatbots are allowed to improve and update this markdown
- Focus on incremental, validated changes
- Always cross-reference this file when starting new sessions
- Ensure the user follows the guidelines to research -> plan -> execute -> review -> revise

---

## Session Organization
- Maintain separate conversation folders per agent per project
- Each session should prefix decisions with agent name and timestamp
- Project: **Bank Transaction Parser** - PDF extraction, transaction parsing, categorization, and visualization

---

## Core Instructions
- Find and read docs, give a boiler plate but not core functionality. 
- User is not allowed for poor planning, shallow understanding of the code, letting AI do what it wants etc

### Code Review & Quality
- **No comments in code** - explain decisions in chat during review
- **Outline exploration** - check Explorer to understand function signatures, inputs → outputs
- **KISS principle** - implement simplest solution first, avoid premature optimization
- **Edge cases** - handle errors explicitly; no silent failures
- **Not overdefensive**  - no extra type escapes
- No code duplication

### Testing & Validation Strategy
- User runs commands themselves (agents provide command guidance only)
- **Test before shipping**: unit tests for critical paths, integration tests for routes
- **Document test results**: what was tested, what passed/failed, improvements made

### Documentation Approach  
- No extra markdown files per change
- Summarize in chat: Problem → Solution → Validation Results
- Track what worked vs what didn't for pattern recognition
- No inconsistent files

---

## Known Issues & Fixes
| Issue | Root Cause | Solution | Status |
|-------|-----------|----------|--------|
| PDF parser returns incorrect amounts | Parser regex fails on multi-line transactions or inconsistent table formatting | Updated extractTransaction() to parse ANZ statement format with DD MMM dates, multi-line descriptions, and withdrawal/deposit/balance columns; modified route to slice text from "Transaction Details" section | ✅ Implemented |
| Missing transaction filtering | Page headers, footers, totals included in results | Added `filterSummaryRows()` to exclude summary patterns (TOTAL, BALANCE, etc) | ✅ Implemented |
| Transaction categorization placeholder | No AI-based categorization yet | Basic category structure exists in `categorizeTransactions()` - ready for AI integration | ⏳ Pending |
| Database not connected | Prisma client imported but routes don't use DB | Need to integrate DB storage in API route after schema finalized | ⏳ Blocked |
| Category colors inconsistent | TransactionDisplay uses hardcoded category colors | Centralize category definitions in lib/constants | 🔄 In Progress |

---

## Testing & Validation Log

### Session: PDF Upload & Parsing
- ✅ PDF upload validation (only .pdf files accepted, max 8MB)
- ✅ PDF text extraction using pdf2json library
- ✅ Transaction regex parsing for date/description/amount patterns
- ✅ Multi-line transaction handling (continuation lines collected)
- ✅ Summary row filtering (TOTAL, BALANCE, page headers removed)
- ✅ ANZ statement format parsing (DD MMM dates, column-based amounts)
- ✅ Monthly grouping with month abbreviation conversion
- ✅ Accuracy testing for ANZ format (numbers correct)
- ⏳ Accuracy testing with other bank statement formats (pending edge cases)
- ⏳ Transaction categorization logic (manual matching only, AI pending)
- ⏳ Monthly grouping and summary calculations (partially tested)

### Feature Testing Status
| Feature | Unit Test | Integration Test | UAT | Notes |
|---------|-----------|-----------------|-----|-------|
| File upload | ✅ | ✅ | ⏳ | Works for PDF files, rejects non-PDFs |
| PDF text extraction | ✅ | ✅ | ⏳ | Uses pdf2json library |
| Transaction parsing | ✅ | ✅ | ✅ | Validated with ANZ statement, numbers correct |
| Transaction categorization | ⏳ | ⏳ | ⏳ | Basic structure only, needs AI |
| Data visualization | ✅ | ⏳ | ⏳ | UI components built, data binding needs testing |
| Monthly grouping | ✅ | ✅ | ✅ | Validated grouping by month |
| Database persistence | ❌ | ❌ | ❌ | Not yet integrated |
| Export reports | ❌ | ❌ | ❌ | Not yet implemented |

---

## Code Quality Checklist
When implementing features:
- [x] TypeScript: No `any` types (use proper typing) - Used in PDF parser type defs only
- [x] Error handling: try-catch or .catch() where applicable - API route has comprehensive error handling
- [x] No unused imports or variables - Checked across components
- [x] Function parameters fully typed - Transaction parsing has proper interfaces
- [x] Exported types match backend contracts - Transaction interface exported and reused
- [x] Edge cases documented in chat - Regex patterns, multi-line handling, summary filtering documented

---

## Tech Stack Best Practices

### Next.js & TypeScript
- Use `"use client"` in React components that require hooks
- API routes should return `NextResponse` with proper headers
- Use FormData for file uploads (multipart/form-data)
- Page components return JSX, API routes return JSON/file responses

### PDF Processing
- pdf2json extracts raw text content from PDFs
- Regex patterns must account for:
  - Multi-line transaction descriptions (continuation handling)
  - Various date formats (MM/DD, DD-MM, etc)
  - Currency formats with thousands separators (parse & remove commas)
  - Bank statement headers, footers, page numbers
- Always filter out summary rows (TOTAL, BALANCE, etc)

### React Components
- Use Tailwind CSS with `cn()` utility for className merging
- Lucide-react for icons (File, UploadCloud, X, etc)
- React-dropzone for drag-and-drop uploads
- Construct grid layouts for responsive design (grid-cols-1, md:grid-cols-3)

### Performance & Memory
- Delete temp files after processing (use try/finally)
- Stream large PDFs where possible
- Implement pagination for large transaction lists

---

## Progress Tracking

### Recent Work (Completed)
1. **PDF Upload Component** - FileUploader.tsx with dropzone support
2. **PDF Parsing Backend** - API route using pdf2json library
3. **Transaction Parser** - Regex-based extraction with multi-line handling
4. **Transaction Display** - UI components showing summary, monthly breakdown, categorized transactions
5. **Error Handling** - Validation for PDF files, size limits (8MB), graceful error messages
6. **Transaction Filtering** - Remove page totals, headers, summary rows
7. **ANZ Statement Parsing** - Updated parser for ANZ bank statements with DD MMM dates and column-based amounts
8. **Text Slicing** - Modified route to start parsing from "Transaction Details" section

### In Progress
- Category color centralization
- Transaction accuracy testing with real bank statements
- Monthly grouping refinement

### Blocked/Pending
- **Database Integration** - Prisma client ready but schema not finalized; needs async/await patterns in route
- **AI Categorization** - Basic category structure exists; need to integrate AI API (GPT or similar) for smart matching
- **Export Reports** - UI component not created; need CSV/PDF export logic

---

## Repeating Mistakes Log
Track mistakes across agent conversations to avoid regression:
| Mistake | Occurrence | Prevention |
|---------|-----------|-----------|
| Regex pattern too strict | Initial parsing failed on wrapped descriptions | Always handle multi-line inputs; collect continuation lines before parsing |
| Forgetting to filter summaries | Document totals appearing in transaction list | Always include exclusion patterns for TOTAL, BALANCE, page headers |
| Using wrong currency parsing | NaN results from amount calculations | Parse amounts BEFORE converting to float; handle comma removal in `parseFloat` step |
| Missing try-catch in async code | File cleanup silently fails | Always use try-finally for cleanup; log errors but don't throw from cleanup paths |
| Not validating file types | Non-PDF files crashing parser | Check both MIME type AND filename extension before processing |
| Hardcoding category colors | Inconsistent theming across components | Define colors in constants file; import and reuse across components |
| Regex not matching bank-specific date formats | Parsing failed on ANZ DD MMM dates instead of expected DD/MM | Update regex and parsing logic to match actual date patterns in bank statements |

---

