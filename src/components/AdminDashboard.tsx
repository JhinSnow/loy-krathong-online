// src/components/AdminDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import type { StatsResponse, KrathongItem } from '../types';
import { GraduationCap } from 'lucide-react';
import {
  exportEvaluationAndProjectToExcel,
  exportEvaluationToCSV,
  openOfficialA4ReportPrintView,
  exportStudentTranscriptByFacultyToExcel
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
  Search,
  Eye,
  EyeOff,
  RotateCcw
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
  buildStudentTranscriptRoster,
  getLocalKrathongRecords,
  updateLocalKrathongStatus,
  getLocalRequireApproval,
  setLocalRequireApproval,
  getModerationOverrides,
  mergeModerationOverrides,
  resetDeviceEvaluationLock,
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
  const [showPassword, setShowPassword] = useState<boolean>(false);
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
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>('all');
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');
  const [resetLockNotice, setResetLockNotice] = useState<string>('');

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
          for (let page = 0; page < 25; page++) {
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

      // ผสานข้อมูลกระทงและแบบประเมินจาก Cloudflare D1 API (รองรับสูงสุด 3,000+ รายการ หากมีเครื่องที่บันทึกผ่าน D1 Fallback)
      try {
        const headers = getAdminAuthHeaders();
        const [listRes, evalRes] = await Promise.all([
          fetch('/api/krathongs?status=all&limit=3000', { headers, credentials: 'include' }).catch(() => null),
          fetch('/api/evaluations?limit=3000', { headers, credentials: 'include' }).catch(() => null)
        ]);
        if (listRes && listRes.ok && (listRes.headers.get('content-type') || '').includes('application/json')) {
          const listData = await listRes.json();
          if (Array.isArray(listData)) {
            listData.forEach((item) => {
              if (item?.id && !mergedKrathongsMap.has(item.id)) {
                mergedKrathongsMap.set(item.id, item);
              }
            });
          }
        }
        if (evalRes && evalRes.ok && (evalRes.headers.get('content-type') || '').includes('application/json')) {
          const evalData = await evalRes.json();
          if (Array.isArray(evalData)) {
            const existingEvalIds = new Set(supaEvals.map((e) => e.id));
            evalData.forEach((row) => {
              if (row?.id && !existingEvalIds.has(row.id)) {
                supaEvals.push(row);
                existingEvalIds.add(row.id);
              }
            });
          }
        }
      } catch {}

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
        const isDuplicate =
          combinedEvalRecords.some(
            (loc) =>
              loc.id === dbRec.id ||
              (Boolean(loc.krathong_id) && loc.krathong_id === dbRec.krathong_id)
          ) ||
          localEvalRecords.some(
            (loc) =>
              loc.user_type === 'student' &&
              dbRec.user_type === 'student' &&
              Boolean(loc.student_id) &&
              loc.student_id === dbRec.student_id
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
        setShowPassword(false);
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

  const handleResetDeviceTestLock = () => {
    if (!getAdminSession()) return;
    const confirmed = window.confirm(
      'ต้องการรีเซ็ตสถานะล็อกแบบประเมินบนเบราว์เซอร์เครื่องนี้เพื่อใช้ทดสอบระบบใช่หรือไม่?\n(การรีเซ็ตนี้ล้างเฉพาะข้อมูลในเบราว์เซอร์นี้ ไม่ลบข้อมูลจริงในฐานข้อมูล Supabase/D1)'
    );
    if (!confirmed) return;
    resetDeviceEvaluationLock();
    setResetLockNotice(
      'รีเซ็ตสถานะทดสอบบนเครื่องนี้เรียบร้อยแล้ว! สามารถกลับไปทดลองลอยกระทงและส่งแบบประเมินใหม่ได้ทันที (หากทดสอบด้วยรหัสนักศึกษา ให้ใช้รหัสทดสอบใหม่ที่ยังไม่ซ้ำในฐานข้อมูล)'
    );
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

  const transcriptRoster = useMemo(
    () => buildStudentTranscriptRoster(evalAnalytics.records, krathongs),
    [evalAnalytics.records, krathongs]
  );

  const filteredTranscriptStudents = useMemo(() => {
    const query = transcriptSearch.trim().toLowerCase();
    return transcriptRoster.uniqueStudents.filter((student) => {
      const matchesFaculty =
        selectedFacultyFilter === 'all' || student.faculty === selectedFacultyFilter;
      if (!matchesFaculty) return false;
      if (!query) return true;
      return (
        student.student_id.toLowerCase().includes(query) ||
        student.faculty.toLowerCase().includes(query)
      );
    });
  }, [transcriptRoster.uniqueStudents, selectedFacultyFilter, transcriptSearch]);

  const statusCounts = useMemo(
    () => ({
      pending: krathongs.filter((k) => k.status === 'pending').length,
      approved: krathongs.filter((k) => (k.status || 'approved') === 'approved').length,
      rejected: krathongs.filter((k) => k.status === 'rejected').length
    }),
    [krathongs]
  );

  const filteredKrathongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return krathongs.filter((k: any) => {
      const st = k.status || 'approved';
      if (statusFilter !== 'all' && st !== statusFilter) return false;
      if (!q) return true;
      return (
        (k.owner_name || '').toLowerCase().includes(q) ||
        (k.wish_message || '').toLowerCase().includes(q)
      );
    });
  }, [krathongs, statusFilter, searchQuery]);

  const handleExportCSV = () => {
    exportEvaluationToCSV(evalAnalytics);
  };

  const handleExportA4Report = () => {
    const totalKrathongs = stats?.userStats.reduce((acc, curr) => acc + curr.count, 0) || krathongs.length;
    openOfficialA4ReportPrintView(evalAnalytics, totalKrathongs);
  };

  const handleExportTranscriptExcel = () => {
    exportStudentTranscriptByFacultyToExcel(evalAnalytics, krathongs);
  };

  // หน้าจอยืนยันตัวตนสำหรับผู้ดูแลระบบ (Admin Authentication Gate)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fdfaf4] text-[#231912] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-amber-900/15 rounded-3xl p-6 sm:p-8 shadow-xl animate-ui-card">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBackToRiver}
              className="flex items-center space-x-1.5 text-xs font-semibold text-[#7c5d3a] hover:text-[#231912] transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับหน้าแม่น้ำ</span>
            </button>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-400/50">
              Protected Area
            </span>
          </div>

          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-100 border border-amber-400/50 flex items-center justify-center text-amber-700 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-[#231912]">เข้าสู่ระบบผู้ดูแล (Admin Login)</h1>
            <p className="text-xs text-[#7c5d3a] mt-1">
              กรุณายืนยันตัวตนก่อนเข้าถึงระบบคัดกรองข้อความและรายงานสรุปผล 10 ด้าน
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-[#574536] mb-1.5">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                maxLength={50}
                required
                className="w-full bg-[#fffdf9] border border-amber-900/20 focus:border-amber-700 focus:ring-1 focus:ring-amber-600 rounded-xl px-3.5 py-2.5 text-sm text-[#231912] placeholder-[#9c8671] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#574536] mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  maxLength={100}
                  required
                  className="w-full bg-[#fffdf9] border border-amber-900/20 focus:border-amber-700 focus:ring-1 focus:ring-amber-600 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-[#231912] placeholder-[#9c8671] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#7c5d3a] hover:text-[#231912] transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs font-semibold text-rose-700 animate-ui-step">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#231912] font-extrabold rounded-xl border border-amber-600/25 shadow-md transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
    <div className="min-h-screen bg-[#fdfaf4] text-[#231912] p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-amber-900/12 gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToRiver}
            className="p-2 bg-white hover:bg-amber-50 text-[#574536] hover:text-[#231912] rounded-xl border border-amber-900/15 shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#231912]">
              Admin Dashboard & ระบบสรุปผลประเมินโครงการ (10 ด้าน)
            </h1>
            <p className="text-xs text-[#7c5d3a]">
              ระบบคัดกรองข้อความ วิเคราะห์ Radar Chart และส่งออกข้อมูลสำหรับทำเล่มสรุปโครงการ
            </p>
          </div>
        </div>

        {/* System Control Grid (4 Equal Buttons) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto shrink-0">
          {/* Approval Mode Toggle */}
          <button
            type="button"
            onClick={handleToggleApproval}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition active:scale-95 cursor-pointer ${
              requireApproval
                ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-2xs'
                : 'bg-white border-amber-900/15 text-[#574536] hover:bg-amber-50 shadow-2xs'
            }`}
          >
            {requireApproval ? (
              <ToggleRight className="w-4 h-4 text-amber-700 shrink-0" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-[#9c8671] shrink-0" />
            )}
            <span className="truncate">คัดกรอง: {requireApproval ? 'เปิด' : 'ปิด'}</span>
          </button>

          <button
            onClick={handleResetDeviceTestLock}
            type="button"
            title="ล้างสถานะล็อกเครื่องและประวัติการประเมินในเบราว์เซอร์นี้สำหรับการทดสอบ"
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-white hover:bg-amber-50 text-[#231912] border border-amber-900/15 rounded-xl text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="truncate">รีเซ็ตสถานะทดสอบ</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            title="รีเฟรชข้อมูล"
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-white hover:bg-amber-50 text-[#231912] rounded-xl border border-amber-900/15 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-amber-700 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span className="truncate">รีเฟรชข้อมูล</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="ออกจากระบบผู้ดูแล"
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="truncate">ออกจากระบบ</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 space-y-6">
        {resetLockNotice && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl px-4 py-3 flex items-start justify-between gap-3 text-xs sm:text-sm animate-ui-step">
            <span>{resetLockNotice}</span>
            <button
              type="button"
              onClick={() => setResetLockNotice('')}
              className="text-emerald-800 hover:text-emerald-950 font-bold px-2 py-0.5 rounded-lg hover:bg-emerald-100 cursor-pointer shrink-0"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-amber-900/12 p-5 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7c5d3a]">ผู้เข้าร่วมลอยกระทงทั้งหมด</span>
              <Users className="w-5 h-5 text-amber-700" />
            </div>
            <p className="text-2xl font-black text-[#231912] mt-2">{totalUsers.toLocaleString()} คน</p>
            <div className="text-[11px] text-[#7c5d3a] mt-2 space-x-2">
              <span>นศ: {stats?.userStats.find(u => u.user_type === 'student')?.count || 0}</span>
              <span>• บุคลากร: {stats?.userStats.find(u => u.user_type === 'staff')?.count || 0}</span>
              <span>• ภายนอก: {stats?.userStats.find(u => u.user_type === 'general')?.count || 0}</span>
            </div>
          </div>

          <div className="bg-white border border-amber-900/12 p-5 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7c5d3a]">ค่าเฉลี่ยรวมทุกด้าน (Overall Mean)</span>
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-800 mt-2">
              x̄ = {evalAnalytics.overallMean.toFixed(2)} / 5.00
            </p>
            <p className="text-[11px] text-[#7c5d3a] mt-2">
              ระดับความพึงพอใจ: <strong className="text-[#231912]">{evalAnalytics.overallLevelText}</strong> (N = {evalAnalytics.totalN} คน)
            </p>
          </div>

          <div className="bg-white border border-amber-900/12 p-5 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7c5d3a]">ด้านที่ได้คะแนนสูงสุด</span>
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-base font-extrabold text-emerald-700 mt-2 line-clamp-1">
              {evalAnalytics.highestDimension?.shortLabel || '-'}
            </p>
            <p className="text-[11px] text-[#7c5d3a] mt-2">
              x̄ = {evalAnalytics.highestDimension?.mean.toFixed(2) || '-'} (S.D. = {evalAnalytics.highestDimension?.sd.toFixed(2) || '-'})
            </p>
          </div>

          <div className="bg-white border border-amber-900/12 p-5 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7c5d3a]">สถานะกระทงบนแม่น้ำ</span>
              <ShieldCheck className="w-5 h-5 text-amber-700" />
            </div>
            <p className="text-2xl font-black text-[#231912] mt-2">
              {stats?.statusStats.find(s => s.status === 'approved')?.count || krathongs.length} ใบ
            </p>
            <p className="text-[11px] text-[#7c5d3a] mt-2">
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
        <div className="bg-white border border-amber-900/12 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-amber-900/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-700" />
                <h2 className="text-base sm:text-lg font-extrabold text-[#231912]">
                  ตารางสรุปผลสถิติความพึงพอใจของผู้เข้าร่วมกิจกรรม 10 ด้าน
                </h2>
                {isUsingDemoEvals && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    ข้อมูลตัวอย่าง (จะอัปเดตทันทีเมื่อมีผู้ส่งแบบประเมินจริง)
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7c5d3a] mt-0.5">
                แสดงจำนวนผู้ตอบทั้งหมด (N = {evalAnalytics.totalN} คน), ร้อยละ (%) ในแต่ละระดับคะแนน (1–5), ค่าเฉลี่ย (x̄) และส่วนเบี่ยงเบนมาตรฐาน (S.D.)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={handleExportExcel}
                title="ดาวน์โหลดไฟล์ Excel (.xlsx) ครบทั้ง 3 Sheets: ข้อมูลดิบผู้ประเมิน, ตารางสรุปสถิติ 10 ด้าน และรายชื่อผู้ลอยกระทง"
                className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>Export Excel (3 Sheets)</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                title="ดาวน์โหลดข้อมูลดิบผู้ตอบแบบประเมินเป็นไฟล์ CSV"
                className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#241911] hover:bg-[#38271a] text-[#fffbeb] text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Export CSV (Raw)</span>
              </button>
              <button
                type="button"
                onClick={handleExportA4Report}
                title="เปิดหน้ารายงานสรุปผลขนาด A4 พร้อมกราฟ Radar Chart และตารางสถิติ 10 ข้อเพื่อพิมพ์หรือเซฟเป็น PDF"
                className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>รายงานสรุป A4 (PDF)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#f6efdf] text-[#574536] border-b border-amber-900/12">
                <tr>
                  <th className="py-3 px-3 text-center border-r border-amber-900/10 w-12">ข้อ</th>
                  <th className="py-3 px-4 border-r border-amber-900/10 min-w-[260px]">
                    ประเด็นการประเมินความพึงพอใจ
                  </th>
                  <th className="py-2 px-2 text-center border-r border-amber-900/10">
                    5 มากที่สุด<br />
                    <span className="text-[10px] text-[#7c5d3a]">จำนวน (%)</span>
                  </th>
                  <th className="py-2 px-2 text-center border-r border-amber-900/10">
                    4 มาก<br />
                    <span className="text-[10px] text-[#7c5d3a]">จำนวน (%)</span>
                  </th>
                  <th className="py-2 px-2 text-center border-r border-amber-900/10">
                    3 ปานกลาง<br />
                    <span className="text-[10px] text-[#7c5d3a]">จำนวน (%)</span>
                  </th>
                  <th className="py-2 px-2 text-center border-r border-amber-900/10">
                    2 น้อย<br />
                    <span className="text-[10px] text-[#7c5d3a]">จำนวน (%)</span>
                  </th>
                  <th className="py-2 px-2 text-center border-r border-amber-900/10">
                    1 น้อยที่สุด<br />
                    <span className="text-[10px] text-[#7c5d3a]">จำนวน (%)</span>
                  </th>
                  <th className="py-3 px-3 text-center border-r border-amber-900/10 text-amber-900">
                    ค่าเฉลี่ย (x̄)
                  </th>
                  <th className="py-3 px-3 text-center border-r border-amber-900/10">S.D.</th>
                  <th className="py-3 px-3 text-center">แปลผล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10">
                {evalAnalytics.questionStats.map((st) => (
                  <tr key={st.questionId} className="hover:bg-[#fdf8ec] transition">
                    <td className="py-3 px-3 text-center font-bold text-amber-800 border-r border-amber-900/10">
                      {st.questionId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#231912] border-r border-amber-900/10">
                      {st.title}
                    </td>
                    {[5, 4, 3, 2, 1].map((lvl) => {
                      const scoreKey = lvl as 1 | 2 | 3 | 4 | 5;
                      return (
                        <td
                          key={lvl}
                          className="py-2.5 px-2 text-center border-r border-amber-900/10 whitespace-nowrap"
                        >
                          <span className="font-semibold text-[#231912]">
                            {st.percentages[scoreKey].toFixed(1)}%
                          </span>
                          <span className="block text-[10px] text-[#7c5d3a]">
                            ({st.counts[scoreKey]} คน)
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-center font-extrabold text-amber-800 border-r border-amber-900/10 text-sm">
                      {st.mean.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center text-[#574536] border-r border-amber-900/10">
                      {st.sd.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {st.levelText}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* แถวสรุปค่าเฉลี่ยรวมทุกด้าน (Overall Mean) */}
                <tr className="bg-[#fffbeb] font-bold text-[#231912] border-t-2 border-amber-400/70">
                  <td colSpan={7} className="py-3.5 px-4 text-right border-r border-amber-900/15 text-sm">
                    ค่าเฉลี่ยรวมทุกด้าน (Overall Mean) จากผู้ประเมินทั้งหมด N = {evalAnalytics.totalN} คน
                  </td>
                  <td className="py-3.5 px-3 text-center text-base font-black text-amber-800 border-r border-amber-900/15">
                    {evalAnalytics.overallMean.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-center border-r border-amber-900/15">
                    {evalAnalytics.overallSD.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-[#231912]">
                      {evalAnalytics.overallLevelText}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2.5 Student Activity Transcript Roster by Faculty */}
        <div className="bg-white border border-amber-900/12 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-amber-900/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#231912] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-700" />
                <span>รายชื่อนักศึกษาสำหรับ Activity Transcript แยกตามคณะ (ตัดซ้ำอัตโนมัติ)</span>
              </h2>
              <p className="text-xs text-[#7c5d3a] mt-1">
                เก็บเฉพาะรหัสนักศึกษาสำหรับกลุ่มนักศึกษา • จำแนกคณะอัตโนมัติจากรหัสและตัดรหัสซ้ำอัตโนมัติ พร้อมตรวจจับอุปกรณ์ที่ส่งหลายรหัส
              </p>
            </div>
            <button
              onClick={handleExportTranscriptExcel}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-[#231912] border border-amber-600/25 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm cursor-pointer shrink-0"
            >
              <GraduationCap className="w-4 h-4" />
              <span>ดาวน์โหลดรายชื่อแยกคณะ (.xlsx)</span>
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Summary Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-emerald-50/75 border border-emerald-300 rounded-xl p-3.5">
                <p className="text-xs font-medium text-emerald-900/80">นักศึกษาไม่ซ้ำทั้งหมด (Unique IDs)</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {transcriptRoster.uniqueStudents.length.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-[#7c5d3a]">คน</span>
                </p>
              </div>
              <div className="bg-sky-50/75 border border-sky-300 rounded-xl p-3.5">
                <p className="text-xs font-medium text-sky-900/80">ตัดรหัสนักศึกษาซ้ำออกอัตโนมัติ</p>
                <p className="text-2xl font-bold text-sky-700 mt-1">
                  {transcriptRoster.duplicateIdCount.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-[#7c5d3a]">รายการ</span>
                </p>
              </div>
              <div className="bg-[#fffbeb] border border-amber-300 rounded-xl p-3.5">
                <p className="text-xs font-medium text-amber-950/80">พบส่งมากกว่า 1 รหัสจากอุปกรณ์เดียวกัน</p>
                <p className="text-2xl font-bold text-amber-800 mt-1">
                  {transcriptRoster.sharedDeviceCount.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-[#7c5d3a]">คน</span>
                </p>
              </div>
            </div>

            {/* Faculty Breakdown Chips */}
            {transcriptRoster.facultyBreakdown.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFacultyFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition active:scale-95 cursor-pointer ${
                    selectedFacultyFilter === 'all'
                      ? 'bg-[#241911] border-[#241911] text-[#fffbeb]'
                      : 'bg-[#fdfaf4] border-amber-900/15 text-[#574536] hover:bg-amber-50'
                  }`}
                >
                  ทุกคณะ ({transcriptRoster.uniqueStudents.length})
                </button>
                {transcriptRoster.facultyBreakdown.map((item) => {
                  const isActive = selectedFacultyFilter === item.faculty;
                  return (
                    <button
                      key={item.faculty}
                      type="button"
                      onClick={() =>
                        setSelectedFacultyFilter(isActive ? 'all' : item.faculty)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition active:scale-95 cursor-pointer ${
                        isActive
                          ? 'bg-[#241911] border-[#241911] text-[#fffbeb] font-semibold'
                          : 'bg-[#fdfaf4] border-amber-900/15 text-[#574536] hover:bg-amber-50'
                      }`}
                    >
                      {item.faculty}: <span className="font-bold">{item.count}</span>{' '}
                      <span className={isActive ? 'text-amber-200' : 'text-[#7c5d3a]'}>
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Faculty Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedFacultyFilter}
                onChange={(e) => setSelectedFacultyFilter(e.target.value)}
                aria-label="กรองตามคณะ"
                className="bg-[#fffdf9] border border-amber-900/20 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#231912] focus:outline-none focus:border-amber-700"
              >
                <option value="all">
                  แสดงทุกคณะ ({transcriptRoster.uniqueStudents.length} คน)
                </option>
                {transcriptRoster.facultyBreakdown.map((item) => (
                  <option key={item.faculty} value={item.faculty}>
                    {item.faculty} ({item.count} คน)
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={transcriptSearch}
                onChange={(e) => setTranscriptSearch(e.target.value)}
                placeholder="ค้นหารหัสนักศึกษา หรือคณะ..."
                className="flex-1 bg-[#fffdf9] border border-amber-900/20 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#231912] placeholder-[#9c8671] focus:outline-none focus:border-amber-700"
              />
            </div>

            {/* Deduplicated Student Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto border border-amber-900/12 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f6efdf] text-[#574536] text-xs sticky top-0 z-10 border-b border-amber-900/12">
                  <tr>
                    <th className="py-3 px-4 font-semibold">#</th>
                    <th className="py-3 px-4 font-semibold">รหัสนักศึกษา</th>
                    <th className="py-3 px-4 font-semibold">คณะ / วิทยาลัย (จำแนกจากรหัส)</th>
                    <th className="py-3 px-4 font-semibold">เวลาที่ส่ง</th>
                    <th className="py-3 px-4 font-semibold">สถานะตรวจสอบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 text-xs sm:text-sm">
                  {filteredTranscriptStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#7c5d3a]">
                        ไม่พบรายชื่อนักศึกษาที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredTranscriptStudents.map((student, idx) => (
                      <tr
                        key={student.student_id}
                        className="hover:bg-[#fdf8ec] transition-colors"
                      >
                        <td className="py-2.5 px-4 text-[#7c5d3a]">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-amber-800">
                          {student.student_id}
                        </td>
                        <td className="py-2.5 px-4 text-[#231912] font-medium">
                          {student.faculty || 'ไม่ระบุคณะ'}
                        </td>
                        <td className="py-2.5 px-4 text-[#7c5d3a] whitespace-nowrap">
                          {student.created_at
                            ? new Date(student.created_at).toLocaleString('th-TH')
                            : '-'}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {student.deviceStatus === 'shared_device' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                              ส่งซ้ำอุปกรณ์เดียวกัน
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              ยืนยัน 1 เครื่อง 1 รหัส
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. Live Moderation Table */}
        <div className="bg-white border border-amber-900/12 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-amber-900/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[#231912]">
                รายการกระทงล่าสุด (Live Moderation Stream)
              </h2>
              <p className="text-xs text-[#7c5d3a]">
                สามารถค้นหา กรองสถานะ ตรวจสอบ อนุมัติ หรือซ่อนข้อความที่ไม่เหมาะสมได้ทันที
              </p>
            </div>

            {/* Search & Status Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#7c5d3a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ หรือคำอธิษฐาน..."
                  className="bg-[#fffdf9] border border-amber-900/20 focus:border-amber-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#231912] placeholder-[#9c8671] focus:outline-none w-48 sm:w-56"
                />
              </div>

              <div className="flex items-center bg-[#f6efdf] p-1 rounded-xl border border-amber-900/12">
                {[
                  { id: 'all', label: `ทั้งหมด (${krathongs.length})` },
                  { id: 'pending', label: `รอตรวจ (${statusCounts.pending})` },
                  { id: 'approved', label: `แสดงผล (${statusCounts.approved})` },
                  { id: 'rejected', label: `ซ่อนแล้ว (${statusCounts.rejected})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-[#241911] text-[#fffbeb] shadow-2xs'
                        : 'text-[#574536] hover:text-[#231912]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {statusCounts.pending > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    krathongs
                      .filter((k) => k.status === 'pending')
                      .forEach((k) => handleModerate(k.id, 'approved'));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95 shadow-sm cursor-pointer flex items-center space-x-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>อนุมัติที่รอตรวจทั้งหมด</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6efdf] text-[#574536] uppercase tracking-wider font-semibold border-b border-amber-900/12">
                <tr>
                  <th className="py-3 px-4">ผู้ปล่อย</th>
                  <th className="py-3 px-4">กลุ่ม</th>
                  <th className="py-3 px-4">คำอธิษฐาน / ข้อความ</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                  <th className="py-3 px-4">เวลา</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10">
                {filteredKrathongs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#7c5d3a]">
                      {krathongs.length === 0
                        ? 'ยังไม่มีรายการกระทงในขณะนี้'
                        : 'ไม่พบรายการกระทงที่ตรงกับเงื่อนไขการค้นหา'}
                    </td>
                  </tr>
                ) : (
                  filteredKrathongs.map((k: any) => {
                    const currentStatus = k.status || 'approved';
                    return (
                      <tr key={k.id} className="hover:bg-[#fdf8ec] transition">
                        <td className="py-3 px-4 font-bold text-[#231912] whitespace-nowrap">
                          {k.owner_name}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f6efdf] text-[#574536] border border-amber-900/12">
                            {k.user_type === 'student' ? 'นักศึกษา' : k.user_type === 'staff' ? 'บุคลากร' : 'บุคคลภายนอก'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#574536] max-w-xs break-words">
                          &ldquo;{k.wish_message}&rdquo;
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {currentStatus === 'approved' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              แสดงผล (อนุมัติ)
                            </span>
                          ) : currentStatus === 'pending' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              รอตรวจสอบ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              ซ่อนแล้ว
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#7c5d3a] whitespace-nowrap">
                          {k.created_at ? k.created_at.slice(11, 16) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleModerate(k.id, 'approved')}
                              title="อนุมัติให้แสดงบนแม่น้ำ"
                              className={`px-2 py-1 rounded-lg transition active:scale-95 cursor-pointer flex items-center space-x-1 text-[11px] font-semibold ${
                                currentStatus === 'approved'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>อนุมัติ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModerate(k.id, 'rejected')}
                              title="ซ่อนไม่ให้แสดงบนแม่น้ำ"
                              className={`px-2 py-1 rounded-lg transition active:scale-95 cursor-pointer flex items-center space-x-1 text-[11px] font-semibold ${
                                currentStatus === 'rejected'
                                  ? 'bg-amber-500 text-[#231912] shadow-sm'
                                  : 'bg-[#fffbeb] hover:bg-amber-100 text-amber-900 border border-amber-300/70'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ซ่อน</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModerate(k.id, 'deleted')}
                              title="ลบรายการนี้ออกจากระบบ"
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition active:scale-95 cursor-pointer flex items-center space-x-1 text-[11px] font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบ</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Feedback Section */}
        {evalAnalytics.records.some(r => r.comment) && (
          <div className="bg-white border border-amber-900/12 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#231912] mb-3">
              ข้อเสนอแนะและความคิดเห็นจากผู้ตอบแบบประเมินล่าสุด
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {evalAnalytics.records
                .filter(r => r.comment)
                .slice(0, 12)
                .map((f, i) => (
                  <div key={i} className="bg-[#fdfaf4] p-3.5 rounded-xl border border-amber-900/12">
                    <div className="flex items-center justify-between text-xs text-[#7c5d3a] mb-1">
                      <span className="font-semibold text-[#574536]">
                        {f.user_type === 'student'
                          ? `นักศึกษา ${f.student_id ? `(${f.student_id})` : ''}`
                          : f.user_type === 'staff'
                            ? 'บุคลากร'
                            : 'บุคคลภายนอก'}
                      </span>
                      <span className="text-amber-800 font-bold">
                        x̄ = {f.average_score.toFixed(2)} / 5.00
                      </span>
                    </div>
                    <p className="text-xs text-[#231912] italic">&ldquo;{f.comment}&rdquo;</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
