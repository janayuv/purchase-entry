-- Add state_code (TEXT) and tds_rate (REAL) to suppliers
ALTER TABLE suppliers ADD COLUMN state_code TEXT;
ALTER TABLE suppliers ADD COLUMN tds_rate REAL;
