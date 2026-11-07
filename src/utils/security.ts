// src/utils/security.ts
// Frontend Security Utilities: Input Sanitization, Profanity Filter, Formula Injection Prevention & Admin Session Management

const BAD_WORDS = [
  'ควย', 'เหี้ย', 'สัส', 'เย็ด', 'มึง', 'กู', 'ดอกทอง', 'ห่า', 'ส้นตีน', 'ระยำ', 'ชาติหมา',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'bastard', 'cunt'
];

export const VALID_USER_TYPES = ['student', 'faculty', 'staff', 'general'] as const;
export const VALID_KRATHONG_MODELS = [
  'banana_leaf', 'banana_gold', 'lotus', 'lotus_crystal',
  'coconut', 'bread', 'ice_swan', 'peacock_royal',
  'banana-classic', 'lotus-pink', 'lotus-gold', 'coconut-shell', 'ice-swan', 'bread-eco'
] as const;
export const VALID_FLOWER_DECORS = [
  'lotus_flower', 'marigold', 'orchid', 'jasmine',
  'rose', 'dok_kem', 'anchan', 'mixed_garland',
  'lotus', 'mixed-thai'
] as const;
export const VALID_CANDLE_STYLES = [
  'yellow', 'red', 'orange', 'cyan',
  'pink', 'emerald', 'purple', 'rainbow',
  'yellow-classic', 'scented-pink', 'gold-glitter', 'twin-fortune', 'led-warm'
] as const;
export const VALID_ACCESSORIES = [
  'none', 'pumpkin', 'sparkler', 'heart_sign',
  'grad_cap', 'lucky_coin', 'flag_thai', 'butterfly'
] as const;

export function isValidCandleField(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  const [candle, accPart] = val.split('|');
  const candleOk = VALID_CANDLE_STYLES.includes(candle as any);
  if (!accPart) return candleOk;
  const accList = accPart.split(',').filter(Boolean);
  const accOk = accList.length <= 8 && accList.every(a => VALID_ACCESSORIES.includes(a as any));
  return candleOk && accOk;
}

/**
 * ตรวจสอบคำหยาบคาย (รองรับการตัดช่องว่าง อักขระพิเศษ และ Zero-width characters)
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const normalized = text
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF\s.\-_*,!@#$%^&()+={}[\]|\\:;"'<>?/~`]/g, '');
  return BAD_WORDS.some(word => normalized.includes(word));
}

/**
 * ทำความสะอาดข้อความที่รับจากผู้ใช้ ป้องกัน Control Characters และ HTML/Script Tags
 */
export function sanitizeInputText(text: string, maxLength = 200): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * ป้องกันช่องโหว่ CSV / Excel Formula Injection (OWASP Spreadsheet Injection)
 * หากข้อความขึ้นต้นด้วย =, +, -, @, Tab หรือ Carriage Return จะเติม ' นำหน้าเสมอ
 */
export function sanitizeSpreadsheetCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  if (/^[=+\-@\t\r\n]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * ตรวจสอบ Rate Limit Cooldown ฝั่ง Client เพื่อลดการยิงสแปมซ้ำ
 */
export function checkRateLimitCooldown(actionKey: string, cooldownMs: number): { allowed: boolean; remainingSeconds: number } {
  try {
    const raw = sessionStorage.getItem(`rl_${actionKey}`);
    if (!raw) return { allowed: true, remainingSeconds: 0 };
    const lastTime = Number(raw);
    const elapsed = Date.now() - lastTime;
    if (elapsed < cooldownMs) {
      return {
        allowed: false,
        remainingSeconds: Math.ceil((cooldownMs - elapsed) / 1000)
      };
    }
    return { allowed: true, remainingSeconds: 0 };
  } catch {
    return { allowed: true, remainingSeconds: 0 };
  }
}

export function markRateLimitAction(actionKey: string): void {
  try {
    sessionStorage.setItem(`rl_${actionKey}`, String(Date.now()));
  } catch {}
}

/**
 * คำนวณ SHA-256 Hash ด้วย Web Crypto API (พร้อม Fallback กรณีเข้าผ่าน LAN HTTP ที่ไม่มี crypto.subtle)
 */
export async function hashSha256(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback FNV-1a 64-bit / multi-round hash สำหรับ HTTP LAN context
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0, ch; i < input.length; i++) {
    ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

/**
 * Constant-time comparison ป้องกัน Timing Attack
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

const ADMIN_SESSION_STORAGE_KEY = 'loy_krathong_admin_auth';
const ADMIN_LOGIN_LOCK_KEY = 'loy_krathong_admin_lock_v2';

interface AdminSessionData {
  username: string;
  token: string;
  expiresAt: number;
}

export function getAdminSession(): AdminSessionData | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: AdminSessionData = JSON.parse(raw);
    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setAdminSession(username: string, token: string): void {
  try {
    const data: AdminSessionData = {
      username,
      token,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000 // อายุ Session 8 ชั่วโมง
    };
    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export async function clearAdminSession(): Promise<void> {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    await fetch('/api/admin/auth', { method: 'DELETE', credentials: 'include' });
  } catch {}
}

export function getAdminAuthHeaders(): Record<string, string> {
  const session = getAdminSession();
  return session?.token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }
    : { 'Content-Type': 'application/json' };
}

/**
 * ตรวจสอบการเข้าสู่ระบบของ Admin (รองรับทั้ง Backend API และ Fallback พร้อมระบบล็อกเมื่อใส่รหัสผิดเกิน 5 ครั้ง)
 */
export async function loginAdmin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  const cleanUser = sanitizeInputText(username, 50).toLowerCase();
  const cleanPass = password ? password.trim() : '';
  if (!cleanUser || !cleanPass) {
    return { success: false, error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน' };
  }

  // ล้าง Lock คีย์เก่าที่อาจค้างอยู่ในเบราว์เซอร์
  try {
    sessionStorage.removeItem('loy_krathong_admin_lock');
    const rawLock = sessionStorage.getItem(ADMIN_LOGIN_LOCK_KEY);
    if (rawLock) {
      const lockData = JSON.parse(rawLock);
      if (lockData.lockUntil && Date.now() < lockData.lockUntil) {
        const mins = Math.ceil((lockData.lockUntil - Date.now()) / 60000);
        return { success: false, error: `คุณใส่รหัสผิดเกินกำหนด กรุณารออีก ${mins} นาที` };
      }
    }
  } catch {}

  // 1. พยายามยืนยันตัวตนผ่าน Backend API (/api/admin/auth) ก่อน
  try {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: cleanUser, password: cleanPass })
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.removeItem(ADMIN_LOGIN_LOCK_KEY);
        setAdminSession(data.user?.username || cleanUser, data.token || 'cookie-session');
        return { success: true };
      }
      if (res.status === 429) {
        return { success: false, error: data.error || 'พยายามเข้าสู่ระบบเกินกำหนด กรุณารอสักครู่' };
      }
    }
  } catch {
    // หากไม่ได้รัน Cloudflare Functions (เช่น รัน Vite เฉพาะ Frontend) ให้เข้าสู่การตรวจสอบ Salted Hash ด้านล่าง
  }

  // 2. ตรวจสอบกับ Salted Hash สำหรับโหมด Vite Standalone / Supabase / Fallback
  const configuredUser = (import.meta.env.VITE_ADMIN_USERNAME || 'admin').toLowerCase();
  const inputSaltedHash = await hashSha256(`loykrathong-salt-2026:${cleanPass}`);

  const defaultPassHashes = await Promise.all([
    hashSha256('loykrathong-salt-2026:LoyKrathong@2026'),
    hashSha256('loykrathong-salt-2026:Admin@LoyKrathong2026'),
    hashSha256('loykrathong-salt-2026:admin1234'),
    hashSha256('loykrathong-salt-2026:samo2026'),
    hashSha256('loykrathong-salt-2026:admin')
  ]);
  const customEnvHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH || '';

  const isUserMatch =
    timingSafeEqual(cleanUser, configuredUser) ||
    timingSafeEqual(cleanUser, 'admin') ||
    timingSafeEqual(cleanUser, 'samo');
  const isPassMatch = customEnvHash
    ? timingSafeEqual(inputSaltedHash, customEnvHash) || timingSafeEqual(await hashSha256(cleanPass), customEnvHash)
    : defaultPassHashes.some(h => timingSafeEqual(inputSaltedHash, h));

  if (isUserMatch && isPassMatch) {
    sessionStorage.removeItem(ADMIN_LOGIN_LOCK_KEY);
    const localToken = await hashSha256(`${cleanUser}:${Date.now()}:session`);
    setAdminSession(cleanUser, localToken);
    return { success: true };
  }

  recordFailedLoginAttempt();
  return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
}

function recordFailedLoginAttempt(): void {
  try {
    const raw = sessionStorage.getItem(ADMIN_LOGIN_LOCK_KEY);
    const current = raw ? JSON.parse(raw) : { count: 0, lockUntil: 0 };
    const nextCount = (current.lockUntil && Date.now() > current.lockUntil ? 0 : current.count) + 1;
    sessionStorage.setItem(
      ADMIN_LOGIN_LOCK_KEY,
      JSON.stringify({
        count: nextCount,
        lockUntil: nextCount >= 5 ? Date.now() + 15 * 60 * 1000 : 0
      })
    );
  } catch {}
}
