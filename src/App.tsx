// src/App.tsx
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { KrathongCustomizer } from './components/KrathongCustomizer';
import { hasCompletedEvaluationOnDevice } from './utils/evaluationHelpers';
import type { UserType } from './types';

const RiverCanvas = lazy(() =>
  import('./components/RiverCanvas').then((m) => ({ default: m.RiverCanvas }))
);
const EvaluationModal = lazy(() =>
  import('./components/EvaluationModal').then((m) => ({ default: m.EvaluationModal }))
);
const WishesGallery = lazy(() =>
  import('./components/WishesGallery').then((m) => ({ default: m.WishesGallery }))
);
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

type AppView = 'river' | 'customize' | 'wishes' | 'admin';
type ForcedMode = 'stage' | 'attendee' | 'auto';

function resolveInitialRouting(): { initialView: AppView; forcedMode: ForcedMode } {
  if (typeof window === 'undefined') {
    return { initialView: 'customize', forcedMode: 'auto' };
  }
  const params = new URLSearchParams(window.location.search);
  const mode = (params.get('mode') || '').trim().toLowerCase();

  if (mode === 'create' || mode === 'customize') {
    return { initialView: 'customize', forcedMode: 'attendee' };
  }
  if (mode === 'wishes' || mode === 'wish') {
    return { initialView: 'wishes', forcedMode: 'attendee' };
  }
  if (mode === 'river' || mode === 'mobile' || mode === 'attendee') {
    return { initialView: 'river', forcedMode: 'attendee' };
  }
  if (mode === 'stage' || mode === 'projector') {
    return { initialView: 'river', forcedMode: 'stage' };
  }
  if (mode === 'admin') {
    return { initialView: 'admin', forcedMode: 'attendee' };
  }
  // ค่าเริ่มต้นของเว็บให้เข้าสู่หน้าสร้าง/ตกแต่งกระทงก่อน (ยกเว้นจอเวทีที่ใช้ ?mode=stage)
  return { initialView: 'customize', forcedMode: 'auto' };
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
  const [justFloated, setJustFloated] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopViewport(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    // Preload RiverCanvas, EvaluationModal & WishesGallery quietly after initial paint so navigation is 0ms instant
    const preloadTimer = window.setTimeout(() => {
      import('./components/RiverCanvas').catch(() => {});
      import('./components/EvaluationModal').catch(() => {});
      import('./components/WishesGallery').catch(() => {});
    }, 500);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.clearTimeout(preloadTimer);
    };
  }, []);

  // เปิด WebSocket Realtime เฉพาะโหมดจอเวที/โปรเจกเตอร์ (?mode=stage หรือหน้าจอขนาด >= 1024px ที่ไม่ได้เข้าผ่านโหมดผู้ร่วมงาน)
  // เพื่อประหยัด Concurrent Connections บนแผน Free เมื่อมีผู้ร่วมงาน 1,300+ คนสแกน QR จากมือถือ
  const enableRealtime = forcedMode === 'stage' || (forcedMode === 'auto' && isDesktopViewport);

  const navigateToRiver = (launched = false) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = (params.get('mode') || '').trim().toLowerCase();
      if (mode === 'create' || mode === 'customize') {
        params.set('mode', 'mobile');
        const nextUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', nextUrl);
      }
    }
    setJustFloated(launched);
    setCurrentView('river');
  };

  // เมื่อผู้ใช้กด "ปล่อยกระทงลงน้ำ" สำเร็จ
  const handleSuccessFloating = (krathongId: string, userType: UserType) => {
    setMyKrathongId(krathongId);
    setCurrentUserType(userType);
    // หากเครื่องนี้เคยทำแบบประเมินไปแล้ว ให้ข้ามหน้าแบบประเมินและพากลับสู่สายน้ำทันที (ไม่ติดล็อกซ้ำ)
    if (hasCompletedEvaluationOnDevice()) {
      setShowEvaluation(false);
      navigateToRiver(true);
      return;
    }
    setShowEvaluation(true);
  };

  // เมื่อส่งแบบประเมินเสร็จ -> Redirect ไปหน้าสายน้ำแบบโปรเจกเตอร์พร้อมแอนิเมชันกระทงลอยออกมา
  const handleEvaluationFinish = () => {
    setShowEvaluation(false);
    navigateToRiver(true);
  };

  const navigateToWishes = () => {
    setJustFloated(false);
    setCurrentView('wishes');
  };

  return (
    <main className="w-screen min-h-screen bg-[#fdfaf4] text-[#231912] font-sans">
      {currentView === 'river' && (
        <Suspense fallback={<div className="w-screen h-dvh bg-[#0c7c94]" />}>
          <RiverCanvas
            myKrathongId={myKrathongId}
            justFloated={justFloated}
            enableRealtime={enableRealtime}
            onNavigateCustomize={() => {
              setJustFloated(false);
              setCurrentView('customize');
            }}
            onNavigateWishes={navigateToWishes}
            onNavigateAdmin={() => {
              setJustFloated(false);
              setCurrentView('admin');
            }}
          />
        </Suspense>
      )}

      {currentView === 'customize' && (
        <KrathongCustomizer
          onBackToRiver={() => navigateToRiver(false)}
          onNavigateWishes={navigateToWishes}
          onSuccessFloating={handleSuccessFloating}
          isOverlayOpen={showEvaluation}
        />
      )}

      {currentView === 'wishes' && (
        <Suspense fallback={<div className="w-screen h-dvh bg-[#fdfaf4]" />}>
          <WishesGallery
            myKrathongId={myKrathongId}
            onNavigateRiver={() => navigateToRiver(false)}
            onNavigateCustomize={() => {
              setJustFloated(false);
              setCurrentView('customize');
            }}
          />
        </Suspense>
      )}

      {currentView === 'admin' && (
        <Suspense fallback={<div className="w-screen h-dvh bg-[#fdfaf4]" />}>
          <AdminDashboard
            onBackToRiver={() => navigateToRiver(false)}
          />
        </Suspense>
      )}

      {/* Evaluation Modal (บังคับเปลี่ยนหน้าหรือเด้งขึ้นทันทีหลังปล่อยกระทง) */}
      {showEvaluation && (
        <Suspense fallback={null}>
          <EvaluationModal
            krathongId={myKrathongId}
            userType={currentUserType}
            onFinish={handleEvaluationFinish}
          />
        </Suspense>
      )}
    </main>
  );
};

export default App;
