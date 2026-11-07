// functions/utils/security.ts
// Edge-compatible security helper functions (Cloudflare Workers V8 Isolate / Web Crypto API)

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
  'grad_cap', 'lucky_coin', 'flag_thai', 'butterfly', 'noppamas_crown'
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

export function filterProfanity(text: string): boolean {
  if (!text) return false;
  // ลบอักขระพิเศษ ช่องว่าง และ Zero-width characters เพื่อป้องกันการหลบเลี่ยงคำหยาบ
  const normalized = text
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF\s.\-_*,!@#$%^&()+={}[\]|\\:;"'<>?/~`]/g, '');
  return BAD_WORDS.some(word => normalized.includes(word));
}

export function sanitizeText(text: string, maxLength = 200): string {
  if (!text || typeof text !== 'string') return '';
  return text
    // ลบ Control characters ที่ไม่พึงประสงค์ (ยกเว้น \n)
    .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, maxLength);
}

export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time string comparison เพื่อป้องกัน Timing Attack
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// HMAC-SHA256 helper
async function hmacSign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Salted HMAC IP Hash เพื่อปกป้องความเป็นส่วนตัว (PDPA) ป้องกันการย้อนกลับด้วย Rainbow Table
export async function hashClientIP(ip: string, env?: Record<string, any>): Promise<string> {
  const secret = env?.IP_HASH_SECRET || env?.SESSION_SECRET || 'loy-krathong-ip-privacy-salt-v1';
  return hmacSign(ip.trim(), secret);
}

// PBKDF2 Password Hashing & Verification (รูปแบบ: pbkdf2$100000$<salt>$<hash>)
export async function hashPasswordPBKDF2(password: string, saltHex?: string): Promise<string> {
  const encoder = new TextEncoder();
  const saltBytes = saltHex
    ? new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
  const computedSaltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `pbkdf2$100000$${computedSaltHex}$${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;
    const saltHex = parts[2];
    const expected = await hashPasswordPBKDF2(password, saltHex);
    return timingSafeEqual(expected, storedHash);
  }

  // Fallback สำหรับ SHA-256 hash ในฐานข้อมูลเดิม (ใช้ timingSafeEqual)
  const sha256Hash = await hashString(password);
  return timingSafeEqual(sha256Hash, storedHash);
}

// สร้าง Signed Session Token สำหรับ Admin (HMAC-SHA256)
export async function createAdminSessionToken(username: string, env?: Record<string, any>): Promise<string> {
  const secret = env?.SESSION_SECRET || 'loy-krathong-admin-hmac-secret-key-2026';
  const payloadObj = {
    sub: username,
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000 // อายุ 24 ชั่วโมง
  };
  const payloadBase64 = btoa(JSON.stringify(payloadObj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const signature = await hmacSign(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
}

export async function verifyAdminSessionToken(token: string, env?: Record<string, any>): Promise<{ valid: boolean; username?: string }> {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false };
  }
  const [payloadBase64, signature] = token.split('.');
  if (!payloadBase64 || !signature) return { valid: false };

  const secret = env?.SESSION_SECRET || 'loy-krathong-admin-hmac-secret-key-2026';
  const expectedSig = await hmacSign(payloadBase64, secret);

  if (!timingSafeEqual(signature, expectedSig)) {
    return { valid: false };
  }

  try {
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (!payload.exp || Date.now() > payload.exp || payload.role !== 'admin') {
      return { valid: false };
    }
    return { valid: true, username: payload.sub };
  } catch {
    return { valid: false };
  }
}

// ตรวจสอบสิทธิ์ Admin จาก Cookie หรือ Authorization Header
export async function isAuthenticatedAdmin(request: Request, env?: Record<string, any>): Promise<{ authenticated: boolean; username?: string }> {
  // 1. ตรวจสอบจาก Authorization: Bearer <token>
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    const verified = await verifyAdminSessionToken(bearerToken, env);
    if (verified.valid) {
      return { authenticated: true, username: verified.username };
    }
  }

  // 2. ตรวจสอบจาก HttpOnly Cookie (admin_session)
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/);
  if (match && match[1]) {
    const cookieToken = decodeURIComponent(match[1].trim());
    const verified = await verifyAdminSessionToken(cookieToken, env);
    if (verified.valid) {
      return { authenticated: true, username: verified.username };
    }
  }

  return { authenticated: false };
}

// สร้าง Security Headers และจำกัด CORS Origin อย่างปลอดภัย
export function getSecurityHeaders(request: Request, env?: Record<string, any>, contentType = 'application/json'): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const requestUrl = new URL(request.url);
  const allowedOriginEnv = env?.ALLOWED_ORIGIN || '';

  let allowOrigin = requestUrl.origin;
  if (allowedOriginEnv && origin === allowedOriginEnv) {
    allowOrigin = origin;
  } else if (origin && (origin === requestUrl.origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
    allowOrigin = origin;
  }

  return {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
}
