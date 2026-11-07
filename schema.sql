-- =============================================================================
-- PART 1: Cloudflare D1 (SQLite) Database Schema
-- =============================================================================

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
    user_type TEXT NOT NULL CHECK(user_type IN ('student', 'faculty', 'staff', 'general')),
    owner_name TEXT NOT NULL CHECK(length(owner_name) <= 50),
    wish_message TEXT NOT NULL CHECK(length(wish_message) <= 150),
    base_type TEXT NOT NULL,        -- 'banana_leaf', 'coconut', 'bread', 'lotus'
    flower_type TEXT NOT NULL,      -- 'marigold', 'lotus_flower', 'orchid'
    candle_color TEXT NOT NULL,     -- 'yellow', 'red', 'orange', 'cyan'
    status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')),
    ip_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_krathong_status ON krathongs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_krathong_ip_rate ON krathongs(ip_hash, created_at DESC);

-- 3. Evaluations Table
CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    krathong_id TEXT,
    user_type TEXT NOT NULL CHECK(user_type IN ('student', 'faculty', 'staff', 'general')),
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    feedback TEXT CHECK(feedback IS NULL OR length(feedback) <= 1000),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(krathong_id) REFERENCES krathongs(id) ON DELETE SET NULL
);

-- 4. Admin Users Table (แนะนำให้ใช้รูปแบบ pbkdf2$100000$<salt>$<hash> หรือกำหนดผ่าน Environment Variables: ADMIN_USERNAME, ADMIN_PASSWORD_HASH)
CREATE TABLE IF NOT EXISTS admin_users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'moderator'
);

-- หมายเหตุ: เปลี่ยนรหัสผ่านทันทีใน Production ด้วยฟังก์ชัน hashPasswordPBKDF2 ใน functions/utils/security.ts


-- =============================================================================
-- PART 2: Supabase (PostgreSQL) Row-Level Security (RLS) & Trigger Hardening
-- รันคำสั่งส่วนนี้ใน Supabase SQL Editor เพื่อป้องกันการยิงข้ามระบบตรวจสอบจากฝั่ง Client
-- =============================================================================
/*
-- เปิดใช้งาน Row Level Security (RLS) ทุกตาราง
ALTER TABLE public.krathongs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 1. นโยบายตาราง krathongs:
-- อนุญาตให้ผู้ใช้ทั่วไปอ่านได้เฉพาะกระทงที่อนุมัติแล้ว (approved)
CREATE POLICY "Public can read approved krathongs"
ON public.krathongs FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- อนุญาตให้สร้างกระทงใหม่โดยจำกัดความยาวข้อความและประเภทผู้ใช้ที่ถูกต้อง
CREATE POLICY "Public can insert valid krathongs"
ON public.krathongs FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(owner_name) BETWEEN 1 AND 50
  AND char_length(wish_message) BETWEEN 1 AND 150
  AND user_type IN ('student', 'faculty', 'staff', 'general')
  AND status IN ('approved', 'pending')
);

-- 2. Trigger บังคับตรวจสอบสถานะ require_approval และตัดอักขระ HTML อันตรายในระดับ Database
CREATE OR REPLACE FUNCTION public.enforce_krathong_security()
RETURNS TRIGGER AS $$
DECLARE
  need_approval TEXT;
BEGIN
  -- ตัดแท็ก HTML < > ออกจากชื่อและคำอธิษฐานเสมอ
  NEW.owner_name := regexp_replace(trim(NEW.owner_name), '[<>]', '', 'g');
  NEW.wish_message := regexp_replace(trim(NEW.wish_message), '[<>]', '', 'g');

  -- ตรวจสอบโหมดคัดกรองจากตาราง system_settings
  SELECT value INTO need_approval FROM public.system_settings WHERE key = 'require_approval';
  IF need_approval = 'true' THEN
    NEW.status := 'pending';
  ELSE
    NEW.status := 'approved';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_krathong_security ON public.krathongs;
CREATE TRIGGER trg_enforce_krathong_security
BEFORE INSERT ON public.krathongs
FOR EACH ROW EXECUTE FUNCTION public.enforce_krathong_security();

-- 3. นโยบายตาราง evaluations:
CREATE POLICY "Public can insert valid evaluations"
ON public.evaluations FOR INSERT
TO anon, authenticated
WITH CHECK (
  rating BETWEEN 1 AND 5
  AND (feedback IS NULL OR char_length(feedback) <= 300)
);
*/
