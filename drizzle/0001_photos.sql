ALTER TABLE candidates ADD COLUMN photo_type TEXT;

CREATE TABLE candidate_photos (
  candidate_id INTEGER PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  data BLOB NOT NULL
);
