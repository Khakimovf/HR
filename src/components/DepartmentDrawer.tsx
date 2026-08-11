'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  Building2,
  Users,
  UserCheck,
  UserMinus,
  ShieldAlert,
  Phone,
  Mail,
  ArrowRight,
  Loader2,
  BarChart3,
  ChevronRight,
  Hash,
  GitBranch,
  TrendingUp,
} from 'lucide-react';

interface DeptStats {
  totalEmployees: number;
  activeCount: number;
  onLeaveCount: number;
  leaveByType: {
    MT: number;
    BS: number;
    BL: number;
    STUDY_LEAVE: number;
    MILITARY_DUTY: number;
  };
  activePenalties: number;
  department: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    parent?: { id: string; name: string; code: string } | null;
    _count: { employees: number };
  } | null;
}

interface DrawerDepartment {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  headName?: string | null;
  staffLimit?: number | null;
  _count?: { employees: number };
}

interface DepartmentDrawerProps {
  department: DrawerDepartment | null;
  isOpen: boolean;
  onClose: () => void;
  onViewEmployees: (deptId: string, deptName: string) => void;
}

// Simulated dept heads for demo (in real app this would come from DB)
const DEPT_HEADS: Record<string, { name: string; phone: string; email: string }> = {
  'DIR-01': { name: 'Abdullayev Sherzod N.', phone: '+998 71 234-56-78', email: 's.abdullayev@enterprise.uz' },
  'LOG-01': { name: 'Tursunov Bobur K.', phone: '+998 90 123-45-67', email: 'b.tursunov@enterprise.uz' },
  'QC-01': { name: 'Nazarova Dilnoza R.', phone: '+998 93 321-54-76', email: 'd.nazarova@enterprise.uz' },
  'HR-01': { name: 'Karimov Mansur O.', phone: '+998 97 456-78-90', email: 'm.karimov@enterprise.uz' },
  'FIN-01': { name: 'Yusupova Malika T.', phone: '+998 94 567-89-01', email: 'm.yusupova@enterprise.uz' },
};

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
  icon: React.ElementType;
}) {
  const colors = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    slate: 'bg-slate-800 border-slate-700 text-slate-400',
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${colors[color]}`}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-medium opacity-70 truncate">{label}</p>
        <p className="text-base font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

export const DepartmentDrawer: React.FC<DepartmentDrawerProps> = ({
  department,
  isOpen,
  onClose,
  onViewEmployees,
}) => {
  const [stats, setStats] = useState<DeptStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async (deptId: string) => {
    setLoading(true);
    setStats(null);
    try {
      const res = await fetch(`/api/departments/${deptId}/stats`);
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch {
      // silently fail — show skeleton
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && department?.id) {
      fetchStats(department.id);
    }
  }, [isOpen, department?.id, fetchStats]);

  // Simulated dept head lookup
  const headInfo = department?.headName
    ? null // if real headName prop is provided use it
    : DEPT_HEADS[department?.code || ''] || null;

  const headName = department?.headName || headInfo?.name || null;
  const headPhone = headInfo?.phone || null;
  const headEmail = headInfo?.email || null;

  const empCount = stats?.totalEmployees ?? department?._count?.employees ?? 0;
  const staffLimit = department?.staffLimit ?? Math.ceil(empCount * 1.12) + 2;
  const vacancyCount = Math.max(0, staffLimit - empCount);
  const isFull = vacancyCount === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-[480px] flex flex-col border-l border-slate-800 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'linear-gradient(180deg, #0f1526 0%, #111827 100%)' }}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-slate-800 px-5 py-4 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 flex-shrink-0 mt-0.5">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-snug">
                {department?.name || 'Bo\'lim'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/15">
                  {department?.code}
                </span>
                {isFull ? (
                  <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    ● To'liq
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ● {vacancyCount} vakansiya
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Section 1: Department Info ── */}
          <section className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Hash className="h-3 w-3" /> Bo'lim Ma'lumoti
            </h3>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800 text-xs">
              <InfoRow label="Nomi" value={department?.name || '—'} />
              <InfoRow label="Kodi" value={<span className="font-mono text-indigo-300">{department?.code || '—'}</span>} />
              {stats?.department?.parent && (
                <InfoRow
                  label="Yuqori bo'lim"
                  value={
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3 text-purple-400" />
                      <span className="text-purple-300">{stats.department.parent.name}</span>
                      <span className="font-mono text-slate-500 text-[10px]">[{stats.department.parent.code}]</span>
                    </span>
                  }
                />
              )}
              {department?.description && (
                <InfoRow label="Tavsif" value={department.description} />
              )}
              <InfoRow
                label="Shtat holati"
                value={
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-white">{empCount}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-400">{staffLimit} shtat</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${isFull ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                      {isFull ? 'To\'liq' : `+${vacancyCount} bo'sh`}
                    </span>
                  </span>
                }
              />
            </div>
          </section>

          {/* ── Section 2: Head of Department ── */}
          <section className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <UserCheck className="h-3 w-3" /> Bo'lim Boshlig'i
            </h3>
            {headName ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white text-xs font-bold flex-shrink-0">
                    {headName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{headName}</p>
                    <p className="text-[11px] text-slate-400">Bo'lim Boshlig'i</p>
                  </div>
                </div>
                {(headPhone || headEmail) && (
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    {headPhone && (
                      <a href={`tel:${headPhone}`} className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-indigo-300 transition">
                        <Phone className="h-3 w-3" /> {headPhone}
                      </a>
                    )}
                    {headEmail && (
                      <a href={`mailto:${headEmail}`} className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-indigo-300 transition truncate">
                        <Mail className="h-3 w-3" /> {headEmail}
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-4 py-3 text-[11px] text-slate-500 text-center">
                Bo'lim boshlig'i tayinlanmagan
              </div>
            )}
          </section>

          {/* ── Section 3: Attendance Stats ── */}
          <section className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3" /> Real-Vaqt Davomat Statistikasi
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-500 text-xs gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                Statistika yuklanmoqda...
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Faol ishchilar" value={stats.activeCount} color="emerald" icon={UserCheck} />
                <StatCard label="Ta'tilda" value={stats.onLeaveCount} color="amber" icon={UserMinus} />
                <StatCard label="MT (Mehnat ta'tili)" value={stats.leaveByType.MT} color="purple" icon={TrendingUp} />
                <StatCard label="BS (Bola parvarishi)" value={stats.leaveByType.BS} color="indigo" icon={Users} />
                <StatCard label="BL (Betob)" value={stats.leaveByType.BL} color="rose" icon={UserMinus} />
                <StatCard label="O'quv ta'tili" value={stats.leaveByType.STUDY_LEAVE} color="slate" icon={TrendingUp} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 opacity-40">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-slate-800 animate-pulse" />
                ))}
              </div>
            )}
          </section>

          {/* ── Section 4: Penalties ── */}
          <section className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="h-3 w-3" /> Intizomiy Holat
            </h3>
            <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${
              !stats ? 'border-slate-800 bg-slate-900/40' :
              stats.activePenalties > 0
                ? 'border-rose-500/20 bg-rose-500/5'
                : 'border-emerald-500/20 bg-emerald-500/5'
            }`}>
              <div className="flex items-center gap-2.5">
                <ShieldAlert className={`h-5 w-5 ${
                  !stats ? 'text-slate-600' :
                  stats.activePenalties > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`} />
                <div>
                  <p className="text-xs font-semibold text-white">Faol jazo choralari</p>
                  <p className="text-[10px] text-slate-400">Joriy oy uchun</p>
                </div>
              </div>
              <div className={`text-2xl font-bold ${
                !stats ? 'text-slate-600' :
                stats.activePenalties > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {loading ? '—' : (stats?.activePenalties ?? '—')}
              </div>
            </div>
          </section>
        </div>

        {/* Drawer Footer CTA */}
        <div className="border-t border-slate-800 px-5 py-4 flex-shrink-0">
          <button
            onClick={() => {
              if (department) {
                onViewEmployees(department.id, department.name);
                onClose();
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] transition-all"
          >
            <Users className="h-4 w-4" />
            Ushbu bo'lim xodimlarini ko'rish
            <ArrowRight className="h-4 w-4 ml-auto" />
          </button>
          <p className="text-center text-[10px] text-slate-600 mt-2">
            Xodimlar ro'yxatiga o'tib, bu bo'lim uchun filtr avtomatik qo'llanadi
          </p>
        </div>
      </div>
    </>
  );
};

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2.5">
      <span className="text-slate-500 text-[11px] flex-shrink-0">{label}</span>
      <span className="text-slate-200 text-xs text-right">{value}</span>
    </div>
  );
}
