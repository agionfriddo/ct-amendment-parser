"use client";

import { useState, useEffect } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

interface PdfViewerProps {
  url: string;
}

export default function PdfViewer({ url }: PdfViewerProps) {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Create proxied URL to avoid CORS issues
  const proxiedUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Loading PDF viewer...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-lg p-4">
        <p className="text-red-500 font-medium mb-2">Error loading PDF</p>
        <p className="text-gray-700 text-sm mb-4">{error}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Open PDF in New Tab
        </a>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <div className="h-full">
          <Viewer
            fileUrl={proxiedUrl}
            plugins={[defaultLayoutPluginInstance]}
            onDocumentLoad={() => {
              // PDF loaded successfully
              console.log("PDF document loaded successfully");
            }}
            renderError={(errorMessage) => {
              // Set the error state
              if (!error) {
                const errorText =
                  typeof errorMessage === "string"
                    ? errorMessage
                    : "Failed to load PDF";
                setError(errorText);
              }

              // Return an empty div (will be replaced by our error UI above)
              return <div style={{ display: "none" }} />;
            }}
          />
        </div>
      </Worker>
    </div>
  );
}
