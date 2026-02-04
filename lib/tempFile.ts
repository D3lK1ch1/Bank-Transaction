import os from "os";
import path from "path";
import fs from "fs/promises";

export async function writeTempPDF(
  filename: string,
  buffer: Buffer
): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), "nextjs-pdf");
  await fs.mkdir(tmpDir, { recursive: true });

  const filePath = path.join(tmpDir, filename);
  await fs.writeFile(filePath, buffer);

  return filePath;
}
