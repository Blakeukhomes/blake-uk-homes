declare module 'pdf-parse' {
  interface PdfParseResult {
    text: string
    numpages: number
    info: any
    metadata: any
  }
  function pdfParse(dataBuffer: Buffer | Uint8Array): Promise<PdfParseResult>
  export default pdfParse
}
