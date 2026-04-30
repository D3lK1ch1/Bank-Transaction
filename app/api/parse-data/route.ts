import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (buffer: Buffer) => Promise<{ text: string }>;
import { parseTransactions } from "@/lib/transactionParser";

export async function POST(req: NextRequest) {
  const formData: FormData = await req.formData();
  const uploadedFiles = formData.getAll("FILE");
  const MAX_SIZE = 8 * 1024 * 1024; // 8MB

  if (uploadedFiles && uploadedFiles.length > 0) {
    const uploadedFile = uploadedFiles[0];
    console.log('Uploaded file:', uploadedFile);

    if (uploadedFile instanceof File) {
      if (!uploadedFile.type.includes("pdf") && !uploadedFile.name.endsWith(".pdf")) {
        return new NextResponse(JSON.stringify({ error: "Only PDF files are accepted. Please upload a bank statement PDF." }), { status: 400 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (uploadedFile as any).size === 'number' && (uploadedFile as any).size > MAX_SIZE) {
        return new NextResponse(JSON.stringify({ error: "File too large. Maximum size is 8MB." }), { status: 413 });
      }

      const fileName = uuidv4();
      const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

      const data = await pdfParse(fileBuffer);
      const parsedText = data.text;

      const parsedData = parseTransactions(parsedText);

      return new NextResponse(JSON.stringify({
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
    } else {
      return new NextResponse("Uploaded file is not in the expected format.", { status: 500 });
    }
  } else {
    return new NextResponse("No File Found", { status: 404 });
  }
}
