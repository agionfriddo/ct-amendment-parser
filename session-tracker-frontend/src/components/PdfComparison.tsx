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
  const [processingStatus, setProcessingStatus] =
    useState<string>("Fetching PDFs...");
  const [viewMode, setViewMode] = useState<"text" | "pdf">("text");

  // Refs for the text containers
  const leftTextRef = useRef<HTMLPreElement>(null);
  const rightTextRef = useRef<HTMLPreElement>(null);
  const [syncScrolling, setSyncScrolling] = useState(true);
  const isScrolling = useRef(false);

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

        if (!hasLeftText && !hasRightText) {
          setError(
            "Failed to extract text from both PDFs. They may be scanned documents or have security restrictions."
          );
          // Automatically switch to PDF view mode if text extraction failed for both
          setViewMode("pdf");
        }
      } catch (err) {
        console.error("Error in PDF comparison process:", err);
        setError(
          "An error occurred during the comparison process. Please try viewing the original documents."
        );
        // Automatically switch to PDF view mode on error
        setViewMode("pdf");
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

      {viewMode === "text" ? (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 h-full border-r p-4 overflow-hidden">
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
                className="font-mono text-sm whitespace-pre-wrap overflow-auto flex-1 border border-gray-200 p-2 rounded"
              >
                {leftText || "No text could be extracted from this PDF."}
              </pre>
            </div>
          </div>
          <div className="w-1/2 h-full p-4 overflow-hidden">
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
                className="font-mono text-sm whitespace-pre-wrap overflow-auto flex-1 border border-gray-200 p-2 rounded"
              >
                {rightText || "No text could be extracted from this PDF."}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 h-full border-r overflow-hidden">
            <PdfViewer url={leftAmendment.lcoLink} />
          </div>
          <div className="w-1/2 h-full overflow-hidden">
            <PdfViewer url={rightAmendment.lcoLink} />
          </div>
        </div>
      )}
    </div>
  );
}
