import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import pdfParse from "pdf-parse";

export async function GET(request: NextRequest) {
  console.log("PDF text extraction API called");
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    console.log(`Fetching PDF from URL: ${url}`);

    // Create a custom HTTPS agent that ignores SSL certificate errors
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    // Fetch the PDF using axios with SSL verification disabled
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      httpsAgent: httpsAgent,
    });

    // Get the PDF data as Buffer (pdf-parse expects a Buffer)
    const pdfBuffer = Buffer.from(response.data);
    console.log(`PDF fetched, size: ${pdfBuffer.length} bytes`);

    // Extract text from PDF using pdf-parse
    const data = await pdfParse(pdfBuffer);

    console.log(`Total text extracted: ${data.text.length} characters`);
    return NextResponse.json(
      {
        text: data.text,
        pages: data.numpages,
        info: data.info,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return NextResponse.json(
      {
        error: "Failed to extract text from PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
