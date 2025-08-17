-- users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create a default admin user
INSERT INTO users (username, password_hash, role) VALUES ('admin', 'admin', 'admin');