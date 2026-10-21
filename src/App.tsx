// src/App.tsx
import React, { useState } from 'react';
import { RiverCanvas } from './components/RiverCanvas';
import { KrathongCustomizer } from './components/KrathongCustomizer';
import { EvaluationModal } from './components/EvaluationModal';
import { AdminDashboard } from './components/AdminDashboard';
import type { UserType } from './types';

export const App: React.FC = () => {
  // Navigation states: 'river' | 'customize' | 'admin'
  const [currentView, setCurrentView] = useState<'river' | 'customize' | 'admin'>('river');
  
  // Stored Krathong after submission
  const [myKrathongId, setMyKrathongId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<UserType>('general');
  const [showEvaluation, setShowEvaluation] = useState<boolean>(false);

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
    setCurrentView('river');
  };

  return (
    <main className="w-screen min-h-screen bg-slate-950 font-sans">
      {currentView === 'river' && (
        <RiverCanvas
          myKrathongId={myKrathongId}
          onNavigateCustomize={() => setCurrentView('customize')}
          onNavigateAdmin={() => setCurrentView('admin')}
        />
      )}

      {currentView === 'customize' && (
        <KrathongCustomizer
          onBackToRiver={() => setCurrentView('river')}
          onSuccessFloating={handleSuccessFloating}
        />
      )}

      {currentView === 'admin' && (
        <AdminDashboard
          onBackToRiver={() => setCurrentView('river')}
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
