"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { TransactionList } from "@/components/transaction-list";
import { formatQuantity } from "@/lib/utils";
import { getTransactionsForDate } from "@/app/actions/admin";
import type { TransactionWithDetails } from "@/types";

/** Get today's date string in IST (YYYY-MM-DD) */
function getTodayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/** Format a YYYY-MM-DD date as a readable IST label */
function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface SummaryRow {
  direction: string;
  total: number;
  count: number;
}

export function ReportsDatePicker() {
  const [selectedDate, setSelectedDate] = useState(getTodayIST);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [txList, setTxList] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTransactionsForDate(date);
      if (result.error) {
        setError(result.error);
        setSummary([]);
        setTxList([]);
      } else {
        setSummary(result.summary as SummaryRow[]);
        setTxList(result.transactions as TransactionWithDetails[]);
      }
    } catch {
      setError("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  const inRow = summary.find((r) => r.direction === "in");
  const outRow = summary.find((r) => r.direction === "out");
  const isToday = selectedDate === getTodayIST();

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-gray-900">
          {isToday ? "Today\u2019s" : formatDateLabel(selectedDate)} Transactions (IST)
        </h3>
        <input
          type="date"
          value={selectedDate}
          max={getTodayIST()}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {loading && (
        <p className="text-sm text-gray-500 py-4 text-center">Loading…</p>
      )}

      {error && (
        <p className="text-sm text-red-600 py-2">{error}</p>
      )}

      {!loading && !error && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-green-50">
              <p className="text-xs text-gray-500">Stock In</p>
              <p className="text-xl font-bold text-green-700">
                {formatQuantity(inRow?.total ?? 0)}
              </p>
              <p className="text-xs text-gray-500">{inRow?.count ?? 0} entries</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <p className="text-xs text-gray-500">Stock Out</p>
              <p className="text-xl font-bold text-red-700">
                {formatQuantity(outRow?.total ?? 0)}
              </p>
              <p className="text-xs text-gray-500">{outRow?.count ?? 0} entries</p>
            </div>
          </div>

          {/* Transaction list */}
          {txList.length > 0 ? (
            <TransactionList transactions={txList} showProduct />
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No transactions on this date.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
