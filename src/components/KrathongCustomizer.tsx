// src/components/KrathongCustomizer.tsx
import React, { useEffect, useRef, useState } from 'react';
import type { UserType } from '../types';
import { Krathong3DPreview } from './Krathong3DPreview';
import { ShareCardModal } from './ShareCardModal';
import { KrathongItemIcon, PumpkinBuildingIcon } from './KrathongIcons';
import {
  Sparkles,
  Eye,
  Image as ImageIcon,
  Dices,
  Volume2,
  VolumeX,
  MessageSquareHeart,
  MessageCircle,
  RotateCcw,
  Check,
  ArrowLeft,
  ArrowRight,
  Flower2,
  Flame
} from 'lucide-react';
import {
  MIN_DECOR_SCALE,
  MAX_DECOR_SCALE,
  SCALE_STEP,
  encodeCandleConfig
} from '../utils/krathongConfig';
import { supabase } from '../utils/supabase';
import {
  containsProfanity,
  sanitizeInputText,
  checkRateLimitCooldown,
  markRateLimitAction,
  VALID_USER_TYPES,
  VALID_KRATHONG_MODELS,
  VALID_FLOWER_DECORS,
  isValidCandleField
} from '../utils/security';
import {
  saveLocalKrathongRecord,
  getLocalRequireApproval
} from '../utils/evaluationHelpers';
import { soundManager } from '../utils/soundEffects';

interface KrathongCustomizerProps {
  onBackToRiver: () => void;
  onNavigateWishes: () => void;
  onSuccessFloating: (krathongId: string, userType: UserType) => void;
  isOverlayOpen?: boolean;
}

type WizardStep = 'base' | 'decor' | 'float';

interface IdeaPreset {
  id: string;
  label: string;
  baseType: string;
  flowerType: string;
  candleColor: string;
  accessories: string[];
  centerScale?: number;
}

// 1. ฐานกระทง 8 รูปแบบ
const BASES = [
  { id: 'banana_leaf', shortName: 'ใบตอง', name: 'ใบตองดั้งเดิม', swatch: '#65a30d' },
  { id: 'banana_gold', shortName: 'ยอดฉัตรทอง', name: 'ใบตองยอดฉัตรทอง', swatch: '#047857' },
  { id: 'lotus', shortName: 'ดอกบัว', name: 'บัวหลวงชมพู', swatch: '#f472b6' },
  { id: 'lotus_crystal', shortName: 'บัวแก้ว', name: 'บัวแก้วคริสตัล', swatch: '#38bdf8' },
  { id: 'coconut', shortName: 'กะลา', name: 'กะลารักษ์โลก', swatch: '#78350f' },
  { id: 'bread', shortName: 'ขนมปัง', name: 'ขนมปังแฟนซี', swatch: '#d97706' },
  { id: 'ice_swan', shortName: 'หงส์คู่', name: 'น้ำแข็งหงส์คู่', swatch: '#0284c7' },
  { id: 'peacock_royal', shortName: 'นกยูงทอง', name: 'นกยูงทองคำ', swatch: '#ca8a04' }
] as const;

// ไอเดียเริ่มต้น (แตะเลือกแล้วแต่งต่อได้ทุกชิ้น)
const IDEA_PRESETS: IdeaPreset[] = [
  {
    id: 'classic',
    label: 'คลาสสิก',
    baseType: 'banana_leaf',
    flowerType: 'lotus_flower',
    candleColor: 'yellow',
    accessories: [],
    centerScale: 1
  },
  {
    id: 'sweet_pink',
    label: 'หวานชมพู',
    baseType: 'lotus',
    flowerType: 'lotus_flower',
    candleColor: 'pink',
    accessories: ['heart_sign'],
    centerScale: 1.05
  },
  {
    id: 'psu_pumpkin',
    label: 'ตึกฟักทอง ม.อ.',
    baseType: 'banana_gold',
    flowerType: 'pumpkin',
    candleColor: 'yellow',
    accessories: ['sparkler'],
    centerScale: 1.1
  },
  {
    id: 'gold_fortune',
    label: 'ทองมงคล',
    baseType: 'peacock_royal',
    flowerType: 'marigold',
    candleColor: 'yellow',
    accessories: ['lucky_coin', 'sky_lantern'],
    centerScale: 1.1
  },
  {
    id: 'eco_natural',
    label: 'รักษ์โลก',
    baseType: 'coconut',
    flowerType: 'jasmine',
    candleColor: 'emerald',
    accessories: ['butterfly'],
    centerScale: 1
  },
  {
    id: 'swan_love',
    label: 'หงส์คู่รัก',
    baseType: 'ice_swan',
    flowerType: 'crystal_heart',
    candleColor: 'cyan',
    accessories: ['butterfly'],
    centerScale: 1.05
  },
  {
    id: 'golden_peacock',
    label: 'นกยูงทอง',
    baseType: 'peacock_royal',
    flowerType: 'gold_pagoda',
    candleColor: 'yellow',
    accessories: ['flag_thai'],
    centerScale: 1
  },
  {
    id: 'bread_fancy',
    label: 'ขนมปังแฟนซี',
    baseType: 'bread',
    flowerType: 'mixed_garland',
    candleColor: 'orange',
    accessories: ['sparkler', 'butterfly'],
    centerScale: 1
  }
];

// 2. ดอกไม้ประดับ (8 ชนิด) และของตกแต่งใส่ตรงกลางกระทงแทนดอกไม้ (8 แบบ)
const FLOWERS: {
  id: string;
  name: string;
  color: string;
  category: 'flower' | 'centerpiece';
}[] = [
  { id: 'lotus_flower', name: 'ดอกบัวชมพู', color: '#f43f5e', category: 'flower' },
  { id: 'marigold', name: 'ดาวเรืองทอง', color: '#fbbf24', category: 'flower' },
  { id: 'orchid', name: 'กล้วยไม้ม่วง', color: '#c084fc', category: 'flower' },
  { id: 'jasmine', name: 'มะลิร้อยมาลัย', color: '#e2e8f0', category: 'flower' },
  { id: 'rose', name: 'กุหลาบแดง', color: '#e11d48', category: 'flower' },
  { id: 'dok_kem', name: 'ดอกเข็มส้ม', color: '#fb923c', category: 'flower' },
  { id: 'anchan', name: 'อัญชันคราม', color: '#6366f1', category: 'flower' },
  { id: 'mixed_garland', name: 'มาลัย 5 สี', color: '#10b981', category: 'flower' },
  { id: 'pumpkin', name: 'ตึกฟักทอง ม.อ.', color: '#f59e0b', category: 'centerpiece' },
  { id: 'noppamas_crown', name: 'ชฎาทองนพมาศ', color: '#fbbf24', category: 'centerpiece' },
  { id: 'elephant_gold', name: 'ช้างเผือกมงคล', color: '#d97706', category: 'centerpiece' },
  { id: 'golden_swan', name: 'หงส์ทองคู่บารมี', color: '#eab308', category: 'centerpiece' },
  { id: 'lotus_lamp', name: 'โคมบัวแก้วทิพย์', color: '#ec4899', category: 'centerpiece' },
  { id: 'gold_pagoda', name: 'เจดีย์ทองมงคล', color: '#ca8a04', category: 'centerpiece' },
  { id: 'royal_barge', name: 'เรือสุพรรณหงส์', color: '#b45309', category: 'centerpiece' },
  { id: 'crystal_heart', name: 'หัวใจเพชรคู่รัก', color: '#e11d48', category: 'centerpiece' }
];

// 3. แสงเทียนนำทาง 8 สี
const CANDLES = [
  { id: 'yellow', name: 'สีทอง (สำเร็จ)', hex: '#fde047' },
  { id: 'red', name: 'สีแดง (โชคลาภ)', hex: '#f87171' },
  { id: 'orange', name: 'สีส้ม (รุ่งเรือง)', hex: '#fb923c' },
  { id: 'cyan', name: 'สีฟ้า (สงบสุข)', hex: '#38bdf8' },
  { id: 'pink', name: 'สีชมพู (ความรัก)', hex: '#f472b6' },
  { id: 'emerald', name: 'สีเขียว (สุขภาพ)', hex: '#34d399' },
  { id: 'purple', name: 'สีม่วง (ปัญญา)', hex: '#c084fc' },
  { id: 'rainbow', name: 'เทียนคู่สายรุ้ง', hex: '#ec4899' }
] as const;

// 4. ของตกแต่งเสริมพิเศษปักรอบกระทง 8 แบบ
const ACCESSORIES = [
  { id: 'sparkler', name: 'ไฟเย็นระยิบ' },
  { id: 'sky_lantern', name: 'โคมลอยล้านนา' },
  { id: 'heart_sign', name: 'หัวใจคู่รัก' },
  { id: 'grad_cap', name: 'หมวกปริญญา A+' },
  { id: 'lucky_coin', name: 'เหรียญทองนำโชค' },
  { id: 'flag_thai', name: 'ธงราวงานวัด' },
  { id: 'butterfly', name: 'ผีเสื้อแสงจันทร์' },
  { id: 'none', name: 'ธูปเทียนปกติ' }
] as const;

const QUICK_WISHES = [
  'ขอขมาพระแม่คงคา ขอให้เกรด 4.00 ทุกวิชา สมหวังทุกประการ',
  'ขอให้สุขภาพแข็งแรง การงานก้าวหน้า เงินทองไหลมาเทมา',
  'ขอให้เจอความรักที่ดี มีความสุขตลอดปีและตลอดไป',
  'ขอให้ทุกข์โศกโรคภัยลอยไปกับสายน้ำ มีแต่รอยยิ้มและความสำเร็จ'
] as const;

export const KrathongCustomizer: React.FC<KrathongCustomizerProps> = ({
  onBackToRiver,
  onNavigateWishes,
  onSuccessFloating,
  isOverlayOpen = false
}) => {
  const [wizardStep, setWizardStep] = useState<WizardStep>('base');
  const [userType, setUserType] = useState<UserType>('student');
  const [ownerName, setOwnerName] = useState('');
  const [wishMessage, setWishMessage] = useState('');
  const [baseType, setBaseType] = useState('banana_leaf');
  const [flowerType, setFlowerType] = useState('lotus_flower');
  const [candleColor, setCandleColor] = useState('yellow');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [centerScale, setCenterScale] = useState<number>(1);
  const [accessoryScales, setAccessoryScales] = useState<Record<string, number>>({});
  const [previewPulseNonce, setPreviewPulseNonce] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(() => soundManager.isAudioEnabled());

  const bodyScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bodyScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [wizardStep]);

  const handleToggleAudio = () => {
    setIsAudioPlaying(soundManager.toggleAudio());
  };

  const handleApplyIdeaPreset = (preset: IdeaPreset) => {
    setBaseType(preset.baseType);
    setFlowerType(preset.flowerType);
    setCandleColor(preset.candleColor);
    setSelectedAccessories(preset.accessories);
    setCenterScale(preset.centerScale ?? 1);
    setAccessoryScales({});
    setPreviewPulseNonce((n) => n + 1);
  };

  const handleToggleAccessory = (accId: string) => {
    if (accId === 'none') {
      setSelectedAccessories([]);
      setAccessoryScales({});
      return;
    }
    setSelectedAccessories((prev) =>
      prev.includes(accId) ? prev.filter((item) => item !== accId) : [...prev, accId]
    );
  };

  const handleAccessoryScaleChange = (accId: string, scale: number) => {
    setAccessoryScales((prev) => ({ ...prev, [accId]: scale }));
  };

  const handleRandomizeDesign = () => {
    setBaseType(BASES[Math.floor(Math.random() * BASES.length)].id);
    setFlowerType(FLOWERS[Math.floor(Math.random() * FLOWERS.length)].id);
    setCandleColor(CANDLES[Math.floor(Math.random() * CANDLES.length)].id);
    setCenterScale(1);
    setAccessoryScales({});

    const decorPool = ACCESSORIES.filter((a) => a.id !== 'none').map((a) => a.id);
    const shuffled = [...decorPool].sort(() => 0.5 - Math.random());
    const pickCount = Math.floor(Math.random() * 3) + 1;
    setSelectedAccessories(shuffled.slice(0, pickCount));
    setPreviewPulseNonce((n) => n + 1);
  };

  const combinedCandleValue = encodeCandleConfig(
    candleColor,
    selectedAccessories,
    accessoryScales,
    centerScale
  );

  const handleFloatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = sanitizeInputText(ownerName, 40);
    const cleanWish = sanitizeInputText(wishMessage, 150);

    if (!cleanName) {
      setWizardStep('float');
      setErrorMsg('กรุณาระบุชื่อหรือนามแฝงของคุณ');
      return;
    }
    if (!cleanWish) {
      setWizardStep('float');
      setErrorMsg('กรุณาระบุคำอวยพรหรือคำขอขมา');
      return;
    }

    // 1. ตรวจสอบคำหยาบคายก่อนส่งข้อมูลทุกช่องทาง
    if (containsProfanity(cleanName) || containsProfanity(cleanWish)) {
      setErrorMsg('พบถ้อยคำไม่สุภาพ กรุณาใช้ถ้อยคำที่เหมาะสมในเทศกาลลอยกระทง');
      return;
    }

    // 2. ตรวจสอบ Rate Limit ฝั่ง Client (3 วินาที ป้องกันการกดซ้ำรัว)
    const cooldown = checkRateLimitCooldown('krathong_submit', 3 * 1000);
    if (!cooldown.allowed) {
      setErrorMsg(`คุณเพิ่งปล่อยกระทงไป กรุณารออีก ${cooldown.remainingSeconds} วินาที`);
      return;
    }

    // 3. ตรวจสอบ Whitelist ของตัวเลือก
    const safeUserType: UserType = VALID_USER_TYPES.includes(userType as any) ? userType : 'general';
    const safeBaseType = VALID_KRATHONG_MODELS.includes(baseType as any) ? baseType : 'banana_leaf';
    const safeFlowerType = VALID_FLOWER_DECORS.includes(flowerType as any) ? flowerType : 'lotus_flower';
    const safeCandleColor = isValidCandleField(combinedCandleValue) ? combinedCandleValue : 'yellow';

    setLoading(true);
    let initialStatus: 'approved' | 'pending' = getLocalRequireApproval() ? 'pending' : 'approved';
    try {
      let createdId: string | null = null;

      // 4. ลองบันทึกลง Supabase พร้อมเช็กสถานะ require_approval จาก system_settings
      try {
        const { data: settingData } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'require_approval')
          .maybeSingle();

        if (settingData?.value !== undefined) {
          initialStatus = settingData.value === 'true' ? 'pending' : 'approved';
        }

        const { data: supaData, error: supaErr } = await supabase
          .from('krathongs')
          .insert([
            {
              user_type: safeUserType,
              owner_name: cleanName,
              wish_message: cleanWish,
              base_type: safeBaseType,
              flower_type: safeFlowerType,
              candle_color: safeCandleColor,
              status: initialStatus
            }
          ])
          .select('id')
          .single();

        if (!supaErr && supaData) {
          createdId = supaData.id;
        } else if (supaErr) {
          const { data: retryData, error: retryErr } = await supabase
            .from('krathongs')
            .insert([
              {
                user_type: safeUserType,
                owner_name: cleanName,
                wish_message: cleanWish,
                base_type: safeBaseType,
                flower_type: safeFlowerType,
                candle_color: safeCandleColor
              }
            ])
            .select('id')
            .single();

          if (!retryErr && retryData) {
            createdId = retryData.id;
          }
        }
      } catch (err) {
        console.warn('Supabase insert note:', err);
      }

      // 5. ถ้าไม่ได้ใช้ Supabase ให้ส่งผ่าน Cloudflare Function (/api/krathongs)
      if (!createdId) {
        try {
          const res = await fetch('/api/krathongs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userType: safeUserType,
              ownerName: cleanName,
              wishMessage: cleanWish,
              baseType: safeBaseType,
              flowerType: safeFlowerType,
              candleColor: safeCandleColor
            })
          });

          if (res.status === 400 || res.status === 429) {
            const errData = (await res.json().catch(() => ({}))) as any;
            setErrorMsg(errData.error || 'ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
            setLoading(false);
            return;
          }

          if (res.ok) {
            const data = (await res.json()) as any;
            createdId = data.id;
          }
        } catch {}
      }

      const finalId = createdId || `local-${Date.now()}`;

      // 6. บันทึกลง LocalStorage เสมอ
      saveLocalKrathongRecord({
        id: finalId,
        user_type: safeUserType,
        owner_name: cleanName,
        wish_message: cleanWish,
        base_type: safeBaseType,
        flower_type: safeFlowerType,
        candle_color: safeCandleColor,
        status: initialStatus,
        created_at: new Date().toISOString()
      });

      markRateLimitAction('krathong_submit');
      soundManager.playFloatSuccessChime();
      onSuccessFloating(finalId, safeUserType);
    } catch (err: any) {
      console.warn('Using local fallback:', err);
      const fakeId = `local-${Date.now()}`;
      saveLocalKrathongRecord({
        id: fakeId,
        user_type: safeUserType,
        owner_name: cleanName,
        wish_message: cleanWish,
        base_type: safeBaseType,
        flower_type: safeFlowerType,
        candle_color: safeCandleColor,
        status: initialStatus,
        created_at: new Date().toISOString()
      });
      markRateLimitAction('krathong_submit');
      soundManager.playFloatSuccessChime();
      onSuccessFloating(fakeId, safeUserType);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col md:flex-row bg-[#1c1815]">
      {/* ฝั่งซ้าย (เดสก์ท็อป) / ด้านบน (มือถือ): ฉากผิวน้ำ 3D เต็มพื้นที่ + แคปซูลนำทางด้านบน */}
      <div className="relative w-full h-[44dvh] shrink-0 md:h-full md:flex-1 overflow-hidden">
        <Krathong3DPreview
          baseType={baseType}
          flowerType={flowerType}
          candleColor={combinedCandleValue}
          fullBleed
          paused={showShareModal || isOverlayOpen}
          pulseNonce={previewPulseNonce}
        />

        {/* มุมบนซ้าย: โลโก้ผู้จัดงาน + ชื่อเทศกาลแบบแคปซูลครีมอุ่น (ไม่ใช้ backdrop-blur ทับ WebGL) */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 bg-[#fdfaf4]/95 px-2.5 sm:px-3 py-1.5 rounded-2xl border border-amber-900/15 shadow-md text-[#231912]">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#241911] flex items-center justify-center p-1 shrink-0">
            <img
              src="/logo-final-notext-white.png"
              alt="SAM SCI 69 Logo"
              className="w-full h-full object-contain select-none pointer-events-none"
            />
          </div>
          <div className="leading-tight pr-0.5">
            <p className="text-[11px] sm:text-xs font-extrabold tracking-tight text-[#231912] whitespace-nowrap">
              เทศกาลลอยกระทงออนไลน์
            </p>
            <p className="text-[9px] sm:text-[10px] font-medium text-[#7c5d3a] whitespace-nowrap">
              กระทง 3D ลอยด้วยกัน
            </p>
          </div>
        </div>

        {/* มุมบนขวา: แคปซูลเมนูสายน้ำ / คำอวยพร / เปียโน / การ์ด */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-wrap items-center justify-end gap-1.5 max-w-[54vw]">
          <button
            type="button"
            onClick={onBackToRiver}
            className="px-2.5 py-1.5 rounded-full bg-[#fdfaf4]/95 hover:bg-white text-[#231912] border border-amber-900/15 shadow-md text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>สายน้ำ</span>
          </button>

          <button
            type="button"
            onClick={onNavigateWishes}
            className="px-2.5 py-1.5 rounded-full bg-[#fdfaf4]/95 hover:bg-white text-[#231912] border border-amber-900/15 shadow-md text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <MessageSquareHeart className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="hidden sm:inline">คำอวยพร</span>
          </button>

          <button
            type="button"
            onClick={handleToggleAudio}
            title={isAudioPlaying ? 'ปิดเสียงเพลงเปียโน' : 'เปิดเสียงเพลงลอยกระทง (เปียโน)'}
            aria-label={isAudioPlaying ? 'ปิดเสียงเพลงเปียโน' : 'เปิดเสียงเพลงลอยกระทง (เปียโน)'}
            className={`px-2.5 py-1.5 rounded-full border shadow-md text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all duration-150 active:scale-95 cursor-pointer ${
              isAudioPlaying
                ? 'bg-amber-100 border-amber-500 text-[#231912]'
                : 'bg-[#fdfaf4]/95 hover:bg-white border-amber-900/15 text-[#231912]'
            }`}
          >
            {isAudioPlaying ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[#7c5d3a] shrink-0" />
            )}
            <span className="hidden md:inline">เปียโน</span>
          </button>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="px-2.5 py-1.5 rounded-full bg-[#fdfaf4]/95 hover:bg-white text-[#231912] border border-amber-900/15 shadow-md text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="hidden sm:inline">การ์ด</span>
          </button>
        </div>
      </div>

      {/* ฝั่งขวา (เดสก์ท็อป) / ด้านล่าง (มือถือ): แผงควบคุมครีมอุ่น 3 ขั้นตอน */}
      <div className="w-full flex-1 md:flex-none md:w-[395px] lg:w-[425px] md:h-full bg-[#fdfaf4] text-[#231912] rounded-t-3xl md:rounded-none -mt-3 md:mt-0 relative z-20 flex flex-col overflow-hidden shadow-2xl border-t md:border-t-0 md:border-l border-amber-900/15">
        {/* แถบ Progress Tabs 3 ขั้นตอนปักหมุดด้านบน */}
        <div className="px-4 pt-3.5 pb-2.5 border-b border-amber-900/10 bg-[#fdfaf4] shrink-0">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'base', num: '1', label: 'เลือกฐาน' },
              { id: 'decor', num: '2', label: 'แต่ง' },
              { id: 'float', num: '3', label: 'ลอย' }
            ].map((step) => {
              const isActive = wizardStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setWizardStep(step.id as WizardStep)}
                  className={`py-2 px-2 rounded-2xl border text-center transition-all duration-150 active:scale-95 cursor-pointer flex flex-col items-center justify-center ${
                    isActive
                      ? 'bg-[#241911] text-[#fffbeb] border-[#241911] shadow-sm'
                      : 'bg-white text-[#574536] border-amber-900/12 hover:border-amber-600/40 hover:bg-amber-50/40'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center mb-0.5 transition-colors ${
                      isActive ? 'bg-amber-400 text-[#241911]' : 'bg-[#f4ecdd] text-[#574536]'
                    }`}
                  >
                    {step.num}
                  </span>
                  <span className="text-[11px] font-bold leading-none">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ฟอร์มเนื้อหาแบ่ง 3 ขั้นตอน (Scrollable Body + Sticky Action Footer) */}
        <form onSubmit={handleFloatSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div ref={bodyScrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-5">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-semibold text-center animate-ui-step">
                {errorMsg}
              </div>
            )}

            {/* ---------------- STEP 1: เลือกฐาน + เริ่มจากไอเดีย + สุ่มให้หน่อย ---------------- */}
            {wizardStep === 'base' && (
              <div key="step-base" className="space-y-5 animate-ui-step">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-extrabold text-[#231912]">1. เลือกฐานกระทง (8 สไตล์)</h2>
                  </div>
                  <p className="text-[11px] text-[#7c5d3a] mb-3">
                    ฐานที่ของตกแต่งทุกชิ้นจะวางอยู่ — เลือกก่อน แล้วค่อยแต่ง
                  </p>

                  <div className="grid grid-cols-4 gap-2">
                    {BASES.map((b) => {
                      const isSelected = baseType === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBaseType(b.id)}
                          className={`relative p-2 rounded-2xl border bg-white text-center transition-all duration-150 active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-[#241911] border-[#241911] shadow-sm bg-[#fffdf7]'
                              : 'border-amber-900/12 hover:border-amber-600/45 hover:bg-amber-50/35'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#241911] text-[#fffbeb] flex items-center justify-center shadow animate-ui-fade">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-1 border border-amber-900/10"
                            style={{ backgroundColor: `${b.swatch}1a`, color: b.swatch }}
                          >
                            <KrathongItemIcon id={b.id} className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-bold text-[#2a1f16] leading-tight line-clamp-1">
                            {b.shortName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* เริ่มจากไอเดีย (8 Presets) */}
                <div className="pt-2 border-t border-amber-900/10">
                  <h3 className="text-base font-extrabold text-[#231912]">เริ่มจากไอเดีย</h3>
                  <p className="text-[11px] text-[#7c5d3a] mb-3">แตะแล้วแต่งต่อได้ทุกชิ้น</p>

                  <div className="grid grid-cols-2 gap-2">
                    {IDEA_PRESETS.map((preset) => {
                      const isMatch =
                        baseType === preset.baseType &&
                        flowerType === preset.flowerType &&
                        candleColor === preset.candleColor;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyIdeaPreset(preset)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                            isMatch
                              ? 'bg-[#241911] text-[#fffbeb] border-[#241911] shadow-sm'
                              : 'bg-white hover:bg-amber-50/75 border-amber-900/12 text-[#2a1f16] shadow-2xs'
                          }`}
                        >
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleRandomizeDesign}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-amber-50 border border-amber-900/20 text-xs font-semibold text-[#2a1f16] shadow-2xs transition-all duration-150 active:scale-95 cursor-pointer"
                    >
                      <Dices className="w-3.5 h-3.5 text-amber-700" />
                      <span>สุ่มให้หน่อย</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- STEP 2: แต่งดอกไม้ / ตึกฟักทอง / เทียน / ของเสริม + สไลเดอร์ขนาด ---------------- */}
            {wizardStep === 'decor' && (
              <div key="step-decor" className="space-y-5 animate-ui-step">
                {/* ดอกไม้ประดับกลางกระทง */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#231912] mb-2">
                    <Flower2 className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>ดอกไม้ประดับกลางกระทง (8 ชนิด)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FLOWERS.filter((fl) => fl.category === 'flower').map((fl) => {
                      const isSelected = flowerType === fl.id;
                      return (
                        <button
                          key={fl.id}
                          type="button"
                          onClick={() => setFlowerType(fl.id)}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-[#241911] text-[#fffbeb] border-[#241911] shadow-sm'
                              : 'bg-white hover:bg-amber-50/70 border-amber-900/12 text-[#2a1f16]'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0 border border-black/15"
                            style={{
                              background:
                                fl.id === 'mixed_garland'
                                  ? 'conic-gradient(#fbbf24, #f43f5e, #c084fc, #38bdf8, #34d399)'
                                  : fl.color
                            }}
                          />
                          <span className="truncate">{fl.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ของตกแต่งกลางกระทงแทนดอกไม้ (รวมตึกฟักทอง ม.อ.) */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#231912] mb-2">
                    <PumpkinBuildingIcon className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>ของตกแต่งใส่ตรงกลางกระทง แทนดอกไม้ (8 แบบ)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FLOWERS.filter((fl) => fl.category === 'centerpiece').map((fl) => {
                      const isSelected = flowerType === fl.id;
                      return (
                        <button
                          key={fl.id}
                          type="button"
                          onClick={() => setFlowerType(fl.id)}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-[#241911] text-[#fffbeb] border-[#241911] shadow-sm'
                              : 'bg-white hover:bg-amber-50/70 border-amber-900/12 text-[#2a1f16]'
                          }`}
                        >
                          <KrathongItemIcon
                            id={fl.id}
                            className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-300' : 'text-amber-700'}`}
                          />
                          <span className="truncate">{fl.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* สไลเดอร์ปรับขนาดของตกแต่งตรงกลาง (60%-160%) */}
                <div className="p-3 rounded-2xl bg-[#f4ecdd] border border-amber-900/12 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#2a1f16]">
                      ปรับขนาดดอกไม้ / ของตกแต่งกลาง:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-amber-800 tabular-nums">
                        {Math.round(centerScale * 100)}%
                      </span>
                      {Math.abs(centerScale - 1) >= 0.01 && (
                        <button
                          type="button"
                          onClick={() => setCenterScale(1)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-amber-50 border border-amber-900/20 text-[10px] font-semibold text-[#2a1f16] transition active:scale-95 cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>รีเซ็ต</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={MIN_DECOR_SCALE}
                    max={MAX_DECOR_SCALE}
                    step={SCALE_STEP}
                    value={centerScale}
                    onChange={(e) => setCenterScale(Number(e.target.value))}
                    aria-label="ปรับขนาดของตกแต่งกลางกระทง"
                    className="w-full accent-[#241911] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#7c5d3a]">
                    <span>เล็ก (60%)</span>
                    <span>มาตรฐาน (100%)</span>
                    <span>ใหญ่พิเศษ (160%)</span>
                  </div>
                </div>

                {/* แสงเทียนนำทาง */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#231912] mb-2">
                    <Flame className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>แสงเทียนนำทาง (8 สีมงคล)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CANDLES.map((cd) => {
                      const isSelected = candleColor === cd.id;
                      return (
                        <button
                          key={cd.id}
                          type="button"
                          onClick={() => setCandleColor(cd.id)}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-[#241911] text-[#fffbeb] border-[#241911] shadow-sm'
                              : 'bg-white hover:bg-amber-50/70 border-amber-900/12 text-[#2a1f16]'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0 border border-black/15"
                            style={{
                              background:
                                cd.id === 'rainbow'
                                  ? 'linear-gradient(135deg, #f472b6, #fde047, #38bdf8)'
                                  : cd.hex
                            }}
                          />
                          <span className="truncate">{cd.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ของตกแต่งเสริมพิเศษปักรอบกระทง */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-[#231912]">
                      <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        ของตกแต่งเสริมรอบกระทง{' '}
                        <span className="font-normal text-[#7c5d3a]">(เลือกได้หลายชิ้น)</span>
                      </span>
                    </label>
                    {selectedAccessories.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-400/50 font-bold">
                        เลือกแล้ว {selectedAccessories.length} ชิ้น
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ACCESSORIES.map((acc) => {
                      const isSelected =
                        acc.id === 'none'
                          ? selectedAccessories.length === 0
                          : selectedAccessories.includes(acc.id);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleToggleAccessory(acc.id)}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-[#241911] text-[#fffbeb] border-[#241911] shadow-sm'
                              : 'bg-white hover:bg-amber-50/70 border-amber-900/12 text-[#2a1f16]'
                          }`}
                        >
                          <KrathongItemIcon
                            id={acc.id}
                            className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-300' : 'text-amber-700'}`}
                          />
                          <span className="truncate">{acc.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ตัวปรับขนาดของตกแต่งเสริมแต่ละชิ้นแยกกัน (60%-160%) */}
                  {selectedAccessories.length > 0 && (
                    <div className="mt-3 p-3 rounded-2xl bg-[#f4ecdd] border border-amber-900/12 space-y-2.5 animate-ui-step">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#2a1f16]">
                          ปรับขนาดของตกแต่งเสริมรายชิ้น:
                        </span>
                        <button
                          type="button"
                          onClick={() => setAccessoryScales({})}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-amber-50 border border-amber-900/20 text-[10px] font-semibold text-[#2a1f16] transition active:scale-95 cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>รีเซ็ตทั้งหมด</span>
                        </button>
                      </div>
                      <div className="space-y-2">
                        {selectedAccessories.map((accId) => {
                          const info = ACCESSORIES.find((a) => a.id === accId);
                          const currentScale = accessoryScales[accId] ?? 1;
                          return (
                            <div key={accId} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="inline-flex items-center gap-1.5 text-[#231912] font-semibold">
                                  <KrathongItemIcon id={accId} className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                  <span>{info?.name || accId}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-amber-800 tabular-nums">
                                    {Math.round(currentScale * 100)}%
                                  </span>
                                  {Math.abs(currentScale - 1) >= 0.01 && (
                                    <button
                                      type="button"
                                      onClick={() => handleAccessoryScaleChange(accId, 1)}
                                      className="text-[10px] text-[#7c5d3a] hover:text-[#231912] underline cursor-pointer"
                                    >
                                      100%
                                    </button>
                                  )}
                                </div>
                              </div>
                              <input
                                type="range"
                                min={MIN_DECOR_SCALE}
                                max={MAX_DECOR_SCALE}
                                step={SCALE_STEP}
                                value={currentScale}
                                onChange={(e) =>
                                  handleAccessoryScaleChange(accId, Number(e.target.value))
                                }
                                aria-label={`ปรับขนาด ${info?.name || accId}`}
                                className="w-full accent-[#241911] cursor-pointer"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- STEP 3: เขียนชื่อ คำอวยพร & ปล่อยกระทง ---------------- */}
            {wizardStep === 'float' && (
              <div key="step-float" className="space-y-4 animate-ui-step">
                <div>
                  <h2 className="text-sm font-extrabold text-[#231912] mb-1">
                    3. เขียนคำอธิษฐานและปล่อยกระทง
                  </h2>
                  <p className="text-[11px] text-[#7c5d3a]">
                    คำอธิษฐานจะลอยคู่กระทง 3D บนแม่น้ำ และอ่านได้ในหน้ารวมคำอวยพร
                  </p>
                </div>

                {/* ประเภทผู้ใช้งาน */}
                <div>
                  <label className="block text-xs font-bold text-[#231912] mb-1.5">
                    ประเภทผู้ใช้งาน <span className="text-amber-700">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'student', label: 'นักศึกษา' },
                      { id: 'staff', label: 'บุคลากร' },
                      { id: 'general', label: 'บุคคลทั่วไป' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setUserType(type.id as UserType)}
                        className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all duration-150 active:scale-95 text-center truncate cursor-pointer ${
                          userType === type.id
                            ? 'bg-[#241911] border-[#241911] text-[#fffbeb] shadow-sm'
                            : 'bg-white border-amber-900/15 text-[#574536] hover:border-amber-600/45'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ชื่อ & คำอวยพร */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#231912] mb-1">
                      ชื่อ / นามแฝง <span className="text-amber-700">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={40}
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="เช่น มะลิวัลย์, เด็กวิทยา ม.อ."
                      className="w-full bg-white border border-amber-900/20 rounded-xl px-3 py-2.5 text-sm text-[#231912] placeholder-[#9c8671] focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#231912] mb-1">
                      คำอธิษฐาน / คำขอขมา <span className="text-amber-700">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      maxLength={150}
                      value={wishMessage}
                      onChange={(e) => setWishMessage(e.target.value)}
                      placeholder="ขอขมาพระแม่คงคา ขอให้ชีวิตราบรื่น..."
                      className="w-full bg-white border border-amber-900/20 rounded-xl px-3 py-2 text-sm text-[#231912] placeholder-[#9c8671] focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-600 resize-none"
                    />
                  </div>

                  {/* คำอธิษฐานด่วน */}
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_WISHES.map((w, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setWishMessage(w)}
                        className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-white hover:bg-amber-50 text-[#574536] border border-amber-900/15 transition active:scale-95 truncate max-w-full cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3 text-amber-700 shrink-0" />
                        <span className="truncate">{w.slice(0, 32)}...</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* พรีวิวป้ายคำอธิษฐานและสรุปของตกแต่งที่เลือก */}
                <div className="bg-[#fffbeb] rounded-2xl p-3.5 border-2 border-amber-400 text-center shadow-sm space-y-2">
                  <p className="font-bold text-amber-900 text-sm">
                    {ownerName || 'ชื่อของคุณจะปรากฏที่นี่'}
                  </p>
                  <p className="text-xs text-stone-800 italic break-words line-clamp-2">
                    &ldquo;{wishMessage || 'คำขอขมาพระแม่คงคาหรือคำอธิษฐาน...'}&rdquo;
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 border border-amber-300/70 font-semibold">
                      <KrathongItemIcon id={baseType} className="w-3 h-3 text-amber-800 shrink-0" />
                      <span>{BASES.find((b) => b.id === baseType)?.shortName}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 border border-amber-300/70 font-semibold">
                      <KrathongItemIcon id={flowerType} className="w-3 h-3 text-amber-800 shrink-0" />
                      <span>
                        {FLOWERS.find((f) => f.id === flowerType)?.name}
                        {Math.abs(centerScale - 1) >= 0.01 ? ` ${Math.round(centerScale * 100)}%` : ''}
                      </span>
                    </span>
                    {selectedAccessories.map((accId) => {
                      const info = ACCESSORIES.find((a) => a.id === accId);
                      return info ? (
                        <span
                          key={accId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-800 border border-amber-300/60"
                        >
                          <KrathongItemIcon id={accId} className="w-3 h-3 text-amber-700 shrink-0" />
                          <span>{info.name}</span>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Action Footer */}
          <div className="px-4 py-3 border-t border-amber-900/10 bg-[#fdfaf4] shrink-0">
            {wizardStep === 'base' && (
              <button
                type="button"
                onClick={() => setWizardStep('decor')}
                className="w-full py-3 rounded-2xl bg-[#241911] hover:bg-[#38271a] text-[#fffbeb] font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all duration-150 active:scale-[0.98] cursor-pointer"
              >
                <span>ต่อไป: แต่งกระทง</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {wizardStep === 'decor' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWizardStep('base')}
                  className="px-4 py-3 rounded-2xl bg-white hover:bg-amber-50 border border-amber-900/20 text-[#3e2e22] font-semibold text-xs sm:text-sm flex items-center gap-1 transition-all duration-150 active:scale-[0.98] cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep('float')}
                  className="flex-1 py-3 rounded-2xl bg-[#241911] hover:bg-[#38271a] text-[#fffbeb] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all duration-150 active:scale-[0.98] cursor-pointer"
                >
                  <span>ต่อไป: เขียนคำอธิษฐาน & ลอย</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {wizardStep === 'float' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWizardStep('decor')}
                  className="px-4 py-3 rounded-2xl bg-white hover:bg-amber-50 border border-amber-900/20 text-[#3e2e22] font-semibold text-xs sm:text-sm flex items-center gap-1 transition-all duration-150 active:scale-[0.98] cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#231912] font-extrabold text-sm flex items-center justify-center gap-2 shadow-md border border-amber-600/25 transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4 text-[#231912]" />
                  <span>{loading ? 'กำลังส่งข้อมูล...' : 'ปล่อยกระทงลงน้ำ'}</span>
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Social Card Modal */}
      {showShareModal && (
        <ShareCardModal
          ownerName={ownerName || 'ผู้มีจิตศรัทธา'}
          wishMessage={wishMessage || 'ขอขมาพระแม่คงคา'}
          userType={userType}
          baseType={baseType}
          flowerType={flowerType}
          candleColor={combinedCandleValue}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};
