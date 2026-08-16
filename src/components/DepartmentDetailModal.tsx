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
import { useLanguage } from '@/contexts/LanguageContext';

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

function StatusBadge({ status, language }: { status: string; language: string }) {
  if (status === 'ACTIVE') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />{language === 'kr' ? '현재 출근' : 'FAOL'}
    </span>
  );
  if (status === 'ON_LEAVE') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{language === 'kr' ? '휴가 중' : "TA'TILDA"}
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
  const { t, language } = useLanguage();
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── MODAL HEADER ───────────────────────────────── */}
          <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-100 dark:bg-slate-800/90">
            <div className="flex items-start justify-between gap-4">
              {/* Left: dept identity */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 dark:bg-gradient-to-br dark:from-indigo-600 dark:to-purple-700 text-white shadow-md font-bold">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{department.name}</h2>
                    <span className="font-mono text-xs text-blue-700 dark:text-indigo-300 bg-blue-100 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-indigo-500/15 font-bold">
                      {department.code}
                    </span>
                    {isFull ? (
                      <span className="text-[11px] font-bold text-rose-800 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-300 dark:border-rose-500/20">
                        ● {language === 'kr' ? '정원 완료' : "Shtat To'liq"}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/20">
                        ● {vacancyCount} {language === 'kr' ? '개 공석' : 'ta Vakansiya'}
                      </span>
                    )}
                  </div>
                  {/* Quick attendance summary pills */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap font-medium">
                    <span className="inline-flex items-center gap-1 text-[11px] rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-slate-800 dark:text-slate-300">
                      <Users className="h-3 w-3 text-blue-600 dark:text-indigo-400" />
                      <strong className="text-slate-900 dark:text-white font-bold">{empCount}</strong> / {staffLimit} {language === 'kr' ? '정원' : 'shtat'}
                    </span>
                    {!loading && stats && (
                      <>
                        <span className="inline-flex items-center gap-1 text-[11px] rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-2.5 py-1 dark:text-emerald-400 font-bold">
                          <UserCheck className="h-3 w-3" />{stats.activeCount} {language === 'kr' ? '명 출근' : 'faol'}
                        </span>
                        {stats.onLeaveCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 px-2.5 py-1 dark:text-amber-400 font-bold">
                            <UserMinus className="h-3 w-3" />{stats.onLeaveCount} {language === 'kr' ? '명 휴가' : "ta'tilda"}
                          </span>
                        )}
                        {stats.activePenalties > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20 px-2.5 py-1 dark:text-rose-400 font-bold">
                            <ShieldAlert className="h-3 w-3" />{stats.activePenalties} {language === 'kr' ? '건 징계' : 'jazo'}
                          </span>
                        )}
                        {stats.department?.parent && (
                          <span className="inline-flex items-center gap-1 text-[11px] rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/20 px-2.5 py-1 dark:text-purple-400 font-bold">
                            <GitBranch className="h-3 w-3" />{stats.department.parent.name}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button onClick={onClose} className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition flex-shrink-0 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Attendance stats bar */}
            {!loading && stats && (
              <div className="grid grid-cols-6 gap-2 mt-4">
                <StatPill label={t('dept_modal.status_present', 'Hozirda Ishda')} value={stats.activeCount} color="emerald" />
                <StatPill label={language === 'kr' ? '휴가자' : "Ta'tilda"} value={stats.onLeaveCount} color="amber" />
                <StatPill label={t('dept_modal.status_annual_leave', "Mehnat Ta'tili")} value={stats.leaveByType.MT} color="purple" />
                <StatPill label={t('dept_modal.status_unpaid_leave', "O'z Hisobidan (B/S)")} value={stats.leaveByType.BS} color="blue" />
                <StatPill label={t('dept_modal.status_sick_leave', 'Vaqtincha Layoqatsizlik (B/L)')} value={stats.leaveByType.BL} color="rose" />
                <StatPill label={language === 'kr' ? '징계 처분' : 'Faol Jazolar'} value={stats.activePenalties} color={stats.activePenalties > 0 ? 'rose' : 'slate'} />
              </div>
            )}
          </div>

          {/* ── SCROLLABLE BODY ─────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-600 dark:text-slate-400 font-medium">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-indigo-400" />
                <p className="text-sm">{language === 'kr' ? '데이터를 불러오는 중...' : "Ma'lumotlar yuklanmoqda..."}</p>
              </div>
            ) : (
              <>
                {/* ── SECTION 1: LEADERSHIP TREE ──────────────── */}
                <div className="px-6 pt-5 pb-3">
                  <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-400 mb-4">
                    <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    {language === 'kr' ? '부서 책임자 및 대리' : "Bo'lim Rahbariyat va O'rinbosarlar"}
                  </h3>

                  {leadership ? (
                    <div className="space-y-3">
                      {/* Head Card */}
                      {leadership.head ? (
                        <div className="flex items-center gap-4 rounded-2xl border border-amber-300 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 p-4">
                          <div className="relative flex-shrink-0">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 text-white text-lg font-bold shadow-md">
                              {leadership.head.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <Crown className="absolute -top-2 -right-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{leadership.head.name}</p>
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">{leadership.head.position}</p>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap font-medium">
                              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 font-bold">{leadership.head.tabel}</span>
                              {leadership.head.phone !== '—' && (
                                <a href={`tel:${leadership.head.phone}`} className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-blue-600 transition">
                                  <Phone className="h-3 w-3" />{leadership.head.phone}
                                </a>
                              )}
                              {leadership.head.email !== '—' && (
                                <a href={`mailto:${leadership.head.email}`} className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-blue-600 transition truncate">
                                  <Mail className="h-3 w-3" />{leadership.head.email}
                                </a>
                              )}
                            </div>
                          </div>
                          <span className="flex-shrink-0 text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 px-2.5 py-1 rounded-full">
                            {t('hierarchy.level_head', "Sex / Bo'lim Boshlig'i")}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 rounded-xl border border-rose-300 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/5 px-4 py-3 text-rose-800 dark:text-rose-400 text-xs font-semibold">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          {language === 'kr' ? '부서장 미지정 (공석)' : 'Rahbar tayinlanmagan — Pozitsiya bo\'sh'}
                        </div>
                      )}

                      {/* Deputies & Specialists grid */}
                      {((leadership.deputies && leadership.deputies.length > 0) || (leadership.specialists && leadership.specialists.length > 0)) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 border-l-2 border-amber-300 dark:border-amber-500/20 ml-7">
                          {(leadership.deputies || []).map((dep, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 shadow-sm">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white text-xs font-bold">
                                {dep.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{dep.name}</p>
                                <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold truncate">{dep.position}</p>
                                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{dep.tabel}</span>
                              </div>
                              <span className="flex-shrink-0 text-[9px] font-bold uppercase text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/15 px-1.5 py-0.5 rounded-full">
                                {t('hierarchy.level_deputy', "Boshqarma Boshlig'i / Ijrochi Direktor")}
                              </span>
                            </div>
                          ))}
                          {(leadership.specialists || []).map((sp, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 shadow-sm">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white text-xs font-bold">
                                {sp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{sp.name}</p>
                                <p className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold truncate">{sp.position}</p>
                                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{sp.tabel}</span>
                              </div>
                              <span className="flex-shrink-0 text-[9px] font-bold uppercase text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-500/10 border border-teal-300 dark:border-teal-500/15 px-1.5 py-0.5 rounded-full">
                                {language === 'kr' ? '전문가' : 'Mutaxassis'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 px-4 py-4 text-slate-600 dark:text-slate-400 text-xs font-medium">
                      <UserCog className="h-4 w-4" />
                      {language === 'kr' ? '등록된 부서 책임자 정보가 없습니다.' : "Bu bo'lim uchun rahbariyat ma'lumoti kiritilmagan"}
                    </div>
                  )}
                </div>

                <div className="mx-6 border-t border-slate-200 dark:border-slate-800" />

                {/* ── SECTION 2: EMPLOYEES TABLE ──────────────── */}
                <div className="px-6 pt-4 pb-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-400">
                      <Users className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
                      {language === 'kr' ? '부서원 목록' : "Bo'lim Xodimlar Ro'yxati"}
                      <span className="text-blue-600 dark:text-indigo-400 font-mono normal-case font-bold">({filteredEmployees.length} / {stats?.employees.length || 0})</span>
                    </h3>

                    {/* In-modal search */}
                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        placeholder={t('hierarchy.search', "Bo'lim yoki F.I.O bo'yicha qidiruv...")}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  {stats?.employees.length === 0 ? (
                    <div className="text-center py-10 text-slate-600 dark:text-slate-400 text-sm font-medium">
                      {language === 'kr' ? '부서에 등록된 임직원이 없습니다.' : "Bu bo'limda xodimlar mavjud emas"}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider border-b border-slate-300 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3">{t('table.tabel_no', 'Tabel №')} / {t('table.fio', 'F.I.O')}</th>
                            <th className="px-4 py-3">{t('table.position', 'Lavozimi')}</th>
                            <th className="px-4 py-3">{t('table.status', 'Status')}</th>
                            <th className="px-4 py-3">{language === 'kr' ? '자격증 / 허가서' : 'Ruxsatnomalar'}</th>
                            <th className="px-4 py-3">{language === 'kr' ? '복무 규율' : 'Intizom'}</th>
                            <th className="px-4 py-3 text-right">{t('table.actions', 'Harakatlar')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {filteredEmployees.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-600 dark:text-slate-400 font-medium">
                                {language === 'kr' ? '검색 결과가 없습니다.' : "Qidiruv bo'yicha natija topilmadi"}
                              </td>
                            </tr>
                          ) : (
                            filteredEmployees.map((emp) => {
                              const hasActivePenalty = emp.disciplinaryActions.length > 0;
                              return (
                                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/70 transition group border-b border-slate-200 dark:border-slate-800">
                                  {/* Tabel + Name */}
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold flex-shrink-0 ${
                                        emp.gender === 'FEMALE'
                                          ? 'bg-pink-100 dark:bg-pink-500/15 text-pink-800 dark:text-pink-400 border border-pink-300 dark:border-pink-500/20'
                                          : 'bg-blue-100 dark:bg-indigo-500/15 text-blue-800 dark:text-indigo-400 border border-blue-300 dark:border-indigo-500/20'
                                      }`}>
                                        {emp.firstName[0]}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-indigo-400">[{emp.tabelNumber}]</span>
                                        </div>
                                        <p className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                                          {emp.lastName} {emp.firstName} {emp.middleName || ''}
                                        </p>
                                        {emp.phone && (
                                          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">{emp.phone}</p>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Position */}
                                  <td className="px-4 py-3">
                                    <span className="text-slate-800 dark:text-slate-200 font-medium">{emp.position}</span>
                                  </td>

                                  {/* Status */}
                                  <td className="px-4 py-3">
                                    <StatusBadge status={emp.status} language={language} />
                                  </td>

                                  {/* Permits */}
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {emp.militaryCertificate && (
                                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 dark:border-emerald-500/20 bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                                          <ShieldCheck className="h-2.5 w-2.5" />{language === 'kr' ? '병역증' : 'Harbiy'}
                                        </span>
                                      )}
                                      {emp.permits.map((p) => (
                                        <PermitBadge key={p.id} permit={p} />
                                      ))}
                                      {!emp.militaryCertificate && emp.permits.length === 0 && (
                                        <span className="text-slate-400 text-[10px]">—</span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Discipline */}
                                  <td className="px-4 py-3">
                                    {hasActivePenalty ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-800 dark:text-rose-400">
                                        <AlertTriangle className="h-2.5 w-2.5" />{language === 'kr' ? '징계 처분' : 'Hayfsan'}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-500" />{language === 'kr' ? '정상' : 'Intizomli'}
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
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 text-[11px] font-bold text-white transition shadow-sm cursor-pointer"
                                    >
                                      <Eye className="h-3 w-3" />
                                      {language === 'kr' ? '프로필 보기' : 'Profil Karta'}
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
          <div className="flex-shrink-0 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-100 dark:bg-slate-900">
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-200 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {t('common.close', 'Yopish')}
            </button>
            <button
              onClick={() => {
                if (department) {
                  onViewEmployees(department.id, department.name);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Users className="h-4 w-4" />
              {t('node.view_staff', "Xodimlarni Ko'rish")}
              <TrendingDown className="h-3.5 w-3.5 rotate-[-90deg]" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
