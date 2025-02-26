"use client";

import { useState } from "react";
import { Amendment } from "@/context/AmendmentsContext";
import PdfViewer from "./PdfViewer";

interface PdfComparisonProps {
  leftAmendment: Amendment;
  rightAmendment: Amendment;
}

export default function PdfComparison({
  leftAmendment,
  rightAmendment,
}: PdfComparisonProps) {
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

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 h-full border-r overflow-hidden">
          <PdfViewer url={leftAmendment.lcoLink} />
        </div>
        <div className="w-1/2 h-full overflow-hidden">
          <PdfViewer url={rightAmendment.lcoLink} />
        </div>
      </div>
    </div>
  );
}
