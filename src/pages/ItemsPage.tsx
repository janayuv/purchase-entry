import { useEffect, useMemo, useState } from "react";
import { useItemMaster, type ItemMasterItem } from "../lib/itemMaster";
import { useSuppliers } from "../lib/queries";

export function ItemsPage() {
  const api = useItemMaster();
  const [items, setItems] = useState<ItemMasterItem[]>(api.items);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ItemMasterItem | null>(null);
  const [form, setForm] = useState<Omit<ItemMasterItem, "id">>({
    part_no: "",
    description: "",
    gst_percent: null,
    supplier_id: null,
    active: true,
  });

  const { data: suppliersPage } = useSuppliers();
  const suppliers = useMemo(() => suppliersPage?.data ?? [], [suppliersPage]);

  useEffect(() => {
    // Refresh list from storage when query changes
    setItems(api.search(query));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const count = useMemo(() => items.length, [items]);

  function resetForm() {
    setEditing(null);
    setForm({ part_no: "", description: "", gst_percent: null, supplier_id: null, active: true });
  }

  function startEdit(it: ItemMasterItem) {
    setEditing(it);
    setForm({
      part_no: it.part_no || "",
      description: it.description,
      gst_percent: it.gst_percent ?? null,
      supplier_id: it.supplier_id ?? null,
      active: it.active,
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      api.update(editing.id, form);
    } else {
      api.add(form);
    }
    setItems(api.search(query));
    resetForm();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Items</h2>
        <div className="text-sm text-muted-foreground">{count} item(s)</div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_420px]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              className="border rounded px-2 py-1 text-sm"
              placeholder="Search part no / description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="px-2 py-1 text-xs rounded border" onClick={() => setQuery("")}>Clear</button>
          </div>

          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="p-2">Part No</th>
                  <th className="p-2">Description</th>
                  <th className="p-2 text-right">GST %</th>
                  <th className="p-2">Supplier</th>
                  <th className="p-2">Active</th>
                  <th className="p-2 w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="p-2">{it.part_no || "-"}</td>
                    <td className="p-2">{it.description}</td>
                    <td className="p-2 text-right">{it.gst_percent == null ? '-' : it.gst_percent.toFixed(2)}</td>
                    <td className="p-2">{suppliers.find((s) => s.id === (it.supplier_id ?? -1))?.name || "-"}</td>
                    <td className="p-2">{it.active ? "Yes" : "No"}</td>
                    <td className="p-2 flex gap-2">
                      <button className="px-2 py-1 text-xs rounded border" onClick={() => startEdit(it)}>Edit</button>
                      <button className="px-2 py-1 text-xs rounded border border-destructive text-destructive" onClick={() => { api.remove(it.id); setItems(api.search(query)); }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 border rounded-md p-4">
          <h3 className="font-medium">{editing ? "Edit Item" : "Add Item"}</h3>
          <div className="grid gap-2">
            <label className="text-xs">Part No</label>
            <input className="border rounded px-2 py-1" value={form.part_no ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, part_no: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <label className="text-xs">Description</label>
            <input className="border rounded px-2 py-1" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
          </div>
          <div className="grid gap-2">
            <label className="text-xs">GST %</label>
            <input
              type="number"
              className="border rounded px-2 py-1"
              value={form.gst_percent ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({ ...f, gst_percent: v === '' ? null : Number(v) }));
              }}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs">Supplier</label>
            <select className="border rounded px-2 py-1" value={form.supplier_id ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value ? Number(e.target.value) : null }))}>
              <option value="">Unlinked</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input id="active" type="checkbox" checked={!!form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: !!e.target.checked }))} />
            <label htmlFor="active" className="text-sm">Active</label>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="px-3 py-1.5 rounded bg-primary text-primary-foreground">
              {editing ? "Update" : "Add"}
            </button>
            {editing && (
              <button type="button" className="px-3 py-1.5 rounded border" onClick={resetForm}>Cancel</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
