export interface ItemMasterItem {
  id: number;
  part_no?: string | null;
  description: string;
  gst_percent?: number | null;
  supplier_id?: number | null;
  active: boolean;
}

const KEY = "app_item_master_v1";

function load(): ItemMasterItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ItemMasterItem[];
    return [];
  } catch {
    return [];
  }
}

function save(items: ItemMasterItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function nextId(items: ItemMasterItem[]) {
  return (items.reduce((m, it) => Math.max(m, it.id), 0) || 0) + 1;
}

export function useItemMaster() {
  function add(item: Omit<ItemMasterItem, "id">) {
    const all = load();
    const created: ItemMasterItem = { id: nextId(all), ...item };
    const next = [...all, created];
    save(next);
    return created;
  }

  function update(id: number, patch: Partial<Omit<ItemMasterItem, "id">>) {
    const all = load();
    const next = all.map((it) => (it.id === id ? { ...it, ...patch } : it));
    save(next);
  }

  function remove(id: number) {
    const all = load();
    const next = all.filter((it) => it.id !== id);
    save(next);
  }

  function search(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return load();
    return load().filter(
      (it) =>
        (it.part_no || "").toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q),
    );
  }

  return { items: load(), add, update, remove, search };
}
