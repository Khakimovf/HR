'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Calculator,
  TrendingDown,
  TrendingUp,
  Building,
  RotateCcw,
  Award,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Table2,
  Download,
  Calendar,
  Users,
  Percent,
  Lock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  X,
  Building2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

/* ─── Period config ─── */
const PERIODS = [
  { key: 'daily',     label: '1 Kunlik' },
  { key: 'weekly',    label: '1 Haftalik' },
  { key: 'monthly',   label: 'Oylik' },
  { key: 'quarterly', label: '3 Oylik (Chorak)' },
  { key: 'annual',    label: 'Yillik' },
  { key: 'custom',    label: 'Tanlangan sana' },
] as const;
type PeriodKey = typeof PERIODS[number]['key'];

/* ─── KPI Rate constants (must match lib/kpi.ts) ─── */
const RATES = [
  { label: "B/S (O'z hisobidan)", rate: '-2.5% / kun', color: 'amber',  detail: 'Har bir ishlanmagan kun uchun chegirma' },
  { label: 'B/L (Kasallik Varaqasi)', rate: '-1.5% / kun', color: 'rose',  detail: '3 kundan ortiq kasallik kunlari uchun' },
  { label: 'Smenaga Kechikish',   rate: '-0.8% / soat', color: 'purple', detail: 'Turnikentdan kechikib o\'tilgan har soat uchun' },
  { label: 'Intizomiy Jazo',      rate: 'KPI = 0%',    color: 'red',    detail: 'Faol intizomiy chora → BUTUN mukofot yo\'qoladi' },
];

const COLOR_MAP: Record<string, string> = {
  amber: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  rose: 'border-rose-500/30 bg-rose-500/5 text-rose-400',
  purple: 'border-purple-500/30 bg-purple-500/5 text-purple-400',
  red: 'border-red-600/40 bg-red-600/8 text-red-400',
};

/* ─── Custom Tooltip for bar charts ─── */
const KpiTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs shadow-2xl">
      <p className="font-bold text-white mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}%</strong>
        </p>
      ))}
    </div>
  );
};

/* ─── Exec status badge ─── */
function ExecBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    "A'lo": 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    'Qoniqarli': 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    'Quyi': 'bg-rose-500/15 border-rose-500/30 text-rose-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cfg[status] || cfg['Qoniqarli']}`}>
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════ */
export const KpiEngineDashboard: React.FC = () => {
  const [period, setPeriod] = useState<PeriodKey>('monthly');
  const [month, setMonth] = useState('2026-08');
  
  // Custom date range state
  const [startDate, setStartDate] = useState('2026-04-15');
  const [endDate, setEndDate] = useState('2026-05-20');

  const [activeView, setActiveView] = useState<'charts' | 'table' | 'svodka'>('charts');

  const [records, setRecords] = useState<any[]>([]);
  const [deptStats, setDeptStats] = useState<any[]>([]);
  const [svodka, setSvodka] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // Table Department Filter state
  const [tableDeptFilter, setTableDeptFilter] = useState<string>('');
  const [tableDeptDropdownOpen, setTableDeptDropdownOpen] = useState(false);
  const [deptSearchVal, setDeptSearchVal] = useState('');

  // Table Sort state
  const [sortKey, setSortKey] = useState<string>('finalKpiPct');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Executive Svod Search state
  const [svodSearch, setSvodSearch] = useState('');

  const svodkaRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ 
      period, 
      month, 
      ref: new Date().toISOString(),
      ...(period === 'custom' ? { startDate, endDate } : {})
    });
    fetch(`/api/kpi?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setRecords(data.records || []);
          setDeptStats(data.departmentStats || []);
          setSvodka(data.svodka || []);
          setDateRange(data.dateRange || null);
        }
      })
      .finally(() => setLoading(false));
  }, [period, month, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await fetch('/api/kpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(`Xatolik: ${data.error}`);
      }
    } catch {
      alert('Tarmoq xatoligi');
    } finally {
      setCalculating(false);
    }
  };

  // ── Chart data: Top 5 + Bottom 5 KPI depts ──
  const sortedDepts = useMemo(() => {
    return [...deptStats]
      .filter(d => d.totalEmployees > 0)
      .sort((a, b) => b.avgKpi - a.avgKpi);
  }, [deptStats]);

  const top5 = sortedDepts.slice(0, 5).map(d => ({ ...d, group: 'top' }));
  const bottom5 = sortedDepts.slice(-5).reverse().map(d => ({ ...d, group: 'bottom' }));
  const barData = [...top5, ...bottom5].map(d => ({
    name: d.code,
    fullName: d.name,
    kpi: d.avgKpi,
    group: d.group,
  }));

  // ── Attendance/Penalty breakdown ──
  const totalRecords = records.length;
  const lockedCount = records.filter(r => r.disciplinaryLock).length;
  const perfectCount = records.filter(r => !r.disciplinaryLock && r.deductionPercentage === 0).length;
  const penalizedCount = totalRecords - lockedCount - perfectCount;

  const breakdownData = [
    { name: 'To\'liq intizomli (100% KPI)', value: Math.round((perfectCount / Math.max(totalRecords, 1)) * 100), fill: '#10b981' },
    { name: 'Chegirma bor (Teilna jarimali)', value: Math.round((penalizedCount / Math.max(totalRecords, 1)) * 100), fill: '#f59e0b' },
    { name: 'Intizomiy blok (0% KPI)', value: Math.round((lockedCount / Math.max(totalRecords, 1)) * 100), fill: '#ef4444' },
  ];

  // ── Unique Departments list for Employee Table Combobox ──
  const uniqueDepartments = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code: string; count: number }>();
    records.forEach(r => {
      const dept = r.employee?.currentDepartment;
      if (dept) {
        if (!map.has(dept.id)) {
          map.set(dept.id, { id: dept.id, name: dept.name, code: dept.code, count: 1 });
        } else {
          map.get(dept.id)!.count += 1;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);

  const filteredDeptsForCombobox = useMemo(() => {
    if (!deptSearchVal) return uniqueDepartments;
    const q = deptSearchVal.toLowerCase();
    return uniqueDepartments.filter(d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q));
  }, [uniqueDepartments, deptSearchVal]);

  const selectedDeptObj = useMemo(() => {
    return uniqueDepartments.find(d => d.id === tableDeptFilter);
  }, [uniqueDepartments, tableDeptFilter]);

  // ── Table Dept Filter & Sort ──
  const filteredRecords = useMemo(() => {
    if (!tableDeptFilter) return records;
    return records.filter(r => {
      const deptId = r.employee?.currentDepartmentId || r.employee?.currentDepartment?.id;
      return deptId === tableDeptFilter;
    });
  }, [records, tableDeptFilter]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [filteredRecords, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // ── Executive Svod Filter ──
  const filteredSvodka = useMemo(() => {
    if (!svodSearch) return svodka;
    const q = svodSearch.toLowerCase();
    return svodka.filter(s => s.deptName.toLowerCase().includes(q) || s.deptCode.toLowerCase().includes(q));
  }, [svodka, svodSearch]);

  // ── Export svodka as CSV ──
  const exportCsv = () => {
    if (!filteredSvodka.length) return;
    const header = "Bo'lim,Kod,Umumiy Xodimlar,O'rtacha KPI %,Jazo Soni,Toza Davomat %,Holati";
    const rows = filteredSvodka.map(s =>
      `"${s.deptName}","${s.deptCode}",${s.totalWorkers},${s.avgKpiPct},${s.penaltyCount},${s.cleanAttendancePct}%,"${s.execStatus}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kpi-svodka-${period}-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Company-wide avg KPI
  const avgKpi = totalRecords > 0
    ? Math.round(records.reduce((s, r) => s + (r.finalKpiPct ?? r.attendanceRate ?? 0), 0) / totalRecords * 10) / 10
    : 0;

  return (
    <div className="space-y-5">

      {/* ── TOP HEADER ── */}
      <div className="glass-panel rounded-2xl border border-slate-800 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Calculator className="h-6 w-6 text-indigo-400" />
              KPI & Samaradorlik Baholash Dvigateli
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              B/S, B/L, Kechikish va Intizomiy chora asosida KPI foiz ko'rsatkichini avtomatik hisoblash
              {dateRange && (
                <span className="ml-2 font-mono text-indigo-400">
                  [{new Date(dateRange.start).toLocaleDateString('uz-UZ')} — {new Date(dateRange.end).toLocaleDateString('uz-UZ')}]
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {/* Month picker (only relevant for monthly) */}
            {period === 'monthly' && (
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Hisob Oyi:</label>
                <input
                  type="month"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
            <button
              onClick={handleCalculate}
              disabled={calculating || period !== 'monthly'}
              title={period !== 'monthly' ? 'KPI saqlash faqat Oylik rejimda ishlaydi' : ''}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-40 transition"
            >
              {calculating
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RotateCcw className="h-4 w-4" />
              }
              Oylik KPI Hisoblash
            </button>
          </div>
        </div>

        {/* ── PERIOD SWITCHER & CUSTOM DATE PICKER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/70 border border-slate-800">
            <Calendar className="h-3.5 w-3.5 text-slate-500 ml-1.5" />
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  period === p.key
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker Inputs */}
          {period === 'custom' && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 border border-slate-700/80 p-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Dan:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <span className="text-slate-500 font-bold">—</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Gacha:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RULES / RATE CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {RATES.map(r => (
          <div key={r.label} className={`glass-card rounded-xl p-3.5 border space-y-1 ${COLOR_MAP[r.color]}`}>
            <div className="flex items-center justify-between font-bold">
              <span>{r.label}</span>
              <span className="font-mono text-sm">{r.rate}</span>
            </div>
            <p className="text-[11px] opacity-70">{r.detail}</p>
          </div>
        ))}
      </div>

      {/* ── SUMMARY STAT PILLS ── */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Hisoblangan Xodimlar', value: totalRecords, icon: Users, color: 'indigo' },
            { label: "O'rtacha Kompaniya KPI", value: `${avgKpi}%`, icon: Percent, color: avgKpi >= 90 ? 'emerald' : avgKpi >= 70 ? 'amber' : 'rose' },
            { label: "Intizomiy Blok (0% KPI)", value: lockedCount, icon: Lock, color: 'rose' },
            { label: "To'liq Intizomli (100%)", value: perfectCount, icon: CheckCircle2, color: 'emerald' },
          ].map(s => {
            const Icon = s.icon;
            const cls: Record<string, string> = {
              indigo: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400',
              emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
              amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
              rose: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
            };
            return (
              <div key={s.label} className={`glass-card rounded-xl border p-4 ${cls[s.color]}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 opacity-80" />
                  <span className="text-[10px] font-semibold opacity-70 uppercase tracking-wider">{s.label}</span>
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VIEW TABS ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/70 border border-slate-800 w-fit">
        {[
          { key: 'charts', label: 'Analitika Grafiklar', icon: BarChart3 },
          { key: 'table',  label: 'Xodimlar KPI Jadvali', icon: Table2 },
          { key: 'svodka', label: "Bo'limlar Svod", icon: Building },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeView === tab.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ VIEW: CHARTS ═══ */}
      {activeView === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Left: Top 5 vs Bottom 5 KPI horizontal bar chart */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              Top 5 va Eng Past 5 KPI Bo'limlari
            </h3>
            {loading ? (
              <div className="h-72 flex items-center justify-center text-slate-500 text-xs gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />Yuklanmoqda...
              </div>
            ) : barData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-500 text-xs">
                Ma'lumot yo'q — avval KPI hisoblang
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#475569" fontSize={10} tickFormatter={v => `${v}%`} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={10}
                      width={56}
                      tick={{ fill: '#94a3b8' }}
                    />
                    <ReferenceLine x={70} stroke="#6366f1" strokeDasharray="4 4" label={{ value: '70%', fill: '#6366f1', fontSize: 10 }} />
                    <Tooltip content={<KpiTooltip />} />
                    <Bar dataKey="kpi" name="O'rtacha KPI %" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {barData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.group === 'top' ? '#10b981' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex items-center gap-4 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />Top 5 (Eng yaxshi)</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-rose-500 inline-block" />Eng past 5</span>
              <span className="flex items-center gap-1"><span className="h-0.5 w-5 bg-indigo-500 inline-block border-dashed border-t-2 border-indigo-500" />70% chegara</span>
            </div>
          </div>

          {/* Right: Company-wide attendance/penalty breakdown */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-400" />
              Kompaniya Davomat va Jazo Taqsimoti (%)
            </h3>
            {loading ? (
              <div className="h-72 flex items-center justify-center text-slate-500 text-xs gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />Yuklanmoqda...
              </div>
            ) : totalRecords === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-500 text-xs">
                Ma'lumot yo'q — avval KPI hisoblang
              </div>
            ) : (
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdownData} layout="vertical" margin={{ left: 10, right: 30, top: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} stroke="#475569" fontSize={10} tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={9} width={160} tick={{ fill: '#94a3b8' }} />
                      <Tooltip content={<KpiTooltip />} />
                      <Bar dataKey="value" name="Ulush %" radius={[0, 6, 6, 0]} maxBarSize={26}>
                        {breakdownData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Count cards */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                    <p className="text-xl font-bold text-emerald-400">{perfectCount}</p>
                    <p className="text-[10px] text-emerald-400/70 mt-0.5">100% KPI</p>
                  </div>
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                    <p className="text-xl font-bold text-amber-400">{penalizedCount}</p>
                    <p className="text-[10px] text-amber-400/70 mt-0.5">Chegirmali</p>
                  </div>
                  <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3">
                    <p className="text-xl font-bold text-rose-400">{lockedCount}</p>
                    <p className="text-[10px] text-rose-400/70 mt-0.5">0% (Jazo)</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ VIEW: EMPLOYEE KPI TABLE ═══ */}
      {activeView === 'table' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Xodimlar KPI Ko'rsatkichlari Jadvali</span>
              <span className="text-xs font-mono text-indigo-400">({sortedRecords.length} / {totalRecords} kishi)</span>
            </h3>

            {/* Department Combobox Filter */}
            <div className="relative min-w-[280px]">
              <button
                type="button"
                onClick={() => setTableDeptDropdownOpen(!tableDeptDropdownOpen)}
                className="w-full flex items-center justify-between rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 text-left focus:border-indigo-500 focus:outline-none"
              >
                <span className="truncate">
                  {selectedDeptObj
                    ? `[${selectedDeptObj.code}] ${selectedDeptObj.name}`
                    : `Barcha Bo'limlar (${totalRecords} kishi)`
                  }
                </span>
                <Building2 className="h-3.5 w-3.5 text-indigo-400 ml-2 shrink-0" />
              </button>

              {tableDeptDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-72 max-h-60 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 space-y-1">
                  <div className="relative mb-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <input
                      type="text"
                      value={deptSearchVal}
                      onChange={(e) => setDeptSearchVal(e.target.value)}
                      placeholder="Bo'lim nomini yozing..."
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 py-1.5 pl-8 pr-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => {
                      setTableDeptFilter('');
                      setTableDeptDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded-lg font-semibold transition ${
                      !tableDeptFilter ? 'bg-indigo-600 text-white' : 'text-indigo-400 hover:bg-slate-800'
                    }`}
                  >
                    -- Barcha Bo'limlar ({totalRecords} kishi) --
                  </button>
                  {filteredDeptsForCombobox.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setTableDeptFilter(d.id);
                        setTableDeptDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between text-left px-2 py-1.5 text-xs rounded-lg transition ${
                        tableDeptFilter === d.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate mr-2">
                        <span className="font-mono text-indigo-300 mr-1">[{d.code}]</span>
                        {d.name}
                      </span>
                      <span className="text-[10px] opacity-70 font-mono">({d.count})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Badge indicator */}
          {selectedDeptObj && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400">
                <Building2 className="h-3.5 w-3.5" />
                {selectedDeptObj.name}: <strong className="text-white ml-1">{sortedRecords.length} kishi ko'rsatilmoqda</strong>
                <button
                  onClick={() => setTableDeptFilter('')}
                  className="ml-1 text-indigo-400 hover:text-white"
                  title="Filtrni tozalash"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Xodim (Tabel №)</th>
                  <th className="px-4 py-3">Bo'lim</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('unworkedDays')}>
                    B/S (kun) {sortKey === 'unworkedDays' && (sortDir === 'desc' ? <ChevronDown className="inline h-3 w-3" /> : <ChevronUp className="inline h-3 w-3" />)}
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('sickDays')}>
                    B/L (kun) {sortKey === 'sickDays' && (sortDir === 'desc' ? <ChevronDown className="inline h-3 w-3" /> : <ChevronUp className="inline h-3 w-3" />)}
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('lateHours')}>
                    Kechikish {sortKey === 'lateHours' && (sortDir === 'desc' ? <ChevronDown className="inline h-3 w-3" /> : <ChevronUp className="inline h-3 w-3" />)}
                  </th>
                  <th className="px-4 py-3">Chegirma %</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('finalKpiPct')}>
                    KPI Holat {sortKey === 'finalKpiPct' && (sortDir === 'desc' ? <ChevronDown className="inline h-3 w-3" /> : <ChevronUp className="inline h-3 w-3" />)}
                  </th>
                  <th className="px-4 py-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('finalKpiPct')}>
                    KPI %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-slate-400"><Loader2 className="h-5 w-5 animate-spin inline mr-2 text-indigo-400" />Yuklanmoqda...</td></tr>
                ) : sortedRecords.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-slate-400">
                    {tableDeptFilter ? "Tanlangan bo'limda xodimlar topilmadi." : "Hali KPI hisoblanmagan. \"Oylik KPI Hisoblash\" tugmasini bosing."}
                  </td></tr>
                ) : (
                  sortedRecords.map((r) => {
                    const kpiPct = r.finalKpiPct ?? r.attendanceRate ?? 0;
                    const isLocked = r.disciplinaryLock;
                    const isPerfect = !isLocked && r.deductionPercentage === 0;
                    return (
                      <tr key={r.id} className={`transition group ${isLocked ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-slate-900/60'}`}>
                        <td className="px-4 py-3 font-sans">
                          <div className="flex items-center gap-2">
                            {isLocked && <Lock className="h-3 w-3 text-rose-500 flex-shrink-0" />}
                            <span className="font-mono text-indigo-400">[{r.employee.tabelNumber}]</span>
                            <span className="font-semibold text-slate-200">{r.employee.lastName} {r.employee.firstName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-300 text-[11px]">
                          {r.employee.currentDepartment?.name}
                        </td>
                        <td className={`px-4 py-3 font-bold ${r.unworkedDays > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                          {r.unworkedDays}
                        </td>
                        <td className={`px-4 py-3 font-bold ${r.sickDays > 0 ? 'text-rose-400' : 'text-slate-600'}`}>
                          {r.sickDays}
                        </td>
                        <td className={`px-4 py-3 font-bold ${r.lateHours > 0 ? 'text-purple-400' : 'text-slate-600'}`}>
                          {r.lateHours > 0 ? `${Number(r.lateHours).toFixed(1)}h` : '—'}
                        </td>
                        <td className={`px-4 py-3 font-bold ${r.deductionPercentage > 0 ? 'text-rose-400' : 'text-emerald-500'}`}>
                          {r.deductionPercentage > 0 ? `-${r.deductionPercentage}%` : '0%'}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                              <ShieldAlert className="h-2.5 w-2.5" />JAZO BLOKI
                            </span>
                          ) : isPerfect ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 className="h-2.5 w-2.5" />MUKAMMAL
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                              <TrendingDown className="h-2.5 w-2.5" />CHEGIRMA
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-bold ${
                            isLocked ? 'text-rose-400' :
                            kpiPct >= 90 ? 'text-emerald-400' :
                            kpiPct >= 70 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {isLocked ? '0%' : `${kpiPct}%`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ VIEW: EXECUTIVE SVODKA ═══ */}
      {activeView === 'svodka' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4" ref={svodkaRef}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="h-4 w-4 text-indigo-400" />
                Bo'limlar Svod Kordinatsiyasi (Executive Report)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Rahbariyat uchun bo'limlar bo'yicha umumlashtirilgan KPI va davomat hisoboti
              </p>
            </div>
            <button
              onClick={exportCsv}
              disabled={!filteredSvodka.length}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-40 transition shrink-0"
            >
              <Download className="h-4 w-4" />
              Svodkani CSV saqlash
            </button>
          </div>

          {/* Svod Live Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={svodSearch}
              onChange={(e) => setSvodSearch(e.target.value)}
              placeholder="Bo'lim nomi yoki kodi (masalan: DEPT-03, Bo'yoqlash)..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 py-2 pl-9 pr-8 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            {svodSearch && (
              <button
                onClick={() => setSvodSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {svodSearch && (
            <p className="text-[11px] text-indigo-400 font-mono">
              Qidiruv natijasi: {filteredSvodka.length} ta bo'lim topildi
            </p>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Bo'lim Nomi</th>
                  <th className="px-4 py-3">Kod</th>
                  <th className="px-4 py-3 text-center">Jami Xodimlar</th>
                  <th className="px-4 py-3 text-center">O'rtacha KPI %</th>
                  <th className="px-4 py-3 text-center">Jazo Soni</th>
                  <th className="px-4 py-3 text-center">Toza Davomat %</th>
                  <th className="px-4 py-3 text-center">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-indigo-400" />Yuklanmoqda...
                  </td></tr>
                ) : filteredSvodka.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-slate-400">
                    {svodSearch ? "Qidiruv bo'yicha bo'lim topilmadi." : "Hali ma'lumot yo'q — KPI hisoblang."}
                  </td></tr>
                ) : (
                  filteredSvodka.map((s, i) => (
                    <tr key={s.deptId} className="hover:bg-slate-900/60 transition">
                      <td className="px-4 py-3 font-mono text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{s.deptName}</td>
                      <td className="px-4 py-3 font-mono text-indigo-300">{s.deptCode}</td>
                      <td className="px-4 py-3 text-center font-mono text-slate-300">{s.totalWorkers}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold font-mono text-sm ${
                          s.avgKpiPct >= 90 ? 'text-emerald-400' :
                          s.avgKpiPct >= 70 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {s.avgKpiPct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.penaltyCount > 0 ? (
                          <span className="font-bold text-rose-400 font-mono">{s.penaltyCount}</span>
                        ) : (
                          <span className="text-emerald-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-mono font-semibold ${
                          s.cleanAttendancePct >= 90 ? 'text-emerald-400' :
                          s.cleanAttendancePct >= 70 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {s.cleanAttendancePct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ExecBadge status={s.execStatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />A'lo: KPI ≥ 90%</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Qoniqarli: KPI 70–89%</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Quyi: KPI &lt; 70%</span>
          </div>
        </div>
      )}
    </div>
  );
};
