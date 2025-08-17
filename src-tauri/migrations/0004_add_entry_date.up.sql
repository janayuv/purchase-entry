-- Add entry_date to purchase_entries
ALTER TABLE purchase_entries ADD COLUMN entry_date TEXT NOT NULL DEFAULT (datetime('now'));

-- Backfill existing rows with current timestamp is handled by DEFAULT; existing rows will have the default applied in SQLite only for new rows.
-- For historical rows, set entry_date to date field timestamp for consistency where possible
UPDATE purchase_entries SET entry_date = COALESCE(entry_date, date || ' 00:00:00');
