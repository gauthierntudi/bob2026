CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  public_open INTEGER NOT NULL DEFAULT 1,
  jury_open INTEGER NOT NULL DEFAULT 1
);

INSERT INTO settings (id, public_open, jury_open) VALUES (1, 1, 1);

CREATE TABLE candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  song TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE public_votes (
  voter_token TEXT PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE jurors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE jury_scores (
  juror_id INTEGER NOT NULL REFERENCES jurors(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  technique INTEGER NOT NULL CHECK (technique BETWEEN 0 AND 100),
  interpretation INTEGER NOT NULL CHECK (interpretation BETWEEN 0 AND 100),
  presence INTEGER NOT NULL CHECK (presence BETWEEN 0 AND 100),
  originality INTEGER NOT NULL CHECK (originality BETWEEN 0 AND 100),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (juror_id, candidate_id)
);
