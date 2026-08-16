'use client';

import React from 'react';
import {
  Wrench,
  Clock,
  ShieldCheck,
  RotateCcw,
  LayoutDashboard,
  AlertTriangle,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useModuleAccess } from '@/contexts/ModuleAccessContext';

interface MaintenanceOverlayProps {
  moduleKey: string;
  onNavigateHome?: () => void;
}

export const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({
  moduleKey,
  onNavigateHome,
}) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const { getModuleConfig } = useModuleAccess();

  const config = getModuleConfig(moduleKey);
  const moduleName = language === 'kr' ? config.name_kr : config.name_uz;
  const customMessage = language === 'kr' ? config.message_kr : config.message_uz;
  const isComingSoon = config.status === 'COMING_SOON';
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'EXECUTIVE_DIRECTOR';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-6 relative overflow-hidden">
        
        {/* Decorative Top Accent Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isComingSoon ? 'bg-blue-600' : 'bg-amber-500'}`} />

        {/* Animated Icon Circle */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full animate-ping opacity-25 ${isComingSoon ? 'bg-blue-500' : 'bg-amber-500'}`} />
          <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
            isComingSoon
              ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
          }`}>
            {isComingSoon ? (
              <Sparkles className="h-10 w-10 animate-pulse" />
            ) : (
              <Wrench className="h-10 w-10 animate-bounce" />
            )}
          </div>
        </div>

        {/* Module Name & Status Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Lock className="h-3.5 w-3.5 text-amber-500" />
            <span>{moduleName}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isComingSoon
              ? (language === 'kr' ? '출시 예정 모듈입니다' : "Tez Kunda Ishga Tushiriladi")
              : (language === 'kr' ? '시스템 점검 중입니다' : 'Texnik Profilaktika Rejimi')}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-md mx-auto">
            {customMessage}
          </p>
        </div>

        {/* Estimated Time Badge */}
        {config.estimated_completion && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 text-xs font-bold shadow-sm">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {language === 'kr' ? '완료 예정 시간: ' : 'Taxminiy yakunlanish vaqti: '}
              <strong className="font-mono">{config.estimated_completion}</strong>
            </span>
          </div>
        )}

        {/* Admin Bypass Warning Notice */}
        {isAdmin && (
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 text-left">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              {language === 'kr'
                ? '관리자 권한으로 로그인되었습니다. 테스트 모드로 접근 가능합니다.'
                : 'Siz Administrator sifatida kirgansiz. Modul test rejimida ko\'rib chiqish uchun ochiq.'}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{language === 'kr' ? '메인 대시보드로 이동' : 'Asosiy Dashboardga Qaytish'}</span>
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{language === 'kr' ? '새로고침' : 'Qayta Tekshirish'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
