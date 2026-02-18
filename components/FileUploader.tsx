"use client";

import { File, UploadCloud, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface FileUploadProgress {
  progress: number;
  file: File;
}

const PdfColor = {
  bgColor: "bg-blue-400",
  fillColor: "fill-blue-400",
};

export default function FileUpload({
  onFileUpload,
  setParsedText,
  maxSize,
}: {
  onFileUpload: (file: File) => void;
  setParsedText: (text: string) => void;
  maxSize: number;
}) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filesToUpload, setFilesToUpload] = useState<FileUploadProgress[]>([]);

  const getFileIconAndColor = (file: File) => {
    if (file.type.includes("pdf")) {
      return {
        icon: <File size={40} className={PdfColor.fillColor} />,
        color: PdfColor.bgColor,
      };
    }

    return null;
  };

  const removeFile = (file: File) => {
    setFilesToUpload((prevUploadProgress) => {
      return prevUploadProgress.filter((item) => item.file !== file);
    });
  };

  const uploadFileToApi = async (file: File) => {
    const formData = new FormData();
    formData.append("FILE", file);

    setErrorMsg(null);
    try {
      const response = await fetch("/api/parse-data", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        // try parse JSON error
        try {
          const err = JSON.parse(text);
          throw new Error(err.error || text || "Failed to upload file");
        } catch {
          throw new Error(text || "Failed to upload file");
        }
      }

      const data = await response.json();
      setParsedText(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error uploading file:", error);
      const message = error instanceof Error ? error.message : String(error);
      setErrorMsg(message);
      setParsedText(`Error: ${message}`);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 1) {   
        setErrorMsg("You can only upload one file at a time.");
        return;
      }

      const file = acceptedFiles[0];
      if (file.size > maxSize) {
        setErrorMsg("File too large. Max 8MB.");
        return;
      }
      setFilesToUpload([{ file, progress: 100 }]);
      onFileUpload(file);
      await uploadFileToApi(file);
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: maxSize,
  });

  return (
    <div>
      <div>
        <label
          {...getRootProps()}
          className="relative flex flex-col items-center justify-center w-full py-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="text-center">
            <div className="border p-2 rounded-md max-w-min mx-auto">
              <UploadCloud size={20} />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold">Drag and drop PDF files</span>
            </p>
            <p className="text-xs text-gray-500">
              Click to upload files (files should be under 8 MB)
            </p>
          </div>
        </label>
        <Input
          {...getInputProps()}
          id="dropzone-file"
          accept="application/pdf"
          type="file"
          className="hidden"
        />
      </div>

      {filesToUpload.length > 0 && (
        <div>
          <div className="h-40">
            <p className="font-medium my-2 mt-6 text-muted-foreground text-sm">
              Files to upload
            </p>
            <div className="space-y-2 pr-3">
              {filesToUpload.map((fileUploadProgress) => {
                return (
                  <div
                    key={fileUploadProgress.file.lastModified}
                    className="flex justify-between gap-2 rounded-lg overflow-hidden border border-slate-100 group hover:pr-0 pr-2"
                  >
                    <div className="flex items-center flex-1 p-2">
                      <div className="text-white">
                        {getFileIconAndColor(fileUploadProgress.file)?.icon}
                      </div>
                      <div className="w-full ml-2 space-y-1">
                        <div className="text-sm flex justify-between">
                          <p className="text-muted-foreground ">
                            {fileUploadProgress.file.name.slice(0, 25)}
                          </p>
                          <span className="text-xs">
                            {fileUploadProgress.progress}%
                          </span>
                        </div>
                        <Progress
                          value={fileUploadProgress.progress}
                          className={
                            getFileIconAndColor(fileUploadProgress.file)?.color
                          }
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(fileUploadProgress.file)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') removeFile(fileUploadProgress.file);
                      }}
                      aria-label={`Remove ${fileUploadProgress.file.name}`}
                      className="bg-red-500 text-white transition-all items-center justify-center cursor-pointer px-2 hidden group-hover:flex focus:outline focus:ring"
                    >
                      <X size={20} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}