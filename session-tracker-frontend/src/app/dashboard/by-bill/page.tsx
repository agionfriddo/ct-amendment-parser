"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAmendments } from "@/context/AmendmentsContext";

type SortField = "billNumber" | "latestDate";
type SortDirection = "asc" | "desc";
type ChamberFilter = "all" | "senate" | "house" | "both";

export default function ByBillPage() {
  const { senateAmendments, houseAmendments, loading, error } = useAmendments();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("latestDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [chamberFilter, setChamberFilter] = useState<ChamberFilter>("all");

  // Group amendments by bill number
  const billGroups = useMemo(() => {
    const allAmendments = [...senateAmendments, ...houseAmendments];
    const groups = allAmendments.reduce((acc, amendment) => {
      const { billNumber } = amendment;
      if (!acc[billNumber]) {
        acc[billNumber] = [];
      }
      acc[billNumber].push(amendment);
      return acc;
    }, {} as Record<string, typeof allAmendments>);

    // Convert to array and sort by bill number
    return Object.entries(groups).map(([billNumber, amendments]) => ({
      billNumber,
      amendments,
      count: amendments.length,
      chambers: [...new Set(amendments.map((a) => a.chamber))],
      latestDate: new Date(
        Math.max(...amendments.map((a) => new Date(a.date).getTime()))
      ),
    }));
  }, [senateAmendments, houseAmendments]);

  // Filter bill groups based on search term and chamber filter
  const filteredBillGroups = useMemo(() => {
    let filtered = billGroups;

    // Apply text search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((group) =>
        group.billNumber.toLowerCase().includes(term)
      );
    }

    // Apply chamber filter
    if (chamberFilter !== "all") {
      if (chamberFilter === "both") {
        filtered = filtered.filter(
          (group) =>
            group.chambers.includes("senate") &&
            group.chambers.includes("house")
        );
      } else {
        filtered = filtered.filter((group) =>
          group.chambers.includes(chamberFilter)
        );
      }
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortField === "billNumber") {
        return sortDirection === "asc"
          ? a.billNumber.localeCompare(b.billNumber)
          : b.billNumber.localeCompare(a.billNumber);
      } else {
        // Sort by latestDate
        return sortDirection === "asc"
          ? a.latestDate.getTime() - b.latestDate.getTime()
          : b.latestDate.getTime() - a.latestDate.getTime();
      }
    });
  }, [billGroups, searchTerm, chamberFilter, sortField, sortDirection]);

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Amendments by Bill
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              View amendments grouped by bill number
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700"
            >
              Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by bill number"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="chamber"
              className="block text-sm font-medium text-gray-700"
            >
              Chamber
            </label>
            <select
              id="chamber"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
              value={chamberFilter}
              onChange={(e) =>
                setChamberFilter(e.target.value as ChamberFilter)
              }
            >
              <option value="all">All Chambers</option>
              <option value="senate">Senate Only</option>
              <option value="house">House Only</option>
              <option value="both">Both Chambers</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Sort by:</span>
            <button
              className={`px-3 py-1 text-sm rounded-md ${
                sortField === "billNumber"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              onClick={() => handleSortChange("billNumber")}
            >
              Bill Number{" "}
              {sortField === "billNumber" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-md ${
                sortField === "latestDate"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              onClick={() => handleSortChange("latestDate")}
            >
              Last Updated{" "}
              {sortField === "latestDate" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-500">
            {filteredBillGroups.length} bills found
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {filteredBillGroups.length > 0 ? (
            filteredBillGroups.map((group) => (
              <li key={group.billNumber} className="hover:bg-gray-50">
                <Link
                  href={`/dashboard/bill/${group.billNumber}`}
                  className="block px-4 py-4 sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-medium text-indigo-600 truncate">
                        {group.billNumber}
                      </p>
                      <div className="mt-2 flex flex-wrap">
                        <div className="flex items-center text-sm text-gray-500 mr-6">
                          <svg
                            className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Last updated: {group.latestDate.toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg
                            className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path
                              fillRule="evenodd"
                              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {group.count} amendments
                        </div>
                      </div>
                      <div className="mt-2">
                        {group.chambers.includes("senate") && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2">
                            Senate
                          </span>
                        )}
                        {group.chambers.includes("house") && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            House
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          ) : (
            <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
              No bills found matching your search criteria
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
