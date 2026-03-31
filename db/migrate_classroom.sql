-- classroom: announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id          SERIAL PRIMARY KEY,
  author_id   VARCHAR(36) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  group_name  VARCHAR(255) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- challenge_progress에 group_name, user_name 추가 (리더보드 집계용)
ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS group_name VARCHAR(255);
ALTER TABLE challenge_progress ADD COLUMN IF NOT EXISTS user_name  VARCHAR(255);
