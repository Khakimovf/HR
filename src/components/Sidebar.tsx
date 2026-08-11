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
  Settings,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  employeeCount?: number;
  activeDisciplineCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  employeeCount = 36,
  activeDisciplineCount = 6,
}) => {
  const navItems = [
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
  ];

  return (
    <aside className="w-64 shrink-0 glass-panel border-r border-slate-800/80 p-4 flex flex-col justify-between min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        <div>
          <h2 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            ASOSIY MODULLAR
          </h2>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
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
              <span>Ta'tildagilar (M/T, B/S):</span>
              <span className="font-semibold text-amber-400">42 kishi</span>
            </div>
            <div className="flex justify-between">
              <span>Kasallik varaqasi (B/L):</span>
              <span className="font-semibold text-rose-400">14 kishi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          <span>Ish tartibi: 24/7 Smena</span>
        </div>
        <p className="mt-1">Toshkent Sanoat Zonasi #4</p>
      </div>
    </aside>
  );
};
