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
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Create proxied URL to avoid CORS issues
  const proxiedUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

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

  return (
    <div className="h-screen">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
        <div className="h-full">
          <Viewer
            fileUrl={proxiedUrl}
            plugins={[defaultLayoutPluginInstance]}
          />
        </div>
      </Worker>
    </div>
  );
}
