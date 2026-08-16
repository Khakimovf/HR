'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Building2,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  Globe,
  LogOut,
  ChevronRight,
  User,
  Crown,
  Briefcase,
  Eye,
  Building,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Language } from '@/locales/i18n';

interface HeaderProps {
  activeTab: string;
  onSearchChange: (query: string) => void;
  onOpenSingleModal?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSearchChange,
  onOpenSingleModal,
  isSidebarCollapsed = false,
}) => {
  const { currentUser, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [searchVal, setSearchVal]     = useState('');
  const [isAnnounceOpen, setIsAnnounceOpen] = useState(false);

  const MODULE_TITLES: Record<string, { uz: string; kr: string; categoryUz: string; categoryKr: string }> = {
    dashboard:   { uz: 'Asosiy Dashboard Overview', kr: '메인 대시보드 종합', categoryUz: 'ASOSIY BOSHQARUV', categoryKr: '메인 관리' },
    analytics:   { uz: 'Rahbariyat Analitikasi', kr: '경영진 분석 대시보드', categoryUz: 'ASOSIY BOSHQARUV', categoryKr: '메인 관리' },
    workforce:   { uz: 'Xodimlar Bazasi va Registr', kr: '임직원 데이터베이스', categoryUz: 'KADRLAR VA HUJJATLAR', categoryKr: '인사 및 문서' },
    arizalar:    { uz: 'Arizalar & Hujjat Aylanishi', kr: '전자 결재 및 문서 승인', categoryUz: 'KADRLAR VA HUJJATLAR', categoryKr: '인사 및 문서' },
    departments: { uz: "Bo'limlar Ierarxiyasi", kr: '부서 조직도 및 구조', categoryUz: 'KADRLAR VA HUJJATLAR', categoryKr: '인사 및 문서' },
    transfers:   { uz: "Bo'limlararo Ko'chish Tarixi", kr: '부서 이동 및 전보 이력', categoryUz: 'KADRLAR VA HUJJATLAR', categoryKr: '인사 및 문서' },
    davomat:     { uz: "Davomat & Ta'tillar Boshqaruvi", kr: '근태 및 휴가 관리', categoryUz: 'MONITORING VA HSE', categoryKr: '모니터링 및 안전' },
    discipline:  { uz: 'Intizomiy Choralar va Mukofotlar', kr: '징계 및 포상/복지', categoryUz: 'MONITORING VA HSE', categoryKr: '모니터링 및 안전' },
    hse:         { uz: "Med-Ko'rik va Xavfsizlik (HSE)", kr: '보건 안전 (HSE System)', categoryUz: 'MONITORING VA HSE', categoryKr: '모니터링 및 안전' },
    kpi:         { uz: 'KPI & Samaradorlik Dvigateli', kr: 'KPI 성과 평가 엔진', categoryUz: 'SYSTEM & ENGINE', categoryKr: '시스템 및 엔진' },
    svodka:      { uz: 'Ijroiy Svodka va Analitik Hisobot', kr: '경영 현황 집계 리포트', categoryUz: 'SYSTEM & ENGINE', categoryKr: '시스템 및 엔진' },
    import:      { uz: 'Ommaviy Fayllarni Yuklash Hub', kr: '일괄 데이터 업로드 Hub', categoryUz: 'SYSTEM & ENGINE', categoryKr: '시스템 및 엔진' },
    audit:       { uz: 'Tizim Auditi va Loglar Center', kr: '시스템 감사 및 E-E\'lonlar', categoryUz: 'SYSTEM & ENGINE', categoryKr: '시스템 및 엔진' },
  };

  const currentModule = MODULE_TITLES[activeTab] || MODULE_TITLES.dashboard;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearchChange(e.target.value);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Breadcrumb & Current Module Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shrink-0">
            <Building2 className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>MANUFACTURING HR</span>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="text-blue-600 dark:text-blue-400 font-bold truncate">
                {language === 'kr' ? currentModule.categoryKr : currentModule.categoryUz}
              </span>
            </div>

            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate leading-tight">
              {language === 'kr' ? currentModule.kr : currentModule.uz}
            </h1>
          </div>
        </div>

        {/* Center: Global Search Input */}
        <div className="relative max-w-md flex-1 hidden md:block mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchVal}
              onChange={handleSearch}
              placeholder={t('search.placeholder', "Qidiruv: Tabel №, Ism, Bo'lim...")}
              className="w-full h-9 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 py-1 pl-9 pr-14 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Side: Controls & User Profile Cluster */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Switcher Pill */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setLanguage('uz')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                language === 'uz'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇺🇿</span> UZ
            </button>
            <button
              onClick={() => setLanguage('kr')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                language === 'kr'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇰🇷</span> KR
            </button>
          </div>

          {/* Dark/Light Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title={theme === 'dark' ? "Yorug' rejimga o'tish" : "Qorong'u rejimga o'tish"}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          {/* Announcements Bell */}
          <div className="relative">
            <button
              onClick={() => setIsAnnounceOpen(!isAnnounceOpen)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Tizim E'lonlari Markazi"
            >
              <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            </button>

            {/* Quick Announcement Popover */}
            {isAnnounceOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-blue-600" />
                    {language === 'kr' ? '시스템 공지사항' : "Tizim E'lonlari Markazi"}
                  </span>
                  <button onClick={() => setIsAnnounceOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-300">
                      <span>📢 System v2.4 Released</span>
                      <span className="text-[9px] text-blue-600 font-mono">Bugun</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      {language === 'kr' ? '새로운 6단계 전자 결재 라인 및 HSE 건강검진 모듈이 업데이트 되었습니다.' : "6-bosqichli avtomatik ariza tasdiqlash va HSE med-ko'rik dvigateli muvaffaqiyatli ishga tushirildi."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm shadow-sm shrink-0">
                {currentUser.fullName?.[0] || 'U'}
              </div>

              <div className="hidden lg:block text-left">
                <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate max-w-[130px]">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[130px]">
                  {currentUser.tabelNumber || currentUser.username}
                </div>
              </div>

              <button
                onClick={logout}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                title="Tizimdan chiqish"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
