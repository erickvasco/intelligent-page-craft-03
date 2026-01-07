import mammoth from "mammoth";

export async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error("Falha ao extrair texto do documento");
  }
}

export function isDocxFile(file: File): boolean {
  const docxMimeTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];
  const docxExtensions = [".docx", ".doc"];
  
  const hasValidMime = docxMimeTypes.includes(file.type);
  const hasValidExtension = docxExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );
  
  return hasValidMime || hasValidExtension;
}
