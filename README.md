# Bank Transaction Analyser
A web-app, uploading ANZ bank transaction files that will show monthly categorized transaction amount to track funancial spending. PDF data will not be kept inside app after upload, for one-time uses.

## Description
The Analyser is accessed on web ready to upload the ANZ transaction file ready to generate a report bellow on how much money is spent (in red) for each category : groceries, food, transport, shopping, friends, rent misc etc

Built with Next.js as fullstack separated in app folder that sub-folders api/parse-data with route.ts for backend supported by lib folder that parses PDF once uploaded to extract, filter group and summarize the information and page.tsx just in app folder fr frontend supported with components folder showing HomePage with file uploader and the transaction display bellow once PDF is submitted.

## Features

- Upload ANZ bank PDF statements (other PDFs rejected)
- Parse transactions: description, withdrawal, deposit, with colour-coded amounts
- Categorise transactions: groceries, food, transport, utilities, rent, education, shopping, friends, misc
- Monthly breakdown view
- Planned: database storage, data visualisation, export reports

See [CHANGELOG.md](./CHANGELOG.md) for version history and upcoming work.


## Built With

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (Full Stack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + Radix UI |
| PDF Parsing | pdf-parse, pdf2json |
| Testing | Vitest 4 + Testing Library |
| ORM | Prisma 7 |

## Getting Started

### Prerequisites

- Node.js v18+ - [download](https://nodejs.org/)
- npm 

### Installation
Clone the repository https://github.com/<your-username>/Bank-Transaction.git
cd Bank-Transaction
```bash
npm install
```

### Running

```bash
npm run dev     # development server
npm run build   # production build
npm start       # production server
```

### Testing

```bash
npm run test          # watch mode
npm run test:run      # single run (headless)
npm run test:coverage # with coverage report
```

## Usage
Potential video demo once app is cleaned up more from testing stages.

## Roadmap
Direction and fixes for the project. 
- [ ] Accepts different formatted bank PDFs uploaded and parsed into the app
- [ ] Implemented AI on categorization rules to determine transactions more effectively rather than anticipating numerous stores recorded on transaction PDF that could be categorized anywhere.
- [ ] Adding a CI pipeline

## License
To be determined.