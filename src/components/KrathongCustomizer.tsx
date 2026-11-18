// src/components/KrathongCustomizer.tsx
import React, { useState } from 'react';
import type { UserType } from '../types';
import { KrathongVisual } from './KrathongVisual';
import { ShareCardModal } from './ShareCardModal';
import { Sparkles, Eye, Image as ImageIcon, Dices, Volume2, VolumeX, MessageSquareHeart } from 'lucide-react';
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
}

export const KrathongCustomizer: React.FC<KrathongCustomizerProps> = ({
  onBackToRiver,
  onNavigateWishes,
  onSuccessFloating
}) => {
  const [userType, setUserType] = useState<UserType>('student');
  const [ownerName, setOwnerName] = useState('');
  const [wishMessage, setWishMessage] = useState('');
  const [baseType, setBaseType] = useState('banana_leaf');
  const [flowerType, setFlowerType] = useState('lotus_flower');
  const [candleColor, setCandleColor] = useState('yellow');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [activeDecorTab, setActiveDecorTab] = useState<'base' | 'flower' | 'candle' | 'accessory'>('base');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(() => soundManager.isAudioEnabled());

  const handleToggleAudio = () => {
    setIsAudioPlaying(soundManager.toggleAudio());
  };

  // 1. ฐานกระทง 8 รูปแบบ
  const bases = [
    { id: 'banana_leaf', name: 'ใบตองดั้งเดิม', icon: '🍃' },
    { id: 'banana_gold', name: 'ใบตองยอดฉัตรทอง', icon: '👑' },
    { id: 'lotus', name: 'บัวหลวงชมพู', icon: '🪷' },
    { id: 'lotus_crystal', name: 'บัวแก้วคริสตัล', icon: '💎' },
    { id: 'coconut', name: 'กะลารักษ์โลก', icon: '🥥' },
    { id: 'bread', name: 'ขนมปังแฟนซี', icon: '🍞' },
    { id: 'ice_swan', name: 'น้ำแข็งหงส์คู่', icon: '🦢' },
    { id: 'peacock_royal', name: 'นกยูงทองคำ', icon: '🦚' },
  ];

  // 2. ดอกไม้ประดับ (8 ชนิด) และของตกแต่งใส่ตรงกลางกระทงแทนดอกไม้ (8 แบบ)
  const flowers: {
    id: string;
    name: string;
    color: string;
    icon: string;
    category: 'flower' | 'centerpiece';
  }[] = [
    { id: 'lotus_flower', name: 'ดอกบัวชมพู', color: '#f43f5e', icon: '🪷', category: 'flower' },
    { id: 'marigold', name: 'ดาวเรืองทอง', color: '#fbbf24', icon: '🌼', category: 'flower' },
    { id: 'orchid', name: 'กล้วยไม้ม่วง', color: '#c084fc', icon: '🌺', category: 'flower' },
    { id: 'jasmine', name: 'มะลิร้อยมาลัย', color: '#f8fafc', icon: '🤍', category: 'flower' },
    { id: 'rose', name: 'กุหลาบแดง', color: '#e11d48', icon: '🌹', category: 'flower' },
    { id: 'dok_kem', name: 'ดอกเข็มส้ม', color: '#fb923c', icon: '🏵️', category: 'flower' },
    { id: 'anchan', name: 'อัญชันคราม', color: '#6366f1', icon: '🪻', category: 'flower' },
    { id: 'mixed_garland', name: 'มาลัย 5 สี', color: '#10b981', icon: '💐', category: 'flower' },
    { id: 'pumpkin', name: 'ตึกฟักทอง ม.อ.', color: '#f59e0b', icon: '🏛️', category: 'centerpiece' },
    { id: 'noppamas_crown', name: 'ชฎาทองนพมาศ', color: '#fbbf24', icon: '👑', category: 'centerpiece' },
    { id: 'elephant_gold', name: 'ช้างเผือกมงคล', color: '#fef3c7', icon: '🐘', category: 'centerpiece' },
    { id: 'golden_swan', name: 'หงส์ทองคู่บารมี', color: '#fde047', icon: '🦢', category: 'centerpiece' },
    { id: 'lotus_lamp', name: 'โคมบัวแก้วทิพย์', color: '#f472b6', icon: '🪷', category: 'centerpiece' },
    { id: 'gold_pagoda', name: 'เจดีย์ทองมงคล', color: '#eab308', icon: '🛕', category: 'centerpiece' },
    { id: 'royal_barge', name: 'เรือสุพรรณหงส์', color: '#d97706', icon: '🛶', category: 'centerpiece' },
    { id: 'crystal_heart', name: 'หัวใจเพชรคู่รัก', color: '#ec4899', icon: '💎', category: 'centerpiece' },
  ];

  // 3. แสงเทียนนำทาง 8 สี
  const candles = [
    { id: 'yellow', name: 'สีทอง (สำเร็จ)', hex: '#fde047' },
    { id: 'red', name: 'สีแดง (โชคลาภ)', hex: '#f87171' },
    { id: 'orange', name: 'สีส้ม (รุ่งเรือง)', hex: '#fb923c' },
    { id: 'cyan', name: 'สีฟ้า (สงบสุข)', hex: '#38bdf8' },
    { id: 'pink', name: 'สีชมพู (ความรัก)', hex: '#f472b6' },
    { id: 'emerald', name: 'สีเขียว (สุขภาพ)', hex: '#34d399' },
    { id: 'purple', name: 'สีม่วง (ปัญญา)', hex: '#c084fc' },
    { id: 'rainbow', name: 'เทียนคู่สายรุ้ง', hex: '#ec4899' },
  ];

  // 4. ของตกแต่งเสริมพิเศษปักรอบกระทง 8 แบบ
  const accessories = [
    { id: 'sparkler', name: 'ไฟเย็นระยิบ', icon: '✨' },
    { id: 'sky_lantern', name: 'โคมลอยล้านนา', icon: '🏮' },
    { id: 'heart_sign', name: 'หัวใจคู่รัก', icon: '💖' },
    { id: 'grad_cap', name: 'หมวกปริญญา A+', icon: '🎓' },
    { id: 'lucky_coin', name: 'เหรียญทองนำโชค', icon: '🪙' },
    { id: 'flag_thai', name: 'ธงราวงานวัด', icon: '🎏' },
    { id: 'butterfly', name: 'ผีเสื้อแสงจันทร์', icon: '🦋' },
    { id: 'none', name: 'ธูปเทียนปกติ', icon: '🕯️' },
  ];

  // คำอธิษฐานยอดฮิตกดเลือกได้ทันที
  const quickWishes = [
    'ขอขมาพระแม่คงคา ขอให้เกรด 4.00 ทุกวิชา สมหวังทุกประการ ✨',
    'ขอให้สุขภาพแข็งแรง การงานก้าวหน้า เงินทองไหลมาเทมา 🌕',
    'ขอให้เจอความรักที่ดี มีความสุขตลอดปีและตลอดไป 💖',
    'ขอให้ทุกข์โศกโรคภัยลอยไปกับสายน้ำ มีแต่รอยยิ้มและความสำเร็จ 🪷'
  ];

  // สลับเลือก/ยกเลิกของตกแต่งเสริม (เลือกได้หลายชิ้นพร้อมกัน)
  const handleToggleAccessory = (accId: string) => {
    if (accId === 'none') {
      setSelectedAccessories([]);
      return;
    }
    setSelectedAccessories((prev) =>
      prev.includes(accId) ? prev.filter((item) => item !== accId) : [...prev, accId]
    );
  };

  // สุ่มแต่งกระทงมงคลด้วยปุ่มเดียว (สุ่มของประดับ 1-3 ชิ้นพร้อมกัน)
  const handleRandomizeDesign = () => {
    setBaseType(bases[Math.floor(Math.random() * bases.length)].id);
    setFlowerType(flowers[Math.floor(Math.random() * flowers.length)].id);
    setCandleColor(candles[Math.floor(Math.random() * candles.length)].id);

    const decorPool = accessories.filter((a) => a.id !== 'none').map((a) => a.id);
    const shuffled = [...decorPool].sort(() => 0.5 - Math.random());
    const pickCount = Math.floor(Math.random() * 3) + 1; // สุ่ม 1 ถึง 3 ชิ้น
    setSelectedAccessories(shuffled.slice(0, pickCount));
  };

  const combinedCandleValue =
    selectedAccessories.length > 0
      ? `${candleColor}|${selectedAccessories.join(',')}`
      : candleColor;

  const handleFloatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = sanitizeInputText(ownerName, 40);
    const cleanWish = sanitizeInputText(wishMessage, 150);

    if (!cleanName) {
      setErrorMsg('กรุณาระบุชื่อหรือนามแฝงของคุณ');
      return;
    }
    if (!cleanWish) {
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
          // กรณีตาราง krathongs บน Supabase ไม่มีคอลัมน์ status ให้ลองบันทึกอีกครั้งโดยไม่ส่งฟิลด์ status
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
            const errData = await res.json().catch(() => ({})) as any;
            setErrorMsg(errData.error || 'ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
            setLoading(false);
            return;
          }

          if (res.ok) {
            const data = await res.json() as any;
            createdId = data.id;
          }
        } catch {}
      }

      const finalId = createdId || `local-${Date.now()}`;

      // 6. บันทึกลง LocalStorage เสมอ เพื่อให้ทั้งหน้าแม่น้ำและหน้า Admin Dashboard แสดงกระทงใบใหม่ทันที 100%
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
    <div className="min-h-screen bg-[#0b132b] text-[#fffbeb] flex flex-col py-2.5 sm:py-3 px-3 sm:px-6 lg:px-8 overflow-x-clip">
      {/* Top Bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-amber-500/25 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onBackToRiver}
            className="flex items-center space-x-1.5 text-amber-200/80 hover:text-amber-100 transition text-xs sm:text-sm py-1.5 px-2.5 sm:px-3 rounded-lg bg-[#1c2541]/70 border border-amber-500/30 hover:border-amber-400 cursor-pointer shrink-0"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">ดูหน้าสายน้ำ</span>
            <span className="sm:hidden">สายน้ำ</span>
          </button>

          <button
            type="button"
            onClick={onNavigateWishes}
            className="flex items-center space-x-1.5 text-amber-200 hover:text-amber-100 transition text-xs sm:text-sm py-1.5 px-2.5 sm:px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 cursor-pointer shrink-0 font-semibold"
          >
            <MessageSquareHeart className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">รวมคำอวยพร</span>
            <span className="sm:hidden">คำอวยพร</span>
          </button>
        </div>

        <h2 className="hidden md:block text-base lg:text-lg font-bold text-amber-100 text-center truncate">
          รังสรรค์กระทงออนไลน์ 🪷
        </h2>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isAudioPlaying ? 'ปิดเสียงเพลงเปียโน' : 'เปิดเสียงเพลงลอยกระทง (เปียโน)'}
            aria-label={isAudioPlaying ? 'ปิดเสียงเพลงเปียโน' : 'เปิดเสียงเพลงลอยกระทง (เปียโน)'}
            className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold border shadow-sm transition cursor-pointer ${
              isAudioPlaying
                ? 'bg-amber-500/20 border-amber-400 text-amber-100'
                : 'bg-[#162038] hover:bg-[#1c2845] border-amber-400/35 text-amber-200/85'
            }`}
          >
            {isAudioPlaying ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-amber-200/80 shrink-0" />
            )}
            <span className="hidden md:inline">{isAudioPlaying ? 'เปียโน: เปิด' : 'เพลงเปียโน'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-[#162038] hover:bg-[#1c2845] text-amber-200 rounded-xl text-xs font-semibold border border-amber-400/40 shadow-sm transition cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">การ์ดรูปภาพ</span>
            <span className="sm:hidden">การ์ด</span>
          </button>
          <img
            src="/logo-final-notext-white.png"
            alt="SAM SCI 69 Logo"
            className="h-7 sm:h-9 w-auto object-contain opacity-95 select-none pointer-events-none"
          />
        </div>
      </div>

      {/* Main Builder Container */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-6 items-start py-3 sm:py-4 pb-10">
        {/* Left Side: Sticky Real-time Live Preview (Compact Horizontal on Mobile, Full Vertical on Desktop) */}
        <div className="md:col-span-5 sticky top-2 z-30 md:top-4 flex flex-col items-center justify-center p-2.5 sm:p-5 md:p-6 bg-[#121b33] rounded-2xl md:rounded-3xl border border-amber-400/35 shadow-xl relative overflow-hidden">
          {/* Mobile Compact Sticky Preview (< md) */}
          <div className="flex md:hidden items-center gap-3 w-full">
            <div className="w-28 h-28 shrink-0 rounded-2xl bg-[#0b132b]/80 border border-amber-500/25 flex items-center justify-center">
              <KrathongVisual
                baseType={baseType}
                flowerType={flowerType}
                candleColor={combinedCandleValue}
                size="sm"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wide truncate">
                  ตัวอย่างกระทงจริง
                </span>
                <button
                  type="button"
                  onClick={handleRandomizeDesign}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/50 text-amber-200 text-[10px] font-semibold transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Dices className="w-3 h-3 text-amber-300" />
                  <span>สุ่มแบบ</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/90 border border-amber-500/30 text-amber-200 truncate max-w-[115px]">
                  {bases.find((b) => b.id === baseType)?.icon} {bases.find((b) => b.id === baseType)?.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/90 border border-amber-500/30 text-amber-200 truncate max-w-[115px]">
                  {flowers.find((f) => f.id === flowerType)?.icon || '🌸'} {flowers.find((f) => f.id === flowerType)?.name}
                </span>
                {selectedAccessories.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 border border-amber-400/50 text-amber-100">
                    +{selectedAccessories.length} ของเสริม
                  </span>
                )}
              </div>
              <div className="w-full bg-[#fffbeb] rounded-xl px-2.5 py-1.5 border border-amber-400 text-left shadow-sm">
                <p className="font-bold text-amber-900 text-[11px] truncate">
                  {ownerName || 'ชื่อของคุณจะปรากฏที่นี่'}
                </p>
                <p className="text-[10px] text-stone-800 italic truncate">
                  "{wishMessage || 'คำอธิษฐานหรือคำขอขมา...'}"
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Vertical Live Preview (>= md) */}
          <div className="hidden md:flex md:flex-col md:items-center w-full">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-[11px] text-amber-300 font-medium tracking-wide uppercase">
                ตัวอย่างกระทงจริง (Live Preview)
              </span>
              <button
                type="button"
                onClick={handleRandomizeDesign}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/50 text-amber-200 text-[11px] font-semibold transition active:scale-95 cursor-pointer"
              >
                <Dices className="w-3.5 h-3.5 text-amber-300" />
                <span>สุ่มแบบสวยๆ</span>
              </button>
            </div>

            <div className="my-4 transform hover:scale-105 transition-transform duration-300 flex items-center justify-center">
              <KrathongVisual
                baseType={baseType}
                flowerType={flowerType}
                candleColor={combinedCandleValue}
                size="md"
              />
            </div>

            {/* Current Design Badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/90 border border-amber-500/30 text-amber-200">
                {bases.find((b) => b.id === baseType)?.icon} {bases.find((b) => b.id === baseType)?.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/90 border border-amber-500/30 text-amber-200">
                {flowers.find((f) => f.id === flowerType)?.icon || '🌸'} {flowers.find((f) => f.id === flowerType)?.name}
              </span>
              {selectedAccessories.length === 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/90 border border-amber-500/30 text-amber-200">
                  🕯️ ธูปเทียนปกติ
                </span>
              ) : (
                selectedAccessories.map((accId) => {
                  const found = accessories.find((a) => a.id === accId);
                  return found ? (
                    <span
                      key={accId}
                      className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 border border-amber-400/50 text-amber-100"
                    >
                      {found.icon} {found.name}
                    </span>
                  ) : null;
                })
              )}
            </div>

            {/* Speech Bubble Preview */}
            <div className="w-full bg-[#fffbeb] rounded-2xl p-4 border-2 border-amber-400 text-center mt-1 shadow-md">
              <p className="font-bold text-amber-900 text-sm">
                {ownerName || 'ชื่อของคุณจะปรากฏที่นี่'}
              </p>
              <p className="text-xs text-stone-800 italic mt-0.5 break-words line-clamp-2">
                "{wishMessage || 'คำขอขมาพระแม่คงคาหรือคำอธิษฐาน...'}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Form Controls */}
        <div className="md:col-span-7 bg-[#121b33] p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-500/25 shadow-xl">
          <form onSubmit={handleFloatSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs text-center">
                {errorMsg}
              </div>
            )}

            {/* 1. ประเภทผู้ใช้งาน (บังคับ) */}
            <div>
              <label className="block text-xs font-semibold text-amber-200 mb-1.5">
                1. ประเภทผู้ใช้งาน <span className="text-amber-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {[
                  { id: 'student', label: 'นักศึกษา' },
                  { id: 'staff', label: 'บุคลากร' },
                  { id: 'general', label: 'บุคคลทั่วไป' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setUserType(type.id as UserType)}
                    className={`py-2 px-1 text-[11px] sm:text-xs font-medium rounded-xl border transition text-center truncate cursor-pointer ${
                      userType === type.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-100 font-bold shadow-sm'
                        : 'bg-[#0b132b]/80 border-slate-700/80 text-slate-300 hover:border-amber-500/40'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. ชื่อ & คำอวยพร */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    ชื่อ / นามแฝง <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="เช่น มะลิวัลย์, เด็กวิศวะ"
                    className="w-full bg-[#0b132b]/90 border border-amber-500/35 rounded-xl px-3 py-2 text-base sm:text-sm text-amber-50 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    คำอธิษฐาน / คำขอขมา <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={wishMessage}
                    onChange={(e) => setWishMessage(e.target.value)}
                    placeholder="ขอขมาพระแม่คงคา ขอให้ชีวิตราบรื่น..."
                    className="w-full bg-[#0b132b]/90 border border-amber-500/35 rounded-xl px-3 py-2 text-base sm:text-sm text-amber-50 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* ปุ่มเลือกคำอธิษฐานด่วน */}
              <div className="flex flex-wrap gap-1.5">
                {quickWishes.map((w, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setWishMessage(w)}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-[#0b132b]/70 hover:bg-amber-500/20 text-amber-200/80 hover:text-amber-100 border border-amber-500/25 transition truncate max-w-full cursor-pointer"
                  >
                    💬 {w.slice(0, 34)}...
                  </button>
                ))}
              </div>
            </div>

            {/* แถบสลับหมวดของตกแต่งเฉพาะมือถือ ลดการเลื่อนขึ้น-ลงบ่อย */}
            <div className="md:hidden pt-1">
              <p className="text-[11px] font-semibold text-amber-200 mb-1.5">
                เลือกปรับแต่งกระทง (กดสลับหมวดได้เลยไม่ต้องเลื่อนจอ):
              </p>
              <div className="grid grid-cols-4 gap-1 bg-[#0b132b]/80 p-1 rounded-2xl border border-amber-500/25">
                {[
                  { id: 'base', label: '1. ฐาน' },
                  { id: 'flower', label: '2. ดอก/ตึก' },
                  { id: 'candle', label: '3. เทียน' },
                  {
                    id: 'accessory',
                    label:
                      selectedAccessories.length > 0
                        ? `4. เสริม (${selectedAccessories.length})`
                        : '4. เสริม'
                  }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setActiveDecorTab(tab.id as 'base' | 'flower' | 'candle' | 'accessory')
                    }
                    className={`py-2 px-1 rounded-xl text-[11px] font-semibold transition text-center truncate cursor-pointer ${
                      activeDecorTab === tab.id
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'text-amber-200/80 hover:text-amber-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. เลือกฐานกระทง (8 แบบ) */}
            <div className={activeDecorTab === 'base' ? 'block' : 'hidden md:block'}>
              <label className="block text-xs font-semibold text-amber-200 mb-1.5">
                2. เลือกฐานกระทง (8 สไตล์)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {bases.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBaseType(b.id)}
                    className={`p-2 rounded-xl border text-left transition flex flex-col items-center text-center cursor-pointer ${
                      baseType === b.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-sm font-bold'
                        : 'bg-[#0b132b]/80 border-slate-700/80 text-slate-300 hover:border-amber-500/40'
                    }`}
                  >
                    <span className="text-lg sm:text-xl mb-0.5">{b.icon}</span>
                    <span className="text-[11px] leading-tight">{b.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. ดอกไม้ประดับ หรือ ของตกแต่งตรงกลางกระทง */}
            <div className={`space-y-2.5 ${activeDecorTab === 'flower' ? 'block' : 'hidden md:block'}`}>
              <label className="block text-xs font-semibold text-amber-200">
                3. เลือกดอกไม้ หรือ ของตกแต่งกลางกระทง
              </label>

              <div>
                <p className="text-[11px] font-medium text-amber-200/80 mb-1.5">
                  🌸 ดอกไม้ประดับกลางกระทง (8 ชนิด)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  {flowers
                    .filter((fl) => fl.category === 'flower')
                    .map((fl) => (
                      <button
                        key={fl.id}
                        type="button"
                        onClick={() => setFlowerType(fl.id)}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                          flowerType === fl.id
                            ? 'bg-amber-500/20 border-amber-400 text-amber-100 font-semibold shadow-sm'
                            : 'bg-[#0b132b]/80 border-slate-700/80 text-slate-300 hover:border-amber-500/40'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/40"
                          style={{
                            background:
                              fl.id === 'mixed_garland'
                                ? 'conic-gradient(#fbbf24, #f43f5e, #c084fc, #38bdf8, #34d399)'
                                : fl.color
                          }}
                        />
                        <span className="truncate">{fl.name}</span>
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-amber-300 mb-1.5">
                  🏛️ ของตกแต่งใส่ตรงกลางกระทง แทนดอกไม้ (8 แบบ)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  {flowers
                    .filter((fl) => fl.category === 'centerpiece')
                    .map((fl) => (
                      <button
                        key={fl.id}
                        type="button"
                        onClick={() => setFlowerType(fl.id)}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                          flowerType === fl.id
                            ? 'bg-amber-500/20 border-amber-400 text-amber-100 font-semibold shadow-sm'
                            : 'bg-[#0b132b]/80 border-slate-700/80 text-slate-300 hover:border-amber-500/40'
                        }`}
                      >
                        <span className="text-sm shrink-0">{fl.icon}</span>
                        <span className="truncate">{fl.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* 5. แสงเทียนนำทาง (8 สีมงคล) */}
            <div className={activeDecorTab === 'candle' ? 'block' : 'hidden md:block'}>
              <label className="block text-xs font-semibold text-amber-200 mb-1.5">
                4. แสงเทียนนำทาง (8 สีมงคล)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                {candles.map((cd) => (
                  <button
                    key={cd.id}
                    type="button"
                    onClick={() => setCandleColor(cd.id)}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      candleColor === cd.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-100 font-semibold shadow-sm'
                        : 'bg-[#0b132b]/80 border-slate-700/80 text-slate-300 hover:border-amber-500/40'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        background:
                          cd.id === 'rainbow'
                            ? 'linear-gradient(135deg, #f472b6, #fde047, #38bdf8)'
                            : cd.hex
                      }}
                    />
                    <span className="truncate">{cd.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. ของตกแต่งเสริมพิเศษบนยอดกระทง (เลือกได้หลายชิ้นพร้อมกัน) */}
            <div className={activeDecorTab === 'accessory' ? 'block' : 'hidden md:block'}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-amber-200">
                  5. ของตกแต่งเสริมพิเศษ (ปักรอบกระทง) <span className="text-amber-300/90 font-normal">(เลือกได้หลายชิ้น ✨)</span>
                </label>
                {selectedAccessories.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40">
                    เลือกแล้ว {selectedAccessories.length} ชิ้น
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                {accessories.map((acc) => {
                  const isSelected =
                    acc.id === 'none'
                      ? selectedAccessories.length === 0
                      : selectedAccessories.includes(acc.id);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleToggleAccessory(acc.id)}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-100 font-semibold shadow-sm'
                          : 'bg-[#0b132b]/80 border-slate-700/80 text-slate-300 hover:border-amber-500/40'
                      }`}
                    >
                      <span className="text-sm">{acc.icon}</span>
                      <span className="truncate">{acc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-2xl shadow-md border border-amber-300/60 transition active:scale-98 text-sm sm:text-base cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-stone-900" />
                <span>{loading ? 'กำลังส่งข้อมูล...' : 'ปล่อยกระทงลงน้ำ 🌊'}</span>
              </button>
            </div>
          </form>
        </div>
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
