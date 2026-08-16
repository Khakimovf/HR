'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModuleAccess } from '@/contexts/ModuleAccessContext';
import { MaintenanceOverlay } from './MaintenanceOverlay';

interface MaintenanceGuardProps {
  moduleKey: string;
  children: React.ReactNode;
  onNavigateHome?: () => void;
}

export const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({
  moduleKey,
  children,
  onNavigateHome,
}) => {
  const { getModuleConfig } = useModuleAccess();
  const { currentUser } = useAuth();
  const { language } = useLanguage();

  const config = getModuleConfig(moduleKey);
  const isMaintenance = config.status === 'MAINTENANCE' || config.status === 'COMING_SOON';
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // 1. NON-ADMIN LOCK: Completely replace page view with MaintenanceOverlay
  if (isMaintenance && !isSuperAdmin) {
    return (
      <MaintenanceOverlay
        moduleKey={moduleKey}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  // 2. SUPER-ADMIN TEST MODE: Render Test Warning Banner + Page Content
  if (isMaintenance && isSuperAdmin) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-500/10 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-500/30 dark:border-amber-700/50 p-3 text-xs font-bold flex items-center justify-between rounded-xl shadow-sm transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-sm shrink-0">⚠️</span>
            <span>
              {language === 'kr'
                ? '주의: 본 모듈은 일반 사용자에게 비활성화되어 있습니다 (점검 중). Super Admin 권한으로 테스트 모드에서 확인 중입니다.'
                : 'DIQQAT: Ushbu modul oddiy foydalanuvchilar uchun yopilgan (Texnik xizmat rejimida). Siz Super Admin bo\'lganingiz uchun modul sizga test rejimida ko\'rinmoqda.'}
            </span>
          </div>
          <span className="bg-amber-500 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase animate-pulse shrink-0 border border-amber-400 shadow-sm ml-3">
            🔒 TEST MODE ACTIVE
          </span>
        </div>
        {children}
      </div>
    );
  }

  // 3. NORMAL ACTIVE STATUS
  return <>{children}</>;
};
