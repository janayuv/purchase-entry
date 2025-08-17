import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAddSupplier,
  useDeleteSupplier,
  useSuppliers,
  useUpdateSupplier,
  useImportSuppliers,
} from "../lib/queries";
import type { Supplier, SupplierCreate, SupplierUpdate } from "../lib/types";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { downloadDir } from "@tauri-apps/api/path";

export function SuppliersPage() {
  const navigate = useNavigate();
  const { data: suppliersPage, isLoading, isError, refetch } = useSuppliers();
  const importMutation = useImportSuppliers();
  const addMutation = useAddSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const emptyForm: SupplierCreate = {
    name: "",
    gst_no: "",
    state_code: "",
    tds_flag: false,
    tds_rate: null,
    contact: "",
    email: "",
  };
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierCreate>(emptyForm);

  useEffect(() => {
    if (editing) {
      const { ...rest } = editing;
      setForm({
        name: rest.name || "",
        gst_no: rest.gst_no || "",
        state_code: rest.state_code || "",
        tds_flag: !!rest.tds_flag,
        tds_rate: rest.tds_rate ?? null,
        contact: rest.contact || "",
        email: rest.email || "",
      });
    } else {
      setForm({
        name: "",
        gst_no: "",
        state_code: "",
        tds_flag: false,
        tds_rate: null,
        contact: "",
        email: "",
      });
    }
  }, [editing]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      // Basic validations
      const existing = (suppliersPage?.data || []).filter(
        (s) => !editing || s.id !== editing.id,
      );
      if (
        form.name.trim() &&
        existing.some(
          (s) => s.name.trim().toLowerCase() === form.name.trim().toLowerCase(),
        )
      ) {
        alert("A supplier with this name already exists.");
        return;
      }
      const gst = (form.gst_no || "").toString().trim().toUpperCase();
      if (gst && gst.length !== 15) {
        alert("GST No must be exactly 15 characters.");
        return;
      }
      const state = (form.state_code || "").trim();
      if (state && !/^\d{2}$/.test(state)) {
        alert("State Code must be exactly 2 digits.");
        return;
      }

      // Normalize case
      const normalized = { ...form, gst_no: gst } as SupplierCreate;
      if (editing) {
        const updatePayload: SupplierUpdate = {
          id: editing.id,
          name: normalized.name,
          gst_no: normalized.gst_no,
          state_code: normalized.state_code,
          tds_flag: normalized.tds_flag,
          tds_rate: normalized.tds_rate,
          contact: normalized.contact,
          email: normalized.email,
        };
        await updateMutation.mutateAsync(updatePayload);
        setEditing(null);
      } else {
        await addMutation.mutateAsync(normalized);
      }
      await refetch();
    } catch (err) {
      console.error(err);
      const msg = String(err || "");
      if (
        msg.includes("UNIQUE constraint failed") ||
        msg.toLowerCase().includes("unique")
      ) {
        alert("Duplicate supplier name. Please use a different name.");
      } else if (msg.toLowerCase().includes("no rows returned")) {
        alert("Supplier not found after update. Please refresh and try again.");
      } else {
        alert("Failed to save supplier. Check inputs and try again.");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Suppliers</h2>
        <div className="flex gap-2">
          <button
            className="rounded border px-3 py-1.5 text-sm"
            onClick={async () => {
              const desktop = await downloadDir();
              const filePath = `${desktop}/supplier_template.xlsx`;
              await invoke("generate_supplier_template", { path: filePath });
              alert(`Template saved to ${filePath}`);
            }}
          >
            Download Template
          </button>
          <button
            className="bg-primary text-primary-foreground rounded px-3 py-1.5 text-sm"
            onClick={async () => {
              const file = await open({
                multiple: false,
                filters: [{ name: "Excel", extensions: ["xlsx"] }],
              });
              if (file) {
                const count = await importMutation.mutateAsync(file);
                alert(`Successfully imported ${count} suppliers.`);
                refetch();
              }
            }}
          >
            Import from Excel
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_420px]">
        <div className="overflow-x-auto rounded-md border">
          {isLoading ? (
            <div className="p-4">Loading...</div>
          ) : isError ? (
            <div className="text-destructive p-4">Failed to load suppliers</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">GST No</th>
                  <th className="p-2 text-center">State Code</th>
                  <th className="p-2">TDS</th>
                  <th className="p-2 text-right">TDS %</th>
                  <th className="p-2">Contact</th>
                  <th className="p-2">Email</th>
                  <th className="w-32 p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(suppliersPage?.data || []).map((s: Supplier) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">{s.gst_no || "-"}</td>
                    <td className="p-2 text-center">{s.state_code || "-"}</td>
                    <td className="p-2">{s.tds_flag ? "Yes" : "No"}</td>
                    <td className="p-2 text-right">{s.tds_rate ?? "-"}</td>
                    <td className="p-2">{s.contact || "-"}</td>
                    <td className="p-2">{s.email || "-"}</td>
                    <td className="flex gap-2 p-2">
                      <button
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() =>
                          navigate(`/purchases?supplier_id=${s.id}`)
                        }
                        title="View purchases from this supplier"
                      >
                        View Purchases
                      </button>
                      <button
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() => setEditing(s)}
                      >
                        Edit
                      </button>
                      <button
                        className="border-destructive text-destructive rounded border px-2 py-1 text-xs"
                        onClick={async () => {
                          await deleteMutation.mutateAsync(s.id);
                          await refetch();
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-3 rounded-md border p-4">
          <h3 className="font-medium">
            {editing ? "Edit Supplier" : "Add Supplier"}
          </h3>
          <div className="grid gap-2">
            <label className="text-xs">Name</label>
            <input
              className="rounded border px-2 py-1"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs">GST No</label>
            <input
              className="rounded border px-2 py-1 tracking-wider uppercase"
              value={form.gst_no ?? ""}
              maxLength={15}
              onChange={(e) =>
                setForm((f) => ({ ...f, gst_no: e.target.value.toUpperCase() }))
              }
              placeholder="15-char GSTIN"
            />
            <span className="text-muted-foreground text-[10px]">
              Must be exactly 15 characters
            </span>
          </div>
          <div className="grid gap-2">
            <label className="text-xs">State Code</label>
            <input
              className="rounded border px-2 py-1 text-center"
              value={(form.state_code as string) ?? ""}
              inputMode="numeric"
              maxLength={2}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                setForm((f) => ({ ...f, state_code: v.slice(0, 2) }));
              }}
              placeholder="e.g. 33"
            />
            <span className="text-muted-foreground text-[10px]">
              Exactly 2 digits
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="tds"
              type="checkbox"
              checked={!!form.tds_flag}
              onChange={(e) =>
                setForm((f) => ({ ...f, tds_flag: !!e.target.checked }))
              }
            />
            <label htmlFor="tds" className="text-sm">
              TDS Applicable
            </label>
          </div>
          <div className="grid gap-2">
            <label className="text-xs">TDS %</label>
            <input
              type="number"
              className="rounded border px-2 py-1"
              value={form.tds_rate ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({
                  ...f,
                  tds_rate: v === "" ? null : Number(v),
                }));
              }}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs">Contact</label>
            <input
              className="rounded border px-2 py-1"
              value={form.contact ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, contact: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs">Email</label>
            <input
              className="rounded border px-2 py-1"
              value={form.email ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="bg-primary text-primary-foreground rounded px-3 py-1.5"
            >
              {editing ? "Update" : "Add"}
            </button>
            {editing && (
              <button
                type="button"
                className="rounded border px-3 py-1.5"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
