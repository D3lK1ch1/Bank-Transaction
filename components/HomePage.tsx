'use client'

import React, { useState } from "react";
import FileUpload from "@/components/FileUploader"
import TransactionDisplay from "@/components/TransactionDisplay"
import type { Transaction } from "@/lib/transactionParser";

interface ParsedData {
  rawText: string;
  transactions: Transaction[];
  categorized: Record<string, Transaction[]>;
  monthlyGrouped: Record<string, Transaction[]>;
  summary: {
    totalDeposits: number;
    totalWithdrawals: number;
    netAmount: number;
  };
}

const PDFParser = () => {
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(() => {
      return file;
    }); 

    setLoading(true);
    setError(null);
  };

   return (
      <>
          <FileUpload
              onFileUpload={handleFileUpload}
              setParsedText={(text: string) => {
                try {
                  const data = JSON.parse(text);
                  setParsedData(data);
                } catch (e) {
                  setError("Failed to parse response. Please try again.");
                  console.error("Parse error:", e);
                }
                setLoading(false);
              }}
              maxSize={8 * 1024 * 1024} // 8 MB
            />
        {loading && (
          <div className="mt-6 flex items-center justify-center">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
          </div>
        )}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}
        {parsedData && (
          <div className="mt-6 w-full">
            <TransactionDisplay 
              transactions={parsedData.transactions}
              categorized={parsedData.categorized}
              monthlyGrouped={parsedData.monthlyGrouped}
              summary={parsedData.summary}
            />
          </div>
        )}
    </>
  )
}

export default PDFParser;