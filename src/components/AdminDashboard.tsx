// src/components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import type { StatsResponse, KrathongItem } from '../types';
import {
  exportEvaluationAndProjectToExcel,
  exportEvaluationToCSV,
  openOfficialA4ReportPrintView
} from '../utils/exportHelpers';
import {
  Users,
  Star,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Lock,
  LogOut,
  KeyRound,
  Download,
  Award,
  BarChart3,
  Trash2,
  Search
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import {
  getAdminSession,
  loginAdmin,
  clearAdminSession,
  getAdminAuthHeaders
} from '../utils/security';
import {
  parseEvaluationRow,
  getLocalEvaluationRecords,
  getDemoEvaluationRecords,
  calculateEvaluationAnalytics,
  getLocalKrathongRecords,
  updateLocalKrathongStatus,
  getLocalRequireApproval,
  setLocalRequireApproval,
  getModerationOverrides,
  mergeModerationOverrides,
  type EvaluationAnalyticsSummary
} from '../utils/evaluationHelpers';
import { EvaluationRadarChart } from './EvaluationRadarChart';

interface AdminDashboardProps {
  onBackToRiver: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToRiver }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAdminSession()));
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [krathongs, setKrathongs] = useState<KrathongItem[]>([]);
  const [evalAnalytics, setEvalAnalytics] = useState<EvaluationAnalyticsSummary>(() =>
    calculateEvaluationAnalytics(getDemoEvaluationRecords())
  );
  const [isUsingDemoEvals, setIsUsingDemoEvals] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [requireApproval, setRequireApproval] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  // ดึงข้อมูลสถิติ รายการกระทง และข้อมูลประเมิน 10 ข้อ (รวมข้อมูลจากทั้ง LocalStorage + Supabase + API)
  const loadData = async () => {
    if (!getAdminSession()) {
      setIsAuthenticated(false);
      return;
    }

    setLoading(true);
    try {
      let supaKrathongs: any[] = [];
      let supaEvals: any[] = [];
      let approvalSetting = getLocalRequireApproval();

      // 1. ดึงจาก Supabase แบบแบ่งหน้า (รองรับมากกว่า 1,000 รายการในวันงานจริง)
      try {
        const fetchAllRows = async (table: 'krathongs' | 'evaluations') => {
          const allRows: any[] = [];
          const pageSize = 1000;
          for (let page = 0; page < 10; page++) {
            const from = page * pageSize;
            const { data } = await supabase
              .from(table)
              .select('*')
              .order('created_at', { ascending: false })
              .range(from, from + pageSize - 1);
            if (!data || data.length === 0) break;
            allRows.push(...data);
            if (data.length < pageSize) break;
          }
          return allRows;
        };

        const [kData, eData, sRes] = await Promise.all([
          fetchAllRows('krathongs'),
          fetchAllRows('evaluations'),
          supabase.from('system_settings').select('value').eq('key', 'require_approval').maybeSingle()
        ]);

        supaKrathongs = kData;
        supaEvals = eData;
        if (sRes.data?.value !== undefined) {
          approvalSetting = sRes.data.value === 'true';
          setLocalRequireApproval(approvalSetting);
        }
      } catch (supaErr) {
        console.warn('Supabase fetch note:', supaErr);
      }

      let overrides = getModerationOverrides();

      // 1.5 ดึงสถานะ Moderation Overrides จาก Cloudflare D1 API (ถ้ามี)
      try {
        const modRes = await fetch('/api/admin/moderate', { credentials: 'include' });
        if (modRes.ok && (modRes.headers.get('content-type') || '').includes('application/json')) {
          const modData = await modRes.json();
          if (modData.overrides && typeof modData.overrides === 'object') {
            overrides = mergeModerationOverrides(modData.overrides);
          }
          if (modData.requireApproval !== undefined) {
            approvalSetting = Boolean(modData.requireApproval);
            setLocalRequireApproval(approvalSetting);
          }
        }
      } catch {}

      setRequireApproval(approvalSetting);

      // 2. รวมข้อมูลกระทงจาก LocalStorage + Supabase (เรียงใหม่ล่าสุดขึ้นก่อน)
      const localKrathongs = getLocalKrathongRecords();
      const mergedKrathongsMap = new Map<string, any>();

      // ใส่ข้อมูลจาก LocalStorage ก่อน (เพื่อให้สถานะที่เพิ่งอัปเดตหรือเพิ่งสร้างใหม่แสดงผลทันที)
      localKrathongs.forEach((item) => {
        mergedKrathongsMap.set(item.id, item);
      });
      supaKrathongs.forEach((item) => {
        if (!mergedKrathongsMap.has(item.id)) {
          mergedKrathongsMap.set(item.id, item);
        }
      });

      // ถ้าทั้ง LocalStorage และ Supabase ยังว่าง ลองดึงจาก Cloudflare API (ตรวจสอบ Content-Type ว่าต้องเป็น JSON เท่านั้น)
      if (mergedKrathongsMap.size === 0) {
        try {
          const headers = getAdminAuthHeaders();
          const listRes = await fetch('/api/krathongs?limit=100', { headers, credentials: 'include' });
          if (listRes.ok && (listRes.headers.get('content-type') || '').includes('application/json')) {
            const listData = await listRes.json();
            if (Array.isArray(listData)) {
              listData.forEach((item) => mergedKrathongsMap.set(item.id, item));
            }
          }
        } catch {}
      }

      // นำสถานะ Override (อนุมัติ / ซ่อน / ลบ) มาประยุกต์กับทุกกระทง
      const allKrathongs = Array.from(mergedKrathongsMap.values())
        .filter((item) => overrides[item.id] !== 'deleted')
        .map((item) => ({
          ...item,
          status: overrides[item.id] || item.status || 'approved'
        }))
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setKrathongs(allKrathongs);

      // 3. รวมข้อมูลแบบประเมิน 10 ข้อจาก LocalStorage + Supabase (ตัดแถวทดสอบระบบออก)
      const localEvalRecords = getLocalEvaluationRecords();
      const dbEvalRecords = supaEvals
        .filter((row) => row.id !== 'f85dd716-4bc9-4e11-b84f-66d5cf9e9007')
        .map((row, idx) => parseEvaluationRow(row, idx));

      const combinedEvalRecords = [...localEvalRecords];
      dbEvalRecords.forEach((dbRec) => {
        const isDuplicate = combinedEvalRecords.some(
          (loc) =>
            loc.id === dbRec.id ||
            (loc.krathong_id && dbRec.krathong_id && loc.krathong_id === dbRec.krathong_id) ||
            Math.abs(new Date(loc.created_at).getTime() - new Date(dbRec.created_at).getTime()) < 2000
        );
        if (!isDuplicate) {
          combinedEvalRecords.push(dbRec);
        }
      });

      combinedEvalRecords.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      const finalEvalRecords =
        combinedEvalRecords.length > 0 ? combinedEvalRecords : getDemoEvaluationRecords();
      setIsUsingDemoEvals(combinedEvalRecords.length === 0);

      const computedAnalytics = calculateEvaluationAnalytics(finalEvalRecords);
      setEvalAnalytics(computedAnalytics);

      // 4. คำนวณสถิติผู้เข้าร่วมและสถานะกระทงจากข้อมูลรวมทั้งหมดเสมอ
      const studentCount = allKrathongs.filter(k => k.user_type === 'student').length;
      const staffCount = allKrathongs.filter(k => k.user_type === 'staff').length;
      const generalCount = allKrathongs.filter(k => k.user_type !== 'student' && k.user_type !== 'staff').length;

      const approvedCount = allKrathongs.filter(k => k.status === 'approved' || !k.status).length;
      const pendingCount = allKrathongs.filter(k => k.status === 'pending').length;
      const rejectedCount = allKrathongs.filter(k => k.status === 'rejected').length;

      const recentFeedbacks = finalEvalRecords
        .filter(e => e.comment)
        .slice(0, 15)
        .map(e => ({
          user_type: e.user_type as any,
          rating: Math.round(e.average_score),
          feedback: e.comment,
          created_at: e.created_at
        }));

      setStats({
        userStats: [
          { user_type: 'student', count: studentCount },
          { user_type: 'staff', count: staffCount },
          { user_type: 'general', count: generalCount }
        ],
        statusStats: [
          { status: 'approved', count: approvedCount },
          { status: 'pending', count: pendingCount },
          { status: 'rejected', count: rejectedCount }
        ],
        ratingSummary: {
          total_reviews: computedAnalytics.totalN,
          average_rating: computedAnalytics.overallMean
        },
        ratingDistribution: [],
        recentFeedbacks,
        requireApproval: approvalSetting
      });
    } catch (e) {
      console.warn('Load admin data note:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      const handleStorageChange = () => loadData();
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [isAuthenticated]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const result = await loginAdmin(username, password);
      if (result.success) {
        setPassword('');
        setIsAuthenticated(true);
      } else {
        setAuthError(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearAdminSession();
    setIsAuthenticated(false);
    setStats(null);
    setKrathongs([]);
  };

  // สลับโหมด Approval
  const handleToggleApproval = async () => {
    if (!getAdminSession()) return;
    const nextVal = !requireApproval;
    setRequireApproval(nextVal);
    setLocalRequireApproval(nextVal);
    try {
      await supabase
        .from('system_settings')
        .upsert({ key: 'require_approval', value: nextVal ? 'true' : 'false' }, { onConflict: 'key' });
    } catch (_) {}

    try {
      await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ action: 'toggle_approval', requireApproval: nextVal })
      });
    } catch (_) {}
  };

  // ดำเนินการ อนุมัติ / ซ่อน / ลบกระทง
  const handleModerate = async (krathongId: string, status: 'approved' | 'rejected' | 'deleted') => {
    if (!getAdminSession()) return;

    // 1. บันทึกสถานะ Override ทันทีและอัปเดตหน้าจอทันที (ไม่ต้องรอ Server)
    updateLocalKrathongStatus(krathongId, status);

    setKrathongs((prev) => {
      const next =
        status === 'deleted'
          ? prev.filter((k) => k.id !== krathongId)
          : prev.map((k) => (k.id === krathongId ? { ...k, status } : k));

      // อัปเดตตัวเลขสถิติด้านบนให้ตรงกันทันที
      setStats((prevStats) => {
        if (!prevStats) return prevStats;
        const approvedCount = next.filter((k: any) => k.status === 'approved' || !k.status).length;
        const pendingCount = next.filter((k: any) => k.status === 'pending').length;
        const rejectedCount = next.filter((k: any) => k.status === 'rejected').length;
        const studentCount = next.filter((k: any) => k.user_type === 'student').length;
        const staffCount = next.filter((k: any) => k.user_type === 'staff').length;
        const generalCount = next.filter((k: any) => k.user_type !== 'student' && k.user_type !== 'staff').length;
        return {
          ...prevStats,
          userStats: [
            { user_type: 'student', count: studentCount },
            { user_type: 'staff', count: staffCount },
            { user_type: 'general', count: generalCount }
          ],
          statusStats: [
            { status: 'approved', count: approvedCount },
            { status: 'pending', count: pendingCount },
            { status: 'rejected', count: rejectedCount }
          ]
        };
      });

      return next;
    });

    // 2. ส่งคำสั่งไปที่ Cloudflare D1 API (/api/admin/moderate)
    try {
      await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: status === 'deleted' ? 'delete' : 'update_status',
          krathongId,
          status
        })
      });
    } catch (_) {}

    // 3. ส่งคำสั่งไปที่ Supabase (ถ้าตารางเปิดสิทธิ์ไว้)
    try {
      if (status === 'deleted') {
        await supabase.from('krathongs').delete().eq('id', krathongId);
      } else {
        await supabase.from('krathongs').update({ status }).eq('id', krathongId);
      }
    } catch (_) {}
  };

  // Export Data Handlers สำหรับทำเล่มรายงานสรุปโครงการ
  const handleExportExcel = () => {
    const exportRows = krathongs.map((k: any) => ({
      id: k.id,
      user_type: k.user_type,
      owner_name: k.owner_name,
      wish_message: k.wish_message,
      status: k.status || 'approved',
      created_at: k.created_at || new Date().toISOString()
    }));
    exportEvaluationAndProjectToExcel(evalAnalytics, exportRows);
  };

  const handleExportCSV = () => {
    exportEvaluationToCSV(evalAnalytics);
  };

  const handleExportA4Report = () => {
    const totalKrathongs = stats?.userStats.reduce((acc, curr) => acc + curr.count, 0) || krathongs.length;
    openOfficialA4ReportPrintView(evalAnalytics, totalKrathongs);
  };

  // หน้าจอยืนยันตัวตนสำหรับผู้ดูแลระบบ (Admin Authentication Gate)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/95 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBackToRiver}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-amber-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับหน้าแม่น้ำ</span>
            </button>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Protected Area
            </span>
          </div>

          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-amber-200">เข้าสู่ระบบผู้ดูแล (Admin Login)</h1>
            <p className="text-xs text-slate-400 mt-1">
              กรุณายืนยันตัวตนก่อนเข้าถึงระบบคัดกรองข้อความและรายงานสรุปผล 10 ด้าน
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-medium text-amber-100/80 mb-1.5">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                maxLength={50}
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-amber-100/80 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                maxLength={100}
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 font-bold rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{authLoading ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบผู้ดูแล'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalUsers = stats?.userStats.reduce((acc, curr) => acc + curr.count, 0) || krathongs.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToRiver}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-amber-200">
              Admin Dashboard & ระบบสรุปผลประเมินโครงการ (10 ด้าน)
            </h1>
            <p className="text-xs text-slate-400">
              ระบบคัดกรองข้อความ วิเคราะห์ Radar Chart และส่งออกข้อมูลสำหรับทำเล่มสรุปโครงการ
            </p>
          </div>
        </div>

        {/* Action Controls & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Approval Mode Toggle */}
          <button
            onClick={handleToggleApproval}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              requireApproval
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            {requireApproval ? (
              <ToggleRight className="w-5 h-5 text-amber-400" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-slate-500" />
            )}
            <span>คัดกรองก่อนขึ้นจอ: {requireApproval ? 'เปิด' : 'ปิด'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            title="ดาวน์โหลดไฟล์ Excel (.xlsx) ครบทั้ง 3 Sheets: ข้อมูลดิบผู้ประเมิน, ตารางสรุปสถิติ 10 ด้าน และรายชื่อผู้ลอยกระทง"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx 3 Sheets)</span>
          </button>

          <button
            onClick={handleExportCSV}
            title="ดาวน์โหลดข้อมูลดิบผู้ตอบแบบประเมินเป็นไฟล์ CSV"
            className="flex items-center space-x-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV (Raw)</span>
          </button>

          <button
            onClick={handleExportA4Report}
            title="เปิดหน้ารายงานสรุปผลขนาด A4 พร้อมกราฟ Radar Chart และตารางสถิติ 10 ข้อเพื่อพิมพ์หรือเซฟเป็น PDF"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>รายงานสรุปโครงการ A4 (PDF)</span>
          </button>

          <button
            onClick={loadData}
            title="รีเฟรชข้อมูล"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            title="ออกจากระบบผู้ดูแล"
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-rose-950/60 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">ผู้เข้าร่วมลอยกระทงทั้งหมด</span>
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mt-2">{totalUsers.toLocaleString()} คน</p>
            <div className="text-[11px] text-slate-400 mt-2 space-x-2">
              <span>นศ: {stats?.userStats.find(u => u.user_type === 'student')?.count || 0}</span>
              <span>• บุคลากร: {stats?.userStats.find(u => u.user_type === 'staff')?.count || 0}</span>
              <span>• ภายนอก: {stats?.userStats.find(u => u.user_type === 'general')?.count || 0}</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">ค่าเฉลี่ยรวมทุกด้าน (Overall Mean)</span>
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-2xl font-black text-amber-300 mt-2">
              x̄ = {evalAnalytics.overallMean.toFixed(2)} / 5.00
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              ระดับความพึงพอใจ: <strong className="text-amber-200">{evalAnalytics.overallLevelText}</strong> (N = {evalAnalytics.totalN} คน)
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">ด้านที่ได้คะแนนสูงสุด</span>
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-base font-extrabold text-emerald-300 mt-2 line-clamp-1">
              {evalAnalytics.highestDimension?.shortLabel || '-'}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              x̄ = {evalAnalytics.highestDimension?.mean.toFixed(2) || '-'} (S.D. = {evalAnalytics.highestDimension?.sd.toFixed(2) || '-'})
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">สถานะกระทงบนแม่น้ำ</span>
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            <p className="text-2xl font-black text-sky-300 mt-2">
              {stats?.statusStats.find(s => s.status === 'approved')?.count || krathongs.length} ใบ
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              รอตรวจ: {stats?.statusStats.find(s => s.status === 'pending')?.count || 0} | ปฏิเสธ: {stats?.statusStats.find(s => s.status === 'rejected')?.count || 0}
            </p>
          </div>
        </div>

        {/* 1. Radar Chart Component */}
        <EvaluationRadarChart
          questionStats={evalAnalytics.questionStats}
          overallMean={evalAnalytics.overallMean}
          totalN={evalAnalytics.totalN}
        />

        {/* 2. ตารางสรุปผลสถิติความพึงพอใจ 10 ด้าน (ตามรูปแบบเอกสารรายงานสรุปโครงการ) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <h2 className="text-base sm:text-lg font-bold text-amber-200">
                  ตารางสรุปผลสถิติความพึงพอใจของผู้เข้าร่วมกิจกรรม 10 ด้าน
                </h2>
                {isUsingDemoEvals && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    ข้อมูลตัวอย่าง (จะอัปเดตทันทีเมื่อมีผู้ส่งแบบประเมินจริง)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                แสดงจำนวนผู้ตอบทั้งหมด (N = {evalAnalytics.totalN} คน), ร้อยละ (%) ในแต่ละระดับคะแนน (1–5), ค่าเฉลี่ย (x̄) และส่วนเบี่ยงเบนมาตรฐาน (S.D.)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition cursor-pointer"
              >
                ดาวน์โหลดตารางนี้เป็น Excel
              </button>
              <button
                onClick={handleExportA4Report}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold transition cursor-pointer"
              >
                พิมพ์รายงาน A4
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center border-r border-slate-800 w-12">ข้อ</th>
                  <th className="py-3 px-4 border-r border-slate-800 min-w-[260px]">
                    ประเด็นการประเมินความพึงพอใจ
                  </th>
                  <th className="py-2 px-2 text-center border-r border-slate-800">
                    5 มากที่สุด<br />
                    <span className="text-[10px] text-slate-400">จำนวน (%)</span>
                  </th>
                  <th className="py-2 px-2 text-center border-r border-slate-800">
                    4 มาก<br />
                    <span className="text-[10px] text-slate-400">จำนวน (%)</span>
                  </th>
                  <th className="py-2 px-2 text-center border-r border-slate-800">
                    3 ปานกลาง<br />
                    <span className="text-[10px] text-slate-400">จำนวน (%)</span>
                  </th>
                  <th className="py-2 px-2 text-center border-r border-slate-800">
                    2 น้อย<br />
                    <span className="text-[10px] text-slate-400">จำนวน (%)</span>
                  </th>
                  <th className="py-2 px-2 text-center border-r border-slate-800">
                    1 น้อยที่สุด<br />
                    <span className="text-[10px] text-slate-400">จำนวน (%)</span>
                  </th>
                  <th className="py-3 px-3 text-center border-r border-slate-800 text-amber-300">
                    ค่าเฉลี่ย (x̄)
                  </th>
                  <th className="py-3 px-3 text-center border-r border-slate-800">S.D.</th>
                  <th className="py-3 px-3 text-center">แปลผล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {evalAnalytics.questionStats.map((st) => (
                  <tr key={st.questionId} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 text-center font-bold text-amber-300 border-r border-slate-800/70">
                      {st.questionId}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-100 border-r border-slate-800/70">
                      {st.title}
                    </td>
                    {[5, 4, 3, 2, 1].map((lvl) => {
                      const scoreKey = lvl as 1 | 2 | 3 | 4 | 5;
                      return (
                        <td
                          key={lvl}
                          className="py-2.5 px-2 text-center border-r border-slate-800/70 whitespace-nowrap"
                        >
                          <span className="font-semibold text-slate-200">
                            {st.percentages[scoreKey].toFixed(1)}%
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            ({st.counts[scoreKey]} คน)
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-center font-extrabold text-amber-300 border-r border-slate-800/70 text-sm">
                      {st.mean.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300 border-r border-slate-800/70">
                      {st.sd.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {st.levelText}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* แถวสรุปค่าเฉลี่ยรวมทุกด้าน (Overall Mean) */}
                <tr className="bg-amber-500/15 font-bold text-amber-200 border-t-2 border-amber-500/40">
                  <td colSpan={7} className="py-3.5 px-4 text-right border-r border-amber-500/30 text-sm">
                    ค่าเฉลี่ยรวมทุกด้าน (Overall Mean) จากผู้ประเมินทั้งหมด N = {evalAnalytics.totalN} คน
                  </td>
                  <td className="py-3.5 px-3 text-center text-base font-black text-amber-300 border-r border-amber-500/30">
                    {evalAnalytics.overallMean.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-center border-r border-amber-500/30">
                    {evalAnalytics.overallSD.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-stone-950">
                      {evalAnalytics.overallLevelText}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Live Moderation Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-amber-200">
                รายการกระทงล่าสุด (Live Moderation Stream)
              </h2>
              <p className="text-xs text-slate-400">
                สามารถค้นหา กรองสถานะ ตรวจสอบ อนุมัติ หรือซ่อนข้อความที่ไม่เหมาะสมได้ทันที
              </p>
            </div>

            {/* Search & Status Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ หรือคำอธิษฐาน..."
                  className="bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none w-48 sm:w-56"
                />
              </div>

              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { id: 'all', label: `ทั้งหมด (${krathongs.length})` },
                  {
                    id: 'pending',
                    label: `รอตรวจ (${krathongs.filter((k) => k.status === 'pending').length})`
                  },
                  {
                    id: 'approved',
                    label: `แสดงผล (${krathongs.filter((k) => (k.status || 'approved') === 'approved').length})`
                  },
                  {
                    id: 'rejected',
                    label: `ซ่อนแล้ว (${krathongs.filter((k) => k.status === 'rejected').length})`
                  }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {krathongs.some((k) => k.status === 'pending') && (
                <button
                  type="button"
                  onClick={() => {
                    krathongs
                      .filter((k) => k.status === 'pending')
                      .forEach((k) => handleModerate(k.id, 'approved'));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow cursor-pointer flex items-center space-x-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>อนุมัติที่รอตรวจทั้งหมด</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ผู้ปล่อย</th>
                  <th className="py-3 px-4">กลุ่ม</th>
                  <th className="py-3 px-4">คำอธิษฐาน / ข้อความ</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                  <th className="py-3 px-4">เวลา</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(() => {
                  const q = searchQuery.trim().toLowerCase();
                  const filtered = krathongs.filter((k: any) => {
                    const st = k.status || 'approved';
                    if (statusFilter !== 'all' && st !== statusFilter) return false;
                    if (!q) return true;
                    return (
                      (k.owner_name || '').toLowerCase().includes(q) ||
                      (k.wish_message || '').toLowerCase().includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          {krathongs.length === 0
                            ? 'ยังไม่มีรายการกระทงในขณะนี้'
                            : 'ไม่พบรายการกระทงที่ตรงกับเงื่อนไขการค้นหา'}
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map((k: any) => {
                    const currentStatus = k.status || 'approved';
                    return (
                      <tr key={k.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                          {k.owner_name}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {k.user_type === 'student' ? 'นักศึกษา' : k.user_type === 'staff' ? 'บุคลากร' : 'บุคคลภายนอก'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-200 max-w-xs break-words">
                          "{k.wish_message}"
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {currentStatus === 'approved' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              แสดงผล (อนุมัติ)
                            </span>
                          ) : currentStatus === 'pending' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              รอตรวจสอบ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              ซ่อนแล้ว
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {k.created_at ? k.created_at.slice(11, 16) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleModerate(k.id, 'approved')}
                              title="อนุมัติให้แสดงบนแม่น้ำ"
                              className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 text-[11px] font-semibold ${
                                currentStatus === 'approved'
                                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
                              }`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>อนุมัติ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModerate(k.id, 'rejected')}
                              title="ซ่อนไม่ให้แสดงบนแม่น้ำ"
                              className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 text-[11px] font-semibold ${
                                currentStatus === 'rejected'
                                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ซ่อน</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModerate(k.id, 'deleted')}
                              title="ลบรายการนี้ออกจากระบบ"
                              className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-lg transition cursor-pointer flex items-center space-x-1 text-[11px] font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบ</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Feedback Section */}
        {evalAnalytics.records.some(r => r.comment) && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-amber-200 mb-3">
              ข้อเสนอแนะและความคิดเห็นจากผู้ตอบแบบประเมินล่าสุด
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {evalAnalytics.records
                .filter(r => r.comment)
                .slice(0, 12)
                .map((f, i) => (
                  <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>
                        {f.user_type === 'student'
                          ? `นักศึกษา ${f.student_id ? `(${f.student_id})` : ''}`
                          : f.user_type === 'staff'
                            ? 'บุคลากร'
                            : 'บุคคลภายนอก'}
                      </span>
                      <span className="text-amber-300 font-bold">
                        x̄ = {f.average_score.toFixed(2)} / 5.00
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 italic">"{f.comment}"</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
