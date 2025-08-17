-- purchase_items: line items per purchase entry
CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL,
  part_no TEXT,
  description TEXT NOT NULL,
  qty REAL NOT NULL DEFAULT 1,
  unit TEXT,
  price REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (purchase_id) REFERENCES purchase_entries(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Helpful indexes for filtering/pagination
CREATE INDEX IF NOT EXISTS idx_purchase_entries_date ON purchase_entries(date);
CREATE INDEX IF NOT EXISTS idx_purchase_entries_supplier ON purchase_entries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_entries_gst_rate ON purchase_entries(gst_rate);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
