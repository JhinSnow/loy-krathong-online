// functions/utils/security.ts
// Edge-compatible helper functions (V8 Isolate)

const BAD_WORDS = [
  'ควย', 'เหี้ย', 'สัส', 'เย็ด', 'มึง', 'กู', 'ดอกทอง', 'ห่า',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy'
];

export function filterProfanity(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase().replace(/[\s\.\-_]/g, '');
  return BAD_WORDS.some(word => lower.includes(word));
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
