-- suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  gst_no TEXT,
  tds_flag INTEGER NOT NULL DEFAULT 0,
  contact TEXT,
  email TEXT
);

-- purchase_entries
CREATE TABLE IF NOT EXISTS purchase_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL,
  invoice_no TEXT NOT NULL,
  date TEXT NOT NULL, -- ISO8601 date string (YYYY-MM-DD)
  gst_rate REAL NOT NULL DEFAULT 0,
  basic_value REAL NOT NULL DEFAULT 0,
  sgst REAL NOT NULL DEFAULT 0,
  cgst REAL NOT NULL DEFAULT 0,
  igst REAL NOT NULL DEFAULT 0,
  invoice_value REAL NOT NULL DEFAULT 0,
  tds_value REAL NOT NULL DEFAULT 0,
  narration TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','uploaded')) DEFAULT 'pending',
  UNIQUE (supplier_id, invoice_no),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- items (master)
CREATE TABLE IF NOT EXISTS items (
  part_no TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  supplier INTEGER,
  FOREIGN KEY (supplier) REFERENCES suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL
);
