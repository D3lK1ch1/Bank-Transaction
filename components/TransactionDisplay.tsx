'use client'

import React, { useMemo } from "react";
import type { Transaction } from "@/lib/transactionParser";

interface TransactionDisplayProps {
  transactions: Transaction[];
  categorized: Record<string, Transaction[]>;
  monthlyGrouped: Record<string, Transaction[]>;
  summary: {
    totalDeposits: number;
    totalWithdrawals: number;
    netAmount: number;
  };
}

export default function TransactionDisplay({
  transactions,
  categorized,
  monthlyGrouped,
  summary,
}: TransactionDisplayProps) {
  const categoryColors: Record<string, string> = {
    groceries: "bg-green-100 text-green-800",
    transport: "bg-blue-100 text-blue-800",
    utilities: "bg-yellow-100 text-yellow-800",
    rent: "bg-red-100 text-red-800",
    education: "bg-purple-100 text-purple-800",
    shopping: "bg-pink-100 text-pink-800",
    food: "bg-orange-100 text-orange-800",
    entertainment: "bg-indigo-100 text-indigo-800",
    healthcare: "bg-cyan-100 text-cyan-800",
    misc: "bg-gray-100 text-gray-800",
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || categoryColors.misc;
  };

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600">Total Deposits</p>
            <p className="text-2xl font-bold text-green-600">
              +${summary.totalDeposits.toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600">Total Withdrawals</p>
            <p className="text-2xl font-bold text-red-600">
              -${summary.totalWithdrawals.toFixed(2)}
            </p>
          </div>
          <div
            className={`p-4 rounded-lg border ${
              summary.netAmount >= 0
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <p className="text-sm text-gray-600">Net Amount</p>
            <p
              className={`text-2xl font-bold ${
                summary.netAmount >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {summary.netAmount >= 0 ? "+" : ""}
              ${summary.netAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      {Object.keys(monthlyGrouped).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Monthly Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(monthlyGrouped)
              .sort()
              .map(([month, monthTransactions]) => {
                const deposits = monthTransactions.reduce(
                  (sum, t) => sum + t.deposit,
                  0
                );
                const withdrawals = monthTransactions.reduce(
                  (sum, t) => sum + t.withdrawal,
                  0
                );
                const net = deposits - withdrawals;

                return (
                  <div
                    key={month}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-lg">{month}</p>
                        <p className="text-sm text-gray-600">
                          {monthTransactions.length} transactions
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-green-600 font-semibold">
                          +${deposits.toFixed(2)}
                        </p>
                        <p className="text-red-600 font-semibold">
                          -${withdrawals.toFixed(2)}
                        </p>
                        <p
                          className={`font-bold ${
                            net >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {net >= 0 ? "+" : ""}${net.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {Object.keys(categorized).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Category Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(categorized)
              .sort(([, a], [, b]) => {
                const totalA = a.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                const totalB = b.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                return totalB - totalA;
              })
              .map(([category, categoryTransactions]) => {
                const total = categoryTransactions.reduce(
                  (sum, t) => sum + t.amount,
                  0
                );
                const totalAbsolute = categoryTransactions.reduce(
                  (sum, t) => sum + Math.abs(t.amount),
                  0
                );

                return (
                  <div
                    key={category}
                    className={`p-4 rounded-lg border-2 ${getCategoryColor(
                      category
                    )}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold capitalize">{category}</p>
                      <span className="text-xs font-medium">
                        {categoryTransactions.length} items
                      </span>
                    </div>
                    <p
                      className={`text-2xl font-bold ${
                        total >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {total >= 0 ? "+" : ""}${total.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Total spending: ${totalAbsolute.toFixed(2)}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Transactions List */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">All Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-left p-3 font-semibold">Description</th>
                  <th className="text-left p-3 font-semibold">Category</th>
                  <th className="text-right p-3 font-semibold">Withdrawal</th>
                  <th className="text-right p-3 font-semibold">Deposit</th>
                  <th className="text-right p-3 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.slice(0, 50).map((transaction, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-600">
                      {transaction.date || "N/A"}
                    </td>
                    <td className="p-3">{transaction.description}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                          transaction.category || "misc"
                        )}`}
                      >
                        {transaction.category || "misc"}
                      </span>
                    </td>
                    <td className="p-3 text-right text-red-600 font-medium">
                      {transaction.withdrawal > 0
                        ? `-$${transaction.withdrawal.toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="p-3 text-right text-green-600 font-medium">
                      {transaction.deposit > 0
                        ? `+$${transaction.deposit.toFixed(2)}`
                        : "-"}
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${
                        transaction.amount >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.amount >= 0 ? "+" : ""}
                      ${transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length > 50 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Showing 50 of {transactions.length} transactions
              </p>
            )}
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">
            No transactions found. Check if the PDF format is supported.
          </p>
        </div>
      )}
    </div>
  );
}
