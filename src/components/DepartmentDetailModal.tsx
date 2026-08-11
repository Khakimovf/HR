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
  Eye,
  Search,
  Loader2,
  BarChart3,
  GitBranch,
  Hash,
  Car,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Crown,
  UserCog,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';

/* ─────────────────────────────────────────────── types ── */
interface Permit {
  id: string;
  licenseType: string;
  category?: string | null;
  status: string;
}

interface DisciplinaryAction {
  id: string;
  type: string;
  status: string;
}

interface DeptEmployee {
  id: string;
  tabelNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  gender: string;
  position: string;
  status: string;
  phone?: string | null;
  militaryCertificate?: string | null;
  permits: Permit[];
  disciplinaryActions: DisciplinaryAction[];
}

interface DeptStats {
  totalEmployees: number;
  activeCount: number;
  onLeaveCount: number;
  leaveByType: { MT: number; BS: number; BL: number; STUDY_LEAVE: number; MILITARY_DUTY: number };
  activePenalties: number;
  employees: DeptEmployee[];
  department: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    parent?: { id: string; name: string; code: string } | null;
    _count: { employees: number };
  } | null;
}

interface ModalDepartment {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  headName?: string | null;
  staffLimit?: number | null;
  _count?: { employees: number };
}

interface DepartmentDetailModalProps {
  department: ModalDepartment | null;
  isOpen: boolean;
  onClose: () => void;
  onViewProfile: (employeeId: string) => void;
  onViewEmployees: (deptId: string, deptName: string) => void;
}

/* ─────────────────────────────────────────────── simulated leadership data ── */
const DEPT_LEADERSHIP: Record<string, {
  head?: { name: string; tabel: string; phone: string; email: string; position: string };
  deputies?: Array<{ name: string; tabel: string; position: string; phone?: string }>;
  specialists?: Array<{ name: string; tabel: string; position: string }>;
}> = {
  'DIR-01': {
    head: { name: 'Abdullayev Sherzod N.', tabel: 'TB-0001', phone: '+998 71 234-56-78', email: 's.abdullayev@enterprise.uz', position: 'Bosh Direktor' },
    deputies: [
      { name: 'Nazarov Bahodir K.', tabel: 'TB-0002', position: 'Bosh Direktor O\'rinbosari (Ishlab Chiqarish)', phone: '+998 90 111-22-33' },
      { name: 'Yusupova Feruza M.', tabel: 'TB-0003', position: 'Bosh Direktor O\'rinbosari (Moliya)', phone: '+998 93 444-55-66' },
    ],
    specialists: [{ name: 'Toshmatov Jasur R.', tabel: 'TB-0010', position: 'Bosh Kotib' }],
  },
};

function getLeadership(code: string, headName?: string | null) {
  if (DEPT_LEADERSHIP[code]) return DEPT_LEADERSHIP[code];
  if (headName) {
    return {
      head: { name: headName, tabel: '—', phone: '—', email: '—', position: 'Bo\'lim Boshlig\'i' },
      deputies: [],
      specialists: [],
    };
  }
  return null;
}

/* ─────────────────────────────────────────────── small helpers ── */
function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  const map: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    slate: 'bg-slate-800 border-slate-700 text-slate-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  };
  return (
    <div className={`flex flex-col items-center rounded-xl border px-3 py-2.5 ${map[color] || map.slate}`}>
      <span className="text-xl font-bold leading-none">{value}</span>
      <span className="mt-1 text-[10px] font-medium opacity-70 text-center leading-tight">{label}</span>
    </div>
  );
}

function PermitBadge({ permit }: { permit: Permit }) {
  const cfg: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    DRIVING: { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <Car className="h-2.5 w-2.5" />, label: permit.category || 'Haydovchi' },
    FORKLIFT_KARA: { cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: null, label: 'KARA' },
    MOBILE_PHONE_ON_SITE: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <PhoneCall className="h-2.5 w-2.5" />, label: 'Tel Ruxsat' },
    PROFESSIONAL_CERT: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <ShieldCheck className="h-2.5 w-2.5" />, label: 'HSE' },
  };
  const c = cfg[permit.licenseType] || { cls: 'bg-slate-800 text-slate-400 border-slate-700', icon: null, label: permit.licenseType };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />FAOL
    </span>
  );
  if (status === 'ON_LEAVE') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />TA'TILDA
    </span>
  );
  return (
    <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-400 border border-slate-700">
      {status}
    </span>
  );
}

/* ─────────────────────────────────────────────── main component ── */
export const DepartmentDetailModal: React.FC<DepartmentDetailModalProps> = ({
  department,
  isOpen,
  onClose,
  onViewProfile,
  onViewEmployees,
}) => {
  const [stats, setStats] = useState<DeptStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  const fetchStats = useCallback(async (deptId: string) => {
    setLoading(true);
    setStats(null);
    setTableSearch('');
    try {
      const res = await fetch(`/api/departments/${deptId}/stats`);
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && department?.id) fetchStats(department.id);
  }, [isOpen, department?.id, fetchStats]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !department) return null;

  const empCount = stats?.totalEmployees ?? department._count?.employees ?? 0;
  const staffLimit = department.staffLimit ?? Math.ceil(empCount * 1.12) + 2;
  const vacancyCount = Math.max(0, staffLimit - empCount);
  const isFull = vacancyCount === 0;

  const leadership = getLeadership(department.code, department.headName);

  // Filtered employees for the table
  const filteredEmployees = (stats?.employees || []).filter((emp) => {
    if (!tableSearch) return true;
    const q = tableSearch.toLowerCase();
    return (
      emp.tabelNumber.toLowerCase().includes(q) ||
      emp.lastName.toLowerCase().includes(q) ||
      emp.firstName.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0d1428 0%, #101828 60%, #0d1220 100%)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── MODAL HEADER ───────────────────────────────── */}
          <div className="flex-shrink-0 border-b border-slate-800 px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              {/* Left: dept identity */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-lg shadow-indigo-600/30">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg font-bold text-white leading-tight">{department.name}</h2>
                    <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/15">
                      {department.code}
                    </span>
                    {isFull ? (
                      <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                        ● Shtat To'liq
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        ● {vacancyCount} ta Vakansiya
                      </span>
                    )}
                  </div>
                  {/* Quick attendance summary pills */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-slate-300">
                      <Users className="h-3 w-3 text-indigo-400" />
                      <strong className="text-white">{empCount}</strong> / {staffLimit} shtat
                    </span>
                    {!loading && stats && (
                      <>
                        <span className="inline-flex items-center gap-1 text-[11px] rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-emerald-400">
                          <UserCheck className="h-3 w-3" />{stats.activeCount} faol
                        </span>
                        {stats.onLeaveCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-amber-400">
                            <UserMinus className="h-3 w-3" />{stats.onLeaveCount} ta'tilda
                          </span>
                        )}
                        {stats.activePenalties > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-rose-400">
                            <ShieldAlert className="h-3 w-3" />{stats.activePenalties} jazo
                          </span>
                        )}
                        {stats.department?.parent && (
                          <span className="inline-flex items-center gap-1 text-[11px] rounded-lg bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-purple-400">
                            <GitBranch className="h-3 w-3" />{stats.department.parent.name}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition flex-shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Attendance stats bar */}
            {!loading && stats && (
              <div className="grid grid-cols-6 gap-2 mt-4">
                <StatPill label="Faol Ishchilar" value={stats.activeCount} color="emerald" />
                <StatPill label="Ta'tilda" value={stats.onLeaveCount} color="amber" />
                <StatPill label="M/T (Mehnat)" value={stats.leaveByType.MT} color="purple" />
                <StatPill label="B/S (Bola)" value={stats.leaveByType.BS} color="blue" />
                <StatPill label="B/L (Betob)" value={stats.leaveByType.BL} color="rose" />
                <StatPill label="Faol Jazolar" value={stats.activePenalties} color={stats.activePenalties > 0 ? 'rose' : 'slate'} />
              </div>
            )}
          </div>

          {/* ── SCROLLABLE BODY ─────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm">Ma'lumotlar yuklanmoqda...</p>
              </div>
            ) : (
              <>
                {/* ── SECTION 1: LEADERSHIP TREE ──────────────── */}
                <div className="px-6 pt-5 pb-3">
                  <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                    <Crown className="h-3.5 w-3.5 text-amber-400" />
                    Bo'lim Rahbariyati va O'rinbosarlar
                  </h3>

                  {leadership ? (
                    <div className="space-y-3">
                      {/* Head Card */}
                      {leadership.head ? (
                        <div className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 p-4">
                          <div className="relative flex-shrink-0">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white text-lg font-bold shadow-lg shadow-amber-500/30">
                              {leadership.head.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <Crown className="absolute -top-2 -right-2 h-4 w-4 text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">{leadership.head.name}</p>
                            <p className="text-xs text-amber-400 font-semibold">{leadership.head.position}</p>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <span className="font-mono text-[11px] text-slate-400">{leadership.head.tabel}</span>
                              {leadership.head.phone !== '—' && (
                                <a href={`tel:${leadership.head.phone}`} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 transition">
                                  <Phone className="h-3 w-3" />{leadership.head.phone}
                                </a>
                              )}
                              {leadership.head.email !== '—' && (
                                <a href={`mailto:${leadership.head.email}`} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 transition truncate">
                                  <Mail className="h-3 w-3" />{leadership.head.email}
                                </a>
                              )}
                            </div>
                          </div>
                          <span className="flex-shrink-0 text-[10px] font-bold uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                            Bo'lim Boshlig'i
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-rose-400 text-xs">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          Rahbar tayinlanmagan — Pozitsiya bo'sh
                        </div>
                      )}

                      {/* Deputies & Specialists grid */}
                      {((leadership.deputies && leadership.deputies.length > 0) || (leadership.specialists && leadership.specialists.length > 0)) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 border-l-2 border-amber-500/10 ml-7">
                          {(leadership.deputies || []).map((dep, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                                {dep.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{dep.name}</p>
                                <p className="text-[10px] text-blue-400 truncate">{dep.position}</p>
                                <span className="font-mono text-[10px] text-slate-500">{dep.tabel}</span>
                              </div>
                              <span className="flex-shrink-0 text-[9px] font-bold uppercase text-blue-400 bg-blue-500/10 border border-blue-500/15 px-1.5 py-0.5 rounded-full">
                                O'rinbosar
                              </span>
                            </div>
                          ))}
                          {(leadership.specialists || []).map((sp, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-xs font-bold">
                                {sp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{sp.name}</p>
                                <p className="text-[10px] text-teal-400 truncate">{sp.position}</p>
                                <span className="font-mono text-[10px] text-slate-500">{sp.tabel}</span>
                              </div>
                              <span className="flex-shrink-0 text-[9px] font-bold uppercase text-teal-400 bg-teal-500/10 border border-teal-500/15 px-1.5 py-0.5 rounded-full">
                                Mutaxassis
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-4 py-4 text-slate-500 text-xs">
                      <UserCog className="h-4 w-4" />
                      Bu bo'lim uchun rahbariyat ma'lumoti kiritilmagan
                    </div>
                  )}
                </div>

                <div className="mx-6 border-t border-slate-800/70" />

                {/* ── SECTION 2: EMPLOYEES TABLE ──────────────── */}
                <div className="px-6 pt-4 pb-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      <Users className="h-3.5 w-3.5 text-indigo-400" />
                      Bo'lim Xodimlar Ro'yxati
                      <span className="text-indigo-400 font-mono normal-case">({filteredEmployees.length} / {stats?.employees.length || 0})</span>
                    </h3>

                    {/* In-modal search */}
                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        placeholder="Tabel №, FIO, Lavozim..."
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {stats?.employees.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      Bu bo'limda xodimlar mavjud emas
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="px-4 py-3">Tabel № / F.I.O</th>
                            <th className="px-4 py-3">Lavozim</th>
                            <th className="px-4 py-3">Holati</th>
                            <th className="px-4 py-3">Ruxsatnomalar</th>
                            <th className="px-4 py-3">Intizom</th>
                            <th className="px-4 py-3 text-right">Amallar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
                          {filteredEmployees.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-500">
                                Qidiruv bo'yicha natija topilmadi
                              </td>
                            </tr>
                          ) : (
                            filteredEmployees.map((emp) => {
                              const hasActivePenalty = emp.disciplinaryActions.length > 0;
                              return (
                                <tr key={emp.id} className="hover:bg-slate-900/70 transition group">
                                  {/* Tabel + Name */}
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold flex-shrink-0 ${
                                        emp.gender === 'FEMALE'
                                          ? 'bg-pink-500/15 text-pink-400 border border-pink-500/20'
                                          : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                                      }`}>
                                        {emp.firstName[0]}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono text-[11px] font-bold text-indigo-400">{emp.tabelNumber}</span>
                                        </div>
                                        <p className="font-semibold text-slate-100 text-[11px]">
                                          {emp.lastName} {emp.firstName} {emp.middleName || ''}
                                        </p>
                                        {emp.phone && (
                                          <p className="text-[10px] text-slate-500 font-mono">{emp.phone}</p>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Position */}
                                  <td className="px-4 py-3">
                                    <span className="text-slate-200 font-medium">{emp.position}</span>
                                  </td>

                                  {/* Status */}
                                  <td className="px-4 py-3">
                                    <StatusBadge status={emp.status} />
                                  </td>

                                  {/* Permits */}
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {emp.militaryCertificate && (
                                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                                          <ShieldCheck className="h-2.5 w-2.5" />Harbiy
                                        </span>
                                      )}
                                      {emp.permits.map((p) => (
                                        <PermitBadge key={p.id} permit={p} />
                                      ))}
                                      {!emp.militaryCertificate && emp.permits.length === 0 && (
                                        <span className="text-slate-600 text-[10px]">—</span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Discipline */}
                                  <td className="px-4 py-3">
                                    {hasActivePenalty ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-400">
                                        <AlertTriangle className="h-2.5 w-2.5" />Hayfsan
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />Intizomli
                                      </span>
                                    )}
                                  </td>

                                  {/* Actions */}
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => {
                                        onViewProfile(emp.id);
                                        onClose();
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/80 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-indigo-500 transition"
                                    >
                                      <Eye className="h-3 w-3" />
                                      Profil Karta
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── MODAL FOOTER ────────────────────────────────── */}
          <div className="flex-shrink-0 flex items-center justify-between gap-3 border-t border-slate-800 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              Yopish
            </button>
            <button
              onClick={() => {
                if (department) {
                  onViewEmployees(department.id, department.name);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] transition-all"
            >
              <Users className="h-4 w-4" />
              Ushbu bo'lim xodimlarini ko'rish (Filtrli)
              <TrendingDown className="h-3.5 w-3.5 rotate-[-90deg]" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
