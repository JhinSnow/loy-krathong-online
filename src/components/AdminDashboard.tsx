// src/components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import type { StatsResponse, KrathongItem } from '../types';
import { exportToExcel, exportToPDF } from '../utils/exportHelpers';
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
  RefreshCw
} from 'lucide-react';
import { supabase } from '../utils/supabase';

interface AdminDashboardProps {
  onBackToRiver: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToRiver }) => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [krathongs, setKrathongs] = useState<KrathongItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [requireApproval, setRequireApproval] = useState<boolean>(false);

  // ดึงข้อมูลสถิติและรายการกระทง
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. ดึงจาก Supabase
      const { data: supaKrathongs } = await supabase
        .from('krathongs')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: supaEvals } = await supabase
        .from('evaluations')
        .select('*')
        .order('created_at', { ascending: false });

      if (supaKrathongs && supaKrathongs.length > 0) {
        setKrathongs(supaKrathongs);

        const studentCount = supaKrathongs.filter(k => k.user_type === 'student').length;
        const staffCount = supaKrathongs.filter(k => k.user_type === 'staff').length;
        const generalCount = supaKrathongs.filter(k => k.user_type === 'general').length;

        const approvedCount = supaKrathongs.filter(k => k.status === 'approved' || !k.status).length;
        const pendingCount = supaKrathongs.filter(k => k.status === 'pending').length;
        const rejectedCount = supaKrathongs.filter(k => k.status === 'rejected').length;

        const totalReviews = supaEvals ? supaEvals.length : 0;
        const avgRating = totalReviews > 0
          ? Number((supaEvals!.reduce((acc, curr) => acc + (curr.rating || 5), 0) / totalReviews).toFixed(2))
          : 5.0;

        const ratingDist = [5, 4, 3, 2, 1].map(r => ({
          rating: r,
          count: supaEvals ? supaEvals.filter(e => e.rating === r).length : 0
        }));

        const recentFeedbacks = (supaEvals || [])
          .filter(e => e.feedback)
          .map(e => ({
            user_type: e.user_type,
            rating: e.rating,
            feedback: e.feedback,
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
          ratingSummary: { total_reviews: totalReviews, average_rating: avgRating },
          ratingDistribution: ratingDist,
          recentFeedbacks,
          requireApproval: false
        });
        setLoading(false);
        return;
      }

      // 2. ถ้า Supabase ยังว่าง ให้ดึงจาก Cloudflare API หรือ Fallback
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
        setRequireApproval(statsData.requireApproval);
      }

      const listRes = await fetch('/api/krathongs?limit=100');
      if (listRes.ok) {
        const listData = await listRes.json();
        setKrathongs(listData);
      }
    } catch (e) {
      console.warn('API error, loading demo stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // สลับโหมด Approval
  const handleToggleApproval = async () => {
    const nextVal = !requireApproval;
    setRequireApproval(nextVal);
    try {
      await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_approval', requireApproval: nextVal })
      });
    } catch (_) {}
  };

  // ดำเนินการ อนุมัติ / ซ่อนกระทง
  const handleModerate = async (krathongId: string, status: 'approved' | 'rejected') => {
    try {
      await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', krathongId, status })
      });
      loadData();
    } catch (_) {
      // Local state update
      setKrathongs(prev => prev.filter(k => k.id !== krathongId));
    }
  };

  // Export Data Handlers
  const handleExportExcel = () => {
    const exportRows = krathongs.map(k => ({
      id: k.id,
      user_type: k.user_type,
      owner_name: k.owner_name,
      wish_message: k.wish_message,
      status: 'approved',
      created_at: k.created_at || new Date().toISOString()
    }));
    exportToExcel(exportRows);
  };

  const handleExportPDF = () => {
    const exportRows = krathongs.map(k => ({
      id: k.id,
      user_type: k.user_type,
      owner_name: k.owner_name,
      wish_message: k.wish_message,
      status: 'approved',
      created_at: k.created_at || new Date().toISOString()
    }));
    exportToPDF(exportRows);
  };

  const totalUsers = stats?.userStats.reduce((acc, curr) => acc + curr.count, 0) || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToRiver}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-amber-200">
              Admin Moderation & Analytics
            </h1>
            <p className="text-xs text-slate-400">ระบบคัดกรองข้อความและสถิติภาพรวมเทศกาล</p>
          </div>
        </div>

        {/* Action Controls & Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Approval Mode Toggle */}
          <button
            onClick={handleToggleApproval}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              requireApproval
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            {requireApproval ? <ToggleRight className="w-5 h-5 text-amber-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
            <span>โหมดคัดกรองก่อนขึ้นจอ: {requireApproval ? 'เปิดใช้งาน' : 'ปิด'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Report</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">ผู้เข้าร่วมลอยกระทง</span>
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mt-2">{totalUsers.toLocaleString()} คน</p>
            <div className="text-[11px] text-slate-400 mt-2 space-x-2">
              <span>นศ: {stats?.userStats.find(u => u.user_type === 'student')?.count || 0}</span>
              <span>• บุคลากร: {stats?.userStats.find(u => u.user_type === 'staff')?.count || 0}</span>
              <span>• ทั่วไป: {stats?.userStats.find(u => u.user_type === 'general')?.count || 0}</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">คะแนนความพึงพอใจเฉลี่ย</span>
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-2xl font-black text-amber-300 mt-2">
              {stats?.ratingSummary?.average_rating || '5.00'} / 5.0
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              จากผู้ตอบแบบประเมิน {stats?.ratingSummary?.total_reviews || 0} คน
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">สถานะกระทงบนแม่น้ำ</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-300 mt-2">
              {stats?.statusStats.find(s => s.status === 'approved')?.count || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              รอตรวจสอบ: {stats?.statusStats.find(s => s.status === 'pending')?.count || 0} | ปฏิเสธ: {stats?.statusStats.find(s => s.status === 'rejected')?.count || 0}
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">ระดับ Edge Runtime</span>
              <span className="text-xs text-amber-400 font-mono">Cloudflare D1</span>
            </div>
            <p className="text-2xl font-black text-sky-300 mt-2">Serverless</p>
            <p className="text-[11px] text-slate-400 mt-2">0ms Cold Start / Client Export</p>
          </div>
        </div>

        {/* Live Moderation Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-amber-200">
                รายการกระทงล่าสุด (Live Moderation Stream)
              </h2>
              <p className="text-xs text-slate-400">
                สามารถตรวจสอบ อนุมัติ หรือซ่อนข้อความที่ไม่เหมาะสมได้ทันที
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ผู้ปล่อย</th>
                  <th className="py-3 px-4">กลุ่ม</th>
                  <th className="py-3 px-4">คำอธิษฐาน / ข้อความ</th>
                  <th className="py-3 px-4">เวลา</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {krathongs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      ยังไม่มีรายการกระทงในขณะนี้
                    </td>
                  </tr>
                ) : (
                  krathongs.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        {k.owner_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {k.user_type === 'student' ? 'นักศึกษา' : k.user_type === 'staff' ? 'บุคลากร' : 'ทั่วไป'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200 max-w-xs break-words">
                        "{k.wish_message}"
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {k.created_at ? k.created_at.slice(11, 16) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleModerate(k.id, 'approved')}
                            title="อนุมัติขึ้นจอ"
                            className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleModerate(k.id, 'rejected')}
                            title="ซ่อน/ปฏิเสธข้อความ"
                            className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feedback Section */}
        {stats?.recentFeedbacks && stats.recentFeedbacks.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-amber-200 mb-3">ความคิดเห็นและข้อเสนอแนะล่าสุด</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stats.recentFeedbacks.map((f, i) => (
                <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>
                      {f.user_type === 'student' ? 'นักศึกษา' : f.user_type === 'staff' ? 'บุคลากร' : 'บุคคลทั่วไป'}
                    </span>
                    <div className="flex text-yellow-400">
                      {'★'.repeat(f.rating)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-200 italic">"{f.feedback}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
