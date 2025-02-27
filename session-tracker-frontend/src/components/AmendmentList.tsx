"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Amendment } from "@/context/AmendmentsContext";

interface AmendmentListProps {
  amendments: Amendment[];
  title: string;
}

export default function AmendmentList({
  amendments,
  title,
}: AmendmentListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Amendment>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedAmendments, setSelectedAmendments] = useState<string[]>([]);

  // Filter amendments based on search term
  const filteredAmendments = amendments.filter((amendment) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      amendment.billNumber.toLowerCase().includes(searchLower) ||
      amendment.lcoNumber.toLowerCase().includes(searchLower) ||
      amendment.calNumber.toLowerCase().includes(searchLower)
    );
  });

  // Sort amendments
  const sortedAmendments = [...filteredAmendments].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Handle sort change
  const handleSort = (field: keyof Amendment) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle amendment selection
  const toggleAmendmentSelection = (lcoNumber: string) => {
    setSelectedAmendments((prev) => {
      if (prev.includes(lcoNumber)) {
        return prev.filter((num) => num !== lcoNumber);
      } else {
        // Limit to 2 selections
        const newSelection = [...prev, lcoNumber];
        if (newSelection.length > 2) {
          newSelection.shift(); // Remove the first item if more than 2
        }
        return newSelection;
      }
    });
  };

  // Handle compare button click
  const handleCompare = () => {
    if (selectedAmendments.length === 2 && amendments.length > 0) {
      const billNumber = amendments[0].billNumber;
      router.push(
        `/dashboard/bill/${billNumber}/compare?left=${selectedAmendments[0]}&right=${selectedAmendments[1]}`
      );
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filteredAmendments.length} amendments found
            </p>
          </div>
          {amendments.length >= 2 && (
            <div>
              <button
                onClick={handleCompare}
                disabled={selectedAmendments.length !== 2}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  selectedAmendments.length === 2
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Compare Selected
              </button>
            </div>
          )}
        </div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search by bill number, LCO number, or calendar number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {amendments.length >= 2 && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Compare
                </th>
              )}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("chamber")}
              >
                Chamber
                {sortField === "chamber" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("billNumber")}
              >
                Bill Number
                {sortField === "billNumber" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("lcoNumber")}
              >
                LCO Number
                {sortField === "lcoNumber" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("calNumber")}
              >
                Calendar Number
                {sortField === "calNumber" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("date")}
              >
                Date
                {sortField === "date" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAmendments.length > 0 ? (
              sortedAmendments.map((amendment) => (
                <tr
                  key={`${amendment.chamber}-${amendment.lcoNumber}`}
                  className="hover:bg-gray-50"
                >
                  {amendments.length >= 2 && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedAmendments.includes(
                          amendment.lcoNumber
                        )}
                        onChange={() =>
                          toggleAmendmentSelection(amendment.lcoNumber)
                        }
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {amendment.chamber === "senate" ? "Senate" : "House"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link
                      href={`/dashboard/bill/${amendment.billNumber}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {amendment.billNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {amendment.lcoNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {amendment.calNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(amendment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link
                      href={`/dashboard/amendment/${amendment.chamber}/${amendment.lcoNumber}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      View Details
                    </Link>
                    <a
                      href={amendment.lcoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View PDF
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={amendments.length >= 2 ? 7 : 6}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                >
                  No amendments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
