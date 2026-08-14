'use client';

import React, { useState, useEffect } from 'react';
import { Search, Building2, ShieldCheck, Clock, UserPlus } from 'lucide-react';

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
  totalEmployeesCount = 1500,
}) => {
  const [searchVal, setSearchVal] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('uz-UZ', {
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
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearchChange(e.target.value);
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 px-6 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Enterprise Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">MANUFACTURING ENTERPRISE HR</h1>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="mr-1 h-3 w-3" /> System v2.4 (Enterprise)
              </span>
            </div>
            <p className="text-xs text-slate-400">1500+ Xodimlar va Bo'limlarni Boshqarish Tizimi</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative max-w-md flex-1 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchVal}
              onChange={handleSearch}
              placeholder="Qidiruv: Tabel №, Ism, Bo'lim yoki Guvohnoma turi..."
              className="w-full rounded-xl bg-slate-900/80 border border-slate-700/60 py-2 pl-10 pr-12 text-sm text-slate-100 placeholder-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700">
              Ctrl K
            </kbd>
          </div>
        </div>

        {/* Action Controls & Live Clock */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-xs text-slate-300">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-mono text-slate-200">{currentTime || 'Yuklanmoqda...'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
