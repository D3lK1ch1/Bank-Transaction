import { NextRequest, NextResponse } from "next/server"; 
import { promises as fs } from "fs"; 
import { v4 as uuidv4 } from "uuid";
import PDFParser from "pdf2json";  
import { writeTempPDF } from "@/lib/tempFile";
import { parseTransactions } from "@/lib/transactionParser";

export async function POST(req: NextRequest) {
  const formData: FormData = await req.formData();
  const uploadedFiles = formData.getAll("FILE");
  let fileName = "";
  let parsedText = "";
  const MAX_SIZE = 8 * 1024 * 1024; // 8MB
  if (uploadedFiles && uploadedFiles.length > 0) {
    const uploadedFile = uploadedFiles[0];
    console.log('Uploaded file:', uploadedFile);

    if (uploadedFile instanceof File) {
      // Validate that the file is a PDF
      if (!uploadedFile.type.includes("pdf") && !uploadedFile.name.endsWith(".pdf")) {
        console.log('Uploaded file is not a PDF.');
        return new NextResponse(JSON.stringify({ error: "Only PDF files are accepted. Please upload a bank statement PDF." }), { status: 400 });
      }

      // Validate size
      if (typeof (uploadedFile as any).size === 'number' && (uploadedFile as any).size > MAX_SIZE) {
        return new NextResponse(JSON.stringify({ error: "File too large. Maximum size is 8MB." }), { status: 413 });
      }

      fileName = uuidv4();
      const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());
      const tempFilePath = await writeTempPDF(`${crypto.randomUUID()}.pdf`, fileBuffer);

      try {
        await fs.writeFile(tempFilePath, fileBuffer);
        const pdfParser = new (PDFParser as any)(null, 1);

        await new Promise<void>((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", (errData: any) =>
          {console.log(errData.parserError);
          reject(errData.parserError);}
        );

          pdfParser.on("pdfParser_dataReady", () => {
              parsedText = (pdfParser as any).getRawTextContent();
              console.log("Total characters:", parsedText.length);
              console.log("First 500 chars:\n", parsedText.slice(0, 500));
              console.log("Contains numbers:", /\d/.test(parsedText)); 
              // Find the start of transaction details (second page)
              const startIndex = parsedText.indexOf("Transaction Details");
              if (startIndex !== -1) {
                parsedText = parsedText.slice(startIndex);
              }
              console.log("Parsed text starts with:", parsedText.slice(0, 200));
              resolve();
          });

          pdfParser.loadPDF(tempFilePath);
        });

        // Parse transactions from extracted text
        const parsedData = parseTransactions(parsedText);

        const response = new NextResponse(JSON.stringify({
          rawText: parsedText,
          transactions: parsedData.transactions,
          categorized: parsedData.categorized,
          monthlyGrouped: parsedData.monthlyGrouped,
          summary: parsedData.summary,
        }), {
          headers: {
            "Content-Type": "application/json",
            "FileName": fileName,
          },
        });
        return response;
      } finally {
        // Attempt to clean up temp file
        try {
          await fs.unlink(tempFilePath);
        } catch (e) {
          // ignore cleanup errors
        }
      }
    } else {
        console.log('Uploaded file is not in the expected format.');
      return new NextResponse("Uploaded file is not in the expected format.", {
        status: 500,
      });
    }
  } else {
    console.log('No files found.');
    return new NextResponse("No File Found", { status: 404 });
  }
}