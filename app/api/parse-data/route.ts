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

  if (uploadedFiles && uploadedFiles.length > 0) {
    const uploadedFile = uploadedFiles[0];
    console.log('Uploaded file:', uploadedFile);

    if (uploadedFile instanceof File) {
      // Validate that the file is a PDF
      if (!uploadedFile.type.includes("pdf") && !uploadedFile.name.endsWith(".pdf")) {
        console.log('Uploaded file is not a PDF.');
        return new NextResponse("Only PDF files are accepted.", {
          status: 400,
        });
      }

      fileName = uuidv4();
      
      const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());
      const tempFilePath = await writeTempPDF(`${crypto.randomUUID()}.pdf`, fileBuffer);

      await fs.writeFile(tempFilePath, fileBuffer); 
      const pdfParser = new (PDFParser as any)(null, 1);

      pdfParser.on("pdfParser_dataError", (errData: any) =>
        console.log(errData.parserError)
      );

      pdfParser.on("pdfParser_dataReady", () => {
        console.log((pdfParser as any).getRawTextContent());
        parsedText = (pdfParser as any).getRawTextContent();
      });

      await new Promise((resolve, reject) => {
        pdfParser.loadPDF(tempFilePath);
        pdfParser.on("pdfParser_dataReady", resolve);
        pdfParser.on("pdfParser_dataError", reject);
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