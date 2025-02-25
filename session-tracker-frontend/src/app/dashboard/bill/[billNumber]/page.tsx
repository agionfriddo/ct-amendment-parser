"use client";

import { useParams, useRouter } from "next/navigation";
import { useAmendments } from "@/context/AmendmentsContext";
import AmendmentList from "@/components/AmendmentList";
import Link from "next/link";

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const billNumber = params.billNumber as string;
  const { getAmendmentsByBill, loading, error } = useAmendments();

  const amendments = getAmendmentsByBill(billNumber);

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

  if (amendments.length === 0) {
    return (
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            No amendments found for {billNumber}
          </h2>
          <p className="mt-2 text-gray-500">
            There are no amendments available for this bill number.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {billNumber}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {amendments.length} amendments for this bill
            </p>
          </div>
          <div className="mt-4 flex-shrink-0 flex md:mt-0 md:ml-4 space-x-3">
            {amendments.length >= 2 && (
              <Link
                href={`/dashboard/bill/${billNumber}/compare`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Compare Amendments
              </Link>
            )}
            <a
              href={amendments[0].billLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Bill
            </a>
          </div>
        </div>
      </div>

      <AmendmentList
        amendments={amendments}
        title={`Amendments for ${billNumber}`}
      />
    </div>
  );
}
