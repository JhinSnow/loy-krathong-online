// src/App.tsx
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
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
type TransitionKind = 'to-customize' | 'to-river' | 'launch-to-river' | 'fade';
type TransitionPhase = 'idle' | 'exiting' | 'entering';

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
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>('idle');
  const [transitionKind, setTransitionKind] = useState<TransitionKind>('fade');
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Stored Krathong after submission
  const [myKrathongId, setMyKrathongId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<UserType>('general');
  const [showEvaluation, setShowEvaluation] = useState<boolean>(false);
  const [justFloated, setJustFloated] = useState<boolean>(false);

  const navTimerRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);
  const evalPopupTimerRef = useRef<number | null>(null);

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
      if (navTimerRef.current) window.clearTimeout(navTimerRef.current);
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (evalPopupTimerRef.current) window.clearTimeout(evalPopupTimerRef.current);
    };
  }, []);

  // เปิด WebSocket Realtime เฉพาะโหมดจอเวที/โปรเจกเตอร์ (?mode=stage หรือหน้าจอขนาด >= 1024px ที่ไม่ได้เข้าผ่านโหมดผู้ร่วมงาน)
  // เพื่อประหยัด Concurrent Connections บนแผน Free เมื่อมีผู้ร่วมงาน 1,300+ คนสแกน QR จากมือถือ
  const enableRealtime = forcedMode === 'stage' || (forcedMode === 'auto' && isDesktopViewport);

  const switchView = (
    nextView: AppView,
    kind: TransitionKind,
    options?: { launched?: boolean }
  ) => {
    if (navTimerRef.current) {
      window.clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
    if (enterTimerRef.current) {
      window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    if (nextView !== 'river' && evalPopupTimerRef.current) {
      window.clearTimeout(evalPopupTimerRef.current);
      evalPopupTimerRef.current = null;
    }

    const applyViewSwap = () => {
      if (nextView === 'river' && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const mode = (params.get('mode') || '').trim().toLowerCase();
        if (mode === 'create' || mode === 'customize') {
          params.set('mode', 'mobile');
          const nextUrl = `${window.location.pathname}?${params.toString()}`;
          window.history.replaceState(null, '', nextUrl);
        }
      }
      setJustFloated(Boolean(options?.launched));
      setCurrentView(nextView);
      setTransitionKind(kind);
      setTransitionPhase('entering');
      enterTimerRef.current = window.setTimeout(
        () => {
          setTransitionPhase('idle');
          enterTimerRef.current = null;
        },
        kind === 'launch-to-river' ? 50 : 300
      );
    };

    if (kind === 'launch-to-river') {
      applyViewSwap();
      return;
    }

    setTransitionKind(kind);
    setTransitionPhase('exiting');
    navTimerRef.current = window.setTimeout(() => {
      navTimerRef.current = null;
      applyViewSwap();
    }, 150);
  };

  // เมื่อผู้ใช้กด "ปล่อยกระทงลงน้ำ" สำเร็จ -> สู่สายน้ำพร้อมแอนิเมชัน Zoom-Out ก่อน แล้วค่อยเปิดแบบประเมิน
  const handleSuccessFloating = (krathongId: string, userType: UserType) => {
    setMyKrathongId(krathongId);
    setCurrentUserType(userType);
    setShowEvaluation(false);
    if (evalPopupTimerRef.current) {
      window.clearTimeout(evalPopupTimerRef.current);
      evalPopupTimerRef.current = null;
    }
    switchView('river', 'launch-to-river', { launched: true });

    if (!hasCompletedEvaluationOnDevice()) {
      evalPopupTimerRef.current = window.setTimeout(() => {
        setShowEvaluation(true);
        evalPopupTimerRef.current = null;
      }, 2200);
    }
  };

  // เมื่อส่งแบบประเมินเสร็จ -> ปิดหน้าต่าง (ผู้ใช้อยู่บนหน้าสายน้ำแล้ว)
  const handleEvaluationFinish = () => {
    setShowEvaluation(false);
    if (currentView !== 'river') {
      switchView('river', 'fade');
    }
  };

  const viewTransitionClass =
    transitionPhase === 'exiting'
      ? transitionKind === 'to-customize'
        ? 'animate-view-zoom-in-exit pointer-events-none'
        : transitionKind === 'to-river'
          ? 'animate-view-zoom-out-exit pointer-events-none'
          : 'animate-view-fade-exit pointer-events-none'
      : transitionPhase === 'entering'
        ? transitionKind === 'to-customize'
          ? 'animate-view-zoom-in-enter'
          : transitionKind === 'to-river'
            ? 'animate-view-zoom-out-enter'
            : transitionKind === 'launch-to-river'
              ? ''
              : 'animate-ui-fade'
        : '';

  const isWaterScene = currentView === 'river' || currentView === 'customize';

  return (
    <main
      className={`w-screen min-h-screen font-sans overflow-x-hidden ${
        isWaterScene ? 'bg-[#0c7c94] text-[#231912]' : 'bg-[#fdfaf4] text-[#231912]'
      }`}
    >
      <div className={`w-full min-h-screen ${viewTransitionClass}`}>
        {currentView === 'river' && (
          <Suspense fallback={<div className="w-screen h-dvh bg-[#0c7c94]" />}>
            <RiverCanvas
              myKrathongId={myKrathongId}
              justFloated={justFloated}
              enableRealtime={enableRealtime}
              externalPaused={showEvaluation}
              onNavigateCustomize={() => switchView('customize', 'to-customize')}
              onNavigateWishes={() => switchView('wishes', 'fade')}
              onNavigateAdmin={() => switchView('admin', 'fade')}
            />
          </Suspense>
        )}

        {currentView === 'customize' && (
          <KrathongCustomizer
            onBackToRiver={() => switchView('river', 'to-river')}
            onNavigateWishes={() => switchView('wishes', 'fade')}
            onSuccessFloating={handleSuccessFloating}
            isOverlayOpen={showEvaluation}
          />
        )}

        {currentView === 'wishes' && (
          <Suspense fallback={<div className="w-screen h-dvh bg-[#fdfaf4]" />}>
            <WishesGallery
              myKrathongId={myKrathongId}
              onNavigateRiver={() => switchView('river', 'fade')}
              onNavigateCustomize={() => switchView('customize', 'fade')}
            />
          </Suspense>
        )}

        {currentView === 'admin' && (
          <Suspense fallback={<div className="w-screen h-dvh bg-[#fdfaf4]" />}>
            <AdminDashboard
              onBackToRiver={() => switchView('river', 'fade')}
            />
          </Suspense>
        )}
      </div>

      {/* Evaluation Modal (เด้งขึ้นอัตโนมัติหลังชมแอนิเมชันกระทงลอยออกสู่สายน้ำเสร็จ) */}
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
