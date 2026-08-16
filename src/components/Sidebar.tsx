'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  GitFork,
  Calculator,
  FileBarChart,
  ArrowLeftRight,
  ShieldAlert,
  Award,
  CalendarDays,
  CalendarClock,
  HeartPulse,
  ClipboardList,
  LogOut,
  Crown,
  Lock,
  FileCheck,
  TrendingUp,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModuleAccess } from '@/contexts/ModuleAccessContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  employeeCount?: number;
  activeDisciplineCount?: number;
  activeLeaveCount?: number;
  hseAlertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  employeeCount = 1520,
  activeDisciplineCount = 6,
  activeLeaveCount = 0,
  hseAlertCount = 0,
}) => {
  const { currentUser, logout, hasModuleAccess } = useAuth();
  const { t } = useLanguage();

  const mainNavItems = [
    {
      id: 'dashboard',
      label: t('nav.dashboard', 'Asosiy Dashboard'),
      icon: LayoutDashboard,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'workforce',
      label: t('nav.workforce', 'Xodimlar Bazasi'),
      icon: Users,
      badge: employeeCount,
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      id: 'kpi',
      label: t('nav.kpi', 'KPI & Mukofot Dvigateli'),
      icon: Calculator,
      badge: 'Avto',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'analytics',
      label: t('nav.analytics', 'Rahbariyat Analitikasi'),
      icon: TrendingUp,
      badge: '2K+ Cache',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      id: 'arizalar',
      label: t('nav.arizalar', 'Arizalar & Hujjat Aylanishi'),
      icon: FileCheck,
      badge: '6-Bosqich',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
    {
      id: 'departments',
      label: t('nav.departments', "Bo'limlar Ierarxiyasi"),
      icon: GitFork,
    },
    {
      id: 'svodka',
      label: t('nav.svodka', 'Ijroiy Svodka & Hisobot'),
      icon: FileBarChart,
      badge: 'PDF/Excel',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      id: 'transfers',
      label: t('nav.transfers', "Bo'limlararo Ko'chish"),
      icon: ArrowLeftRight,
    },
    {
      id: 'discipline',
      label: t('nav.discipline', 'Intizom & Mukofotlar'),
      icon: ShieldAlert,
      badge: activeDisciplineCount,
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    {
      id: 'davomat',
      label: t('nav.davomat', "Davomat & Ta'tillar"),
      icon: CalendarClock,
      badge: activeLeaveCount > 0 ? activeLeaveCount : undefined,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      id: 'hse',
      label: t('nav.hse', "Med-Ko'rik va Xavfsizlik"),
      icon: HeartPulse,
      badge: hseAlertCount > 0 ? hseAlertCount : undefined,
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
  ];

  // Import Hub item positioned directly ABOVE Audit
  const importNavItem = {
    id: 'import',
    label: t('nav.import', 'Ommaviy Fayllarni Yuklash'),
    icon: UploadCloud,
    badge: 'Excel/CSV',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  // Audit log goes at the VERY BOTTOM
  const bottomNavItem = {
    id: 'audit',
    label: t('nav.audit', 'Tizim Auditi va Loglar'),
    icon: ClipboardList,
    badgeColor: 'bg-slate-700 text-slate-400 border-slate-600',
  };

  const NavButton = ({ item }: { item: any }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isAllowed = hasModuleAccess(item.id);
    const { getModuleConfig } = useModuleAccess();
    const config = getModuleConfig(item.id);

    const isMaintenance = config.status === 'MAINTENANCE';
    const isComingSoon = config.status === 'COMING_SOON';

    return (
      <button
        key={item.id}
        onClick={() => isAllowed && setActiveTab(item.id)}
        disabled={!isAllowed}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer group ${
          !isAllowed
            ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
            : isMaintenance || isComingSoon
            ? 'opacity-85'
            : ''
        } ${
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Icon
            className={`h-4 w-4 shrink-0 ${
              !isAllowed
                ? 'text-slate-400 dark:text-slate-600'
                : isActive
                ? 'text-white'
                : isMaintenance
                ? 'text-amber-500'
                : isComingSoon
                ? 'text-blue-500'
                : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
            }`}
          />
          <span className="truncate">{item.label}</span>
        </div>
        {!isAllowed ? (
          <Lock className="h-3 w-3 text-slate-400 dark:text-slate-600 shrink-0" />
        ) : isMaintenance ? (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
            🔒 Texnik xizmat
          </span>
        ) : isComingSoon ? (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
            ⏳ Tez kunda
          </span>
        ) : item.badge !== undefined ? (
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold border shrink-0 ${
              isActive
                ? 'bg-white/20 text-white border-white/30'
                : item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {item.badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <aside className="w-60 shrink-0 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-3 flex flex-col min-h-[calc(100vh-57px)] transition-colors">
      {/* Top: main nav */}
      <div className="space-y-4 flex-1">
        <div>
          <h2 className="px-2.5 text-[10px] font-bold uppercase tracking-wider dark:text-slate-400 text-slate-500">
            {t('section.main_modules', 'ASOSIY MODULLAR')}
          </h2>
          <nav className="mt-1.5 space-y-0.5">
            {mainNavItems.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </nav>
        </div>

        {/* Enterprise Quick Metrics Panel */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/80 p-3 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-semibold dark:text-slate-200 text-slate-800">
              {t('section.quick_metrics', "Sanoat Ko'rsatkichlari")}
            </h3>
          </div>
          <div className="space-y-2 text-[11px] dark:text-slate-400 text-gray-600">
            <div className="flex justify-between">
              <span>{t('kpi.active_staff', 'Faol Shtat')}:</span>
              <span className="font-semibold text-emerald-500">1,520 kishi</span>
            </div>
            <div className="flex justify-between">
              <span>{t('kpi.annual_leave', 'Ta\'tildagilar')}:</span>
              <span className="font-semibold text-amber-500">{activeLeaveCount || 42} kishi</span>
            </div>
            <div className="flex justify-between">
              <span>Ko'rik Ogohlantirishlari:</span>
              <span
                className={`font-semibold ${hseAlertCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}
              >
                {hseAlertCount > 0 ? `${hseAlertCount} ta` : 'Hammasi yaxshi'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Current User chip + Import Hub + Audit + logout */}
      <div className="space-y-2 border-t dark:border-slate-800 border-gray-200 pt-3">
        {/* Standalone Import Hub directly ABOVE Tizim Auditi va Loglar */}
        <NavButton item={importNavItem} />

        {/* Audit at very bottom of nav tree */}
        <NavButton item={bottomNavItem} />

        {/* Current user chip */}
        {currentUser && (
          <div className="rounded-xl dark:bg-slate-900/80 bg-gray-100 border dark:border-slate-800 border-gray-300 px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {currentUser.fullName?.[0] || '?'}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold dark:text-white text-slate-900 truncate">
                  {currentUser.fullName}
                </div>
                <div className="flex items-center gap-1">
                  {currentUser.role === 'SUPER_ADMIN' && <Crown className="h-2.5 w-2.5 text-amber-400" />}
                  <span className="text-[10px] dark:text-slate-500 text-gray-500 truncate">
                    {currentUser.role === 'SUPER_ADMIN'
                      ? 'Super Admin'
                      : currentUser.role === 'EXECUTIVE_DIRECTOR'
                      ? 'Bosh Direktor'
                      : currentUser.role === 'AUDITOR'
                      ? 'Auditor'
                      : 'HR Xodimi'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Chiqish"
              className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="text-[11px] dark:text-slate-500 text-gray-500 px-1 flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          <span>Toshkent Sanoat Zonasi #4</span>
        </div>
      </div>
    </aside>
  );
};
