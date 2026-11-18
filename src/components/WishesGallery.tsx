// src/components/WishesGallery.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { KrathongItem } from '../types';
import {
  Sparkles,
  Eye,
  Search,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  RefreshCw,
  MessageSquareHeart,
  X,
  Clock,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import { containsProfanity, sanitizeInputText } from '../utils/security';
import {
  getLocalKrathongRecords,
  getModerationOverrides,
  mergeModerationOverrides
} from '../utils/evaluationHelpers';
import { KrathongVisual } from './KrathongVisual';
import { ShareCardModal } from './ShareCardModal';
import { soundManager } from '../utils/soundEffects';

interface WishesGalleryProps {
  myKrathongId?: string | null;
  onNavigateRiver: () => void;
  onNavigateCustomize: () => void;
}

type FilterTab = 'all' | 'student' | 'staff' | 'general' | 'mine';

const PAGE_SIZE = 24;

const SAMPLE_WISHES: KrathongItem[] = [
  {
    id: 'sample-wish-1',
    user_type: 'general',
    owner_name: 'น้องฟ้า',
    wish_message: 'ขอให้ปีนี้สมหวังทุกประการ และครอบครัวมีแต่ความสุขค่ะ 🌸',
    base_type: 'lotus',
    flower_type: 'lotus_flower',
    candle_color: 'pink|sparkler',
    status: 'approved',
    created_at: new Date().toISOString()
  },
  {
    id: 'sample-wish-2',
    user_type: 'general',
    owner_name: 'พี่โชคดี',
    wish_message: 'ขอขมาพระแม่คงคา กิจการรุ่งเรือง สุขภาพแข็งแรง 🌕',
    base_type: 'banana_gold',
    flower_type: 'pumpkin',
    candle_color: 'yellow',
    status: 'approved',
    created_at: new Date(Date.now() - 60000).toISOString()
  },
  {
    id: 'sample-wish-3',
    user_type: 'student',
    owner_name: 'ชมรมอนุรักษ์',
    wish_message: 'สืบสานประเพณีไทย รักษ์สายน้ำ Zero-Waste 100% 🪷',
    base_type: 'peacock_royal',
    flower_type: 'mixed_garland',
    candle_color: 'emerald|flag_thai,butterfly',
    status: 'approved',
    created_at: new Date(Date.now() - 120000).toISOString()
  }
];

const USER_TYPE_META: Record<string, { label: string; badgeClass: string }> = {
  student: {
    label: 'นักศึกษา',
    badgeClass: 'bg-amber-500/15 text-amber-200 border-amber-400/40'
  },
  staff: {
    label: 'บุคลากร',
    badgeClass: 'bg-sky-500/15 text-sky-200 border-sky-400/40'
  },
  general: {
    label: 'บุคคลทั่วไป',
    badgeClass: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40'
  }
};

function formatWishDate(iso?: string): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '-';
  }
}

async function fetchApprovedWishes(myKrathongId?: string | null): Promise<{
  items: KrathongItem[];
  isSample: boolean;
}> {
  let overrides = getModerationOverrides();
  try {
    const modRes = await fetch('/api/admin/moderate');
    if (modRes.ok && (modRes.headers.get('content-type') || '').includes('application/json')) {
      const modData = (await modRes.json()) as { overrides?: Record<string, string> };
      if (modData.overrides && typeof modData.overrides === 'object') {
        overrides = mergeModerationOverrides(modData.overrides);
      }
    }
  } catch {
    // Fallback quietly when offline or no Cloudflare moderation API
  }

  const localItems = getLocalKrathongRecords().filter(
    (item) => (overrides[item.id] || item.status || 'approved') === 'approved'
  );

  const hiddenUuidList = Object.entries(overrides)
    .filter(([id, st]) => (st === 'deleted' || st === 'rejected') && /^[0-9a-f-]{36}$/i.test(id))
    .map(([id]) => id)
    .slice(0, 50);

  let remoteItems: any[] = [];
  try {
    let query = supabase
      .from('krathongs')
      .select('id, user_type, owner_name, wish_message, base_type, flower_type, candle_color, status, created_at')
      .eq('status', 'approved');

    if (hiddenUuidList.length > 0) {
      query = query.not('id', 'in', `(${hiddenUuidList.join(',')})`);
    }

    const { data } = await query.order('created_at', { ascending: false }).limit(500);
    if (Array.isArray(data)) {
      remoteItems = data;
    }
  } catch {
    // Fallback below when Supabase is unavailable
  }

  if (remoteItems.length === 0) {
    try {
      const apiRes = await fetch('/api/krathongs?status=approved&limit=100');
      if (apiRes.ok && (apiRes.headers.get('content-type') || '').includes('application/json')) {
        const apiData = await apiRes.json();
        if (Array.isArray(apiData)) {
          remoteItems = apiData;
        }
      }
    } catch {
      // Offline mode continues using local records
    }
  }

  const combinedMap = new Map<string, KrathongItem>();

  const tryInsert = (raw: any) => {
    if (!raw || !raw.id) return;
    const effectiveStatus = overrides[raw.id] || raw.status || 'approved';
    if (effectiveStatus !== 'approved') return;

    const cleanName = sanitizeInputText(raw.owner_name, 50);
    const cleanWish = sanitizeInputText(raw.wish_message, 150);
    if (!cleanName || !cleanWish) return;
    if (containsProfanity(cleanName) || containsProfanity(cleanWish)) return;

    if (!combinedMap.has(raw.id)) {
      combinedMap.set(raw.id, {
        id: String(raw.id),
        user_type: (raw.user_type || 'general') as KrathongItem['user_type'],
        owner_name: cleanName,
        wish_message: cleanWish,
        base_type: String(raw.base_type || 'banana_leaf'),
        flower_type: String(raw.flower_type || 'lotus_flower'),
        candle_color: String(raw.candle_color || 'yellow'),
        status: 'approved',
        created_at: raw.created_at || new Date().toISOString(),
        isMine: Boolean(myKrathongId && raw.id === myKrathongId)
      });
    }
  };

  localItems.forEach(tryInsert);
  remoteItems.forEach(tryInsert);

  const merged = Array.from(combinedMap.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  if (merged.length === 0) {
    return { items: SAMPLE_WISHES, isSample: true };
  }
  return { items: merged, isSample: false };
}

export const WishesGallery: React.FC<WishesGalleryProps> = ({
  myKrathongId,
  onNavigateRiver,
  onNavigateCustomize
}) => {
  const [wishes, setWishes] = useState<KrathongItem[]>([]);
  const [isShowingSample, setIsShowingSample] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [shareCardKrathong, setShareCardKrathong] = useState<KrathongItem | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(() => soundManager.isAudioEnabled());

  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    fetchApprovedWishes(myKrathongId).then(({ items, isSample }) => {
      if (!mountedRef.current) return;
      setWishes(items);
      setIsShowingSample(isSample);
      setLoading(false);
    });

    const handleStorage = () => {
      fetchApprovedWishes(myKrathongId).then(({ items, isSample }) => {
        if (!mountedRef.current) return;
        setWishes(items);
        setIsShowingSample(isSample);
      });
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, [myKrathongId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { items, isSample } = await fetchApprovedWishes(myKrathongId);
      if (mountedRef.current) {
        setWishes(items);
        setIsShowingSample(isSample);
      }
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  };

  const handleToggleAudio = () => {
    setIsAudioPlaying(soundManager.toggleAudio());
  };

  const hasMyWish = useMemo(() => wishes.some((w) => w.isMine), [wishes]);

  const counts = useMemo(
    () => ({
      all: wishes.length,
      student: wishes.filter((w) => w.user_type === 'student').length,
      staff: wishes.filter((w) => w.user_type === 'staff').length,
      general: wishes.filter((w) => w.user_type !== 'student' && w.user_type !== 'staff').length,
      mine: wishes.filter((w) => w.isMine).length
    }),
    [wishes]
  );

  const filteredWishes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return wishes.filter((item) => {
      if (filterTab === 'mine' && !item.isMine) return false;
      if (filterTab === 'student' && item.user_type !== 'student') return false;
      if (filterTab === 'staff' && item.user_type !== 'staff') return false;
      if (
        filterTab === 'general' &&
        (item.user_type === 'student' || item.user_type === 'staff')
      ) {
        return false;
      }
      if (!q) return true;
      return (
        item.owner_name.toLowerCase().includes(q) ||
        item.wish_message.toLowerCase().includes(q)
      );
    });
  }, [wishes, filterTab, searchQuery]);

  const displayedWishes = filteredWishes.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredWishes.length - displayedWishes.length);

  return (
    <div className="min-h-screen bg-[#0b132b] text-[#fffbeb] flex flex-col py-2.5 sm:py-4 px-3 sm:px-6 lg:px-8 overflow-x-clip">
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-2 pb-3 border-b border-amber-500/25 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onNavigateRiver}
            className="flex items-center space-x-1.5 text-amber-200/85 hover:text-amber-100 transition text-xs sm:text-sm py-1.5 px-2.5 sm:px-3 rounded-xl bg-[#1c2541]/80 border border-amber-500/30 hover:border-amber-400 cursor-pointer shrink-0"
          >
            <Eye className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">ดูหน้าสายน้ำ</span>
            <span className="sm:hidden">สายน้ำ</span>
          </button>

          <button
            type="button"
            onClick={onNavigateCustomize}
            className="flex items-center space-x-1.5 text-stone-950 font-bold transition text-xs sm:text-sm py-1.5 px-2.5 sm:px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 border border-amber-300/60 shadow-sm cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-stone-950" />
            <span>สร้างกระทง</span>
          </button>
        </div>

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
            <span className="hidden md:inline">
              {isAudioPlaying ? 'เปียโน: เปิด' : 'เพลงเปียโน'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="อัปเดตคำอวยพรล่าสุด"
            aria-label="อัปเดตคำอวยพรล่าสุด"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-[#162038] hover:bg-[#1c2845] border border-amber-400/35 text-amber-200 text-xs font-semibold transition cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>

          <img
            src="/logo-final-notext-white.png"
            alt="SAM SCI 69 Logo"
            className="h-7 sm:h-9 w-auto object-contain opacity-95 select-none pointer-events-none"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto w-full py-5 sm:py-6 space-y-5 flex-1">
        {/* Hero Header */}
        <div className="bg-[#121b33] border border-amber-500/25 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-200 text-xs font-semibold">
              <MessageSquareHeart className="w-3.5 h-3.5 text-amber-300" />
              <span>บอร์ดคำอธิษฐานเทศกาลลอยกระทงออนไลน์</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-amber-100">
              รวมคำอวยพรและคำขอขมาพระแม่คงคาของทุกคน 🪷
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/75">
              อ่านคำอวยพร ความปรารถนาดี และชมกระทงที่ผู้ร่วมงานทุกคนร่วมปล่อยลงสู่สายน้ำ
              {isShowingSample && ' (กำลังแสดงตัวอย่างเริ่มต้น — ลอยกระทงใบแรกเพื่อเพิ่มคำอวยพรจริง)'}
            </p>
          </div>

          <div className="bg-[#0b132b]/85 border border-amber-400/30 rounded-2xl px-4 py-3 text-center sm:text-right shrink-0">
            <p className="text-[11px] text-amber-200/75">จำนวนคำอวยพรที่แสดง</p>
            <p className="text-2xl font-extrabold text-amber-300 mt-0.5">
              {wishes.length.toLocaleString()}{' '}
              <span className="text-xs font-medium text-amber-100/80">รายการ</span>
            </p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-[#121b33] border border-amber-500/25 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-lg">
          <div className="relative">
            <Search className="w-4 h-4 text-amber-300/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="ค้นหาคำอวยพร หรือชื่อผู้ลอยกระทง..."
              className="w-full bg-[#0b132b]/90 border border-amber-500/35 rounded-xl pl-10 pr-10 py-2.5 text-base sm:text-sm text-amber-50 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setVisibleCount(PAGE_SIZE);
                }}
                aria-label="ล้างคำค้นหา"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(
              [
                { id: 'all', label: `ทั้งหมด (${counts.all})` },
                { id: 'student', label: `นักศึกษา (${counts.student})` },
                { id: 'staff', label: `บุคลากร (${counts.staff})` },
                { id: 'general', label: `บุคคลทั่วไป (${counts.general})` },
                ...(hasMyWish ? [{ id: 'mine', label: `✨ กระทงของฉัน (${counts.mine})` }] : [])
              ] as { id: FilterTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilterTab(tab.id);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  filterTab === tab.id
                    ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-sm'
                    : 'bg-[#0b132b]/80 border-slate-700/80 text-slate-300 hover:border-amber-500/40 hover:text-amber-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Wishes Grid */}
        {loading ? (
          <div className="bg-[#121b33] border border-amber-500/20 rounded-3xl p-12 text-center text-amber-200/80 text-sm">
            กำลังโหลดคำอวยพรจากสายน้ำ...
          </div>
        ) : displayedWishes.length === 0 ? (
          <div className="bg-[#121b33] border border-amber-500/20 rounded-3xl p-10 text-center space-y-3">
            <p className="text-amber-100 font-semibold text-base">
              ไม่พบคำอวยพรที่ตรงกับคำค้นหาหรือตัวกรองที่เลือก
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterTab('all');
                setVisibleCount(PAGE_SIZE);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-200 text-xs font-semibold transition cursor-pointer"
            >
              แสดงคำอวยพรทั้งหมด
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedWishes.map((item) => {
                const typeInfo = USER_TYPE_META[item.user_type] || USER_TYPE_META.general;
                return (
                  <article
                    key={item.id}
                    className={`rounded-3xl p-4 border shadow-lg flex flex-col justify-between transition ${
                      item.isMine
                        ? 'bg-[#172546] border-amber-400/75 ring-1 ring-amber-400/35'
                        : 'bg-[#121b33] border-amber-500/25 hover:border-amber-400/45'
                    }`}
                  >
                    <div>
                      {/* Card Header: Krathong Miniature + Owner Metadata */}
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-24 shrink-0 rounded-2xl bg-[#0b132b]/85 border border-amber-500/25 flex items-center justify-center overflow-hidden">
                          <div className="scale-90">
                            <KrathongVisual
                              baseType={item.base_type}
                              flowerType={item.flower_type}
                              candleColor={item.candle_color}
                              size="sm"
                            />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeInfo.badgeClass}`}
                            >
                              {typeInfo.label}
                            </span>
                            {item.isMine && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/60">
                                ✨ กระทงของคุณ
                              </span>
                            )}
                          </div>

                          <h2 className="text-sm sm:text-base font-bold text-amber-100 truncate">
                            {item.owner_name}
                          </h2>

                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="truncate">{formatWishDate(item.created_at)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Full Wish Message */}
                      <div className="mt-3 bg-[#0b132b]/80 border border-amber-500/20 rounded-2xl p-3.5 text-xs sm:text-sm text-amber-50/95 leading-relaxed whitespace-pre-wrap break-words">
                        “{item.wish_message}”
                      </div>
                    </div>

                    {/* Footer Button */}
                    <div className="mt-3 pt-2.5 border-t border-amber-500/15 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setShareCardKrathong(item)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-semibold transition cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                        <span>เปิดดูการ์ด E-Card</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {remainingCount > 0 && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-[#162038] hover:bg-[#1c2845] border border-amber-400/45 text-amber-200 text-xs sm:text-sm font-semibold shadow-md transition cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>ดูคำอวยพรเพิ่มเติม (เหลืออีก {remainingCount.toLocaleString()} รายการ)</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Share Card Modal */}
      {shareCardKrathong && (
        <ShareCardModal
          ownerName={shareCardKrathong.owner_name}
          wishMessage={shareCardKrathong.wish_message}
          userType={shareCardKrathong.user_type}
          baseType={shareCardKrathong.base_type}
          flowerType={shareCardKrathong.flower_type}
          candleColor={shareCardKrathong.candle_color}
          onClose={() => setShareCardKrathong(null)}
        />
      )}
    </div>
  );
};
