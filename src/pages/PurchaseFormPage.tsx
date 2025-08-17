import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  usePurchases,
  useItemsByPurchase,
  useSuppliers,
  useDeletePurchase,
} from "../lib/queries";
import type { PurchaseFilters, Supplier, PurchaseEntry } from "../lib/types";
import { PurchaseForm } from "../components/purchases/PurchaseForm";

export function PurchaseFormPage() {
  const navigate = useNavigate();
  const [filters] = useState<Partial<PurchaseFilters>>({});
  const { data, isLoading, isError, refetch } = usePurchases(filters, 1, 10);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<PurchaseEntry | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const items = useItemsByPurchase(selectedId ?? 0);
  const { data: suppliersPage } = useSuppliers();
  const suppliers: Supplier[] = useMemo(
    () => suppliersPage?.data || [],
    [suppliersPage],
  );
  const deletePurchase = useDeletePurchase();

  const handleCreated = () => {
    // Refresh the purchase list after creating new entry
    refetch();
  };

  const handleUpdated = () => {
    setEditing(null);
    // clear ?edit param if present
    if (searchParams.get("edit")) {
      searchParams.delete("edit");
      setSearchParams(searchParams, { replace: true });
    }
    refetch();
  };

  // If navigated with ?edit=<id>, pick from current list when available
  useEffect(() => {
    const idStr = searchParams.get("edit");
    if (!idStr) return;
    const id = Number(idStr);
    const entry = data?.data.find((p) => p.id === id) || null;
    if (entry) setEditing(entry);
  }, [searchParams, data]);

  const handleCancel = () => {
    navigate("/purchases");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Purchase Entry
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Enter purchases and view recent entries in real-time
          </p>
        </div>
        <button
          onClick={handleCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm transition-colors hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          ← Back to Full List
        </button>
      </div>

      {/* Purchase Form - Full Width */}
      <div className="space-y-6">
        <div className="rounded-lg border bg-white shadow-sm dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Quick Entry Form
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Form stays open for continuous entry
            </p>
          </div>
          <div className="p-4">
            <PurchaseForm
              onCreated={handleCreated}
              onUpdated={handleUpdated}
              initial={editing}
            />
          </div>
        </div>

        {/* Recent Purchases List - Moved Down */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-white shadow-sm dark:bg-slate-900">
            <div className="border-b border-slate-200 p-4 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                Recent Entries
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Latest 10 purchases with all details - updates automatically
                after each entry
              </p>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-6 text-center text-slate-500">
                  Loading recent purchases...
                </div>
              ) : isError ? (
                <div className="p-6 text-center text-red-500">
                  Failed to load purchases
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left dark:bg-slate-800">
                    <tr>
                      <th className="p-2 font-semibold text-slate-700 dark:text-slate-300">
                        Entry Date
                      </th>
                      <th className="p-2 font-semibold text-slate-700 dark:text-slate-300">
                        Supplier
                      </th>
                      <th className="p-2 font-semibold text-slate-700 dark:text-slate-300">
                        Invoice
                      </th>
                      <th className="p-2 font-semibold text-slate-700 dark:text-slate-300">
                        Date
                      </th>
                      <th className="p-2 text-right font-semibold text-slate-700 dark:text-slate-300">
                        Basic
                      </th>
                      <th className="p-2 text-center font-semibold text-slate-700 dark:text-slate-300">
                        GST%
                      </th>
                      <th className="p-2 text-right font-semibold text-slate-700 dark:text-slate-300">
                        SGST
                      </th>
                      <th className="p-2 text-right font-semibold text-slate-700 dark:text-slate-300">
                        CGST
                      </th>
                      <th className="p-2 text-right font-semibold text-slate-700 dark:text-slate-300">
                        IGST
                      </th>
                      <th className="p-2 text-right font-semibold text-slate-700 dark:text-slate-300">
                        TDS
                      </th>
                      <th className="p-2 text-right font-semibold text-slate-700 dark:text-slate-300">
                        Total
                      </th>
                      <th className="p-2 font-semibold text-slate-700 dark:text-slate-300">
                        Status
                      </th>
                      <th className="p-2 text-right font-semibold text-slate-700 dark:text-slate-300">
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
                          onClick={() =>
                            setSelectedId(selectedId === p.id ? null : p.id)
                          }
                        >
                          <td className="p-2 text-xs text-slate-900 dark:text-slate-100">
                            {p.entry_date}
                          </td>
                          <td className="p-2 text-xs text-slate-700 dark:text-slate-300">
                            <div
                              className="max-w-20 truncate"
                              title={supplier?.name || `#${p.supplier_id}`}
                            >
                              {supplier?.name || `#${p.supplier_id}`}
                            </div>
                          </td>
                          <td className="p-2 text-xs font-medium text-slate-900 dark:text-slate-100">
                            {p.invoice_no}
                          </td>
                          <td className="p-2 text-xs text-slate-900 dark:text-slate-100">
                            {p.date}
                          </td>
                          <td className="p-2 text-right font-mono text-xs text-slate-900 dark:text-slate-100">
                            ₹{p.basic_value.toFixed(2)}
                          </td>
                          <td className="p-2 text-center font-mono text-xs text-slate-900 dark:text-slate-100">
                            {p.gst_rate}%
                          </td>
                          <td className="p-2 text-right font-mono text-xs text-slate-900 dark:text-slate-100">
                            ₹{p.sgst.toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-mono text-xs text-slate-900 dark:text-slate-100">
                            ₹{p.cgst.toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-mono text-xs text-slate-900 dark:text-slate-100">
                            ₹{p.igst.toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-mono text-xs text-slate-900 dark:text-slate-100">
                            ₹{p.tds_value.toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-mono text-base font-bold text-blue-700 dark:text-blue-300">
                            ₹{p.invoice_value.toFixed(2)}
                          </td>
                          <td className="p-2 text-center text-xs">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                p.status === "uploaded"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : p.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              className="mr-2 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing(p);
                                // also reflect in URL for deep-link
                                searchParams.set("edit", String(p.id));
                                setSearchParams(searchParams, {
                                  replace: true,
                                });
                                // focus top
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm("Delete this purchase?")) {
                                  await deletePurchase.mutateAsync(p.id);
                                  refetch();
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
          </div>

          {/* Purchase Details Panel */}
          {selectedId && (
            <div className="rounded-lg border bg-white shadow-sm dark:bg-slate-900">
              <div className="border-b border-slate-200 p-4 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                  Purchase Details
                </h3>
              </div>
              <div className="p-4">
                {items.isLoading ? (
                  <div className="py-4 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-slate-500">
                      Loading details...
                    </p>
                  </div>
                ) : items.isError ? (
                  <div className="py-4 text-center text-red-500">
                    <p className="text-sm">Failed to load details</p>
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
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500">Supplier:</span>{" "}
                              <span className="font-medium">
                                {supplier?.name}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">GST Rate:</span>{" "}
                              <span className="font-medium">
                                {purchase.gst_rate}%
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">CGST:</span>{" "}
                              <span className="font-medium">
                                ₹{purchase.cgst.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">SGST:</span>{" "}
                              <span className="font-medium">
                                ₹{purchase.sgst.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">IGST:</span>{" "}
                              <span className="font-medium">
                                ₹{purchase.igst.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">TDS:</span>{" "}
                              <span className="font-medium text-red-600">
                                -₹{purchase.tds_value.toFixed(2)}
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

                    {/* Items */}
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Items
                      </h4>
                      <div className="space-y-2">
                        {(items.data || []).map((it) => (
                          <div
                            key={it.id}
                            className="rounded border border-slate-200 p-2 dark:border-slate-700"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {it.part_no && (
                                    <span className="text-blue-600 dark:text-blue-400">
                                      {it.part_no} -{" "}
                                    </span>
                                  )}
                                  {it.description}
                                </p>
                              </div>
                              <div className="ml-2 text-right">
                                <p className="font-mono text-sm text-slate-900 dark:text-slate-100">
                                  {it.qty} × ₹{it.price.toFixed(2)} = ₹
                                  {it.amount.toFixed(2)}
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
          )}
        </div>
      </div>
    </div>
  );
}
