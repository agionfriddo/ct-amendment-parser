import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import { getServerSession } from "next-auth";
import pdfParse from "pdf-parse";

export async function GET(request: NextRequest) {
  console.log("PDF-TEXT API ROUTE CALLED");

  // Check authentication
  const session = await getServerSession();
  console.log("Session:", session ? "Authenticated" : "Not authenticated");

  if (!session) {
    console.log("Unauthorized access attempt to pdf-text API");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  // Try different URL formats if the original fails
  const tryFetchPDF = async (pdfUrl: string) => {
    console.log(`Attempting to fetch PDF from: ${pdfUrl}`);

    // Create a custom https agent that ignores SSL certificate errors
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    try {
      // Use axios to fetch the PDF with the custom agent
      const response = await axios.get(pdfUrl, {
        responseType: "arraybuffer",
        httpsAgent,
        timeout: 60000, // 60 second timeout
        headers: {
          Accept: "application/pdf, application/octet-stream",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        validateStatus: function (status) {
          return status < 500; // Accept any status code less than 500 to handle 404s gracefully
        },
      });

      // Check if we got a 404 or other error
      if (response.status !== 200) {
        console.warn(`Received status ${response.status} for URL: ${pdfUrl}`);
        return null;
      }

      console.log(
        `PDF fetched successfully, content-type: ${response.headers["content-type"]}, size: ${response.data.byteLength} bytes`
      );

      return response;
    } catch (error) {
      console.error(`Error fetching from ${pdfUrl}:`, error);
      return null;
    }
  };

  try {
    // Try the original URL first
    let response = await tryFetchPDF(url);

    // If original URL fails, try alternative formats
    if (!response) {
      console.log("Original URL failed, trying alternative formats...");

      // Try lowercase extension
      if (url.endsWith(".PDF")) {
        const lowercaseUrl = url.replace(".PDF", ".pdf");
        response = await tryFetchPDF(lowercaseUrl);
        if (response) console.log("Lowercase PDF extension worked!");
      }

      // Try alternative year format (if URL contains year)
      if (!response && url.includes("/2024/")) {
        const altYearUrl = url.replace("/2024/", "/2023/");
        response = await tryFetchPDF(altYearUrl);
        if (response) console.log("Alternative year format worked!");
      }

      // Try alternative path structure
      if (!response && url.includes("/lcoamd/pdf/")) {
        const altPathUrl = url.replace("/lcoamd/pdf/", "/amd/pdf/");
        response = await tryFetchPDF(altPathUrl);
        if (response) console.log("Alternative path structure worked!");
      }
    }

    // If all attempts failed, return an error
    if (!response) {
      return NextResponse.json(
        {
          error: "PDF not found",
          details:
            "The PDF could not be found at the specified URL or any alternative URLs we tried.",
          url: url,
        },
        { status: 404 }
      );
    }

    // Check if we actually got a PDF
    const contentType = response.headers["content-type"];
    if (
      !contentType?.includes("pdf") &&
      !contentType?.includes("application/octet-stream")
    ) {
      console.warn(`Warning: Content-Type is not PDF: ${contentType}`);
    }

    // Use pdf-parse with custom options for better extraction
    const options = {
      // Limit the number of pages to parse if the PDF is very large
      max: 0, // 0 means parse all pages
      // Enable text content rendering
      pagerender: undefined,
      // Custom rendering context
      renderContext: undefined,
    };

    try {
      console.log("Attempting to parse PDF with pdf-parse...");
      const data = await pdfParse(Buffer.from(response.data), options);

      // Check if we got meaningful text
      if (data.text && data.text.trim().length > 0) {
        console.log(
          `PDF parsed successfully, extracted ${data.text.length} characters of text from ${data.numpages} pages`
        );

        return NextResponse.json({
          text: data.text,
          contentType: contentType,
          info: {
            pages: data.numpages,
            metadata: data.info,
          },
        });
      } else {
        console.warn("PDF parsed but no text was extracted");
        throw new Error("No text content found in PDF");
      }
    } catch (parseError) {
      console.error("Error in primary PDF parsing:", parseError);

      // Fallback: Try a simpler approach to extract some text
      console.log("Attempting fallback text extraction...");
      const buffer = Buffer.from(response.data);
      let text = "";

      // Simple text extraction - look for text patterns in PDF
      for (let i = 0; i < buffer.length - 10; i++) {
        // Look for text objects in the PDF
        if (
          (buffer[i] === 0x54 && buffer[i + 1] === 0x6a) || // Tj
          (buffer[i] === 0x54 && buffer[i + 1] === 0x44) || // TD
          (buffer[i] === 0x54 && buffer[i + 1] === 0x66) // Tf
        ) {
          // Extract some characters after a potential text marker
          let j = i + 2;
          let chunk = "";
          while (
            j < buffer.length &&
            j < i + 200 && // Increased from 100 to 200
            buffer[j] >= 32 &&
            buffer[j] <= 126
          ) {
            chunk += String.fromCharCode(buffer[j]);
            j++;
          }
          if (chunk.length > 3) {
            text += chunk + "\n";
          }
        }
      }

      if (text.length > 0) {
        console.log(`Fallback extraction found ${text.length} characters`);
        return NextResponse.json({
          text: text,
          contentType: contentType,
          info: {
            pages: "unknown",
            metadata: null,
            extractionMethod: "fallback",
          },
        });
      }

      // If we get here, both methods failed
      throw new Error("All text extraction methods failed");
    }
  } catch (error) {
    console.error("Error extracting PDF text:", error);

    // Provide more detailed error information
    let errorMessage = "Failed to extract text from PDF";
    let statusCode = 500;
    let details = error instanceof Error ? error.message : String(error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        errorMessage = "PDF not found";
        statusCode = 404;
        details =
          "The PDF could not be found at the specified URL. Please check if the URL is correct.";
      } else {
        errorMessage = `Network error: ${error.message}`;
        statusCode = error.response?.status || 500;
        details = JSON.stringify({
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
        });
      }
    }

    console.error(
      `PDF extraction failed with status ${statusCode}: ${errorMessage}`
    );

    return NextResponse.json(
      {
        error: errorMessage,
        details: details,
        url: url, // Include the URL that failed for debugging
      },
      { status: statusCode }
    );
  }
}
