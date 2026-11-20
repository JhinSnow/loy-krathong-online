// src/utils/krathongConfig.ts
// ตัวจัดการและแปลงค่า Config ของกระทง (สีเทียน + ของตกแต่งเสริม + ขนาดของตกแต่งแต่ละชิ้น)
// ออกแบบให้ใช้งานร่วมกับคอลัมน์ candle_color เดิมในฐานข้อมูล Supabase และ D1 ได้แบบ Backward-Compatible 100%

export const MIN_DECOR_SCALE = 0.6;
export const MAX_DECOR_SCALE = 1.6;
export const SCALE_STEP = 0.05;

export interface ParsedCandleConfig {
  candleId: string;
  accessories: string[];
  accessoryScales: Record<string, number>;
  centerScale: number;
}

export function clampDecorScale(value: number, min = MIN_DECOR_SCALE, max = MAX_DECOR_SCALE): number {
  const numeric = Number.isFinite(value) ? value : 1;
  const clamped = Math.min(max, Math.max(min, numeric));
  return Math.round(clamped * 100) / 100;
}

function formatScaleToken(scale: number): string {
  return clampDecorScale(scale)
    .toFixed(2)
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.00$/, '');
}

/**
 * แปลงค่าสตริงจาก candle_color เช่น
 * - "yellow"
 * - "yellow|sparkler,butterfly"
 * - "yellow|sparkler@1.25,butterfly@0.85|cs=1.3"
 * - "yellow||cs=1.2"
 */
export function parseCandleConfig(candleColor?: string, legacyAccessory?: string): ParsedCandleConfig {
  const parts = (candleColor || 'yellow').split('|');
  const candleId = (parts[0] || 'yellow').trim() || 'yellow';
  const rawAccStr = legacyAccessory !== undefined ? legacyAccessory : parts[1] || '';

  const accessories: string[] = [];
  const accessoryScales: Record<string, number> = {};

  rawAccStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((token) => {
      const [rawId, rawScale] = token.split('@');
      const id = (rawId || '').trim();
      if (!id || id === 'none') return;
      if (!accessories.includes(id)) {
        accessories.push(id);
      }
      const parsedScale = rawScale !== undefined ? Number(rawScale) : 1;
      accessoryScales[id] = Number.isFinite(parsedScale)
        ? clampDecorScale(parsedScale, 0.5, 1.8)
        : 1;
    });

  let centerScale = 1;
  for (let i = 2; i < parts.length; i++) {
    const seg = parts[i].trim();
    if (seg.startsWith('cs=')) {
      const parsedCenter = Number(seg.slice(3));
      if (Number.isFinite(parsedCenter)) {
        centerScale = clampDecorScale(parsedCenter, 0.5, 1.8);
      }
    }
  }

  return {
    candleId,
    accessories,
    accessoryScales,
    centerScale
  };
}

/**
 * เข้ารหัสกลับเป็นสตริงสั้นเพื่อบันทึกลง candle_color (ความยาว <= 260 ตัวอักษร)
 */
export function encodeCandleConfig(
  candleId: string,
  accessories: string[],
  accessoryScales: Record<string, number> = {},
  centerScale = 1
): string {
  const cleanCandle = (candleId || 'yellow').trim() || 'yellow';
  const cleanAccTokens = accessories
    .map((acc) => acc.trim())
    .filter((acc) => acc && acc !== 'none')
    .slice(0, 12)
    .map((acc) => {
      const scale = clampDecorScale(accessoryScales[acc] ?? 1);
      return Math.abs(scale - 1) >= 0.01 ? `${acc}@${formatScaleToken(scale)}` : acc;
    });

  const clampedCenter = clampDecorScale(centerScale);
  const hasCustomCenter = Math.abs(clampedCenter - 1) >= 0.01;

  if (cleanAccTokens.length === 0 && !hasCustomCenter) {
    return cleanCandle;
  }
  if (!hasCustomCenter) {
    return `${cleanCandle}|${cleanAccTokens.join(',')}`;
  }
  return `${cleanCandle}|${cleanAccTokens.join(',')}|cs=${formatScaleToken(clampedCenter)}`;
}
