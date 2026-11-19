"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface CourtFlowTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (item: T) => void;
  className?: string;
}

export function CourtFlowTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = "id",
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are currently no records to display matching your criteria.",
  pagination,
  onRowClick,
  className = "",
}: CourtFlowTableProps<T>) {
  const startRecord = pagination
    ? (pagination.currentPage - 1) * pagination.pageSize + 1
    : 1;
  const endRecord = pagination
    ? Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)
    : data.length;

  return (
    <div
      className={`rounded-2xl border border-[#eaecf0] bg-white overflow-hidden shadow-xs ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-[10px] font-extrabold text-slate-500 uppercase tracking-wider py-3 px-4 border-r border-slate-200/80 last:border-r-0 select-none ${
                    col.className || ""
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 animate-pulse">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400 mb-3">
                      <Inbox className="w-6 h-6 stroke-1" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{emptyTitle}</p>
                    <p className="text-xs text-slate-500 mt-1">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={item[keyField] ?? index}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-4 text-xs text-slate-700 align-middle border-r border-slate-200/70 last:border-r-0 ${
                        col.className || ""
                      }`}
                    >
                      {col.render ? col.render(item, index) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching CourtFlow image */}
      {pagination && pagination.totalRecords > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#eaecf0] bg-white text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{startRecord}</span> to{" "}
            <span className="font-semibold text-slate-700">{endRecord}</span> of{" "}
            <span className="font-semibold text-slate-700">{pagination.totalRecords}</span> results
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 flex items-center gap-1 transition-colors font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === pagination.currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => pagination.onPageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 flex items-center gap-1 transition-colors font-medium"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
