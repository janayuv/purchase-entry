import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import type { PurchaseEntry, PurchasesBySupplier, ReportSummary } from "@/lib/types";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [purchasesBySupplier, setPurchasesBySupplier] = useState<
    PurchasesBySupplier[]
  >([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2022, 0, 20),
    to: new Date(),
  });

  useEffect(() => {
    const fetchData = async () => {
      if (dateRange?.from && dateRange?.to) {
        const [summaryRes, purchasesBySupplierRes] = await Promise.all([
          invoke<ReportSummary>("get_report_summary", {
            dateFrom: dateRange.from.toISOString().split("T")[0],
            dateTo: dateRange.to.toISOString().split("T")[0],
          }),
          invoke<PurchasesBySupplier[]>("get_purchases_by_supplier", {
            dateFrom: dateRange.from.toISOString().split("T")[0],
            dateTo: dateRange.to.toISOString().split("T")[0],
          }),
        ]);
        setSummary(summaryRes);
        setPurchasesBySupplier(purchasesBySupplierRes);
      }
    };
    fetchData();
  }, [dateRange]);

  const handleExport = async () => {
    if (dateRange?.from && dateRange?.to) {
      const purchases = await invoke<PurchaseEntry[]>("export_purchases", {
        dateFrom: dateRange.from.toISOString().split("T")[0],
        dateTo: dateRange.to.toISOString().split("T")[0],
      });

      const csvContent = [
        "ID,Supplier ID,Invoice No,Date,Entry Date,GST Rate,Basic Value,SGST,CGST,IGST,Invoice Value,TDS Value,Narration,Status",
        ...purchases.map((p) =>
          [
            p.id,
            p.supplier_id,
            p.invoice_no,
            p.date,
            p.entry_date,
            p.gst_rate,
            p.basic_value,
            p.sgst,
            p.cgst,
            p.igst,
            p.invoice_value,
            p.tds_value,
            p.narration,
            p.status,
          ].join(",")
        ),
      ].join("\n");

      const filePath = await save({
        filters: [{ name: "CSV", extensions: ["csv"] }],
        defaultPath: `purchases-${new Date().toISOString().split("T")[0]}.csv`,
      });

      if (filePath) {
        await writeTextFile(filePath, csvContent);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Reports</h2>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button onClick={handleExport}>Export CSV</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.total_purchases.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total GST</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.total_gst.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_suppliers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_items}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Purchases by Supplier</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={purchasesBySupplier}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="supplier_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_purchases" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
