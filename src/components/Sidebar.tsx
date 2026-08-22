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
  CalendarClock,
  HeartPulse,
  ClipboardList,
  FileCheck,
  TrendingUp,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Lock,
  Clock,
  Crown,
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
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  employeeCount = 0,
  activeDisciplineCount = 0,
  activeLeaveCount = 0,
  hseAlertCount = 0,
  isCollapsed = false,
  setIsCollapsed,
}) => {
  const { currentUser, hasModuleAccess } = useAuth();
  const { t, language } = useLanguage();
  const { getModuleConfig } = useModuleAccess();

  const menuGroups = [
    {
      groupKey: 'MAIN',
      titleUz: 'ASOSIY BOSHQARUV',
      titleKr: '메인 관리',
      items: [
        {
          id: 'dashboard',
          label: t('nav.dashboard', 'Asosiy Dashboard'),
          icon: LayoutDashboard,
          badge: 'LIVE',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        },
        {
          id: 'analytics',
          label: t('nav.analytics', 'Rahbariyat Analitikasi'),
          icon: TrendingUp,
          badge: '2K+ Cache',
          badgeColor: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
        },
      ],
    },
    {
      groupKey: 'HR_DOCS',
      titleUz: 'KADRLAR VA HUJJATLAR',
      titleKr: '인사 및 문서 관리',
      items: [
        {
          id: 'workforce',
          label: t('nav.workforce', 'Xodimlar Bazasi'),
          icon: Users,
          badge: employeeCount,
          badgeColor: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
        },
        {
          id: 'arizalar',
          label: t('nav.arizalar', 'Arizalar & Hujjatlar'),
          icon: FileCheck,
          badge: '6-Bosqich',
          badgeColor: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
        },
        {
          id: 'departments',
          label: t('nav.departments', "Bo'limlar Ierarxiyasi"),
          icon: GitFork,
        },
        {
          id: 'transfers',
          label: t('nav.transfers', "Ko'chish Tarixi"),
          icon: ArrowLeftRight,
        },
      ],
    },
    {
      groupKey: 'SAFETY',
      titleUz: 'MONITORING VA HSE',
      titleKr: '근태 및 보건 안전',
      items: [
        {
          id: 'davomat',
          label: t('nav.davomat', "Davomat & Ta'tillar"),
          icon: CalendarClock,
          badge: activeLeaveCount > 0 ? activeLeaveCount : undefined,
          badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        },
        {
          id: 'discipline',
          label: t('nav.discipline', 'Intizom & Mukofotlar'),
          icon: ShieldAlert,
          badge: activeDisciplineCount,
          badgeColor: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        },
        {
          id: 'hse',
          label: t('nav.hse', "Med-Ko'rik & Xavfsizlik"),
          icon: HeartPulse,
          badge: hseAlertCount > 0 ? hseAlertCount : undefined,
          badgeColor: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        },
      ],
    },
    {
      groupKey: 'SYSTEM',
      titleUz: 'SYSTEM & ENGINE',
      titleKr: '시스템 및 엔진',
      items: [
        {
          id: 'kpi',
          label: t('nav.kpi', 'KPI & Samaradorlik'),
          icon: Calculator,
          badge: 'Avto',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        },
        {
          id: 'svodka',
          label: t('nav.svodka', 'Ijroiy Svodka'),
          icon: FileBarChart,
          badge: 'Excel',
          badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        },
        {
          id: 'import',
          label: t('nav.import', 'Ommaviy Fayllarni Yuklash'),
          icon: UploadCloud,
          badge: 'CSV',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        },
        {
          id: 'audit',
          label: t('nav.audit', 'Tizim Auditi & Loglar'),
          icon: ClipboardList,
        },
      ],
    },
  ];

  const NavButton = ({ item }: { item: any }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isAllowed = hasModuleAccess(item.id);
    const config = getModuleConfig(item.id);

    const isMaintenance = config.status === 'MAINTENANCE';
    const isComingSoon = config.status === 'COMING_SOON';

    return (
      <button
        onClick={() => setActiveTab(item.id)}
        title={isCollapsed ? `${item.label} ${isMaintenance ? '(Texnik xizmatda)' : ''}` : undefined}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer select-none text-xs font-semibold ${
          isCollapsed ? 'justify-center px-0' : ''
        } ${
          isActive
            ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25 ring-1 ring-blue-500'
            : isMaintenance
            ? 'bg-slate-800/40 text-amber-400/80 hover:bg-slate-800 hover:text-amber-300'
            : isComingSoon
            ? 'bg-slate-800/40 text-blue-400/80 hover:bg-slate-800 hover:text-blue-300'
            : isAllowed
            ? 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
            : 'text-slate-600 hover:bg-slate-800/40 hover:text-slate-400'
        }`}
      >
        <div className="relative shrink-0 flex items-center justify-center">
          <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
          {isMaintenance && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse" />
          )}
        </div>

        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0 text-left">
            <span className="truncate">{item.label}</span>

            {/* Maintenance Lock Indicator */}
            {isMaintenance ? (
              <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                <Lock className="h-2.5 w-2.5 text-amber-400" />
                <span>Texnik xizmat</span>
              </span>
            ) : isComingSoon ? (
              <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                <Clock className="h-2.5 w-2.5 text-blue-400" />
                <span>Tez kunda</span>
              </span>
            ) : item.badge ? (
              <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${item.badgeColor}`}>
                {item.badge}
              </span>
            ) : null}
          </div>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800/80 text-slate-300 flex flex-col justify-between transition-all duration-300 shrink-0 z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Upper Navigation Sections */}
      <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-65px)]">
        {menuGroups.map((group) => (
          <div key={group.groupKey} className="space-y-1.5">
            {/* Subtle Group Header Label */}
            {!isCollapsed ? (
              <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'kr' ? group.titleKr : group.titleUz}
              </div>
            ) : (
              <div className="h-px bg-slate-800 mx-2 my-2" />
            )}

            <div className="space-y-1">
              {group.items.map((item) => (
                <NavButton key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Collapsible Mini-Mode Toggle */}
      {setIsCollapsed && (
        <div className="p-3 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer text-xs font-semibold"
            title={isCollapsed ? "Menyuni kengaytirish" : "Menyuni yig'ish"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-blue-400" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 text-blue-400" />
                <span className="text-[11px] font-bold text-slate-300">Yig'ish / Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
};
