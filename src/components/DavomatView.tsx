'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Plus,
  LayoutList,
  LayoutGrid,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Ban,
  CalendarClock,
  Building2,
} from 'lucide-react';
import { LeaveCreationModal, LEAVE_TYPES } from './LeaveCreationModal';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// ─── Type Metadata ────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; short: string; bgClass: string; textClass: string; borderClass: string }> = {
  MEHNAT_TATILI:        { label: "Mehnat ta'tili",   short: 'M/T',  bgClass: 'bg-blue-500/15',   textClass: 'text-blue-300',   borderClass: 'border-blue-500/30' },
  MT:                   { label: "Mehnat ta'tili",   short: 'M/T',  bgClass: 'bg-blue-500/15',   textClass: 'text-blue-300',   borderClass: 'border-blue-500/30' },
  SICK_LEAVE_BL:        { label: "Vaqtincha mehnatka layoqatsizlik", short: 'B/L',  bgClass: 'bg-rose-500/15',   textClass: 'text-rose-300',   borderClass: 'border-rose-500/30' },
  BL:                   { label: "Vaqtincha mehnatka layoqatsizlik", short: 'B/L',  bgClass: 'bg-rose-500/15',   textClass: 'text-rose-300',   borderClass: 'border-rose-500/30' },
  BS_UNPAID:            { label: "O'z hisobidan ta'til", short: 'B/S', bgClass: 'bg-amber-500/15',  textClass: 'text-amber-300',  borderClass: 'border-amber-500/30' },
  BS:                   { label: "O'z hisobidan ta'til", short: 'B/S', bgClass: 'bg-amber-500/15',  textClass: 'text-amber-300',  borderClass: 'border-amber-500/30' },
  OQISH_TATILI:         { label: "O'qish davri uchun qo'shimcha ta'til", short: "O'Q", bgClass: 'bg-purple-500/15', textClass: 'text-purple-300', borderClass: 'border-purple-500/30' },
  OTGUL:                { label: 'Kechikish / soatli ruxsatnoma', short: 'OTG',  bgClass: 'bg-teal-500/15',   textClass: 'text-teal-300',   borderClass: 'border-teal-500/30' },
  ADMIN_TATIL:          { label: "Administrativ ta'til", short: 'ADM',  bgClass: 'bg-indigo-500/15', textClass: 'text-indigo-300', borderClass: 'border-indigo-500/30' },
  KECHIKISH_RUXSATNOMA: { label: 'Kechikish / soatli ruxsatnoma', short: 'KECH', bgClass: 'bg-orange-500/15', textClass: 'text-orange-300', borderClass: 'border-orange-500/30' },
  LATE_ARRIVAL:         { label: 'Kechikish / soatli ruxsatnoma', short: 'KECH', bgClass: 'bg-orange-500/15', textClass: 'text-orange-300', borderClass: 'border-orange-500/30' },
  PROGUL:               { label: 'Devonsizlik', short: 'PRG',  bgClass: 'bg-red-600/15',    textClass: 'text-red-400',    borderClass: 'border-red-500/30' },
  STUDY_LEAVE:          { label: "O'qish davri uchun qo'shimcha ta'til", short: "O'Q", bgClass: 'bg-purple-500/15', textClass: 'text-purple-300', borderClass: 'border-purple-500/30' },
  MILITARY_DUTY:        { label: 'Harbiy', short: 'HRB',  bgClass: 'bg-slate-500/15',  textClass: 'text-slate-300',  borderClass: 'border-slate-500/30' },
};

const STATUS_META: Record<string, { label: string; bgClass: string; textClass: string; borderClass: string }> = {
  ACTIVE:    { label: 'Faol',         bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-400', borderClass: 'border-emerald-500/30' },
  APPROVED:  { label: 'Tasdiqlangan', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-400', borderClass: 'border-emerald-500/30' },
  COMPLETED: { label: 'Tugallangan',  bgClass: 'bg-slate-500/15',   textClass: 'text-slate-400',   borderClass: 'border-slate-700' },
  CANCELLED: { label: 'Bekor',        bgClass: 'bg-rose-500/10',    textClass: 'text-rose-400',    borderClass: 'border-rose-500/20' },
};

// ─── Month Calendar / Gantt helpers ──────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthStart(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

const MONTH_NAMES = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
const DAY_NAMES   = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak'];

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, colorClass }: { label: string; value: number; icon: any; colorClass: string }) => (
  <div className={`glass-card rounded-2xl p-4 border ${colorClass} flex items-center gap-4`}>
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorClass.replace('border-', 'bg-').replace('/30', '/20')}`}>
      <Icon className={`h-5 w-5 ${colorClass.replace('border-', 'text-').replace('/30', '')}`} />
    </div>
    <div>
      <div className="text-2xl font-extrabold text-white">{value}</div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </div>
  </div>
);

// ─── Type Badge ───────────────────────────────────────────────────────────────

const TypeBadge = ({ type }: { type: string }) => {
  const meta = TYPE_META[type] || { label: type, short: type, bgClass: 'bg-slate-700', textClass: 'text-slate-300', borderClass: 'border-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
      {meta.short}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface DavomatViewProps {
  departments?: Array<{ id: string; name: string }>;
}

export const DavomatView: React.FC<DavomatViewProps> = ({ departments = [] }) => {
  const { isReadOnly } = useAuth();
  const [leaves, setLeaves]             = useState<any[]>([]);
  const [stats, setStats]               = useState<any>({});
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState<'table' | 'calendar'>('table');

  // Filters
  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState('ALL');
  const [filterDept, setFilterDept]     = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');

  // Calendar navigation
  const now = new Date();
  const [calYear, setCalYear]   = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)       params.set('search', search);
      if (filterType !== 'ALL') params.set('type', filterType);
      if (filterDept !== 'ALL') params.set('departmentId', filterDept);
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (dateFrom)     params.set('startDate', dateFrom);
      if (dateTo)       params.set('endDate', dateTo);

      const res = await fetch(`/api/leaves?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeaves(data.leaves || []);
        setStats(data.stats || {});
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterDept, filterStatus, dateFrom, dateTo]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleCancel = async (id: string) => {
    if (!confirm("Bu ta'til yozuvini BEKOR qilishni tasdiqlaysizmi?")) return;
    setCancellingId(id);
    try {
      await fetch(`/api/leaves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      fetchLeaves();
    } finally {
      setCancellingId(null);
    }
  };

  // Paginated data
  const totalPages = Math.ceil(leaves.length / PAGE_SIZE);
  const pagedLeaves = leaves.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Calendar data: leaves in selected month
  const calStart = new Date(calYear, calMonth, 1);
  const calEnd   = new Date(calYear, calMonth + 1, 0, 23, 59, 59);
  const calLeaves = leaves.filter((l) => {
    const s = new Date(l.startDate);
    const e = new Date(l.endDate);
    return s <= calEnd && e >= calStart;
  });

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  // Group leaves by date for calendar
  const leaveDayMap: Record<number, any[]> = {};
  calLeaves.forEach((l) => {
    const s = Math.max(1, new Date(l.startDate).getDate());
    const e = Math.min(daysInMonth, new Date(l.endDate).getDate());
    for (let d = s; d <= e; d++) {
      if (!leaveDayMap[d]) leaveDayMap[d] = [];
      leaveDayMap[d].push(l);
    }
  });

  const resetFilters = () => {
    setSearch('');
    setFilterType('ALL');
    setFilterDept('ALL');
    setFilterStatus('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = search || filterType !== 'ALL' || filterDept !== 'ALL' || filterStatus !== 'ALL' || dateFrom || dateTo;

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <CalendarClock className="h-5 w-5 text-white" />
            </div>
            Davomat & Ta'tillar Boshqaruvi
          </h2>
          <p className="text-sm text-slate-400 mt-1 ml-13">
            M/T, B/S, B/L, Otgul, Ruxsatnoma va Kechikishlar umumiy logi
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          disabled={isReadOnly}
          title={isReadOnly ? "🔒 Faqat o'zingizga biriktirilgan bo'lim xodimlarini tahrirlashingiz mumkin" : "Yangi ta'til yoki ruxsatnoma qo'shish"}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-orange-500 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Yangi Ta'til / Ruxsatnoma
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Jami Yozuvlar"          value={stats.total || 0}      icon={LayoutList}    colorClass="border-indigo-500/30" />
        <StatCard label="Faol Ta'tildagilar"      value={stats.active || 0}     icon={Calendar}      colorClass="border-emerald-500/30" />
        <StatCard label="Vaqtincha mehnatka layoqatsizlik" value={stats.sickLeave || 0} icon={AlertTriangle}  colorClass="border-rose-500/30" />
        <StatCard label="O'z hisobidan ta'til"  value={stats.bsUnpaid || 0}  icon={Clock}         colorClass="border-amber-500/30" />
      </div>

      {/* ── Toolbar ── */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-4 space-y-3">
        {/* Row 1: Search + View toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Xodim ismi yoki tabel raqami bo'yicha qidirish..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none transition"
            />
          </div>

          <button
            onClick={fetchLeaves}
            className="rounded-xl p-2 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-white transition"
            title="Yangilash"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* View Switcher */}
          <div className="flex rounded-xl border border-slate-700 overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition ${view === 'table' ? 'bg-amber-500/20 text-amber-300 border-r border-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-r border-slate-700'}`}
            >
              <LayoutList className="h-3.5 w-3.5" /> Ro'yxat
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition ${view === 'calendar' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kalendar
            </button>
          </div>
        </div>

        {/* Row 2: Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="h-4 w-4 text-slate-500 shrink-0" />

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none transition"
          >
            <option value="ALL">Barcha turlar</option>
            {Array.from(new Map(LEAVE_TYPES.map((lt) => [lt.label, lt])).values()).map((lt) => (
              <option key={lt.id} value={lt.id}>{lt.label}</option>
            ))}
          </select>

          {/* Department filter */}
          <select
            value={filterDept}
            onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none transition"
          >
            <option value="ALL">Barcha bo'limlar</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none transition"
          >
            <option value="ALL">Barcha holat</option>
            <option value="ACTIVE">Faol</option>
            <option value="COMPLETED">Tugallangan</option>
            <option value="CANCELLED">Bekor</option>
          </select>

          {/* Date range */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none transition"
          />
          <span className="text-slate-600 text-xs">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none transition"
          />

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition"
            >
              <XCircle className="h-3.5 w-3.5" /> Tozalash
            </button>
          )}
        </div>
      </div>

      {/* ── Content: Table View ── */}
      {view === 'table' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-16 gap-3">
              <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
              <span className="text-slate-400 text-sm">Yuklanmoqda...</span>
            </div>
          ) : leaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <Calendar className="h-12 w-12 text-slate-700" />
              <p className="text-slate-400 font-medium">Ta'til yozuvlari topilmadi</p>
              <p className="text-slate-600 text-sm">Filtrlarni o'zgartiring yoki yangi yozuv qo'shing</p>
              <button onClick={() => setIsCreateOpen(true)} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 px-4 py-2 text-xs font-semibold hover:bg-amber-500/30 transition">
                <Plus className="h-4 w-4" /> Yangi Ta'til Qo'shish
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wide border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="px-4 py-3 text-left">Xodim</th>
                      <th className="px-4 py-3 text-left">Bo'lim</th>
                      <th className="px-4 py-3 text-left">Tur</th>
                      <th className="px-4 py-3 text-left">Boshlanish</th>
                      <th className="px-4 py-3 text-left">Tugash</th>
                      <th className="px-4 py-3 text-center">Kun/Soat</th>
                      <th className="px-4 py-3 text-left">Buyruq №</th>
                      <th className="px-4 py-3 text-left">Sabab</th>
                      <th className="px-4 py-3 text-center">Holat</th>
                      <th className="px-4 py-3 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {pagedLeaves.map((lv) => {
                      const statusMeta = STATUS_META[lv.status] || STATUS_META.ACTIVE;
                      return (
                        <tr key={lv.id} className="hover:bg-slate-800/30 transition-colors group">
                          {/* Employee */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                                {lv.employee?.firstName?.[0]}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-200 leading-tight">
                                  {lv.employee?.lastName} {lv.employee?.firstName}
                                </div>
                                <div className="font-mono text-[10px] text-indigo-400">{lv.employee?.tabelNumber}</div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="px-4 py-3 text-slate-400 max-w-[120px]">
                            <span className="truncate block text-[11px]">{lv.employee?.currentDepartment?.name}</span>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3">
                            <TypeBadge type={lv.type} />
                          </td>

                          {/* Dates */}
                          <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                            {lv.startTime ? `${formatDate(lv.startDate)} ${lv.startTime}` : formatDate(lv.startDate)}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                            {lv.endTime ? lv.endTime : formatDate(lv.endDate)}
                          </td>

                          {/* Duration */}
                          <td className="px-4 py-3 text-center">
                            {lv.totalHours ? (
                              <span className="font-bold text-orange-300">{lv.totalHours}h</span>
                            ) : (
                              <span className="font-bold text-white">{lv.totalDays}<span className="text-slate-500 font-normal ml-1">kun</span></span>
                            )}
                          </td>

                          {/* Order # */}
                          <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                            {lv.orderNumber || <span className="text-slate-700">—</span>}
                          </td>

                          {/* Reason */}
                          <td className="px-4 py-3 text-slate-400 max-w-[160px]">
                            <span className="truncate block text-[11px]">{lv.reason || '—'}</span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusMeta.bgClass} ${statusMeta.textClass} ${statusMeta.borderClass}`}>
                              {statusMeta.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            {lv.status !== 'CANCELLED' && lv.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleCancel(lv.id)}
                                disabled={cancellingId === lv.id}
                                className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-500/15 hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
                                title="Bekor qilish"
                              >
                                {cancellingId === lv.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Ban className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/40">
                  <span className="text-[11px] text-slate-500">
                    {leaves.length} ta yozuvdan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, leaves.length)} ko'rsatilmoqda
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => Math.abs(p - page) <= 2).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${p === page ? 'bg-amber-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Content: Calendar View ── */}
      {view === 'calendar' && (
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          {/* Calendar Nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
              className="rounded-xl p-2 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-white transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-bold text-white">
              {MONTH_NAMES[calMonth]} {calYear}
            </h3>
            <button
              onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
              className="rounded-xl p-2 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-white transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {Array.from(new Map(Object.entries(TYPE_META).map(([_, meta]) => [meta.label, meta])).values()).map((meta) => (
              <div key={meta.label} className="flex items-center gap-1.5 text-[10px]">
                <div className={`h-3 w-5 rounded-sm ${meta.bgClass} border ${meta.borderClass}`} />
                <span className={meta.textClass}>{meta.short}</span>
              </div>
            ))}
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Leading empty cells */}
            {Array.from({ length: (getMonthStart(calYear, calMonth) + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 rounded-lg" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dayLeaves = leaveDayMap[day] || [];
              const isToday = calYear === now.getFullYear() && calMonth === now.getMonth() && day === now.getDate();
              return (
                <div
                  key={day}
                  className={`relative min-h-20 rounded-xl p-1.5 border transition-all ${
                    isToday ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className={`text-[11px] font-bold mb-1 ${isToday ? 'text-amber-400' : 'text-slate-400'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayLeaves.slice(0, 3).map((lv) => {
                      const meta = TYPE_META[lv.type] || { short: lv.type, bgClass: 'bg-slate-700', textClass: 'text-slate-300', borderClass: '' };
                      return (
                        <div
                          key={lv.id}
                          className={`text-[9px] font-bold px-1 py-0.5 rounded truncate ${meta.bgClass} ${meta.textClass} border ${meta.borderClass}`}
                          title={`${lv.employee?.lastName} ${lv.employee?.firstName} — ${meta.short}`}
                        >
                          {lv.employee?.firstName?.slice(0, 1)}.{lv.employee?.lastName?.slice(0, 6)} [{meta.short}]
                        </div>
                      );
                    })}
                    {dayLeaves.length > 3 && (
                      <div className="text-[9px] text-slate-500 font-semibold px-1">+{dayLeaves.length - 3} ta</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar month summary */}
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-bold text-slate-300 mb-3">
              {MONTH_NAMES[calMonth]} oyi ta'til yozuvlari ({calLeaves.length} ta)
            </h4>
            {calLeaves.length === 0 ? (
              <p className="text-slate-500 text-xs">Bu oyda hech qanday ta'til yozuvi topilmadi</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {calLeaves.slice(0, 9).map((lv) => (
                  <div key={lv.id} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 p-2">
                    <TypeBadge type={lv.type} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        {lv.employee?.lastName} {lv.employee?.firstName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatDate(lv.startDate)} — {formatDate(lv.endDate)}
                      </div>
                    </div>
                  </div>
                ))}
                {calLeaves.length > 9 && (
                  <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-2">
                    <button onClick={() => setView('table')} className="text-xs text-amber-400 hover:text-amber-300 transition font-semibold">
                      + {calLeaves.length - 9} ta ko'rish →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KPI Linkage Info Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-slate-900 border border-indigo-500/20 p-4 flex items-start gap-3">
        <TrendingUp className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-indigo-300 text-sm">KPI Dvigateli bilan avtomatik bog'liq</div>
          <p className="text-slate-400 text-xs mt-1">
            Bu modulda kiritilgan <strong className="text-amber-300">O'z hisobidan ta'til</strong>, <strong className="text-rose-300">Vaqtincha mehnatka layoqatsizlik</strong> va <strong className="text-orange-300">Kechikish / soatli ruxsatnoma</strong> yozuvlari
            KPI Dvigateli tomonidan avtomatik o'qiladi va mos ushlab qolish foizi hisoblashda ishlatiladi.
          </p>
        </div>
      </div>

      {/* ── Creation Modal ── */}
      <LeaveCreationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchLeaves();
        }}
        departments={departments}
      />
    </div>
  );
};
