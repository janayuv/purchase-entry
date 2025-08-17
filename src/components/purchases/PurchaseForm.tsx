import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  useAddPurchase,
  useSuppliers,
  useUpdatePurchase,
} from "../../lib/queries";
import type {
  PurchaseCreate,
  PurchaseItemPayload,
  Supplier,
  PurchaseEntry,
  PurchaseUpdate,
} from "../../lib/types";
import { useItemMaster } from "../../lib/itemMaster";

export function PurchaseForm({
  onCreated,
  onUpdated,
  initial,
}: {
  onCreated?: () => void;
  onUpdated?: () => void;
  initial?: PurchaseEntry | null;
}) {
  const addMutation = useAddPurchase();
  const updateMutation = useUpdatePurchase();
  const { data: suppliersPage } = useSuppliers();
  const suppliers: Supplier[] = useMemo(
    () => suppliersPage?.data || [],
    [suppliersPage],
  );

  // Form refs for keyboard navigation
  const supplierRef = useRef<HTMLInputElement>(null);
  const invoiceNoRef = useRef<HTMLInputElement>(null);
  const partRef = useRef<HTMLInputElement>(null);
  const assessableRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const [entryDate, setEntryDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [gstRate, setGstRate] = useState<number | "">("");
  const [narration, setNarration] = useState("");
  const [narrationTouched, setNarrationTouched] = useState(false);
  const [assessable, setAssessable] = useState<number | "">("");
  const [difference, setDifference] = useState<number | "">("");
  const [partQuery, setPartQuery] = useState("");
  const [part, setPart] = useState<{
    id?: number;
    part_no?: string | null;
    description: string;
  } | null>(null);
  const [openPartSuggest, setOpenPartSuggest] = useState(false);
  const [openSupplierSuggest, setOpenSupplierSuggest] = useState(false);
  const [lastEntry, setLastEntry] = useState<{
    supplierId: number | "";
    supplierSearch: string;
    gstRate: number | "";
    part: { id?: number; part_no?: string | null; description: string } | null;
    partQuery: string;
  } | null>(null);
  const itemApi = useItemMaster();
  const selectedSupplier = suppliers.find((s) => s.id === Number(supplierId));
  const isTN = (selectedSupplier?.gst_no || "").startsWith("33");
  // Convert values to numbers, ensuring proper calculation
  const assessableNum = Number(assessable) || 0;
  const gstRateNum = Number(gstRate) || 0;
  const differenceNum = Number(difference) || 0;

  // GST calculation - only on base amount (assessable), not on difference
  const gstAmount = assessableNum * (gstRateNum / 100);
  const cgst = gstRateNum > 0 && isTN ? gstAmount / 2 : 0;
  const sgst = gstRateNum > 0 && isTN ? gstAmount / 2 : 0;
  const igst = gstRateNum > 0 && !isTN ? gstAmount : 0;

  // TDS calculation on base amount only
  const tds = selectedSupplier?.tds_flag
    ? assessableNum * ((selectedSupplier.tds_rate || 0) / 100)
    : 0;

  // Total calculation: base amount + GST + difference (TDS excluded as per requirement)
  const invoiceValue = assessableNum + cgst + sgst + igst + differenceNum;

  // When editing, prefill form from initial
  useEffect(() => {
    if (!initial) return;
    try {
      // entry_date like 'YYYY-MM-DD HH:MM:SS' -> take date part
      const ed = (initial.entry_date || "").slice(0, 10);
      setEntryDate(ed || new Date().toISOString().slice(0, 10));
      setSupplierId(initial.supplier_id);
      const supplierName =
        suppliers.find((s) => s.id === initial.supplier_id)?.name || "";
      setSupplierSearch(supplierName);
      setInvoiceNo(initial.invoice_no);
      // stored date is YYYY-MM-DD; convert back to dd-mm-yy for the input UX
      const d = initial.date;
      if (d && d.length === 10) {
        const [y, m, day] = d.split("-");
        setInvoiceDate(`${day}-${m}-${y.slice(2)}`);
      } else {
        setInvoiceDate(initial.date || "");
      }
      setGstRate(initial.gst_rate);
      setAssessable(initial.basic_value);
      // difference isn't stored separately; derive from invoice_value - (basic + gst)
      const gstAmt = initial.cgst + initial.sgst + initial.igst;
      const diff = initial.invoice_value - (initial.basic_value + gstAmt);
      setDifference(Number(diff.toFixed(2)));
      setNarration(initial.narration || "");
      setNarrationTouched(!!initial.narration);
      // Part is not normalized in DB; keep last chosen or leave null
      setPart(null);
      setPartQuery("");
    } catch (err) {
      // Safe guard: if prefill parsing fails, log and continue with defaults
      console.debug("[PurchaseForm] Prefill failed", err);
    }
  }, [initial, suppliers]);

  const autoNarration = useCallback(() => {
    const partText = part?.description || partQuery || "part";
    const supplierText = selectedSupplier?.name || "supplier";
    const tdsText =
      selectedSupplier?.tds_flag && (selectedSupplier?.tds_rate || 0) > 0
        ? ` TDS amounted ${tds.toFixed(2)} deducted for ${(selectedSupplier.tds_rate || 0).toFixed(2)}% Assessable value`
        : "";
    return `${partText} purchased from ${supplierText} Invoice no ${invoiceNo || "-"} / ${invoiceDate}${tdsText}`;
  }, [part, partQuery, selectedSupplier, tds, invoiceNo, invoiceDate]);

  // Convert dd-mm-yy format to YYYY-MM-DD for database
  const convertDateFormat = useCallback((dateStr: string): string => {
    if (!dateStr) return "";

    // Handle dd-mm-yy format
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      // Convert 2-digit year to 4-digit (assuming 20xx for years 00-99)
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // If already in correct format or invalid, return as is
    return dateStr;
  }, []);

  // Debug logger: logs whenever key inputs change
  useEffect(() => {
    const supplierName = selectedSupplier?.name || null;
    const supplierGST = selectedSupplier?.gst_no || null;
    const supplierTDSFlag = !!selectedSupplier?.tds_flag;
    const supplierTDSRate = selectedSupplier?.tds_rate ?? null;
    console.log("[PurchaseForm Debug]", {
      entryDate,
      supplierId,
      supplierName,
      supplierGST,
      supplierTDSFlag,
      supplierTDSRate,
      isTN,
      invoiceNo,
      invoiceDate,
      part,
      partQuery,
      gstRate,
      assessable,
      difference,
      computed: { cgst, sgst, igst, tds, invoiceValue },
      narrationPreview: autoNarration(),
    });
    // We purposely depend on all relevant inputs/computed values
    // to log their latest snapshot for verification.
  }, [
    entryDate,
    supplierId,
    selectedSupplier,
    isTN,
    invoiceNo,
    invoiceDate,
    part,
    partQuery,
    gstRate,
    assessable,
    difference,
    cgst,
    sgst,
    igst,
    tds,
    invoiceValue,
    autoNarration,
  ]);

  // Keyboard shortcuts and navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      // Simulate down arrow key behavior - focus next field or submit
      const currentElement = document.activeElement as HTMLElement;
      const focusableElements = Array.from(
        document.querySelectorAll(
          'input, button, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ) as HTMLElement[];
      const currentIndex = focusableElements.indexOf(currentElement);
      if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
        focusableElements[currentIndex + 1].focus();
      } else {
        submitRef.current?.click();
      }
    } else if (e.ctrlKey && e.key === "d") {
      e.preventDefault();
      duplicateLastEntry();
    } else if (e.key === "Tab") {
      // Enhanced tab navigation handled by tabIndex
    }
  };

  const duplicateLastEntry = () => {
    if (lastEntry) {
      setSupplierId(lastEntry.supplierId);
      setSupplierSearch(lastEntry.supplierSearch);
      setGstRate(lastEntry.gstRate);
      setPart(lastEntry.part);
      setPartQuery(lastEntry.partQuery);
      // Focus on invoice number for quick entry
      setTimeout(() => invoiceNoRef.current?.focus(), 100);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) return;

    if (initial) {
      // Update mode
      const up: PurchaseUpdate = {
        id: initial.id,
        supplier_id: Number(supplierId),
        invoice_no: invoiceNo,
        date: convertDateFormat(invoiceDate),
        entry_date: `${entryDate} 00:00:00`,
        gst_rate: gstRateNum,
        basic_value: Number(assessableNum.toFixed(2)),
        sgst: Number(sgst.toFixed(2)),
        cgst: Number(cgst.toFixed(2)),
        igst: Number(igst.toFixed(2)),
        invoice_value: Number(invoiceValue.toFixed(2)),
        tds_value: Number(tds.toFixed(2)),
        narration: narrationTouched ? narration : autoNarration(),
        status: "uploaded",
        // Items editing not supported in this quick edit path; omit to keep existing
      };
      await updateMutation.mutateAsync(up);
      onUpdated?.();
      return;
    }

    const payload: PurchaseCreate = {
      supplier_id: Number(supplierId),
      invoice_no: invoiceNo,
      date: convertDateFormat(invoiceDate),
      entry_date: entryDate ? `${entryDate} 00:00:00` : undefined,
      gst_rate: gstRateNum,
      basic_value: Number(assessableNum.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      cgst: Number(cgst.toFixed(2)),
      igst: Number(igst.toFixed(2)),
      invoice_value: Number(invoiceValue.toFixed(2)),
      tds_value: Number(tds.toFixed(2)),
      narration: narrationTouched ? narration : autoNarration(),
      status: "uploaded",
      items: part
        ? [
            {
              part_no: part.part_no || "",
              description: part.description,
              qty: 1,
              price: Number(assessableNum.toFixed(2)),
              amount: Number(assessableNum.toFixed(2)),
            } as PurchaseItemPayload,
          ]
        : [],
    };

    // Save current entry for duplication
    setLastEntry({
      supplierId,
      supplierSearch,
      gstRate,
      part,
      partQuery,
    });

    await addMutation.mutateAsync(payload);

    // Reset form but keep dates
    setSupplierId("");
    setSupplierSearch("");
    setInvoiceNo("");
    setGstRate("");
    setAssessable("");
    setDifference("");
    setPart(null);
    setPartQuery("");
    setNarration("");
    setNarrationTouched(false);

    // Focus on supplier for next entry
    setTimeout(() => supplierRef.current?.focus(), 100);
    onCreated?.();
  }

  return (
    <div className="rounded-lg border bg-gradient-to-br from-slate-50 to-blue-50 p-4 shadow-sm dark:from-slate-900 dark:to-slate-800">
      {/* Quick Actions Header */}
      <div className="mb-4 flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">
            {initial ? "Edit Purchase" : "Quick Entry"}
          </h3>
          <div className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-700">
            {initial ? "Ctrl+Enter: Update" : "Ctrl+Enter: Save"} | Ctrl+D:
            Duplicate Last
          </div>
        </div>
        {!initial && lastEntry && (
          <button
            type="button"
            onClick={duplicateLastEntry}
            className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
          >
            Duplicate Last Entry
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} onKeyDown={handleKeyDown} className="space-y-3">
        {/* Compact Main Entry Row */}
        <div className="grid grid-cols-12 items-end gap-2">
          {/* Entry Date */}
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Entry Date
            </label>
            <input
              type="date"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              tabIndex={1}
              required
            />
          </div>

          {/* Supplier */}
          <div className="relative col-span-3">
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Supplier *
            </label>
            <input
              ref={supplierRef}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              placeholder="Type supplier name..."
              value={supplierSearch}
              onFocus={() => setOpenSupplierSuggest(true)}
              onChange={(e) => {
                setSupplierSearch(e.target.value);
                setOpenSupplierSuggest(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && openSupplierSuggest) {
                  e.preventDefault();
                  const filtered = suppliers.filter((s) =>
                    s.name.toLowerCase().includes(supplierSearch.toLowerCase()),
                  );
                  if (filtered.length > 0) {
                    setSupplierId(filtered[0].id);
                    setSupplierSearch(filtered[0].name);
                    // Reset part selection when supplier changes
                    setPart(null);
                    setPartQuery("");
                    setOpenSupplierSuggest(false);
                    invoiceNoRef.current?.focus();
                  }
                }
              }}
              tabIndex={2}
              required
            />
            {openSupplierSuggest && (
              <div className="absolute right-0 left-0 z-20 mt-1 max-h-48 overflow-auto rounded border border-slate-300 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
                {suppliers
                  .filter((s) =>
                    s.name.toLowerCase().includes(supplierSearch.toLowerCase()),
                  )
                  .slice(0, 6)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-slate-700 ${supplierId === s.id ? "bg-blue-100 dark:bg-slate-600" : ""}`}
                      onClick={() => {
                        setSupplierId(s.id);
                        setSupplierSearch(s.name);
                        // Reset part selection when supplier changes
                        setPart(null);
                        setPartQuery("");
                        setOpenSupplierSuggest(false);
                        invoiceNoRef.current?.focus();
                      }}
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.gst_no}</div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Invoice No */}
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Invoice No *
            </label>
            <input
              ref={invoiceNoRef}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && partRef.current?.focus()}
              tabIndex={3}
              required
            />
          </div>

          {/* Invoice Date */}
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Invoice Date
            </label>
            <input
              type="text"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              placeholder="dd-mm-yy"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              tabIndex={4}
              required
            />
          </div>
        </div>

        {/* Part & Amount Row */}
        <div className="grid grid-cols-12 items-end gap-2">
          {/* Part */}
          <div className="relative col-span-5">
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Part *
            </label>
            <input
              ref={partRef}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              placeholder="Type part number or description..."
              value={partQuery}
              onFocus={() => setOpenPartSuggest(true)}
              onChange={(e) => {
                setPartQuery(e.target.value);
                setOpenPartSuggest(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && openPartSuggest) {
                  e.preventDefault();
                  const preferred = Number(supplierId) || null;
                  const base = itemApi.search(partQuery);
                  const list = preferred
                    ? base.filter((x) => (x.supplier_id ?? null) === preferred)
                    : base;
                  if (list.length > 0) {
                    const s = list[0];
                    setPart({
                      id: s.id,
                      part_no: s.part_no || "",
                      description: s.description,
                    });
                    setPartQuery(`${s.part_no || "-"} — ${s.description}`);
                    if (typeof s.gst_percent === "number" && s.gst_percent > 0)
                      setGstRate(s.gst_percent);
                    setOpenPartSuggest(false);
                    assessableRef.current?.focus();
                  }
                }
              }}
              tabIndex={5}
              required
            />
            {openPartSuggest && partQuery.length > 0 && (
              <div className="absolute right-0 left-0 z-20 mt-1 max-h-48 overflow-auto rounded border border-slate-300 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
                {(() => {
                  const preferred = Number(supplierId) || null;
                  const base = itemApi.search(partQuery);
                  const filtered = preferred
                    ? base.filter((x) => (x.supplier_id ?? null) === preferred)
                    : base;
                  return filtered.slice(0, 6);
                })().map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-slate-700"
                    onClick={() => {
                      setPart({
                        id: s.id,
                        part_no: s.part_no || "",
                        description: s.description,
                      });
                      setPartQuery(`${s.part_no || "-"} — ${s.description}`);
                      if (
                        typeof s.gst_percent === "number" &&
                        s.gst_percent > 0
                      )
                        setGstRate(s.gst_percent);
                      setOpenPartSuggest(false);
                      assessableRef.current?.focus();
                    }}
                  >
                    <div className="font-medium">{s.part_no || "-"}</div>
                    <div className="truncate text-xs text-slate-500">
                      {s.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GST % */}
          <div className="col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              GST%
            </label>
            <input
              type="number"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              value={gstRate}
              onChange={(e) =>
                setGstRate(e.target.value === "" ? "" : Number(e.target.value))
              }
              min={0}
              step={1}
              tabIndex={6}
            />
          </div>

          {/* Assessable Value */}
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Amount *
            </label>
            <input
              ref={assessableRef}
              type="number"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              value={assessable}
              onChange={(e) =>
                setAssessable(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              min={0}
              step={0.01}
              onKeyDown={(e) => e.key === "Enter" && submitRef.current?.focus()}
              tabIndex={7}
              required
            />
          </div>

          {/* Difference */}
          <div className="col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Diff
            </label>
            <input
              type="number"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              value={difference}
              onChange={(e) =>
                setDifference(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              step={0.01}
              tabIndex={8}
            />
          </div>

          {/* Submit Button */}
          <div className="col-span-3">
            <button
              ref={submitRef}
              type="submit"
              className="w-full rounded bg-blue-600 px-4 py-1.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={addMutation.isPending || !supplierId || !part}
              tabIndex={9}
            >
              {addMutation.isPending ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </div>

        {/* Compact Summary Row */}
        <div className="grid grid-cols-8 gap-2 rounded bg-slate-100 p-2 text-xs dark:bg-slate-800">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">CGST:</span>
            <span className="font-mono">{cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">SGST:</span>
            <span className="font-mono">{sgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">IGST:</span>
            <span className="font-mono">{igst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">TDS:</span>
            <span className="font-mono">{tds.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-blue-700 dark:text-blue-300">
            <span>Total:</span>
            <span className="font-mono">{invoiceValue.toFixed(2)}</span>
          </div>
          <div className="col-span-3 text-right">
            <div className="truncate text-slate-500">
              {selectedSupplier?.name} |{" "}
              {part?.description || "No part selected"}
            </div>
          </div>
        </div>

        {/* Auto Narration Preview */}
        <div className="rounded border-l-2 border-blue-200 bg-slate-50 p-2 text-xs text-slate-500 dark:border-blue-700 dark:bg-slate-800">
          <strong>Auto Narration:</strong> {autoNarration()}
        </div>
      </form>
    </div>
  );
}
