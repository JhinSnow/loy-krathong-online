-- Cloudflare D1 Database Schema
-- 1. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO system_settings (key, value) VALUES ('require_approval', 'false');

-- 2. Krathongs Table
CREATE TABLE IF NOT EXISTS krathongs (
    id TEXT PRIMARY KEY,
    user_type TEXT NOT NULL CHECK(user_type IN ('student', 'staff', 'general')),
    owner_name TEXT NOT NULL,
    wish_message TEXT NOT NULL,
    base_type TEXT NOT NULL,        -- 'banana_leaf', 'coconut', 'bread', 'lotus'
    flower_type TEXT NOT NULL,      -- 'marigold', 'lotus_flower', 'orchid'
    candle_color TEXT NOT NULL,     -- 'yellow', 'red', 'orange', 'cyan'
    status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
    ip_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_krathong_status ON krathongs(status, created_at DESC);

-- 3. Evaluations Table
CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    krathong_id TEXT,
    user_type TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(krathong_id) REFERENCES krathongs(id) ON DELETE SET NULL
);

-- 4. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'moderator'
);

INSERT OR IGNORE INTO admin_users (username, password_hash, role) 
VALUES ('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'admin'); -- admin / admin
