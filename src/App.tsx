// src/App.tsx
import React, { useEffect, useState } from 'react';
import { RiverCanvas } from './components/RiverCanvas';
import { KrathongCustomizer } from './components/KrathongCustomizer';
import { EvaluationModal } from './components/EvaluationModal';
import { AdminDashboard } from './components/AdminDashboard';
import type { UserType } from './types';

type AppView = 'river' | 'customize' | 'admin';
type ForcedMode = 'stage' | 'attendee' | 'auto';

function resolveInitialRouting(): { initialView: AppView; forcedMode: ForcedMode } {
  if (typeof window === 'undefined') {
    return { initialView: 'river', forcedMode: 'auto' };
  }
  const params = new URLSearchParams(window.location.search);
  const mode = (params.get('mode') || '').trim().toLowerCase();

  if (mode === 'create' || mode === 'customize') {
    return { initialView: 'customize', forcedMode: 'attendee' };
  }
  if (mode === 'mobile' || mode === 'attendee') {
    return { initialView: 'river', forcedMode: 'attendee' };
  }
  if (mode === 'stage' || mode === 'projector') {
    return { initialView: 'river', forcedMode: 'stage' };
  }
  if (mode === 'admin') {
    return { initialView: 'admin', forcedMode: 'attendee' };
  }
  return { initialView: 'river', forcedMode: 'auto' };
}

export const App: React.FC = () => {
  const [{ initialView, forcedMode }] = useState(resolveInitialRouting);

  // Navigation states: 'river' | 'customize' | 'admin'
  const [currentView, setCurrentView] = useState<AppView>(initialView);
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Stored Krathong after submission
  const [myKrathongId, setMyKrathongId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<UserType>('general');
  const [showEvaluation, setShowEvaluation] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopViewport(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // เปิด WebSocket Realtime เฉพาะโหมดจอเวที/โปรเจกเตอร์ (?mode=stage หรือหน้าจอขนาด >= 1024px ที่ไม่ได้เข้าผ่านโหมดผู้ร่วมงาน)
  // เพื่อประหยัด Concurrent Connections บนแผน Free เมื่อมีผู้ร่วมงาน 1,300+ คนสแกน QR จากมือถือ
  const enableRealtime = forcedMode === 'stage' || (forcedMode === 'auto' && isDesktopViewport);

  const navigateToRiver = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = (params.get('mode') || '').trim().toLowerCase();
      if (mode === 'create' || mode === 'customize') {
        params.set('mode', 'mobile');
        const nextUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', nextUrl);
      }
    }
    setCurrentView('river');
  };

  // เมื่อผู้ใช้กด "ปล่อยกระทงลงน้ำ" สำเร็จ
  const handleSuccessFloating = (krathongId: string, userType: UserType) => {
    setMyKrathongId(krathongId);
    setCurrentUserType(userType);
    // บังคับแสดงแบบประเมินความพึงพอใจทันทีตามข้อกำหนด
    setShowEvaluation(true);
  };

  // เมื่อส่งแบบประเมินหรือข้ามแบบประเมินเสร็จ -> Redirect ไปหน้าแม่น้ำพร้อมเปิดโหมด Find My Krathong
  const handleEvaluationFinish = () => {
    setShowEvaluation(false);
    navigateToRiver();
  };

  return (
    <main className="w-screen min-h-screen bg-slate-950 font-sans">
      {currentView === 'river' && (
        <RiverCanvas
          myKrathongId={myKrathongId}
          enableRealtime={enableRealtime}
          onNavigateCustomize={() => setCurrentView('customize')}
          onNavigateAdmin={() => setCurrentView('admin')}
        />
      )}

      {currentView === 'customize' && (
        <KrathongCustomizer
          onBackToRiver={navigateToRiver}
          onSuccessFloating={handleSuccessFloating}
        />
      )}

      {currentView === 'admin' && (
        <AdminDashboard
          onBackToRiver={navigateToRiver}
        />
      )}

      {/* Evaluation Modal (บังคับเปลี่ยนหน้าหรือเด้งขึ้นทันทีหลังปล่อยกระทง) */}
      {showEvaluation && (
        <EvaluationModal
          krathongId={myKrathongId}
          userType={currentUserType}
          onFinish={handleEvaluationFinish}
        />
      )}
    </main>
  );
};

export default App;
