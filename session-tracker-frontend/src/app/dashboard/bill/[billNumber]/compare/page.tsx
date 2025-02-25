"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAmendments, Amendment } from "@/context/AmendmentsContext";
import PdfComparison from "@/components/PdfComparison";
import Link from "next/link";

export default function CompareAmendmentsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const billNumber = params.billNumber as string;
  const leftLco = searchParams.get("left");
  const rightLco = searchParams.get("right");

  const { getAmendmentsByBill, loading, error } = useAmendments();
  const [leftAmendment, setLeftAmendment] = useState<Amendment | null>(null);
  const [rightAmendment, setRightAmendment] = useState<Amendment | null>(null);

  const amendments = getAmendmentsByBill(billNumber);

  useEffect(() => {
    if (amendments.length > 0) {
      if (leftLco) {
        const left = amendments.find((a) => a.lcoNumber === leftLco);
        if (left) setLeftAmendment(left);
      }

      if (rightLco) {
        const right = amendments.find((a) => a.lcoNumber === rightLco);
        if (right) setRightAmendment(right);
      }
    }
  }, [amendments, leftLco, rightLco]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading amendments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
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
    );
  }

  if (amendments.length < 2) {
    return (
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Cannot Compare Amendments
          </h2>
          <p className="mt-2 text-gray-500">
            This bill needs at least two amendments to compare.
          </p>
          <Link
            href={`/dashboard/bill/${billNumber}`}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Bill
          </Link>
        </div>
      </div>
    );
  }

  if (!leftAmendment || !rightAmendment) {
    return (
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Select Amendments to Compare
          </h2>
          <p className="mt-2 text-gray-500">
            Please select two amendments to compare for {billNumber}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Amendment
              </label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={leftLco || ""}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  url.searchParams.set("left", e.target.value);
                  router.push(url.toString());
                }}
              >
                <option value="">Select an amendment</option>
                {amendments.map((amendment) => (
                  <option
                    key={`left-${amendment.lcoNumber}`}
                    value={amendment.lcoNumber}
                  >
                    {amendment.chamber === "senate" ? "Senate" : "House"} - LCO{" "}
                    {amendment.lcoNumber} (
                    {new Date(amendment.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Second Amendment
              </label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={rightLco || ""}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  url.searchParams.set("right", e.target.value);
                  router.push(url.toString());
                }}
              >
                <option value="">Select an amendment</option>
                {amendments.map((amendment) => (
                  <option
                    key={`right-${amendment.lcoNumber}`}
                    value={amendment.lcoNumber}
                  >
                    {amendment.chamber === "senate" ? "Senate" : "House"} - LCO{" "}
                    {amendment.lcoNumber} (
                    {new Date(amendment.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`/dashboard/bill/${billNumber}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Bill
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white shadow px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Comparing Amendments for {billNumber}
          </h2>
        </div>
        <div>
          <Link
            href={`/dashboard/bill/${billNumber}`}
            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Bill
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <PdfComparison
          leftAmendment={leftAmendment}
          rightAmendment={rightAmendment}
        />
      </div>
    </div>
  );
}
