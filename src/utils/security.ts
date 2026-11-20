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
  'pumpkin', 'noppamas_crown', 'elephant_gold', 'golden_swan',
  'lotus_lamp', 'gold_pagoda', 'royal_barge', 'crystal_heart',
  'lotus', 'mixed-thai'
] as const;
export const VALID_CANDLE_STYLES = [
  'yellow', 'red', 'orange', 'cyan',
  'pink', 'emerald', 'purple', 'rainbow',
  'yellow-classic', 'scented-pink', 'gold-glitter', 'twin-fortune', 'led-warm'
] as const;
export const VALID_ACCESSORIES = [
  'none', 'pumpkin', 'noppamas_crown', 'sky_lantern', 'lotus_lamp', 'elephant_gold',
  'sparkler', 'heart_sign', 'grad_cap', 'lucky_coin', 'flag_thai', 'butterfly'
] as const;

export function isValidCandleField(val: string): boolean {
  if (!val || typeof val !== 'string' || val.length > 260) return false;
  const parts = val.split('|');
  if (parts.length > 3) return false;

  const [candle, accPart = '', metaPart = ''] = parts;
  if (!VALID_CANDLE_STYLES.includes(candle as any)) return false;

  if (accPart) {
    const accList = accPart.split(',').filter(Boolean);
    if (accList.length > 12) return false;
    const accOk = accList.every((token) => {
      const [id, scaleStr, ...extra] = token.split('@');
      if (extra.length > 0 || !VALID_ACCESSORIES.includes(id as any)) return false;
      if (scaleStr === undefined) return true;
      if (!/^\d+(\.\d{1,2})?$/.test(scaleStr)) return false;
      const scaleVal = Number(scaleStr);
      return scaleVal >= 0.5 && scaleVal <= 1.8;
    });
    if (!accOk) return false;
  }

  if (metaPart) {
    const match = metaPart.match(/^cs=(\d+(?:\.\d{1,2})?)$/);
    if (!match) return false;
    const csVal = Number(match[1]);
    if (csVal < 0.5 || csVal > 1.8) return false;
  }

  return true;
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

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

const SHA256_INIT = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
]);

const SHA256_W = new Int32Array(64);

function sha256Compress(state: Uint32Array, block: Uint8Array, offset: number): void {
  for (let i = 0; i < 16; i++) {
    const j = offset + i * 4;
    SHA256_W[i] = (block[j] << 24) | (block[j + 1] << 16) | (block[j + 2] << 8) | block[j + 3];
  }
  for (let i = 16; i < 64; i++) {
    const s0w = SHA256_W[i - 15];
    const s1w = SHA256_W[i - 2];
    const s0 = ((s0w >>> 7) | (s0w << 25)) ^ ((s0w >>> 18) | (s0w << 14)) ^ (s0w >>> 3);
    const s1 = ((s1w >>> 17) | (s1w << 15)) ^ ((s1w >>> 19) | (s1w << 13)) ^ (s1w >>> 10);
    SHA256_W[i] = (SHA256_W[i - 16] + s0 + SHA256_W[i - 7] + s1) | 0;
  }

  let a = state[0];
  let b = state[1];
  let c = state[2];
  let d = state[3];
  let e = state[4];
  let f = state[5];
  let g = state[6];
  let h = state[7];

  for (let i = 0; i < 64; i++) {
    const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
    const ch = (e & f) ^ (~e & g);
    const temp1 = (h + S1 + ch + SHA256_K[i] + SHA256_W[i]) | 0;
    const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
    const maj = (a & b) ^ (a & c) ^ (b & c);
    const temp2 = (S0 + maj) | 0;

    h = g;
    g = f;
    f = e;
    e = (d + temp1) | 0;
    d = c;
    c = b;
    b = a;
    a = (temp1 + temp2) | 0;
  }

  state[0] = (state[0] + a) | 0;
  state[1] = (state[1] + b) | 0;
  state[2] = (state[2] + c) | 0;
  state[3] = (state[3] + d) | 0;
  state[4] = (state[4] + e) | 0;
  state[5] = (state[5] + f) | 0;
  state[6] = (state[6] + g) | 0;
  state[7] = (state[7] + h) | 0;
}

function sha256PureJs(data: Uint8Array): Uint8Array {
  const len = data.length;
  const totalLen = Math.ceil((len + 9) / 64) * 64;
  const padded = new Uint8Array(totalLen);
  padded.set(data);
  padded[len] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(totalLen - 8, Math.floor((len * 8) / 0x100000000), false);
  dv.setUint32(totalLen - 4, (len * 8) >>> 0, false);

  const state = new Uint32Array(SHA256_INIT);
  for (let offset = 0; offset < totalLen; offset += 64) {
    sha256Compress(state, padded, offset);
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) {
    outView.setUint32(i * 4, state[i], false);
  }
  return out;
}

function pbkdf2Sha256PureJs(passwordBytes: Uint8Array, saltBytes: Uint8Array, iterations: number): Uint8Array {
  const key = passwordBytes.length > 64 ? sha256PureJs(passwordBytes) : passwordBytes;
  const ipad = new Uint8Array(64);
  const opad = new Uint8Array(64);
  ipad.fill(0x36);
  opad.fill(0x5c);
  for (let i = 0; i < key.length; i++) {
    ipad[i] ^= key[i];
    opad[i] ^= key[i];
  }

  const innerBase = new Uint32Array(SHA256_INIT);
  sha256Compress(innerBase, ipad, 0);
  const outerBase = new Uint32Array(SHA256_INIT);
  sha256Compress(outerBase, opad, 0);

  const digestBlock = new Uint8Array(64);
  digestBlock[32] = 0x80;
  digestBlock[62] = 0x03; // (64 + 32) * 8 = 768 bits

  const firstInput = new Uint8Array(64 + saltBytes.length + 4);
  firstInput.set(ipad, 0);
  firstInput.set(saltBytes, 64);
  firstInput[64 + saltBytes.length + 3] = 1;
  const innerHash1 = sha256PureJs(firstInput);

  const outerInput = new Uint8Array(64 + 32);
  outerInput.set(opad, 0);
  outerInput.set(innerHash1, 64);
  const u = sha256PureJs(outerInput);
  const dk = new Uint8Array(u);
  const state = new Uint32Array(8);

  for (let iter = 1; iter < iterations; iter++) {
    digestBlock.set(u, 0);
    state.set(innerBase);
    sha256Compress(state, digestBlock, 0);
    for (let i = 0; i < 8; i++) {
      const v = state[i];
      digestBlock[i * 4] = (v >>> 24) & 0xff;
      digestBlock[i * 4 + 1] = (v >>> 16) & 0xff;
      digestBlock[i * 4 + 2] = (v >>> 8) & 0xff;
      digestBlock[i * 4 + 3] = v & 0xff;
    }

    state.set(outerBase);
    sha256Compress(state, digestBlock, 0);
    for (let i = 0; i < 8; i++) {
      const v = state[i];
      u[i * 4] = (v >>> 24) & 0xff;
      u[i * 4 + 1] = (v >>> 16) & 0xff;
      u[i * 4 + 2] = (v >>> 8) & 0xff;
      u[i * 4 + 3] = v & 0xff;
    }

    for (let j = 0; j < 32; j++) {
      dk[j] ^= u[j];
    }
  }
  return dk;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * คำนวณ SHA-256 Hash ด้วย Web Crypto API (พร้อม Pure-JS SHA-256 Fallback สำหรับ LAN HTTP)
 */
export async function hashSha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return bytesToHex(new Uint8Array(hashBuffer));
  }
  return bytesToHex(sha256PureJs(data));
}

async function derivePbkdf2Hex(password: string, saltHex: string, iterations: number): Promise<string> {
  if (!/^[0-9a-f]+$/i.test(saltHex) || saltHex.length % 2 !== 0) {
    throw new Error('Invalid salt');
  }
  const passwordBytes = new TextEncoder().encode(password);
  const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const keyMaterial = await crypto.subtle.importKey('raw', passwordBytes, { name: 'PBKDF2' }, false, ['deriveBits']);
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    return bytesToHex(new Uint8Array(derivedBits));
  }

  return bytesToHex(pbkdf2Sha256PureJs(passwordBytes, saltBytes, iterations));
}

/**
 * Constant-time comparison ป้องกัน Timing Attack
 */
function timingSafeEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < maxLen; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}

async function verifyPasswordAgainstHash(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;
    const iterations = Number(parts[1]);
    const saltHex = parts[2];
    if (!Number.isInteger(iterations) || iterations < 10000 || iterations > 100000) {
      return false;
    }
    try {
      const derivedHex = await derivePbkdf2Hex(password, saltHex, iterations);
      return timingSafeEqual(`pbkdf2$${iterations}$${saltHex}$${derivedHex}`, storedHash);
    } catch {
      return false;
    }
  }
  const shaHex = await hashSha256(password);
  return timingSafeEqual(shaHex, storedHash);
}

const DEFAULT_ADMIN_USERNAME = 'admin';
// PBKDF2-HMAC-SHA256 (100,000 iterations) hash — ไม่เก็บรหัสผ่านจริงไว้ในโค้ดฝั่ง Frontend
const DEFAULT_ADMIN_PASSWORD_HASH =
  'pbkdf2$100000$7bc575cfed63045006305deed5646370$7ab1e272ee9b1f849ab39c3b5482a8a46d64e6c5c067b2334a3abbd81fd36dad';

const ADMIN_SESSION_STORAGE_KEY = 'loy_krathong_admin_auth';
const ADMIN_LOGIN_LOCK_KEY = 'loy_krathong_admin_lock_v3';

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

function readLockState(): { count: number; lockUntil: number } {
  let best = { count: 0, lockUntil: 0 };
  for (const storage of [typeof localStorage !== 'undefined' ? localStorage : null, typeof sessionStorage !== 'undefined' ? sessionStorage : null]) {
    if (!storage) continue;
    try {
      const raw = storage.getItem(ADMIN_LOGIN_LOCK_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if ((parsed.lockUntil || 0) > best.lockUntil || (parsed.count || 0) > best.count) {
        best = { count: Number(parsed.count) || 0, lockUntil: Number(parsed.lockUntil) || 0 };
      }
    } catch {}
  }
  return best;
}

function clearLoginLockout(): void {
  try {
    sessionStorage.removeItem('loy_krathong_admin_lock');
    sessionStorage.removeItem('loy_krathong_admin_lock_v2');
    sessionStorage.removeItem(ADMIN_LOGIN_LOCK_KEY);
    localStorage.removeItem(ADMIN_LOGIN_LOCK_KEY);
  } catch {}
}

/**
 * ตรวจสอบการเข้าสู่ระบบของ Admin (รองรับทั้ง Backend API และ Standalone PBKDF2-SHA256 พร้อม Brute-force Lockout)
 */
export async function loginAdmin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  const cleanUser = sanitizeInputText(username, 50).toLowerCase();
  const rawPass = typeof password === 'string' ? password : '';
  if (!cleanUser || !rawPass) {
    return { success: false, error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน' };
  }

  const lockState = readLockState();
  if (lockState.lockUntil && Date.now() < lockState.lockUntil) {
    const mins = Math.ceil((lockState.lockUntil - Date.now()) / 60000);
    return { success: false, error: `คุณใส่รหัสผิดเกินกำหนด กรุณารออีก ${mins} นาที` };
  }

  // 1. พยายามยืนยันตัวตนผ่าน Backend API (/api/admin/auth) ก่อน
  try {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: cleanUser, password: rawPass })
    });

    const contentType = res.headers.get('content-type') || '';
    // หาก Backend API จริงตอบกลับมาเป็น JSON (ไม่ใช่ 404/405 ของ Vite/Static Server)
    // ห้าม Fallback มาตรวจฝั่ง Client เด็ดขาด เพื่อป้องกันการ Bypass Backend
    if (res.status !== 404 && res.status !== 405 && contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.success) {
        clearLoginLockout();
        setAdminSession(data.user?.username || cleanUser, data.token || 'cookie-session');
        return { success: true };
      }
      if (res.status === 429) {
        return { success: false, error: data.error || 'พยายามเข้าสู่ระบบเกินกำหนด กรุณารอสักครู่' };
      }
      if (res.status === 401 || res.status === 400) {
        recordFailedLoginAttempt();
      }
      return { success: false, error: data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }
  } catch {
    // กรณีรัน Vite Standalone / Static Hosting ที่ไม่มี Cloudflare Functions
  }

  // 2. ตรวจสอบกับ PBKDF2-SHA256 Hash เดี่ยวสำหรับโหมด Vite Standalone / Supabase
  const configuredUser = (import.meta.env.VITE_ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME).trim().toLowerCase();
  const targetHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH || DEFAULT_ADMIN_PASSWORD_HASH;

  const isUserMatch = timingSafeEqual(cleanUser, configuredUser);
  const isPassMatch = await verifyPasswordAgainstHash(rawPass, targetHash);

  if (isUserMatch && isPassMatch) {
    clearLoginLockout();
    let randomNonce = `${Date.now()}-${Math.random()}`;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buf = new Uint8Array(32);
      crypto.getRandomValues(buf);
      randomNonce = bytesToHex(buf);
    }
    const localToken = await hashSha256(`${cleanUser}:${randomNonce}:session`);
    setAdminSession(cleanUser, localToken);
    return { success: true };
  }

  recordFailedLoginAttempt();
  return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
}

function recordFailedLoginAttempt(): void {
  const current = readLockState();
  const nextCount = (current.lockUntil && Date.now() > current.lockUntil ? 0 : current.count) + 1;
  const payload = JSON.stringify({
    count: nextCount,
    lockUntil: nextCount >= 5 ? Date.now() + 15 * 60 * 1000 : 0
  });
  try {
    sessionStorage.setItem(ADMIN_LOGIN_LOCK_KEY, payload);
  } catch {}
  try {
    localStorage.setItem(ADMIN_LOGIN_LOCK_KEY, payload);
  } catch {}
}
