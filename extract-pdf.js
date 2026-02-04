const PDFParser = require('pdf2json');
const fs = require('fs');
const path = require('path');

const pdfPath = process.argv[2];
const pdfParser = new PDFParser(null, 1);

pdfParser.on('pdfParser_dataError', (errData) => {
  console.error('PDF Error:', errData.parserError);
  process.exit(1);
});

pdfParser.on('pdfParser_dataReady', () => {
  const text = pdfParser.getRawTextContent();
  console.log(text);
  process.exit(0);
});

pdfParser.loadPDF(pdfPath);
