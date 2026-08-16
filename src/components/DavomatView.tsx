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
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Month Calendar / Gantt helpers ──────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthStart(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

const MONTH_NAMES_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
const MONTH_NAMES_KR = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

const DAY_NAMES_UZ   = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak'];
const DAY_NAMES_KR   = ['월', '화', '수', '목', '금', '토', '일'];

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, colorClass }: { label: string; value: number; icon: any; colorClass: string }) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all flex items-center gap-4">
    <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</div>
      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">{label}</div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface DavomatViewProps {
  departments?: Array<{ id: string; name: string }>;
}

export const DavomatView: React.FC<DavomatViewProps> = ({ departments = [] }) => {
  const { isReadOnly } = useAuth();
  const { t, language } = useLanguage();

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
    if (!confirm(language === 'kr' ? '이 휴가/병가 내역을 취소하시겠습니까?' : "Bu ta'til yozuvini BEKOR qilishni tasdiqlaysizmi?")) return;
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

  // Type metadata helper with language dynamic support
  const getTypeBadge = (type: string) => {
    if (type === 'MEHNAT_TATILI' || type === 'MT') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
          {t('davomat.badge_annual', "MEHNAT TA'TILI")}
        </span>
      );
    }
    if (type === 'SICK_LEAVE_BL' || type === 'BL') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800">
          {t('davomat.badge_sick', "VAQTINCHA LAYOQATSIZLIK (B/L)")}
        </span>
      );
    }
    if (type === 'BS_UNPAID' || type === 'BS') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800">
          {t('davomat.badge_unpaid', "O'Z HISOBIDAN (B/S)")}
        </span>
      );
    }
    if (type === 'OQISH_TATILI' || type === 'STUDY_LEAVE') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800">
          {t('davomat.badge_study', "O'QISH TA'TILI")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700">
        {type}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE' || status === 'APPROVED') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
          {language === 'kr' ? '진행 중' : 'Faol'}
        </span>
      );
    }
    if (status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700">
          {language === 'kr' ? '종료됨' : 'Tugallangan'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800">
        {language === 'kr' ? '취소됨' : 'Bekor'}
      </span>
    );
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
  const monthNames = language === 'kr' ? MONTH_NAMES_KR : MONTH_NAMES_UZ;
  const dayNames   = language === 'kr' ? DAY_NAMES_KR   : DAY_NAMES_UZ;

  return (
    <div className="space-y-5 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen p-1 transition-colors">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <CalendarClock className="h-5 w-5 text-white" />
            </div>
            {t('davomat.title', "Davomat va Ta'tillar Boshqaruvi")}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {t('davomat.subtitle', "Xodimlarning mehnat ta'tillari, kasallik varaqalari (B/L) va B/S jurnali")}
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          disabled={isReadOnly}
          title={isReadOnly ? "🔒 Read-only access" : "New leave request"}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 text-sm font-bold shadow-sm active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {t('davomat.new_btn', "+ Yangi Ta'til / B/L Qo'shish")}
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={language === 'kr' ? '총 등록 건수' : 'Jami Yozuvlar'} value={stats.total || 0} icon={LayoutList} colorClass="border-indigo-500/30" />
        <StatCard label={t('davomat.stat_total_on_leave', "Jami Ta'tildagilar")} value={stats.active || 0} icon={Calendar} colorClass="border-emerald-500/30" />
        <StatCard label={t('davomat.stat_sick_leave', "Vaqtincha Layoqatsiz (B/L)")} value={stats.sickLeave || 0} icon={AlertTriangle} colorClass="border-rose-500/30" />
        <StatCard label={t('davomat.stat_unpaid_leave', "O'z Hisobidan (B/S)")} value={stats.bsUnpaid || 0} icon={Clock} colorClass="border-amber-500/30" />
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        {/* Row 1: Search + View toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('davomat.search', 'Qidiruv (F.I.O, Tabel №)...')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition font-medium"
            />
          </div>

          <button
            onClick={fetchLeaves}
            className="rounded-lg p-2 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={language === 'kr' ? '새로고침' : 'Yangilash'}
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* View Switcher */}
          <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition cursor-pointer ${view === 'table' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <LayoutList className="h-3.5 w-3.5" /> {language === 'kr' ? '목록' : "Ro'yxat"}
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition cursor-pointer ${view === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> {language === 'kr' ? '달력' : 'Kalendar'}
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
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('davomat.tab_all', 'Barchasi')}</option>
            <option value="MEHNAT_TATILI" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('davomat.tab_annual', "Mehnat ta'tili")}</option>
            <option value="SICK_LEAVE_BL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('davomat.tab_sick', "Vaqtincha layoqatsizlik (B/L)")}</option>
            <option value="BS_UNPAID" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('davomat.tab_unpaid', "O'z hisobidan (B/S)")}</option>
            <option value="OQISH_TATILI" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('davomat.tab_study', "O'qish ta'tili")}</option>
          </select>

          {/* Department filter */}
          <select
            value={filterDept}
            onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">-- {t('analytics.all_depts', "Barcha Bo'limlar")} --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{d.name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">-- {language === 'kr' ? '전체 상태' : 'Barcha holat'} --</option>
            <option value="ACTIVE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '진행 중' : 'Faol'}</option>
            <option value="COMPLETED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '종료됨' : 'Tugallangan'}</option>
            <option value="CANCELLED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '취소됨' : 'Bekor'}</option>
          </select>

          {/* Date range */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
          <span className="text-slate-500 text-xs">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline transition cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5" /> {t('filter.reset', 'Filtrlarni tiklash')}
            </button>
          )}
        </div>
      </div>

      {/* ── Content: Table View ── */}
      {view === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-16 gap-3">
              <Loader2 className="h-6 w-6 text-blue-600 dark:text-amber-400 animate-spin" />
              <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">{language === 'kr' ? '데이터를 불러오는 중입니다...' : 'Yuklanmoqda...'}</span>
            </div>
          ) : leaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <Calendar className="h-12 w-12 text-slate-400" />
              <p className="text-slate-700 dark:text-slate-300 font-bold">{language === 'kr' ? '등록된 휴가 내역이 없습니다.' : "Ta'til yozuvlari topilmadi"}</p>
              <p className="text-slate-500 text-sm">{language === 'kr' ? '필터를 변경하거나 신규 휴가를 등록하세요.' : "Filtrlarni o'zgartiring yoki yangi yozuv qo'shing"}</p>
              <button onClick={() => setIsCreateOpen(true)} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition">
                <Plus className="h-4 w-4" /> {t('davomat.new_btn', "+ Yangi Ta'til / B/L Qo'shish")}
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider border-b border-slate-300 dark:border-slate-700 text-[10px]">
                    <tr>
                      <th className="px-4 py-3.5 text-left">{t('mobility.col_fio', 'F.I.O')} ({t('mobility.col_tabel', 'Tabel №')})</th>
                      <th className="px-4 py-3.5 text-left">{t('table.dept', "Bo'lim")}</th>
                      <th className="px-4 py-3.5 text-left">{t('davomat.col_leave_type', "Ta'til / B/L Turi")}</th>
                      <th className="px-4 py-3.5 text-left">{t('table.date', 'Boshlanish Sanasi')}</th>
                      <th className="px-4 py-3.5 text-left">{t('davomat.col_return_date', 'Ishga Qaytish Sanasi')}</th>
                      <th className="px-4 py-3.5 text-center">{t('davomat.col_days', 'Kunlar Soni')}</th>
                      <th className="px-4 py-3.5 text-left">{t('mobility.col_order', 'Buyruq №')}</th>
                      <th className="px-4 py-3.5 text-left">{t('mobility.col_reason', 'Sabab')}</th>
                      <th className="px-4 py-3.5 text-center">{t('table.status', 'Status')}</th>
                      <th className="px-4 py-3.5 text-right">{t('mobility.col_actions', 'Harakatlar')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {pagedLeaves.map((lv) => {
                      return (
                        <tr key={lv.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          {/* Employee */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                                {lv.employee?.firstName?.[0]}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                  {lv.employee?.lastName} {lv.employee?.firstName}
                                </div>
                                <div className="font-mono text-[10px] text-blue-700 dark:text-indigo-400 font-bold">[{lv.employee?.tabelNumber}]</div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium max-w-[120px]">
                            <span className="truncate block text-[11px]">{lv.employee?.currentDepartment?.name}</span>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3">
                            {getTypeBadge(lv.type)}
                          </td>

                          {/* Dates */}
                          <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                            {lv.startTime ? `${formatDate(lv.startDate)} ${lv.startTime}` : formatDate(lv.startDate)}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                            {lv.endTime ? lv.endTime : formatDate(lv.endDate)}
                          </td>

                          {/* Duration */}
                          <td className="px-4 py-3 text-center font-bold">
                            {lv.totalHours ? (
                              <span className="text-amber-700 dark:text-orange-300 font-bold">{lv.totalHours}{language === 'kr' ? '시간' : 'h'}</span>
                            ) : (
                              <span className="text-slate-900 dark:text-white font-bold">{lv.totalDays}<span className="text-slate-500 font-semibold ml-1">{language === 'kr' ? '일' : 'kun'}</span></span>
                            )}
                          </td>

                          {/* Order # */}
                          <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-300 font-bold text-[11px]">
                            {lv.orderNumber ? (
                              <span className="bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold px-2 py-0.5 rounded text-xs">
                                {lv.orderNumber}
                              </span>
                            ) : <span className="text-slate-400">—</span>}
                          </td>

                          {/* Reason */}
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-[160px]">
                            <span className="truncate block text-[11px] font-medium italic">{lv.reason || '—'}</span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(lv.status)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            {lv.status !== 'CANCELLED' && lv.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleCancel(lv.id)}
                                disabled={cancellingId === lv.id}
                                className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                title={t('common.cancel', 'Bekor qilish')}
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
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    {leaves.length}{language === 'kr' ? '건 중 ' : ' ta yozuvdan '}{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, leaves.length)} {language === 'kr' ? '표시 중' : "ko'rsatilmoqda"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => Math.abs(p - page) <= 2).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${p === page ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-lg p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer"
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
          {/* Calendar Nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
              className="rounded-lg p-2 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {monthNames[calMonth]} {calYear}
            </h3>
            <button
              onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
              className="rounded-lg p-2 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase py-1">{d}</div>
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
                    isToday ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`text-[11px] font-bold mb-1 ${isToday ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-400'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayLeaves.slice(0, 3).map((lv) => {
                      return (
                        <div
                          key={lv.id}
                          className="text-[9px] font-bold px-1 py-0.5 rounded truncate bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        >
                          {lv.employee?.firstName?.slice(0, 1)}.{lv.employee?.lastName?.slice(0, 6)}
                        </div>
                      );
                    })}
                    {dayLeaves.length > 3 && (
                      <div className="text-[9px] text-slate-500 font-bold px-1">+{dayLeaves.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
