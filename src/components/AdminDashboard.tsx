// src/components/AdminDashboard.tsx
import React, { Suspense, lazy, useState, useEffect, useMemo } from 'react';
import type { StatsResponse, KrathongItem } from '../types';
import { GraduationCap, ClipboardCheck } from 'lucide-react';
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
  ArrowLeft,
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
  RotateCcw,
  Leaf,
  AlertTriangle,
  X
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
  getModerationOverrides,
  mergeModerationOverrides,
  resetDeviceEvaluationLock,
  resetAllLocalProjectData,
  getDeletedEvaluationIds,
  mergeDeletedEvaluationIds,
  deleteLocalEvaluationsByStudentId,
  deleteLocalEvaluationById,
  type ParsedEvaluationRecord,
  type EvaluationAnalyticsSummary
} from '../utils/evaluationHelpers';
import { EvaluationRadarChart } from './EvaluationRadarChart';

const EvaluationModal = lazy(() =>
  import('./EvaluationModal').then((m) => ({ default: m.EvaluationModal }))
);

interface AdminDashboardProps {
  onBackToRiver: () => void;
}

const XBar: React.FC = () => (
  <span className="inline-block border-t-[1.5px] border-current leading-[0.88] pt-[1px] mx-[1px]">
    x
  </span>
);

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
  const [transcriptRecords, setTranscriptRecords] = useState<ParsedEvaluationRecord[]>(() =>
    getDemoEvaluationRecords()
  );
  const [isUsingDemoEvals, setIsUsingDemoEvals] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>('all');
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');
  const [transcriptPage, setTranscriptPage] = useState<number>(1);
  const [krathongPage, setKrathongPage] = useState<number>(1);
  const [resetLockNotice, setResetLockNotice] = useState<string>('');
  const [showTestEvalModal, setShowTestEvalModal] = useState<boolean>(false);
  const [showFullResetModal, setShowFullResetModal] = useState<boolean>(false);
  const [fullResetConfirmText, setFullResetConfirmText] = useState<string>('');
  const [fullResetRunning, setFullResetRunning] = useState<boolean>(false);
  const [fullResetError, setFullResetError] = useState<string>('');
  const ADMIN_PAGE_SIZE = 50;

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

        const [kData, eData] = await Promise.all([
          fetchAllRows('krathongs'),
          fetchAllRows('evaluations')
        ]);

        supaKrathongs = kData;
        supaEvals = eData;
      } catch (supaErr) {
        console.warn('Supabase fetch note:', supaErr);
      }

      let overrides = getModerationOverrides();
      let deletedEvalIds = getDeletedEvaluationIds();

      // 1.5 ดึงสถานะ Moderation Overrides & รายการที่ถูกลบจาก Cloudflare D1 API (ถ้ามี)
      try {
        const modRes = await fetch('/api/admin/moderate', { credentials: 'include' });
        if (modRes.ok && (modRes.headers.get('content-type') || '').includes('application/json')) {
          const modData = await modRes.json();
          if (modData.overrides && typeof modData.overrides === 'object') {
            overrides = mergeModerationOverrides(modData.overrides);
          }
          if (Array.isArray(modData.deletedEvalIds)) {
            deletedEvalIds = mergeDeletedEvaluationIds(modData.deletedEvalIds);
          }
        }
      } catch {}

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

      // นำสถานะ Override (แสดงผล / ซ่อน / ลบ) มาประยุกต์กับทุกกระทง
      const allKrathongs = Array.from(mergedKrathongsMap.values())
        .filter((item) => overrides[item.id] !== 'deleted')
        .map((item) => {
          const resolvedStatus = overrides[item.id] || item.status || 'approved';
          return {
            ...item,
            status: resolvedStatus === 'rejected' ? 'rejected' : 'approved'
          };
        })
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setKrathongs(allKrathongs);

      // 3. รวมข้อมูลแบบประเมิน 10 ข้อจาก LocalStorage + Supabase แบบ O(N) Set Lookup (รองรับ 5,000+ รายการใน < 1ms)
      const deletedEvalSet = new Set(deletedEvalIds);
      const localEvalRecords = getLocalEvaluationRecords().filter(
        (rec) => !rec.id || !deletedEvalSet.has(rec.id)
      );
      const dbEvalRecords = supaEvals
        .filter((row) => row.id !== 'f85dd716-4bc9-4e11-b84f-66d5cf9e9007' && !deletedEvalSet.has(row.id))
        .map((row, idx) => parseEvaluationRow(row, idx));

      const combinedEvalRecords = [...localEvalRecords];
      const seenEvalIds = new Set<string>();
      const seenEvalKrathongIds = new Set<string>();
      const seenStudentIds = new Set<string>();

      for (let i = 0; i < localEvalRecords.length; i++) {
        const loc = localEvalRecords[i];
        if (loc.id) seenEvalIds.add(loc.id);
        if (loc.krathong_id) seenEvalKrathongIds.add(loc.krathong_id);
        if (loc.user_type === 'student' && loc.student_id) seenStudentIds.add(loc.student_id);
      }

      for (let i = 0; i < dbEvalRecords.length; i++) {
        const dbRec = dbEvalRecords[i];
        const isDuplicate =
          (dbRec.id && seenEvalIds.has(dbRec.id)) ||
          (dbRec.krathong_id && seenEvalKrathongIds.has(dbRec.krathong_id)) ||
          (dbRec.user_type === 'student' && dbRec.student_id && seenStudentIds.has(dbRec.student_id));
        if (!isDuplicate) {
          combinedEvalRecords.push(dbRec);
          if (dbRec.id) seenEvalIds.add(dbRec.id);
          if (dbRec.krathong_id) seenEvalKrathongIds.add(dbRec.krathong_id);
        }
      }

      combinedEvalRecords.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      const realV3Count = combinedEvalRecords.filter((r) => r.schemaVersion === 3).length;
      const demoRecords = realV3Count === 0 ? getDemoEvaluationRecords() : [];
      const analyticsInputRecords =
        realV3Count > 0 ? combinedEvalRecords : [...demoRecords, ...combinedEvalRecords];
      setIsUsingDemoEvals(realV3Count === 0);

      const computedAnalytics = calculateEvaluationAnalytics(analyticsInputRecords);
      setEvalAnalytics(computedAnalytics);

      // Transcript Roster ยังคงแสดงรายชื่อนักศึกษาจริงที่มีอยู่ทั้งหมด (ทั้งข้อมูลชุดใหม่และชุดเดิมที่ยังไม่ถูกลบ) เพื่อให้ผู้ดูแลตรวจสอบและลบได้
      setTranscriptRecords(combinedEvalRecords.length > 0 ? combinedEvalRecords : demoRecords);

      // 4. คำนวณสถิติผู้เข้าร่วมและสถานะกระทงจากข้อมูลรวมใน Single Pass O(N)
      let studentCount = 0;
      let staffCount = 0;
      let generalCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;
      for (let i = 0; i < allKrathongs.length; i++) {
        const k = allKrathongs[i];
        if (k.user_type === 'student') studentCount++;
        else if (k.user_type === 'staff') staffCount++;
        else generalCount++;

        if (k.status === 'rejected') rejectedCount++;
        else approvedCount++;
      }

      const recentFeedbacks = computedAnalytics.records
        .filter((e) => e.comment)
        .slice(0, 15)
        .map((e) => ({
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
          { status: 'rejected', count: rejectedCount }
        ],
        ratingSummary: {
          total_reviews: computedAnalytics.totalN,
          average_rating: computedAnalytics.overallMean
        },
        ratingDistribution: [],
        recentFeedbacks,
        requireApproval: false
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
      'ต้องการรีเซ็ตล็อกแบบประเมินบนเบราว์เซอร์เครื่องนี้เท่านั้นใช่หรือไม่?\n(การรีเซ็ตนี้ล้างเฉพาะสิทธิ์ที่ผูกไว้ในเครื่องนี้ เพื่อเทสซ้ำ — ไม่ลบกระทงหรือผลประเมินจริงในฐานข้อมูล)'
    );
    if (!confirmed) return;
    resetDeviceEvaluationLock();
    setResetLockNotice(
      'รีเซ็ตล็อกบนเครื่องนี้เรียบร้อยแล้ว! สามารถกลับไปทดลองลอยกระทงและส่งแบบประเมินใหม่จากเบราว์เซอร์นี้ได้ทันที'
    );
  };

  // ล้างข้อมูลทดสอบทั้งหมดทั้งระบบ (Supabase + Cloudflare D1 + เบราว์เซอร์) เพื่อเตรียมพร้อมวันงานจริง
  const handleConfirmFullSystemReset = async () => {
    if (!getAdminSession() || fullResetRunning) return;
    if (fullResetConfirmText.trim().toUpperCase() !== 'RESET') {
      setFullResetError('กรุณาพิมพ์คำว่า RESET เพื่อยืนยันการล้างข้อมูลทั้งหมด');
      return;
    }

    setFullResetRunning(true);
    setFullResetError('');

    try {
      const fetchAllSupabaseIds = async (table: 'krathongs' | 'evaluations'): Promise<string[]> => {
        const ids: string[] = [];
        const pageSize = 1000;
        for (let page = 0; page < 50; page++) {
          const from = page * pageSize;
          const { data } = await supabase
            .from(table)
            .select('id')
            .range(from, from + pageSize - 1);
          if (!data || data.length === 0) break;
          for (const row of data) {
            if (row?.id) ids.push(String(row.id));
          }
          if (data.length < pageSize) break;
        }
        return ids;
      };

      const deleteSupabaseInChunks = async (table: 'krathongs' | 'evaluations', ids: string[]) => {
        const chunkSize = 100;
        for (let i = 0; i < ids.length; i += chunkSize) {
          const chunk = ids.slice(i, i + chunkSize);
          try {
            await supabase.from(table).delete().in('id', chunk);
          } catch {}
        }
      };

      // 1. ดึงรายการ ID ทั้งหมดจาก Supabase แล้วพยายามลบออกจากฐานข้อมูลโดยตรง
      const [supaEvalIds, supaKrathongIds] = await Promise.all([
        fetchAllSupabaseIds('evaluations').catch(() => []),
        fetchAllSupabaseIds('krathongs').catch(() => [])
      ]);

      await deleteSupabaseInChunks('evaluations', supaEvalIds);
      await deleteSupabaseInChunks('krathongs', supaKrathongIds);

      // 2. ตรวจสอบว่ายังมีแถวที่ค้างอยู่จาก RLS บน Supabase หรือไม่ เพื่อนำไปซ่อน Fallback บน D1 + LocalStorage
      const [remainingEvalIds, remainingKrathongIds] = await Promise.all([
        fetchAllSupabaseIds('evaluations').catch(() => supaEvalIds),
        fetchAllSupabaseIds('krathongs').catch(() => supaKrathongIds)
      ]);

      const fallbackDeletedEvalIds = remainingEvalIds.filter(
        (id) => id !== 'f85dd716-4bc9-4e11-b84f-66d5cf9e9007'
      );
      const fallbackHiddenKrathongIds = remainingKrathongIds;

      // 3. ล้างฐานข้อมูล Cloudflare D1 และอัปเดตสถานะซ่อน Fallback ผ่าน Admin API
      try {
        await fetch('/api/admin/moderate', {
          method: 'POST',
          headers: getAdminAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({
            action: 'reset_all_data',
            fallbackHiddenKrathongIds,
            fallbackDeletedEvalIds
          })
        });
      } catch {}

      // 4. ล้างข้อมูลบนเบราว์เซอร์เครื่องนี้ทั้งหมด
      resetAllLocalProjectData(fallbackHiddenKrathongIds, fallbackDeletedEvalIds);

      setShowFullResetModal(false);
      setFullResetConfirmText('');
      setFullResetError('');
      setResetLockNotice(
        'ล้างข้อมูลทดสอบทั้งระบบเรียบร้อยแล้ว! เว็บพร้อมใช้งานในวันงานจริง (กระทง 0 ใบ / แบบประเมิน 0 รายการ)'
      );
      await loadData();
    } catch (err) {
      console.warn('Full reset error:', err);
      setFullResetError('เกิดข้อผิดพลาดระหว่างล้างข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setFullResetRunning(false);
    }
  };

  // ลบรายชื่อนักศึกษาที่ยืนยันแล้วออกจาก Activity Transcript เพื่อให้สามารถกรอกรหัสเดิมทดสอบซ้ำได้ทันที
  const handleDeleteTranscriptStudent = async (studentId: string) => {
    if (!getAdminSession()) return;
    const confirmed = window.confirm(
      `ต้องการลบข้อมูลการยืนยันรหัสนักศึกษา ${studentId} ออกจากรายชื่อ Activity Transcript เพื่อรีเซ็ตให้ทดสอบซ้ำได้ใช่หรือไม่?`
    );
    if (!confirmed) return;

    const matchingIds = [...transcriptRecords, ...evalAnalytics.records]
      .filter((r) => (r.student_id || '').trim() === studentId && r.id)
      .map((r) => r.id);

    const localRemovedIds = deleteLocalEvaluationsByStudentId(studentId);
    const allIdsToDelete = Array.from(new Set([...matchingIds, ...localRemovedIds]));
    if (allIdsToDelete.length > 0) {
      mergeDeletedEvaluationIds(allIdsToDelete);
    }

    const uuidIds = allIdsToDelete.filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    );
    if (uuidIds.length > 0) {
      try {
        await supabase.from('evaluations').delete().in('id', uuidIds);
      } catch {}
    }

    try {
      await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: 'delete_student_eval',
          studentId,
          evalIds: allIdsToDelete
        })
      });
    } catch {}

    setResetLockNotice(
      `ลบรหัสนักศึกษา ${studentId} ออกจากรายชื่อ Activity Transcript เรียบร้อยแล้ว สามารถนำไปกรอกทดสอบยืนยันใหม่ได้ทันที`
    );
    await loadData();
  };

  // ลบข้อเสนอแนะและผลประเมิน 1 รายการ (Section 4) ออกจากระบบ
  const handleDeleteFeedback = async (record: ParsedEvaluationRecord) => {
    if (!getAdminSession() || !record?.id) return;
    const confirmed = window.confirm(
      `ต้องการลบข้อเสนอแนะ "${record.comment}" นี้ออกจากระบบใช่หรือไม่?`
    );
    if (!confirmed) return;

    deleteLocalEvaluationById(record.id);
    mergeDeletedEvaluationIds([record.id]);

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.id)) {
      try {
        await supabase.from('evaluations').delete().eq('id', record.id);
      } catch {}
    }

    try {
      await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: 'delete_student_eval',
          studentId: '',
          evalIds: [record.id]
        })
      });
    } catch {}

    setResetLockNotice('ลบข้อเสนอแนะและผลประเมินดังกล่าวเรียบร้อยแล้ว');
    await loadData();
  };

  // ดำเนินการ ซ่อน / แสดงคืน / ลบกระทง
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
        const approvedCount = next.filter((k: any) => k.status !== 'rejected').length;
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
      status: k.status === 'rejected' ? 'rejected' : 'approved',
      created_at: k.created_at || new Date().toISOString()
    }));
    exportEvaluationAndProjectToExcel(evalAnalytics, exportRows);
  };

  const transcriptRoster = useMemo(
    () => buildStudentTranscriptRoster(transcriptRecords, krathongs),
    [transcriptRecords, krathongs]
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
        student.faculty.toLowerCase().includes(query) ||
        (student.major || '').toLowerCase().includes(query) ||
        (student.year_level || '').toLowerCase().includes(query)
      );
    });
  }, [transcriptRoster.uniqueStudents, selectedFacultyFilter, transcriptSearch]);

  const totalTranscriptPages = Math.max(1, Math.ceil(filteredTranscriptStudents.length / ADMIN_PAGE_SIZE));
  const safeTranscriptPage = Math.min(transcriptPage, totalTranscriptPages);
  const pagedTranscriptStudents = useMemo(() => {
    const start = (safeTranscriptPage - 1) * ADMIN_PAGE_SIZE;
    return filteredTranscriptStudents.slice(start, start + ADMIN_PAGE_SIZE);
  }, [filteredTranscriptStudents, safeTranscriptPage]);

  const statusCounts = useMemo(() => {
    let approved = 0;
    let rejected = 0;
    for (let i = 0; i < krathongs.length; i++) {
      if (krathongs[i].status === 'rejected') rejected++;
      else approved++;
    }
    return { approved, rejected };
  }, [krathongs]);

  const filteredKrathongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return krathongs.filter((k: any) => {
      const st = k.status === 'rejected' ? 'rejected' : 'approved';
      if (statusFilter !== 'all' && st !== statusFilter) return false;
      if (!q) return true;
      return (
        (k.owner_name || '').toLowerCase().includes(q) ||
        (k.wish_message || '').toLowerCase().includes(q)
      );
    });
  }, [krathongs, statusFilter, searchQuery]);

  const totalKrathongPages = Math.max(1, Math.ceil(filteredKrathongs.length / ADMIN_PAGE_SIZE));
  const safeKrathongPage = Math.min(krathongPage, totalKrathongPages);
  const pagedKrathongs = useMemo(() => {
    const start = (safeKrathongPage - 1) * ADMIN_PAGE_SIZE;
    return filteredKrathongs.slice(start, start + ADMIN_PAGE_SIZE);
  }, [filteredKrathongs, safeKrathongPage]);

  const handleExportCSV = () => {
    exportEvaluationToCSV(evalAnalytics);
  };

  const handleExportA4Report = () => {
    const totalKrathongs = stats?.userStats.reduce((acc, curr) => acc + curr.count, 0) || krathongs.length;
    openOfficialA4ReportPrintView(evalAnalytics, totalKrathongs);
  };

  const handleExportTranscriptExcel = () => {
    exportStudentTranscriptByFacultyToExcel(
      evalAnalytics,
      krathongs,
      'loy-krathong-student-transcript.xlsx',
      transcriptRecords
    );
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
              กรุณายืนยันตัวตนก่อนเข้าถึงระบบคัดกรองข้อความและรายงานสรุปผลแบบประเมินมาตรฐานกลาง ม.อ.
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
              Admin Dashboard & ระบบสรุปผลประเมินโครงการ (แบบประเมินมาตรฐานกลาง ม.อ.)
            </h1>
            <p className="text-xs text-[#7c5d3a]">
              โครงการลอยกระทงบุฟเฟต์ • วิเคราะห์ผล 9 หมวด 36 ข้อ + ชุมชน + 7 SDGs, Radar Chart และส่งออกเอกสารสรุปโครงการ
            </p>
          </div>
        </div>

        {/* System Control Grid (5 Buttons) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full lg:w-auto shrink-0">
          {/* Open Evaluation Modal for Admin Testing */}
          <button
            type="button"
            onClick={() => setShowTestEvalModal(true)}
            title="เปิดหน้าต่างแบบประเมินเพื่อทดสอบระบบจากหลังบ้านโดยตรง"
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-amber-100 hover:bg-amber-200/80 text-amber-950 border border-amber-400/70 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4 text-amber-800 shrink-0" />
            <span className="truncate">ทดสอบแบบประเมิน</span>
          </button>

          <button
            onClick={handleResetDeviceTestLock}
            type="button"
            title="ล้างเฉพาะล็อกเครื่องนี้และประวัติในเบราว์เซอร์นี้เพื่อเทสซ้ำ (ไม่กระทบฐานข้อมูล)"
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-white hover:bg-amber-50 text-[#231912] border border-amber-900/15 rounded-xl text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="truncate">รีเซ็ตล็อกเครื่องนี้</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFullResetConfirmText('');
              setFullResetError('');
              setShowFullResetModal(true);
            }}
            title="ลบข้อมูลทดสอบทั้งหมด (กระทง, แบบประเมิน, Transcript) ทั้งใน Supabase, D1 และเครื่องนี้ เพื่อเตรียมเปิดงานจริง"
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span className="truncate">ล้างข้อมูลทั้งระบบ</span>
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
            className="col-span-2 sm:col-span-1 flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer"
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
            <p className="text-xl xl:text-2xl font-black text-amber-800 mt-2 flex flex-wrap items-baseline gap-1 leading-tight">
              <span>
                <XBar /> = {evalAnalytics.overallMean.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-[#7c5d3a]">/ 5.00</span>
            </p>
            <p className="text-[11px] text-[#7c5d3a] mt-2 leading-snug">
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
            <p className="text-[11px] text-[#7c5d3a] mt-2 leading-snug">
              <XBar /> = {evalAnalytics.highestDimension?.mean.toFixed(2) || '-'} (S.D. = {evalAnalytics.highestDimension?.sd.toFixed(2) || '-'})
            </p>
          </div>

          <div className="bg-white border border-amber-900/12 p-5 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7c5d3a]">สถานะกระทงบนแม่น้ำ</span>
              <ShieldCheck className="w-5 h-5 text-amber-700" />
            </div>
            <p className="text-2xl font-black text-[#231912] mt-2">
              {statusCounts.approved.toLocaleString()} ใบ
            </p>
            <p className="text-[11px] text-[#7c5d3a] mt-2">
              กำลังแสดงผล: {statusCounts.approved.toLocaleString()} | ซ่อนแล้ว: {statusCounts.rejected.toLocaleString()}
            </p>
          </div>
        </div>

        {/* KPI Success Cards Strip (ตัวชี้วัดเชิงคุณภาพ หน้า 5 เล่มโครงการ) */}
        <div className="bg-white border border-amber-900/12 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-[#231912]">
                ตัวชี้วัดความสำเร็จของโครงการ (KPIs เชิงคุณภาพ • เกณฑ์ผ่าน <XBar /> ≥ 4.00)
              </h2>
              <p className="text-[11px] text-[#7c5d3a]">
                อ้างอิงหัวข้อ 7 ตัวชี้วัดความสำเร็จของโครงการลอยกระทงบุฟเฟต์
              </p>
            </div>
            {evalAnalytics.legacyExcludedCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 border border-sky-200 text-sky-800">
                แยกข้อมูลชุดทดสอบเก่า (10 ข้อ) ออกจากการคำนวณสถิติชุดใหม่แล้ว {evalAnalytics.legacyExcludedCount} รายการ
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {evalAnalytics.kpiStats.map((kpi) => (
              <div
                key={kpi.key}
                className={`p-3.5 rounded-xl border ${
                  kpi.passed
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : 'bg-[#fdfaf4] border-amber-300/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-[#231912] leading-snug">{kpi.label}</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 border ${
                      kpi.passed
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                        : evalAnalytics.totalN > 0
                          ? 'bg-amber-100 border-amber-400 text-amber-900'
                          : 'bg-white border-amber-900/15 text-[#7c5d3a]'
                    }`}
                  >
                    {evalAnalytics.totalN === 0
                      ? 'รอข้อมูล'
                      : kpi.passed
                        ? `ผ่านเกณฑ์ ≥ ${kpi.target.toFixed(0)}`
                        : `ต่ำกว่าเกณฑ์ < ${kpi.target.toFixed(0)}`}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-3 text-xs">
                  <span className="text-lg font-black text-amber-800">
                    <XBar /> = {kpi.mean.toFixed(2)}
                  </span>
                  <span className="text-[#7c5d3a]">S.D. = {kpi.sd.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 1. Radar Chart Component (9 หมวดหลัก) */}
        <EvaluationRadarChart
          dimensionStats={evalAnalytics.dimensionStats}
          overallMean={evalAnalytics.overallMean}
          totalN={evalAnalytics.totalN}
        />

        {/* 2. ตารางสรุปผลสถิติความพึงพอใจแบบประเมินมาตรฐานกลาง ม.อ. (9 หมวด / 36 ข้อหลัก + 4 ข้อชุมชน) */}
        <div className="bg-white border border-amber-900/12 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-amber-900/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-700" />
                <h2 className="text-base sm:text-lg font-extrabold text-[#231912]">
                  ตารางสรุปผลสถิติความพึงพอใจ (36 ข้อหลัก + 4 ข้อชุมชน)
                </h2>
                {isUsingDemoEvals && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    ข้อมูลตัวอย่าง (จะอัปเดตทันทีเมื่อมีผู้ส่งแบบประเมินมาตรฐานใหม่จริง)
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7c5d3a] mt-0.5 leading-snug">
                แสดงจำนวนผู้ตอบทั้งหมด (N = {evalAnalytics.totalN} คน • ชุมชน/บุคคลทั่วไป N = {evalAnalytics.communityN} คน), ร้อยละ (%) ในแต่ละระดับคะแนน (1–5), ค่าเฉลี่ย (<XBar />) และ S.D.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={handleExportExcel}
                title="ดาวน์โหลดไฟล์ Excel (.xlsx) ครบ 4 Sheets: ข้อมูลดิบ, ตารางสรุปสถิติ 9 หมวด/36 ข้อ + ชุมชน + KPIs, สรุป 7 SDGs และรายชื่อกระทง"
                className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>Export Excel (4 Sheets)</span>
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
                title="เปิดหน้ารายงานสรุปผลขนาด A4 พร้อมกราฟ Radar Chart 9 หมวด, ตารางสถิติ 36+4 ข้อ และสรุป SDGs เพื่อพิมพ์หรือเซฟเป็น PDF"
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
                  <th className="py-3 px-3 text-center border-r border-amber-900/10 text-amber-900 whitespace-nowrap">
                    ค่าเฉลี่ย (<XBar />)
                  </th>
                  <th className="py-3 px-3 text-center border-r border-amber-900/10">S.D.</th>
                  <th className="py-3 px-3 text-center">แปลผล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10">
                {evalAnalytics.dimensionStats.map((dim) => {
                  const dimQuestions = evalAnalytics.questionStats.filter(
                    (q) => q.dimensionId === dim.dimensionId
                  );
                  return (
                    <React.Fragment key={dim.dimensionId}>
                      <tr className="bg-[#fdf3dc] border-y border-amber-300/60">
                        <td
                          colSpan={7}
                          className="py-2 px-4 font-extrabold text-[#231912] border-r border-amber-900/12"
                        >
                          <span>{dim.label}</span>
                          <span className="ml-2 text-[10px] font-semibold text-[#7c5d3a]">
                            ({dim.sectionGroup})
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-black text-amber-900 border-r border-amber-900/12">
                          {dim.mean.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center font-semibold text-[#574536] border-r border-amber-900/12">
                          {dim.sd.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-950">
                            {dim.levelText}
                          </span>
                        </td>
                      </tr>
                      {dimQuestions.map((st) => (
                        <tr key={st.questionId} className="hover:bg-[#fdf8ec] transition">
                          <td className="py-2.5 px-3 text-center font-bold text-amber-800 border-r border-amber-900/10">
                            {st.questionId}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-[#231912] border-r border-amber-900/10">
                            {st.subGroupLabel && (
                              <span className="inline-block mr-1.5 px-1.5 py-0.5 rounded bg-amber-100/70 text-[10px] font-semibold text-amber-900">
                                {st.subGroupLabel}
                              </span>
                            )}
                            <span>{st.title}</span>
                          </td>
                          {[5, 4, 3, 2, 1].map((lvl) => {
                            const scoreKey = lvl as 1 | 2 | 3 | 4 | 5;
                            return (
                              <td
                                key={lvl}
                                className="py-2 px-2 text-center border-r border-amber-900/10 whitespace-nowrap"
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
                          <td className="py-2.5 px-3 text-center font-extrabold text-amber-800 border-r border-amber-900/10 text-sm">
                            {st.mean.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center text-[#574536] border-r border-amber-900/10">
                            {st.sd.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              {st.levelText}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}

                {/* ส่วนที่ 15: สำหรับผู้ปกครอง / ชุมชน (เฉพาะบุคคลทั่วไป/ชุมชน) */}
                <tr className="bg-emerald-50/80 border-y border-emerald-300/70">
                  <td
                    colSpan={10}
                    className="py-2 px-4 font-extrabold text-emerald-950"
                  >
                    ส่วนเพิ่มเติมเฉพาะกลุ่มบุคคลทั่วไป / ชุมชน (ส่วนที่ 15: สำหรับผู้ปกครอง / ชุมชน • N = {evalAnalytics.communityN} คน)
                  </td>
                </tr>
                {evalAnalytics.communityN === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-4 px-4 text-center text-xs text-[#7c5d3a]">
                      ยังไม่มีผู้ตอบในกลุ่มบุคคลทั่วไป/ชุมชน สำหรับแบบประเมินมาตรฐานใหม่
                    </td>
                  </tr>
                ) : (
                  evalAnalytics.communityStats.map((st) => (
                    <tr key={`comm-${st.questionId}`} className="hover:bg-[#fdf8ec] transition">
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700 border-r border-amber-900/10">
                        ช.{st.questionId}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#231912] border-r border-amber-900/10">
                        {st.title}
                      </td>
                      {[5, 4, 3, 2, 1].map((lvl) => {
                        const scoreKey = lvl as 1 | 2 | 3 | 4 | 5;
                        return (
                          <td
                            key={lvl}
                            className="py-2 px-2 text-center border-r border-amber-900/10 whitespace-nowrap"
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
                      <td className="py-2.5 px-3 text-center font-extrabold text-emerald-800 border-r border-amber-900/10 text-sm">
                        {st.mean.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#574536] border-r border-amber-900/10">
                        {st.sd.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {st.levelText}
                        </span>
                      </td>
                    </tr>
                  ))
                )}

                {/* แถวสรุปค่าเฉลี่ยรวมทุกด้าน (Overall Mean) */}
                <tr className="bg-[#fffbeb] font-bold text-[#231912] border-t-2 border-amber-400/70">
                  <td
                    colSpan={7}
                    className="py-3.5 px-4 text-right border-r border-amber-900/15 text-xs sm:text-sm leading-snug"
                  >
                    ค่าเฉลี่ยรวม 36 ข้อหลัก (Overall Mean) จากผู้ประเมินทั้งหมด N = {evalAnalytics.totalN} คน
                  </td>
                  <td className="py-3.5 px-3 text-center text-base font-black text-amber-800 border-r border-amber-900/15 whitespace-nowrap">
                    {evalAnalytics.overallMean.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-center border-r border-amber-900/15 whitespace-nowrap">
                    {evalAnalytics.overallSD.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-[#231912]">
                      {evalAnalytics.overallLevelText}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2.2 สรุปผลการประเมินความสอดคล้องตามเป้าหมาย SDGs (7 เป้าหมาย: 5, 11, 12, 13, 14, 15, 17) */}
        <div className="bg-white border border-amber-900/12 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-amber-900/10">
            <h2 className="text-base sm:text-lg font-extrabold text-[#231912] flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-600" />
              <span>สรุปผลการประเมินความสอดคล้องเป้าหมาย SDGs (7 เป้าหมายตามเล่มโครงการ)</span>
            </h2>
            <p className="text-xs text-[#7c5d3a] mt-0.5">
              SDG 5, 11, 12, 13, 14, 15 และ 17 (N = {evalAnalytics.sdgStats[0]?.totalN ?? 0} คน)
            </p>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {evalAnalytics.sdgStats.map((sdg) => (
              <div
                key={sdg.key}
                className="p-3.5 rounded-xl bg-[#fdfaf4] border border-amber-900/12 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-md text-white text-[11px] font-extrabold shrink-0"
                      style={{ backgroundColor: sdg.colorHex }}
                    >
                      SDG {sdg.code}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#231912]">{sdg.nameTh}</p>
                      <p className="text-[10px] text-[#7c5d3a]">{sdg.nameEn}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-700 shrink-0">
                    {sdg.compliantPct.toFixed(1)}%
                  </span>
                </div>

                <p className="text-[11px] text-[#574536] leading-snug">{sdg.description}</p>

                <div className="w-full h-2.5 rounded-full bg-rose-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, sdg.compliantPct))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-800 font-semibold">
                    สอดคล้อง / บรรลุ: {sdg.compliantCount} คน ({sdg.compliantPct.toFixed(1)}%)
                  </span>
                  <span className="text-rose-700 font-medium">
                    ไม่สอดคล้อง: {sdg.nonCompliantCount} คน ({sdg.nonCompliantPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
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
                placeholder="ค้นหารหัสนักศึกษา, คณะ, สาขา หรือชั้นปี..."
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
                    <th className="py-3 px-4 font-semibold">สาขา</th>
                    <th className="py-3 px-4 font-semibold">ชั้นปี</th>
                    <th className="py-3 px-4 font-semibold">เวลาที่ส่ง</th>
                    <th className="py-3 px-4 font-semibold">สถานะตรวจสอบ</th>
                    <th className="py-3 px-4 font-semibold text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 text-xs sm:text-sm">
                  {filteredTranscriptStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#7c5d3a]">
                        ไม่พบรายชื่อนักศึกษาที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  ) : (
                    pagedTranscriptStudents.map((student, idx) => (
                      <tr
                        key={student.student_id}
                        className="hover:bg-[#fdf8ec] transition-colors"
                      >
                        <td className="py-2.5 px-4 text-[#7c5d3a]">{(safeTranscriptPage - 1) * ADMIN_PAGE_SIZE + idx + 1}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-amber-800">
                          {student.student_id}
                        </td>
                        <td className="py-2.5 px-4 text-[#231912] font-medium">
                          {student.faculty || 'ไม่ระบุคณะ'}
                        </td>
                        <td className="py-2.5 px-4 text-[#574536]">
                          {student.major || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-[#574536] whitespace-nowrap">
                          {student.year_level || '-'}
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
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteTranscriptStudent(student.student_id)}
                            title="ลบรายชื่อนี้ออกจาก Transcript เพื่อให้ทดสอบยืนยันรหัสเดิมซ้ำได้"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition active:scale-95 cursor-pointer text-xs font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบ</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalTranscriptPages > 1 && (
              <div className="flex items-center justify-between text-xs text-[#7c5d3a] pt-1">
                <span>
                  แสดง {(safeTranscriptPage - 1) * ADMIN_PAGE_SIZE + 1}–
                  {Math.min(safeTranscriptPage * ADMIN_PAGE_SIZE, filteredTranscriptStudents.length)} จาก{' '}
                  {filteredTranscriptStudents.length.toLocaleString()} คน
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safeTranscriptPage <= 1}
                    onClick={() => setTranscriptPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg bg-[#fdfaf4] border border-amber-900/15 text-[#231912] disabled:opacity-40 cursor-pointer"
                  >
                    ก่อนหน้า
                  </button>
                  <span className="font-semibold text-[#231912]">
                    หน้า {safeTranscriptPage} / {totalTranscriptPages}
                  </span>
                  <button
                    type="button"
                    disabled={safeTranscriptPage >= totalTranscriptPages}
                    onClick={() => setTranscriptPage((p) => Math.min(totalTranscriptPages, p + 1))}
                    className="px-3 py-1 rounded-lg bg-[#fdfaf4] border border-amber-900/15 text-[#231912] disabled:opacity-40 cursor-pointer"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
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
                สามารถค้นหา กรองสถานะ ซ่อน หรือลบข้อความที่ไม่เหมาะสมได้ทันที
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
                  pagedKrathongs.map((k: any) => {
                    const isHidden = k.status === 'rejected';
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
                          {isHidden ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              ซ่อนแล้ว
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              แสดงผล
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
                              onClick={() => handleModerate(k.id, isHidden ? 'approved' : 'rejected')}
                              title={isHidden ? 'นำกลับมาแสดงบนแม่น้ำ' : 'ซ่อนไม่ให้แสดงบนแม่น้ำ'}
                              className={`px-2.5 py-1 rounded-lg transition active:scale-95 cursor-pointer flex items-center space-x-1 text-[11px] font-semibold ${
                                isHidden
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-[#fffbeb] hover:bg-amber-100 text-amber-900 border border-amber-300/70'
                              }`}
                            >
                              {isHidden ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>แสดงคืน</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>ซ่อน</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModerate(k.id, 'deleted')}
                              title="ลบรายการนี้ออกจากระบบ"
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition active:scale-95 cursor-pointer flex items-center space-x-1 text-[11px] font-semibold"
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
          {totalKrathongPages > 1 && (
            <div className="px-4 py-3 border-t border-amber-900/10 bg-[#fdfaf4] flex items-center justify-between text-xs text-[#7c5d3a]">
              <span>
                แสดง {(safeKrathongPage - 1) * ADMIN_PAGE_SIZE + 1}–
                {Math.min(safeKrathongPage * ADMIN_PAGE_SIZE, filteredKrathongs.length)} จาก{' '}
                {filteredKrathongs.length.toLocaleString()} รายการ
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeKrathongPage <= 1}
                  onClick={() => setKrathongPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-lg bg-white border border-amber-900/15 text-[#231912] disabled:opacity-40 cursor-pointer"
                >
                  ก่อนหน้า
                </button>
                <span className="font-semibold text-[#231912]">
                  หน้า {safeKrathongPage} / {totalKrathongPages}
                </span>
                <button
                  type="button"
                  disabled={safeKrathongPage >= totalKrathongPages}
                  onClick={() => setKrathongPage((p) => Math.min(totalKrathongPages, p + 1))}
                  className="px-3 py-1 rounded-lg bg-white border border-amber-900/15 text-[#231912] disabled:opacity-40 cursor-pointer"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Feedback Section */}
        {evalAnalytics.records.some(
          (r) => r.feedback_impressed || r.feedback_improve || r.feedback_other || r.comment
        ) && (
          <div className="bg-white border border-amber-900/12 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#231912] mb-3">
              ข้อเสนอแนะและความคิดเห็นจากผู้ตอบแบบประเมินล่าสุด
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {evalAnalytics.records
                .filter(
                  (r) => r.feedback_impressed || r.feedback_improve || r.feedback_other || r.comment
                )
                .slice(0, 12)
                .map((f, i) => {
                  const responderLabel =
                    f.user_type === 'student'
                      ? `นักศึกษา${f.student_id ? ` (${f.student_id})` : ''}${f.major ? ` • ${f.major}` : ''}${f.year_level ? ` (${f.year_level})` : ''}`
                      : f.user_type === 'staff'
                        ? `อาจารย์/บุคลากร${f.major ? ` • ${f.major}` : ''}${f.role ? ` (${f.role})` : ''}`
                        : `บุคคลทั่วไป/ชุมชน${f.role ? ` (${f.role})` : ''}`;

                  const hasStructuredFeedback = Boolean(
                    f.feedback_impressed || f.feedback_improve || f.feedback_other
                  );

                  return (
                    <div
                      key={f.id || i}
                      className="bg-[#fdfaf4] p-3.5 rounded-xl border border-amber-900/12 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-[#7c5d3a]">
                        <span className="font-semibold text-[#574536] truncate">
                          {responderLabel}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-amber-800 font-bold">
                            <XBar /> = {f.average_score.toFixed(2)} / 5.00
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteFeedback(f)}
                            title="ลบข้อเสนอแนะนี้ออกจากระบบ"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition active:scale-95 cursor-pointer text-[11px] font-semibold"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </div>

                      {hasStructuredFeedback ? (
                        <div className="space-y-1 text-xs text-[#231912] break-words">
                          {f.feedback_impressed && (
                            <p>
                              <strong className="text-emerald-800">สิ่งที่ประทับใจ:</strong>{' '}
                              {f.feedback_impressed}
                            </p>
                          )}
                          {f.feedback_improve && (
                            <p>
                              <strong className="text-amber-900">ควรปรับปรุง:</strong>{' '}
                              {f.feedback_improve}
                            </p>
                          )}
                          {f.feedback_other && (
                            <p>
                              <strong className="text-[#574536]">เพิ่มเติม:</strong>{' '}
                              {f.feedback_other}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-[#231912] italic break-words">
                          &ldquo;{f.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Admin Test Evaluation Modal */}
      {showTestEvalModal && (
        <Suspense fallback={null}>
          <EvaluationModal
            krathongId={null}
            userType="student"
            isAdminTestMode
            onClose={() => setShowTestEvalModal(false)}
            onFinish={() => {
              setShowTestEvalModal(false);
              setResetLockNotice(
                'ส่งแบบประเมินทดสอบเรียบร้อยแล้ว! ข้อมูลกราฟและตารางด้านล่างถูกอัปเดตล่าสุดแล้ว'
              );
              loadData();
            }}
          />
        </Suspense>
      )}

      {/* Full System Reset Confirmation Modal */}
      {showFullResetModal && (
        <div className="fixed inset-0 bg-[#1c140d]/75 flex items-center justify-center p-4 z-50 animate-ui-fade">
          <div className="bg-[#fdfaf4] border border-rose-300 text-[#231912] rounded-3xl p-5 sm:p-6 max-w-md w-full relative shadow-2xl space-y-4 animate-ui-modal">
            <button
              type="button"
              disabled={fullResetRunning}
              onClick={() => setShowFullResetModal(false)}
              aria-label="ปิดหน้าต่างล้างข้อมูลทั้งระบบ"
              className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white hover:bg-rose-50 text-[#574536] hover:text-rose-700 border border-amber-900/15 transition cursor-pointer disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-rose-800">
                  ล้างข้อมูลทดสอบทั้งระบบ (เตรียมวันงานจริง)
                </h3>
                <p className="text-xs text-[#574536] mt-0.5 leading-relaxed">
                  การดำเนินการนี้จะลบรายการกระทง คำอธิษฐาน แบบประเมิน และรายชื่อ Activity Transcript ทดสอบทั้งหมดในฐานข้อมูลกลาง (Supabase + Cloudflare D1) และเบราว์เซอร์นี้ให้เหลือ 0 พร้อมสำหรับเปิดงานวันที่ 24 พฤศจิกายน 2569
                </p>
              </div>
            </div>

            <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-3 text-xs text-rose-900 space-y-1">
              <p className="font-bold">คำเตือน: ไม่สามารถกู้คืนข้อมูลที่ถูกลบได้</p>
              <p>หากต้องการดำเนินการต่อ กรุณาพิมพ์คำว่า <strong>RESET</strong> ลงในช่องด้านล่าง</p>
            </div>

            <div>
              <input
                type="text"
                value={fullResetConfirmText}
                onChange={(e) => {
                  setFullResetConfirmText(e.target.value);
                  setFullResetError('');
                }}
                placeholder="พิมพ์คำว่า RESET"
                disabled={fullResetRunning}
                className="w-full bg-white border border-rose-300 focus:border-rose-600 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#231912] placeholder-[#9c8671] focus:outline-none uppercase"
              />
              {fullResetError && (
                <p className="text-xs font-semibold text-rose-700 mt-1.5">{fullResetError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={fullResetRunning}
                onClick={() => setShowFullResetModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-[#231912] border border-amber-900/15 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={fullResetRunning || fullResetConfirmText.trim().toUpperCase() !== 'RESET'}
                onClick={handleConfirmFullSystemReset}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer disabled:opacity-45 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{fullResetRunning ? 'กำลังล้างข้อมูล...' : 'ยืนยันล้างข้อมูลทั้งหมด'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
