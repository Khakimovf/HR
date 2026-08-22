'use client';

import React, { useState, useEffect } from 'react';
import { Search, Building2, ShieldCheck, Clock, Sun, Moon, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Language } from '@/locales/i18n';

interface NavbarProps {
  onSearchChange: (query: string) => void;
  onOpenSingleModal?: () => void;
  activeTab: string;
  totalEmployeesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSearchChange,
  onOpenSingleModal,
  activeTab,
  totalEmployeesCount = 0,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [searchVal, setSearchVal] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const locale = language === 'kr' ? 'ko-KR' : 'uz-UZ';
      setCurrentTime(
        now.toLocaleDateString(locale, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [language]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearchChange(e.target.value);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
        {/* Brand & Enterprise Identity */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 shadow-sm">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight dark:text-white text-slate-900 leading-none">
                {t('app.title', 'MANUFACTURING ENTERPRISE HR')}
              </h1>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                <ShieldCheck className="mr-1 h-3 w-3" /> {t('app.system_version', 'System v2.4 (Enterprise)')}
              </span>
            </div>
            <p className="text-[11px] dark:text-slate-400 text-slate-500 font-medium">
              {totalEmployeesCount > 0
                ? (language === 'kr'
                  ? `임직원 ${totalEmployeesCount.toLocaleString()}명 · 부서 통합 관리`
                  : `${totalEmployeesCount.toLocaleString()} xodim · Bo'limlar boshqaruvi`)
                : t('app.subtitle', "Xodimlar va Bo'limlarni Boshqarish Tizimi")}
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative max-w-md flex-1 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 dark:text-slate-400 text-gray-400" />
            <input
              type="text"
              value={searchVal}
              onChange={handleSearch}
              placeholder={t('search.placeholder', "Qidiruv: Tabel №, Ism, Bo'lim yoki Guvohnoma turi...")}
              className="w-full h-8 rounded-lg dark:bg-slate-900/80 bg-slate-50 border dark:border-slate-700/60 border-slate-300 py-1 pl-9 pr-12 text-xs font-semibold dark:text-slate-100 text-slate-900 placeholder:dark:text-slate-400 placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded dark:bg-slate-800 bg-gray-200 px-1.5 py-0.5 text-[10px] font-mono dark:text-slate-400 text-gray-600 border dark:border-slate-700 border-gray-300">
              Ctrl K
            </kbd>
          </div>
        </div>

        {/* Top Right Controls & Switchers */}
        <div className="flex items-center gap-3">
          {/* Live Clock */}
          <div className="hidden lg:flex items-center gap-2 rounded-xl dark:bg-slate-900/80 bg-gray-100 border dark:border-slate-800 border-gray-300 px-3 py-1.5 text-xs text-slate-300">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-mono dark:text-slate-200 text-slate-700">{currentTime || '...'}</span>
          </div>

          {/* Theme Switcher Toggle: [🌙 Dark / ☀️ Light] */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? "Yorug' rejimga o'tish (Light Mode)" : "Qorong'u rejimga o'tish (Dark Mode)"}
            className="flex items-center gap-1.5 rounded-xl dark:bg-slate-900/80 bg-gray-100 border dark:border-slate-800 border-gray-300 px-3 py-1.5 text-xs font-semibold dark:text-slate-200 text-slate-800 hover:border-indigo-500 transition shadow-sm"
          >
            {theme === 'dark' ? (
              <>
                <Moon className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">🌙 Dark</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline">☀️ Light</span>
              </>
            )}
          </button>

          {/* Language Switcher Dropdown: [🇺🇿 O'zbekcha / 🇰🇷 한국어] */}
          <div className="relative flex items-center gap-1 rounded-xl dark:bg-slate-900/80 bg-gray-100 border dark:border-slate-800 border-gray-300 px-2 py-1 text-xs font-semibold shadow-sm">
            <Globe className="h-3.5 w-3.5 text-indigo-400 ml-1" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent dark:text-slate-200 text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer py-0.5 pr-1"
            >
              <option value="uz" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">
                🇺🇿 O'zbekcha
              </option>
              <option value="kr" className="dark:bg-slate-900 bg-white text-slate-900 dark:text-white">
                🇰🇷 한국어
              </option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
