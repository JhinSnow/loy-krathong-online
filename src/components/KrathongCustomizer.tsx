// src/components/KrathongCustomizer.tsx
import React, { useState } from 'react';
import type { UserType } from '../types';
import { KrathongVisual } from './KrathongVisual';
import { ShareCardModal } from './ShareCardModal';
import { Sparkles, Eye, Image as ImageIcon, Dices } from 'lucide-react';
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
  onSuccessFloating: (krathongId: string, userType: UserType) => void;
}

export const KrathongCustomizer: React.FC<KrathongCustomizerProps> = ({
  onBackToRiver,
  onSuccessFloating
}) => {
  const [userType, setUserType] = useState<UserType>('student');
  const [ownerName, setOwnerName] = useState('');
  const [wishMessage, setWishMessage] = useState('');
  const [baseType, setBaseType] = useState('banana_leaf');
  const [flowerType, setFlowerType] = useState('lotus_flower');
  const [candleColor, setCandleColor] = useState('yellow');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>(['pumpkin']);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

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

  // 2. ดอกไม้ประดับ 8 ชนิด
  const flowers = [
    { id: 'lotus_flower', name: 'ดอกบัวชมพู', color: '#f43f5e' },
    { id: 'marigold', name: 'ดาวเรืองทอง', color: '#fbbf24' },
    { id: 'orchid', name: 'กล้วยไม้ม่วง', color: '#c084fc' },
    { id: 'jasmine', name: 'มะลิร้อยมาลัย', color: '#f8fafc' },
    { id: 'rose', name: 'กุหลาบแดง', color: '#e11d48' },
    { id: 'dok_kem', name: 'ดอกเข็มส้ม', color: '#fb923c' },
    { id: 'anchan', name: 'อัญชันคราม', color: '#6366f1' },
    { id: 'mixed_garland', name: 'มาลัย 5 สี', color: '#10b981' },
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

  // 4. ของตกแต่งเสริมพิเศษบนกระทง 8 แบบ
  const accessories = [
    { id: 'none', name: 'ธูปเทียนปกติ', icon: '🕯️' },
    { id: 'pumpkin', name: 'ป้ายตึกฟักทอง', icon: '🏛️' },
    { id: 'sparkler', name: 'ไฟเย็นระยิบ', icon: '✨' },
    { id: 'heart_sign', name: 'หัวใจคู่รัก', icon: '💖' },
    { id: 'grad_cap', name: 'หมวกปริญญา A+', icon: '🎓' },
    { id: 'lucky_coin', name: 'เหรียญทองนำโชค', icon: '🪙' },
    { id: 'flag_thai', name: 'ธงราวงานวัด', icon: '🎏' },
    { id: 'butterfly', name: 'ผีเสื้อแสงจันทร์', icon: '🦋' },
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
    <div className="min-h-screen bg-[#0b132b] text-[#fffbeb] flex flex-col py-3 px-3 sm:px-6 lg:px-8 overflow-y-auto">
      {/* Top Bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-3 border-b border-amber-500/25 shrink-0">
        <button
          onClick={onBackToRiver}
          className="flex items-center space-x-1.5 text-amber-200/80 hover:text-amber-100 transition text-xs sm:text-sm py-1.5 px-3 rounded-lg bg-[#1c2541]/70 border border-amber-500/30 hover:border-amber-400 cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span>ดูหน้าสายน้ำ</span>
        </button>

        <h2 className="text-sm sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-200">
          รังสรรค์กระทงออนไลน์ (กว่า 4,000 รูปแบบ) 🪷
        </h2>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1c2541]/80 hover:bg-[#1c2541] text-amber-300 rounded-xl text-xs font-semibold border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.2)] transition cursor-pointer"
        >
          <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
          <span>การ์ดรูปภาพ</span>
        </button>
      </div>

      {/* Main Builder Container */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start py-4 pb-12">
        {/* Left Side: Real-time Live Preview */}
        <div className="md:col-span-5 md:sticky md:top-4 flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#1c2541]/90 via-[#0b132b]/95 to-[#0b132b] rounded-3xl border border-amber-400/40 shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(245,158,11,0.2)] relative overflow-hidden backdrop-blur-md">
          {/* Ambient Glow */}
          <div className="absolute top-0 w-36 h-36 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

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

          <div className="my-2 sm:my-4 transform hover:scale-105 transition-transform duration-300 flex items-center justify-center">
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
              {bases.find(b => b.id === baseType)?.icon} {bases.find(b => b.id === baseType)?.name}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/90 border border-amber-500/30 text-amber-200">
              🌸 {flowers.find(f => f.id === flowerType)?.name}
            </span>
            {selectedAccessories.length === 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/90 border border-amber-500/30 text-amber-200">
                🕯️ ธูปเทียนปกติ
              </span>
            ) : (
              selectedAccessories.map((accId) => {
                const found = accessories.find(a => a.id === accId);
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
          <div className="w-full bg-[#fffbeb] rounded-2xl p-3 sm:p-4 border-2 border-amber-400 text-center mt-1 shadow-[0_4px_16px_rgba(245,158,11,0.3)]">
            <p className="font-bold text-amber-900 text-xs sm:text-sm">
              {ownerName || 'ชื่อของคุณจะปรากฏที่นี่'}
            </p>
            <p className="text-[11px] sm:text-xs text-stone-800 italic mt-0.5 break-words line-clamp-2">
              "{wishMessage || 'คำขอขมาพระแม่คงคาหรือคำอธิษฐาน...'}"
            </p>
          </div>
        </div>

        {/* Right Side: Form Controls */}
        <div className="md:col-span-7 bg-[#1c2541]/75 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-amber-500/35 shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(245,158,11,0.15)]">
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
                        ? 'bg-amber-400/25 border-amber-400 text-amber-200 font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]'
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
                    className="w-full bg-[#0b132b]/90 border border-amber-500/35 rounded-xl px-3 py-2 text-xs sm:text-sm text-amber-50 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
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
                    className="w-full bg-[#0b132b]/90 border border-amber-500/35 rounded-xl px-3 py-2 text-xs sm:text-sm text-amber-50 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
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

            {/* 3. เลือกฐานกระทง (8 แบบ) */}
            <div>
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
                        ? 'bg-amber-400/25 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold'
                        : 'bg-[#0b132b]/80 border-slate-700/80 text-slate-300 hover:border-amber-500/40'
                    }`}
                  >
                    <span className="text-lg sm:text-xl mb-0.5">{b.icon}</span>
                    <span className="text-[11px] leading-tight">{b.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. ดอกไม้ประดับ (8 ชนิด) */}
            <div>
              <label className="block text-xs font-semibold text-amber-200 mb-1.5">
                3. ดอกไม้ประดับ (8 ชนิด)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                {flowers.map((fl) => (
                  <button
                    key={fl.id}
                    type="button"
                    onClick={() => setFlowerType(fl.id)}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      flowerType === fl.id
                        ? 'bg-amber-400/25 border-amber-400 text-amber-200 font-semibold shadow-[0_0_10px_rgba(245,158,11,0.25)]'
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

            {/* 5. แสงเทียนนำทาง (8 สีมงคล) */}
            <div>
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
                        ? 'bg-amber-400/25 border-amber-400 text-amber-200 font-semibold shadow-[0_0_10px_rgba(245,158,11,0.25)]'
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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-amber-200">
                  5. ของตกแต่งเสริมพิเศษ <span className="text-amber-300/90 font-normal">(เลือกได้หลายชิ้นพร้อมกัน ✨)</span>
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
                          ? 'bg-amber-400/25 border-amber-400 text-amber-200 font-semibold shadow-[0_0_10px_rgba(245,158,11,0.25)]'
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
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-stone-900 font-extrabold rounded-2xl shadow-[0_4px_25px_rgba(245,158,11,0.45)] border border-yellow-200/60 transition active:scale-98 text-sm sm:text-base cursor-pointer"
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
