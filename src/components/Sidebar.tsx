'use client';

import React from 'react';
import {
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
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
  employeeCount = 36,
  activeDisciplineCount = 6,
  activeLeaveCount = 0,
  hseAlertCount = 0,
}) => {
  const { currentUser, logout, hasModuleAccess } = useAuth();

  const mainNavItems = [
    {
      id: 'workforce',
      label: 'Xodimlar Baza',
      icon: Users,
      badge: employeeCount,
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      id: 'departments',
      label: 'Bo\'limlar Ierarxiyasi',
      icon: GitFork,
    },
    {
      id: 'arizalar',
      label: 'Arizalar & Hujjat Aylanishi',
      icon: FileCheck,
      badge: '6-Bosqich',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
    {
      id: 'kpi',
      label: 'KPI & Mukofot Dvigateli',
      icon: Calculator,
      badge: 'Avto',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'svodka',
      label: 'Ijroiy Svodka & Hisobot',
      icon: FileBarChart,
      badge: 'PDF/Excel',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      id: 'transfers',
      label: 'Bo\'limlararo Ko\'chish',
      icon: ArrowLeftRight,
    },
    {
      id: 'discipline',
      label: 'Intizom & Mukofotlar',
      icon: ShieldAlert,
      badge: activeDisciplineCount,
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    {
      id: 'davomat',
      label: "Davomat & Ta'tillar",
      icon: CalendarClock,
      badge: activeLeaveCount > 0 ? activeLeaveCount : undefined,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      id: 'hse',
      label: "Med-Ko'rik va Xavfsizlik",
      icon: HeartPulse,
      badge: hseAlertCount > 0 ? hseAlertCount : undefined,
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
  ];

  // Import Hub item positioned directly ABOVE Audit
  const importNavItem = {
    id: 'import',
    label: 'Ommaviy Fayllarni Yuklash',
    icon: UploadCloud,
    badge: 'Excel/CSV',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  // Audit log goes at the VERY BOTTOM
  const bottomNavItem = {
    id: 'audit',
    label: 'Tizim Auditi va Loglar',
    icon: ClipboardList,
    badgeColor: 'bg-slate-700 text-slate-400 border-slate-600',
  };

  const NavButton = ({ item }: { item: any }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isAllowed = hasModuleAccess(item.id);

    return (
      <button
        key={item.id}
        onClick={() => {
          if (isAllowed) setActiveTab(item.id);
        }}
        disabled={!isAllowed}
        title={!isAllowed ? "🔒 Ushbu menyu moduliga ruxsat berilmagan" : item.label}
        className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
          !isAllowed
            ? 'opacity-40 cursor-not-allowed text-slate-500 hover:bg-transparent'
            : isActive
            ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20 font-semibold'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`h-4 w-4 ${!isAllowed ? 'text-slate-600' : isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
          <span className="truncate">{item.label}</span>
        </div>
        {!isAllowed ? (
          <Lock className="h-3 w-3 text-slate-600 shrink-0" />
        ) : item.badge !== undefined ? (
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${
              isActive
                ? 'bg-white/20 text-white border-white/30'
                : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {item.badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <aside className="w-64 shrink-0 glass-panel border-r border-slate-800/80 p-4 flex flex-col min-h-[calc(100vh-65px)]">
      {/* Top: main nav */}
      <div className="space-y-6 flex-1">
        <div>
          <h2 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            ASOSIY MODULLAR
          </h2>
          <nav className="mt-2 space-y-1">
            {mainNavItems.map((item) => <NavButton key={item.id} item={item} />)}
          </nav>
        </div>

        {/* Enterprise Quick Metrics Panel */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-slate-200">Sanoat Ko'rsatkichlari</h3>
          </div>
          <div className="space-y-2 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Faol Shtat:</span>
              <span className="font-semibold text-emerald-400">1,520 kishi</span>
            </div>
            <div className="flex justify-between">
              <span>Ta'tildagilar:</span>
              <span className="font-semibold text-amber-400">{activeLeaveCount || 42} kishi</span>
            </div>
            <div className="flex justify-between">
              <span>Ko'rik Ogohlantirishlari:</span>
              <span className={`font-semibold ${hseAlertCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {hseAlertCount > 0 ? `${hseAlertCount} ta` : 'Hammasi yaxshi'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Current User chip + Import Hub + Audit + logout */}
      <div className="space-y-2 border-t border-slate-800 pt-3">
        {/* Standalone Import Hub directly ABOVE Tizim Auditi va Loglar */}
        <NavButton item={importNavItem} />

        {/* Audit at very bottom of nav tree */}
        <NavButton item={bottomNavItem} />

        {/* Current user chip */}
        {currentUser && (
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {currentUser.fullName?.[0] || '?'}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">{currentUser.fullName}</div>
                <div className="flex items-center gap-1">
                  {currentUser.role === 'SUPER_ADMIN' && <Crown className="h-2.5 w-2.5 text-amber-400" />}
                  <span className="text-[10px] text-slate-500 truncate">
                    {currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : currentUser.role === 'EXECUTIVE_DIRECTOR' ? 'Bosh Direktor' : currentUser.role === 'AUDITOR' ? 'Auditor' : 'HR Xodimi'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Chiqish"
              className="shrink-0 rounded-lg p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="text-[11px] text-slate-500 px-1 flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          <span>Toshkent Sanoat Zonasi #4</span>
        </div>
      </div>
    </aside>
  );
};
