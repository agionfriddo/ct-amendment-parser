"use client";

import { useState, useEffect, useRef } from "react";
import { Amendment } from "@/context/AmendmentsContext";
import axios from "axios";
import PdfViewer from "./PdfViewer";

interface PdfComparisonProps {
  leftAmendment: Amendment;
  rightAmendment: Amendment;
}

export default function PdfComparison({
  leftAmendment,
  rightAmendment,
}: PdfComparisonProps) {
  const [leftText, setLeftText] = useState<string>("");
  const [rightText, setRightText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leftError, setLeftError] = useState<string | null>(null);
  const [rightError, setRightError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"text" | "pdf">("text");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Refs for the text containers
  const leftTextRef = useRef<HTMLPreElement>(null);
  const rightTextRef = useRef<HTMLPreElement>(null);
  const [syncScrolling, setSyncScrolling] = useState(true);
  const isScrolling = useRef(false);

  // Extract text from PDFs using server-side API
  useEffect(() => {
    const fetchPdfText = async () => {
      setLoading(true);
      setError(null);
      setLeftError(null);
      setRightError(null);

      try {
        // Extract text from both PDFs using our server-side API
        const leftUrl = `/api/pdf-text?url=${encodeURIComponent(
          leftAmendment.lcoLink
        )}`;
        const rightUrl = `/api/pdf-text?url=${encodeURIComponent(
          rightAmendment.lcoLink
        )}`;

        const [leftTextResult, rightTextResult] = await Promise.allSettled([
          axios.get(leftUrl),
          axios.get(rightUrl),
        ]);

        // Handle left PDF result
        if (leftTextResult.status === "fulfilled") {
          console.log("leftTextResult", leftTextResult.value.data);
          setLeftText(leftTextResult.value.data.text);
        } else {
          const reason = leftTextResult.reason;
          console.error("Error extracting text from left PDF:", reason);

          let errorMsg =
            "Failed to extract text from left PDF. View the original PDF instead.";
          if (axios.isAxiosError(reason)) {
            errorMsg += ` (Status: ${
              reason.response?.status || "unknown"
            }, Message: ${reason.message})`;
            setDebugInfo({
              ...debugInfo,
              leftError: {
                message: reason.message,
                code: reason.code,
                status: reason.response?.status,
                data: reason.response?.data,
              },
            });
          }

          setLeftError(errorMsg);
        }

        // Handle right PDF result
        if (rightTextResult.status === "fulfilled") {
          setRightText(rightTextResult.value.data.text);
        } else {
          const reason = rightTextResult.reason;
          console.error("Error extracting text from right PDF:", reason);

          let errorMsg =
            "Failed to extract text from right PDF. View the original PDF instead.";
          if (axios.isAxiosError(reason)) {
            errorMsg += ` (Status: ${
              reason.response?.status || "unknown"
            }, Message: ${reason.message})`;
            setDebugInfo({
              ...debugInfo,
              rightError: {
                message: reason.message,
                code: reason.code,
                status: reason.response?.status,
                data: reason.response?.data,
              },
            });
          }

          setRightError(errorMsg);
        }

        // If both failed, show a general error
        if (
          leftTextResult.status === "rejected" &&
          rightTextResult.status === "rejected"
        ) {
          setError(
            "Failed to extract text from both PDFs. View the original documents instead."
          );
        }
      } catch (err) {
        console.error("Error in PDF text extraction process:", err);
        setError(
          "An error occurred during the text extraction process. View the original documents instead."
        );
        if (axios.isAxiosError(err)) {
          setDebugInfo({
            ...debugInfo,
            generalError: {
              message: err.message,
              code: err.code,
              status: err.response?.status,
              data: err.response?.data,
            },
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPdfText();
  }, [leftAmendment.lcoLink, rightAmendment.lcoLink]);

  // Set up synchronized scrolling
  useEffect(() => {
    if (!syncScrolling || viewMode !== "text") return;

    const handleLeftScroll = () => {
      if (
        !syncScrolling ||
        isScrolling.current ||
        !leftTextRef.current ||
        !rightTextRef.current
      )
        return;

      isScrolling.current = true;
      const scrollPercentage =
        leftTextRef.current.scrollTop /
        (leftTextRef.current.scrollHeight - leftTextRef.current.clientHeight);

      const targetScrollTop =
        scrollPercentage *
        (rightTextRef.current.scrollHeight - rightTextRef.current.clientHeight);

      rightTextRef.current.scrollTop = targetScrollTop;

      setTimeout(() => {
        isScrolling.current = false;
      }, 50);
    };

    const handleRightScroll = () => {
      if (
        !syncScrolling ||
        isScrolling.current ||
        !leftTextRef.current ||
        !rightTextRef.current
      )
        return;

      isScrolling.current = true;
      const scrollPercentage =
        rightTextRef.current.scrollTop /
        (rightTextRef.current.scrollHeight - rightTextRef.current.clientHeight);

      const targetScrollTop =
        scrollPercentage *
        (leftTextRef.current.scrollHeight - leftTextRef.current.clientHeight);

      leftTextRef.current.scrollTop = targetScrollTop;

      setTimeout(() => {
        isScrolling.current = false;
      }, 50);
    };

    const leftTextElement = leftTextRef.current;
    const rightTextElement = rightTextRef.current;

    if (leftTextElement) {
      leftTextElement.addEventListener("scroll", handleLeftScroll);
    }

    if (rightTextElement) {
      rightTextElement.addEventListener("scroll", handleRightScroll);
    }

    return () => {
      if (leftTextElement) {
        leftTextElement.removeEventListener("scroll", handleLeftScroll);
      }
      if (rightTextElement) {
        rightTextElement.removeEventListener("scroll", handleRightScroll);
      }
    };
  }, [syncScrolling, leftText, rightText, viewMode]);

  // Toggle synchronized scrolling
  const toggleSyncScrolling = () => {
    setSyncScrolling(!syncScrolling);
  };

  // Toggle view mode between text and PDF
  const toggleViewMode = () => {
    setViewMode(viewMode === "text" ? "pdf" : "text");
  };

  // Toggle debug information
  const toggleDebugInfo = () => {
    setDebugInfo(debugInfo ? null : { error, leftError, rightError });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Extracting text from PDFs...</p>
          <p className="text-sm text-gray-500">
            This may take a moment for large documents
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
        <div className="text-center flex-1">
          <h3 className="font-medium text-gray-900">
            {leftAmendment.chamber === "senate" ? "Senate" : "House"} Amendment
          </h3>
          <p className="text-sm text-gray-500">LCO {leftAmendment.lcoNumber}</p>
          <p className="text-sm text-gray-500">
            {new Date(leftAmendment.date).toLocaleDateString()}
          </p>
          <a
            href={leftAmendment.lcoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            View Original PDF
          </a>
        </div>

        <div className="flex flex-col items-center">
          {viewMode === "text" && (
            <button
              onClick={toggleSyncScrolling}
              className={`px-3 py-1 text-xs rounded mb-2 ${
                syncScrolling
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {syncScrolling ? "Sync Scrolling: ON" : "Sync Scrolling: OFF"}
            </button>
          )}

          <button
            onClick={toggleViewMode}
            className="px-3 py-1 text-xs rounded mb-2 bg-indigo-600 text-white"
          >
            {viewMode === "text" ? "Switch to PDF View" : "Switch to Text View"}
          </button>

          <button
            onClick={toggleDebugInfo}
            className="px-3 py-1 text-xs rounded mb-2 bg-gray-200 text-gray-700"
          >
            {debugInfo ? "Hide Debug Info" : "Show Debug Info"}
          </button>

          {error && (
            <div className="text-xs text-red-500 mt-1 max-w-xs text-center">
              {error}
            </div>
          )}
        </div>

        <div className="text-center flex-1">
          <h3 className="font-medium text-gray-900">
            {rightAmendment.chamber === "senate" ? "Senate" : "House"} Amendment
          </h3>
          <p className="text-sm text-gray-500">
            LCO {rightAmendment.lcoNumber}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(rightAmendment.date).toLocaleDateString()}
          </p>
          <a
            href={rightAmendment.lcoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            View Original PDF
          </a>
        </div>
      </div>

      {debugInfo && (
        <div className="p-4 bg-gray-100 border-b overflow-auto max-h-60">
          <h3 className="font-medium text-gray-900 mb-2">Debug Information</h3>
          <pre className="text-xs text-black dark:text-black bg-white dark:bg-gray-100 p-2 rounded border">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {viewMode === "text" ? (
        <div className="flex flex-1 overflow-hidden px-4">
          <div className="w-[49%] h-full overflow-hidden">
            <div className="bg-white shadow-sm rounded-lg p-4 h-full flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {leftAmendment.chamber === "senate" ? "Senate" : "House"}{" "}
                Amendment Text
              </h3>
              {leftError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <p className="text-sm text-red-700">{leftError}</p>
                </div>
              )}
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-500">
                  {leftText
                    ? `${leftText.length} characters extracted`
                    : "No text extracted"}
                </span>
              </div>
              <pre
                ref={leftTextRef}
                className="font-mono text-sm text-black dark:text-black whitespace-pre-wrap overflow-auto flex-1 border border-gray-200 p-2 rounded bg-white dark:bg-gray-100"
              >
                {leftText || "No text could be extracted from this PDF."}
              </pre>
            </div>
          </div>
          <div className="w-[2%]"></div>
          <div className="w-[49%] h-full overflow-hidden">
            <div className="bg-white shadow-sm rounded-lg p-4 h-full flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {rightAmendment.chamber === "senate" ? "Senate" : "House"}{" "}
                Amendment Text
              </h3>
              {rightError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <p className="text-sm text-red-700">{rightError}</p>
                </div>
              )}
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-500">
                  {rightText
                    ? `${rightText.length} characters extracted`
                    : "No text extracted"}
                </span>
              </div>
              <pre
                ref={rightTextRef}
                className="font-mono text-sm text-black dark:text-black whitespace-pre-wrap overflow-auto flex-1 border border-gray-200 p-2 rounded bg-white dark:bg-gray-100"
              >
                {rightText || "No text could be extracted from this PDF."}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden px-4">
          <div className="w-[49%] h-full overflow-hidden">
            <PdfViewer url={leftAmendment.lcoLink} />
          </div>
          <div className="w-[2%]"></div>
          <div className="w-[49%] h-full overflow-hidden">
            <PdfViewer url={rightAmendment.lcoLink} />
          </div>
        </div>
      )}
    </div>
  );
}
