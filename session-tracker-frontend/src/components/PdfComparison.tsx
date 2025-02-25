"use client";

import { useState, useEffect } from "react";
import { Amendment } from "@/context/AmendmentsContext";
import axios from "axios";

// Define the interface for diff parts
interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

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
  const [diffLines, setDiffLines] = useState<DiffPart[]>([]);
  const [showDiff, setShowDiff] = useState(true);
  const [leftInfo, setLeftInfo] = useState<any>(null);
  const [rightInfo, setRightInfo] = useState<any>(null);
  const [processingStatus, setProcessingStatus] =
    useState<string>("Fetching PDFs...");
  const [retryCount, setRetryCount] = useState(0);
  const [leftError, setLeftError] = useState<string | null>(null);
  const [rightError, setRightError] = useState<string | null>(null);

  // Fetch PDF text content
  useEffect(() => {
    const fetchPdfText = async () => {
      setLoading(true);
      setError(null);
      setLeftError(null);
      setRightError(null);

      try {
        setProcessingStatus("Fetching PDFs...");

        // Fetch text from both PDFs with individual error handling
        const leftPromise = axios
          .get(`/api/pdf-text?url=${encodeURIComponent(leftAmendment.lcoLink)}`)
          .catch((err) => {
            console.error("Error fetching left PDF:", err);
            setLeftError(
              `Failed to extract text from left PDF: ${
                err.response?.data?.error || err.message
              }`
            );
            return { data: { text: "", info: null } };
          });

        const rightPromise = axios
          .get(
            `/api/pdf-text?url=${encodeURIComponent(rightAmendment.lcoLink)}`
          )
          .catch((err) => {
            console.error("Error fetching right PDF:", err);
            setRightError(
              `Failed to extract text from right PDF: ${
                err.response?.data?.error || err.message
              }`
            );
            return { data: { text: "", info: null } };
          });

        const [leftResponse, rightResponse] = await Promise.all([
          leftPromise,
          rightPromise,
        ]);

        setLeftText(leftResponse.data.text || "");
        setRightText(rightResponse.data.text || "");
        setLeftInfo(leftResponse.data.info || null);
        setRightInfo(rightResponse.data.info || null);

        // Check if we have text from both PDFs
        const hasLeftText =
          leftResponse.data.text && leftResponse.data.text.trim().length > 0;
        const hasRightText =
          rightResponse.data.text && rightResponse.data.text.trim().length > 0;

        if (!hasLeftText) {
          setLeftError(
            "No text could be extracted from this PDF. It may be a scanned document or have security restrictions."
          );
        }

        if (!hasRightText) {
          setRightError(
            "No text could be extracted from this PDF. It may be a scanned document or have security restrictions."
          );
        }

        // Only proceed with diff if we have text from both PDFs
        if (hasLeftText && hasRightText) {
          setProcessingStatus("Analyzing differences...");
          await generateDiff(leftResponse.data.text, rightResponse.data.text);
        } else {
          // We can still show the texts side by side even if diff fails
          setShowDiff(false);

          if (!hasLeftText && !hasRightText) {
            setError(
              "Failed to extract text from both PDFs. They may be scanned documents or have security restrictions."
            );
          } else {
            setError(
              "Failed to extract text from one PDF. Showing available text in side-by-side view."
            );
          }
        }
      } catch (err) {
        console.error("Error in PDF comparison process:", err);
        setError(
          "An error occurred during the comparison process. Please try viewing the original documents."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPdfText();
  }, [leftAmendment.lcoLink, rightAmendment.lcoLink, retryCount]);

  // Generate diff between two texts
  const generateDiff = async (text1: string, text2: string) => {
    try {
      // Dynamically import the diff library
      const diffModule = await import("diff");
      const diffLines = diffModule.diffLines(text1, text2);
      setDiffLines(diffLines);
    } catch (err) {
      console.error("Error generating diff:", err);
      setError(
        "Failed to generate diff between documents. Switching to side-by-side view."
      );
      setShowDiff(false);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{processingStatus}</p>
          <p className="text-sm text-gray-500">
            This may take a moment for large documents
          </p>
        </div>
      </div>
    );
  }

  // If we have a critical error that prevents showing anything useful
  if (error && !leftText.trim() && !rightText.trim()) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 max-w-2xl w-full">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-4 items-center">
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Retry Extraction
          </button>
          <div className="flex space-x-4">
            <a
              href={leftAmendment.lcoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              View Left PDF
            </a>
            <a
              href={rightAmendment.lcoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              View Right PDF
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const addedLines = diffLines
    .filter((part) => part.added)
    .reduce((acc, part) => acc + (part.value.split("\n").length - 1), 0);
  const removedLines = diffLines
    .filter((part) => part.removed)
    .reduce((acc, part) => acc + (part.value.split("\n").length - 1), 0);
  const unchangedLines = diffLines
    .filter((part) => !part.added && !part.removed)
    .reduce((acc, part) => acc + (part.value.split("\n").length - 1), 0);

  const totalDifferences = addedLines + removedLines;
  const hasDifferences = totalDifferences > 0;

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
          {leftInfo && (
            <p className="text-xs text-gray-400">{leftInfo.pages} pages</p>
          )}
          {leftError && (
            <p className="text-xs text-red-500">Text extraction issue</p>
          )}
        </div>
        <div className="flex flex-col items-center mx-4">
          <div className="flex space-x-2 mb-2">
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`px-3 py-1 text-xs rounded ${
                showDiff
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              disabled={!hasDifferences}
            >
              {showDiff ? "Showing Diff" : "Side by Side"}
            </button>
            <button
              onClick={handleRetry}
              className="px-3 py-1 text-xs rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Retry
            </button>
          </div>
          {hasDifferences && (
            <div className="text-xs text-gray-500">
              <span className="text-green-600">{addedLines} additions</span> |
              <span className="text-red-600"> {removedLines} removals</span>
            </div>
          )}
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
          {rightInfo && (
            <p className="text-xs text-gray-400">{rightInfo.pages} pages</p>
          )}
          {rightError && (
            <p className="text-xs text-red-500">Text extraction issue</p>
          )}
        </div>
      </div>

      {showDiff && hasDifferences ? (
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          <div className="bg-white shadow-sm rounded-lg p-4 max-w-5xl mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Differences Between Amendments
            </h3>
            {!hasDifferences && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      No significant differences detected between these
                      amendments. They may be identical or the text extraction
                      may not have captured all content.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="font-mono text-sm whitespace-pre-wrap">
              {diffLines.length > 0 ? (
                diffLines.map((part, index) => (
                  <div
                    key={index}
                    className={`${
                      part.added
                        ? "bg-green-100 text-green-800"
                        : part.removed
                        ? "bg-red-100 text-red-800"
                        : ""
                    } ${
                      part.added || part.removed
                        ? "px-1 py-0.5 rounded my-1"
                        : ""
                    }`}
                  >
                    {part.value}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  No differences found or text extraction incomplete.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 h-full border-r p-4 overflow-auto">
            <div className="bg-white shadow-sm rounded-lg p-4 h-full">
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
                <a
                  href={leftAmendment.lcoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  View Original PDF
                </a>
              </div>
              <pre className="font-mono text-sm whitespace-pre-wrap overflow-auto h-[calc(100%-6rem)] border border-gray-200 p-2 rounded">
                {leftText || "No text could be extracted from this PDF."}
              </pre>
            </div>
          </div>
          <div className="w-1/2 h-full p-4 overflow-auto">
            <div className="bg-white shadow-sm rounded-lg p-4 h-full">
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
                <a
                  href={rightAmendment.lcoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  View Original PDF
                </a>
              </div>
              <pre className="font-mono text-sm whitespace-pre-wrap overflow-auto h-[calc(100%-6rem)] border border-gray-200 p-2 rounded">
                {rightText || "No text could be extracted from this PDF."}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
