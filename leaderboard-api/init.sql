CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(32) NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_users_username ON users (username);
-- Case-insensitive uniqueness so "Alice" and "alice" collide, while the
-- plain column above still preserves the originally-typed casing.
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username_lower ON users (lower(username));

CREATE TABLE IF NOT EXISTS scores (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level_id      INTEGER NOT NULL,
    first_time_ms BIGINT NOT NULL,
    steps         INTEGER,
    lines_of_code INTEGER,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_level UNIQUE (user_id, level_id)
);

CREATE TABLE IF NOT EXISTS attempts (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level_id      INTEGER NOT NULL,
    time_ms       BIGINT NOT NULL,
    steps         INTEGER NOT NULL,
    lines_of_code INTEGER NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_attempts_user_level ON attempts (user_id, level_id);
