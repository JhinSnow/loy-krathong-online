// src/App.tsx
import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { KrathongCustomizer } from './components/KrathongCustomizer';
import {
  RiverCanvas,
  type CraftDesignState,
  type LaunchEvent
} from './components/RiverCanvas';
import { hasCompletedEvaluationOnDevice } from './utils/evaluationHelpers';
import { soundManager } from './utils/soundEffects';
import type { KrathongItem, UserType } from './types';

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

  // Navigation states: 'river' | 'customize' | 'wishes' | 'admin'
  const [currentView, setCurrentView] = useState<AppView>(initialView);
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Shared 3D craft design & launch event driving the persistent RiverCanvas
  const [craftDesign, setCraftDesign] = useState<CraftDesignState>({
    baseType: 'banana_leaf',
    flowerType: 'lotus_flower',
    candleColor: 'yellow',
    pulseNonce: 0,
    cameraPreset: 'angled'
  });
  const [launchEvent, setLaunchEvent] = useState<LaunchEvent | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(() =>
    soundManager.isAudioEnabled()
  );
  const [customizerModalOpen, setCustomizerModalOpen] = useState<boolean>(false);

  // Stored Krathong after submission
  const [myKrathongId, setMyKrathongId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<UserType>('general');
  const [showEvaluation, setShowEvaluation] = useState<boolean>(false);

  const evalPopupTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopViewport(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    // Preload EvaluationModal & WishesGallery quietly after initial paint
    const preloadTimer = window.setTimeout(() => {
      import('./components/EvaluationModal').catch(() => {});
      import('./components/WishesGallery').catch(() => {});
    }, 500);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.clearTimeout(preloadTimer);
      if (evalPopupTimerRef.current) window.clearTimeout(evalPopupTimerRef.current);
    };
  }, []);

  // เปิด WebSocket Realtime เฉพาะโหมดจอเวที/โปรเจกเตอร์ (?mode=stage หรือหน้าจอขนาด >= 1024px ที่ไม่ได้เข้าผ่านโหมดผู้ร่วมงาน)
  // เพื่อประหยัด Concurrent Connections บนแผน Free เมื่อมีผู้ร่วมงาน 1,300+ คนสแกน QR จากมือถือ
  const enableRealtime = forcedMode === 'stage' || (forcedMode === 'auto' && isDesktopViewport);

  const handleToggleAudio = useCallback(() => {
    setIsAudioPlaying(soundManager.toggleAudio());
  }, []);

  const handleToggleCameraPreset = useCallback(() => {
    setCraftDesign((prev) => ({
      ...prev,
      cameraPreset: prev.cameraPreset === 'angled' ? 'top' : 'angled'
    }));
  }, []);

  const handleDesignChange = useCallback((next: CraftDesignState) => {
    setCraftDesign((prev) =>
      prev.baseType === next.baseType &&
      prev.flowerType === next.flowerType &&
      prev.candleColor === next.candleColor &&
      prev.pulseNonce === next.pulseNonce &&
      prev.cameraPreset === next.cameraPreset
        ? prev
        : next
    );
  }, []);

  const navigateToRiver = useCallback(() => {
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
  }, []);

  const navigateToCustomize = useCallback(() => {
    if (evalPopupTimerRef.current) {
      window.clearTimeout(evalPopupTimerRef.current);
      evalPopupTimerRef.current = null;
    }
    setCurrentView('customize');
  }, []);

  // เมื่อผู้ใช้กด "ปล่อยกระทงลงน้ำ" สำเร็จ -> สไลด์แผงแต่งออกแล้วซูมกล้อง 3D ถอยออกต่อเนื่องสู่สายน้ำ จากนั้นค่อยเปิดแบบประเมิน
  const handleSuccessFloating = useCallback(
    (krathongId: string, userType: UserType, createdItem: KrathongItem) => {
      setMyKrathongId(krathongId);
      setCurrentUserType(userType);
      setShowEvaluation(false);
      if (evalPopupTimerRef.current) {
        window.clearTimeout(evalPopupTimerRef.current);
        evalPopupTimerRef.current = null;
      }
      setLaunchEvent({ nonce: Date.now(), item: createdItem });
      navigateToRiver();

      if (!hasCompletedEvaluationOnDevice()) {
        evalPopupTimerRef.current = window.setTimeout(() => {
          setShowEvaluation(true);
          evalPopupTimerRef.current = null;
        }, 2300);
      }
    },
    [navigateToRiver]
  );

  // เมื่อส่งแบบประเมินเสร็จ -> ปิดหน้าต่าง (ผู้ใช้อยู่บนหน้าแม่น้ำหลักแล้ว)
  const handleEvaluationFinish = useCallback(() => {
    setShowEvaluation(false);
    setCurrentView((prev) => (prev !== 'river' ? 'river' : prev));
  }, []);

  const isRiverOrCustomize = currentView === 'river' || currentView === 'customize';

  return (
    <main
      className={`w-screen min-h-screen font-sans overflow-x-hidden ${
        isRiverOrCustomize ? 'bg-[#0c7c94] text-[#231912]' : 'bg-[#fdfaf4] text-[#231912]'
      }`}
    >
      {isRiverOrCustomize && (
        <>
          <RiverCanvas
            mode={currentView === 'customize' ? 'customize' : 'river'}
            craftDesign={craftDesign}
            launchEvent={launchEvent}
            myKrathongId={myKrathongId}
            enableRealtime={enableRealtime}
            externalPaused={showEvaluation || customizerModalOpen}
            isAudioPlaying={isAudioPlaying}
            onToggleAudio={handleToggleAudio}
            onNavigateCustomize={navigateToCustomize}
            onNavigateWishes={() => setCurrentView('wishes')}
            onNavigateAdmin={() => setCurrentView('admin')}
          />

          <KrathongCustomizer
            isOpen={currentView === 'customize'}
            cameraPreset={craftDesign.cameraPreset}
            onToggleCameraPreset={handleToggleCameraPreset}
            onDesignChange={handleDesignChange}
            isAudioPlaying={isAudioPlaying}
            onToggleAudio={handleToggleAudio}
            onBackToRiver={navigateToRiver}
            onNavigateWishes={() => setCurrentView('wishes')}
            onSuccessFloating={handleSuccessFloating}
            onModalOpenChange={setCustomizerModalOpen}
          />
        </>
      )}

      {currentView === 'wishes' && (
        <Suspense fallback={<div className="w-screen h-dvh bg-[#fdfaf4]" />}>
          <div className="w-full min-h-screen animate-ui-fade">
            <WishesGallery
              myKrathongId={myKrathongId}
              onNavigateRiver={navigateToRiver}
              onNavigateCustomize={navigateToCustomize}
            />
          </div>
        </Suspense>
      )}

      {currentView === 'admin' && (
        <Suspense fallback={<div className="w-screen h-dvh bg-[#fdfaf4]" />}>
          <div className="w-full min-h-screen animate-ui-fade">
            <AdminDashboard onBackToRiver={navigateToRiver} />
          </div>
        </Suspense>
      )}

      {/* Evaluation Modal (เด้งขึ้นอัตโนมัติหลังชมแอนิเมชันซูมถอยออกปล่อยกระทงเสร็จ) */}
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
