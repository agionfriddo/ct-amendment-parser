"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

export interface Amendment {
  billNumber: string;
  date: string;
  lcoLink: string;
  billLink: string;
  lcoNumber: string;
  calNumber: string;
  chamber: "senate" | "house";
}

interface AmendmentsContextType {
  senateAmendments: Amendment[];
  houseAmendments: Amendment[];
  loading: boolean;
  error: string | null;
  refreshAmendments: () => Promise<void>;
  getAmendmentsByBill: (billNumber: string) => Amendment[];
}

const AmendmentsContext = createContext<AmendmentsContextType | undefined>(
  undefined
);

export function useAmendments() {
  const context = useContext(AmendmentsContext);
  if (context === undefined) {
    throw new Error("useAmendments must be used within an AmendmentsProvider");
  }
  return context;
}

interface AmendmentsProviderProps {
  children: ReactNode;
}

export function AmendmentsProvider({ children }: AmendmentsProviderProps) {
  const { data: session, status } = useSession();
  const [senateAmendments, setSenateAmendments] = useState<Amendment[]>([]);
  const [houseAmendments, setHouseAmendments] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAmendments = async () => {
    // Don't fetch if not authenticated
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [senateResponse, houseResponse] = await Promise.all([
        axios.get("/api/amendments/senate"),
        axios.get("/api/amendments/house"),
      ]);

      // Handle potential error responses
      if (
        senateResponse.status === 401 ||
        !Array.isArray(senateResponse.data)
      ) {
        console.error(
          "Unauthorized or invalid senate response:",
          senateResponse.data
        );
        setSenateAmendments([]);
      } else {
        setSenateAmendments(
          senateResponse.data.map((item: any) => ({
            ...item,
            chamber: "senate",
          }))
        );
      }

      if (houseResponse.status === 401 || !Array.isArray(houseResponse.data)) {
        console.error(
          "Unauthorized or invalid house response:",
          houseResponse.data
        );
        setHouseAmendments([]);
      } else {
        setHouseAmendments(
          houseResponse.data.map((item: any) => ({ ...item, chamber: "house" }))
        );
      }
    } catch (err) {
      setError("Failed to fetch amendments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch amendments when authentication status changes to authenticated
    if (status === "authenticated") {
      fetchAmendments();
    } else if (status === "unauthenticated") {
      // Clear data and loading state when not authenticated
      setSenateAmendments([]);
      setHouseAmendments([]);
      setLoading(false);
    }
  }, [status]);

  const refreshAmendments = async () => {
    await fetchAmendments();
  };

  const getAmendmentsByBill = (billNumber: string): Amendment[] => {
    return [
      ...senateAmendments.filter((a) => a.billNumber === billNumber),
      ...houseAmendments.filter((a) => a.billNumber === billNumber),
    ];
  };

  const value = {
    senateAmendments,
    houseAmendments,
    loading,
    error,
    refreshAmendments,
    getAmendmentsByBill,
  };

  return (
    <AmendmentsContext.Provider value={value}>
      {children}
    </AmendmentsContext.Provider>
  );
}
