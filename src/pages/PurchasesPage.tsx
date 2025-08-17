import { useEffect, useMemo, useState } from "react";
import {
  usePurchases,
  useItemsByPurchase,
  useSuppliers,
  useDeletePurchase,
} from "../lib/queries";
import type { PurchaseFilters, Supplier } from "../lib/types";
import { useSearchParams, useNavigate } from "react-router-dom";

export function PurchasesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initSupplier =
    Number(searchParams.get("supplier_id") || "0") || undefined;
  const [filters, setFilters] = useState<Partial<PurchaseFilters>>({
    supplier_id: initSupplier,
    date_from: searchParams.get("date_from") || undefined,
    date_to: searchParams.get("date_to") || undefined,
    invoice_no: searchParams.get("invoice_no") || undefined,
  });
  const { data, isLoading, isError, refetch } = usePurchases(filters, 1, 20);
  const deletePurchase = useDeletePurchase();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const items = useItemsByPurchase(selectedId ?? 0);
  const { data: suppliersPage } = useSuppliers();
  const suppliers: Supplier[] = useMemo(
    () => suppliersPage?.data || [],
    [suppliersPage],
  );

  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.supplier_id)
      next.set("supplier_id", String(filters.supplier_id));
    if (filters.date_from) next.set("date_from", filters.date_from);
    if (filters.date_to) next.set("date_to", filters.date_to);
    if (filters.invoice_no) next.set("invoice_no", filters.invoice_no);
    setSearchParams(next);
  }, [filters, setSearchParams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Purchases
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage and view all purchase entries
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          onClick={() => navigate("/purchases/new")}
        >
          <span>+</span>
          New Purchase Entry
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1">
            <label className="text-muted-foreground text-xs">Supplier</label>
            <select
              className="min-w-48 rounded border px-2 py-1 text-sm"
              value={filters.supplier_id ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  supplier_id: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
            >
              <option value="">All</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-muted-foreground text-xs">Invoice No</label>
            <input
              className="rounded border px-2 py-1 text-sm"
              placeholder="Search invoice no"
              value={filters.invoice_no ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  invoice_no: e.target.value || undefined,
                }))
              }
            />
          </div>
          <div className="grid gap-1">
            <label className="text-muted-foreground text-xs">From</label>
            <input
              type="date"
              className="rounded border px-2 py-1 text-sm"
              value={filters.date_from ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  date_from: e.target.value || undefined,
                }))
              }
            />
          </div>
          <div className="grid gap-1">
            <label className="text-muted-foreground text-xs">To</label>
            <input
              type="date"
              className="rounded border px-2 py-1 text-sm"
              value={filters.date_to ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  date_to: e.target.value || undefined,
                }))
              }
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_420px]">
          <div className="overflow-x-auto rounded-lg border shadow-sm">
            {isLoading ? (
              <div className="p-6 text-center text-slate-500">
                Loading purchases...
              </div>
            ) : isError ? (
              <div className="p-6 text-center text-red-500">
                Failed to load purchases
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left dark:bg-slate-800">
                  <tr>
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      Entry Date
                    </th>
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      Supplier
                    </th>
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      Invoice
                    </th>
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      Date
                    </th>
                    <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      Basic
                    </th>
                    <th className="p-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                      GST%
                    </th>
                    <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      SGST
                    </th>
                    <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      CGST
                    </th>
                    <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      IGST
                    </th>
                    <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      TDS
                    </th>
                    <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      Total
                    </th>
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      Status
                    </th>
                    <th className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {(data?.data || []).map((p) => {
                    const supplier = suppliers.find(
                      (s) => s.id === p.supplier_id,
                    );
                    return (
                      <tr
                        key={p.id}
                        className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          selectedId === p.id
                            ? "border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : ""
                        }`}
                        onClick={() => setSelectedId(p.id)}
                      >
                        <td className="p-3 text-slate-900 dark:text-slate-100">
                          {p.entry_date}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          <div
                            className="max-w-32 truncate"
                            title={supplier?.name || `#${p.supplier_id}`}
                          >
                            {supplier?.name || `#${p.supplier_id}`}
                          </div>
                        </td>
                        <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                          {p.invoice_no}
                        </td>
                        <td className="p-3 text-slate-900 dark:text-slate-100">
                          {p.date}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-900 dark:text-slate-100">
                          {p.basic_value.toFixed(2)}
                        </td>
                        <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                          {p.gst_rate}%
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {p.sgst.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {p.cgst.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {p.igst.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono text-red-600 dark:text-red-400">
                          {p.tds_value > 0
                            ? `-${p.tds_value.toFixed(2)}`
                            : "0.00"}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {p.invoice_value.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              p.status === "uploaded"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            className="mr-2 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/purchases/new?edit=${p.id}`);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this purchase?",
                                )
                              ) {
                                deletePurchase.mutate(p.id, {
                                  onSuccess: () => refetch(),
                                });
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-lg border bg-white shadow-sm dark:bg-slate-900">
            <div className="border-b border-slate-200 p-4 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                Purchase Details
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Click on a purchase to view items and details
              </p>
            </div>
            <div className="p-4">
              {!selectedId ? (
                <div className="py-8 text-center">
                  <div className="mb-2 text-slate-400 dark:text-slate-500">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Select a purchase to view items
                  </p>
                </div>
              ) : items.isLoading ? (
                <div className="py-8 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-slate-500">
                    Loading items...
                  </p>
                </div>
              ) : items.isError ? (
                <div className="py-8 text-center text-red-500">
                  <p className="text-sm">Failed to load items</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Purchase Summary */}
                  {(() => {
                    const purchase = data?.data?.find(
                      (p) => p.id === selectedId,
                    );
                    const supplier = suppliers.find(
                      (s) => s.id === purchase?.supplier_id,
                    );
                    return purchase ? (
                      <div className="mb-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Supplier:</span>{" "}
                            <span className="font-medium">
                              {supplier?.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Invoice:</span>{" "}
                            <span className="font-medium">
                              {purchase.invoice_no}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Date:</span>{" "}
                            <span className="font-medium">{purchase.date}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">GST Rate:</span>{" "}
                            <span className="font-medium">
                              {purchase.gst_rate}%
                            </span>
                          </div>
                        </div>
                        {purchase.narration && (
                          <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              <span className="font-medium">Narration:</span>{" "}
                              {purchase.narration}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}

                  {/* Items List */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Items
                    </h4>
                    <div className="space-y-2">
                      {(items.data || []).map((it) => (
                        <div
                          key={it.id}
                          className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {it.part_no && (
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {it.part_no}
                                  </span>
                                )}
                              </p>
                              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                {it.description}
                              </p>
                            </div>
                            <div className="ml-3 text-right">
                              <p className="font-mono text-sm text-slate-900 dark:text-slate-100">
                                {it.qty} × ₹{it.price.toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                = ₹{it.amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
