'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Palmtree,
  Stethoscope,
  FileClock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
  ChevronRight,
  TrendingUp,
  PieChart as PieChartIcon,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  Award,
  Sparkles,
  Zap,
  BarChart3,
  Activity,
  HardHat,
  HeartPulse,
  ShieldCheck,
  Check,
  X,
  FileText,
  Megaphone,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDate } from '@/lib/utils';
import { AnnouncementDetailModal, AnnouncementType } from './AnnouncementDetailModal';

interface DashboardOverviewViewProps {
  onSelectEmployee: (id: string) => void;
  onNavigateTab: (tabId: string) => void;
}

export const DashboardOverviewView: React.FC<DashboardOverviewViewProps> = ({
  onSelectEmployee,
  onNavigateTab,
}) => {
  const { t, language } = useLanguage();
  const { theme }        = useTheme();
  const isDarkMode       = theme === 'dark';

  const [loading, setLoading]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [mounted, setMounted]                 = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Executive BI Control Tower State
  const [metrics, setMetrics] = useState({
    totalStaff: 1520,
    presentToday: 1385,
    annualLeave: 42,
    sickLeave: 18,
    unpaidLeave: 12,
    studyLeave: 5,
    pendingAppsCount: 6,
    expiringPermitsCount: 9,
    turnoverRate: 3.4,
    kpiScoreAvg: 92.8,
  });

  const [pendingRequests, setPendingRequests]   = useState<any[]>([]);
  const [departmentBudgets, setDepartmentBudgets] = useState<any[]>([]);

  // System Announcements State
  const [announcements, setAnnouncements]       = useState<AnnouncementType[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementType | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      // Fetch leave requests for Pending Approvals Drawer
      const reqRes = await fetch('/api/leave-requests?status=PENDING');
      const reqData = await reqRes.json();

      let fetchedRequests = [];
      if (reqData.success && Array.isArray(reqData.requests)) {
        fetchedRequests = reqData.requests.slice(0, 5);
        setPendingRequests(fetchedRequests);
      }

      // Fetch Executive BI Analytics
      const analyticsRes = await fetch('/api/analytics/executive');
      const analyticsData = await analyticsRes.json();

      if (analyticsData.success && analyticsData.data) {
        const d = analyticsData.data;
        const total = d.summary?.totalWorkforce || 1520;
        const sick = d.summary?.sickLeaveDaysTotal || 18;
        const pendingCount = reqData.stats?.pending ?? (fetchedRequests.length || 6);

        setMetrics((prev) => ({
          ...prev,
          totalStaff: total,
          sickLeave: sick,
          pendingAppsCount: pendingCount,
          expiringPermitsCount: (d.complianceStats?.medicalExpired || 0) + (d.complianceStats?.permitExpired || 0) || 9,
          turnoverRate: d.summary?.turnoverRate || 3.4,
          kpiScoreAvg: d.summary?.kpiScoreAvg || 92.8,
        }));

        if (Array.isArray(d.headcountBudget)) {
          setDepartmentBudgets(d.headcountBudget.slice(0, 8));
        }
      }

      // Fetch System Announcements
      const annRes = await fetch('/api/announcements');
      const annData = await annRes.json();
      if (annData.success && Array.isArray(annData.announcements)) {
        setAnnouncements(annData.announcements);
      }
    } catch (e) {
      // silent catch
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchDashboardData();
      } catch (e) {
        // silent catch
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    loadData();
  }, []);

  // Quick Approval / Rejection Handler
  const handleApprovalAction = async (requestId: string, action: 'approve' | 'reject') => {
    setActionLoadingId(requestId);
    try {
      const url = `/api/leave-requests/${requestId}/${action}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverName: language === 'kr' ? '대표이사 (전자서명)' : 'Bosh Direktor (Elektron Imzo)',
          comment: action === 'approve' ? 'BI Dashboard Approved' : 'BI Dashboard Rejected',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        setMetrics((prev) => ({
          ...prev,
          pendingAppsCount: Math.max(0, prev.pendingAppsCount - 1),
        }));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Server Connection Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── DERIVED CALCULATIONS & CHARTS DATA ────────────────────────────────────
  const presentPct = Math.round((metrics.presentToday / metrics.totalStaff) * 100) || 91;
  const totalActiveLeaves = metrics.annualLeave + metrics.sickLeave + metrics.unpaidLeave + metrics.studyLeave;

  // 1. Donut Chart Data (Attendance & Leaves Distribution)
  const donutData = useMemo(() => [
    { name: t('chart.present', 'Ishda'), value: metrics.presentToday, color: '#10b981' },
    { name: t('chart.annual_leave', "Mehnat ta'tili"), value: metrics.annualLeave, color: '#f59e0b' },
    { name: t('chart.sick_leave', 'Vaqtincha layoqatsiz (B/L)'), value: metrics.sickLeave, color: '#f43f5e' },
    { name: t('chart.unpaid_leave', "O'z hisobidan (B/S)"), value: metrics.unpaidLeave, color: '#a855f7' },
    { name: t('chart.study_leave', "O'qish ta'tili"), value: metrics.studyLeave, color: '#06b6d4' },
  ], [metrics, t]);

  // 2. Turnover & Attrition Grouped Bar Chart Data (Top 8 Departments)
  const turnoverChartData = useMemo(() => [
    { name: language === 'kr' ? '프레스1공장' : 'Shtamplash #1', hires: 14, terminations: 3 },
    { name: language === 'kr' ? '용접공장' : 'Payvandlash Sex', hires: 18, terminations: 7 },
    { name: language === 'kr' ? '도장공장' : "Bo'yoqlash Sex", hires: 9, terminations: 2 },
    { name: language === 'kr' ? '조립라인 A/B' : "Yig'uv Line A/B", hires: 22, terminations: 12 },
    { name: language === 'kr' ? '물류/지게차' : 'Logistika & KARA', hires: 11, terminations: 1 },
    { name: language === 'kr' ? '엔진공장' : 'Dvigatel Sexi', hires: 15, terminations: 4 },
    { name: language === 'kr' ? '품질관리(QC)' : 'OTK & Sifat Nazorati', hires: 6, terminations: 1 },
    { name: language === 'kr' ? '경영/HR' : "Ma'muriyat & HR", hires: 4, terminations: 0 },
  ], [language]);

  // 3. Headcount Budget vs Actual Stacked Bar Chart Data
  const headcountChartData = useMemo(() => {
    if (departmentBudgets.length > 0) {
      return departmentBudgets.map((b) => ({
        name: b.departmentName?.replace(" (Ishlab chiqarish)", "") || (language === 'kr' ? "부서" : "Bo'lim"),
        actual: b.actual || 0,
        vacancies: b.vacancies || 0,
        planned: b.planned || 0,
      }));
    }
    return [
      { name: language === 'kr' ? '프레스공장' : 'Shtamplash Sexi', actual: 432, vacancies: 18, planned: 450 },
      { name: language === 'kr' ? '주조메카닉' : 'Quyuv-Mexanika', actual: 265, vacancies: 15, planned: 280 },
      { name: language === 'kr' ? '물류지게차' : 'Logistika & KARA', actual: 186, vacancies: 4, planned: 190 },
      { name: language === 'kr' ? '품질검사' : 'Texnik Nazorat', actual: 115, vacancies: 5, planned: 120 },
      { name: language === 'kr' ? '동력정비' : 'Energetika Sexi', actual: 152, vacancies: 8, planned: 160 },
      { name: language === 'kr' ? '경영HR' : "Ma'muriyat & HR", actual: 58, vacancies: 2, planned: 60 },
    ];
  }, [departmentBudgets, language]);

  // 4. Performance & Payroll Bonus 6-Month Trend Data
  const trendPerformanceData = useMemo(() => [
    { month: language === 'kr' ? '3월' : 'Mart', kpiScore: 88.5, bonusFundMln: 420 },
    { month: language === 'kr' ? '4월' : 'Aprel', kpiScore: 89.2, bonusFundMln: 445 },
    { month: language === 'kr' ? '5월' : 'May', kpiScore: 91.0, bonusFundMln: 460 },
    { month: language === 'kr' ? '6월' : 'Iyun', kpiScore: 90.4, bonusFundMln: 455 },
    { month: language === 'kr' ? '7월' : 'Iyul', kpiScore: 91.8, bonusFundMln: 480 },
    { month: language === 'kr' ? '8월' : 'Avgust', kpiScore: 92.8, bonusFundMln: 495 },
  ], [language]);

  // Fallback pending requests for demonstration
  const displayPendingRequests =
    pendingRequests.length > 0
      ? pendingRequests
      : [
          {
            id: 'req-demo-1',
            type: 'MEHNAT_TATILI',
            employeeName: language === 'kr' ? '김철수 (대리)' : 'Ergashev Jamshid (Katta Usta)',
            departmentName: language === 'kr' ? '프레스공장' : 'Shtamplash Sexi',
            totalDays: 14,
            startDate: '2026-08-20',
            endDate: '2026-09-02',
            requestDate: '2026-08-15',
          },
          {
            id: 'req-demo-2',
            type: 'SICK_LEAVE_BL',
            employeeName: language === 'kr' ? '이영희 (엔지니어)' : 'Abdullayeva Malika (QC Injiniring)',
            departmentName: language === 'kr' ? '품질관리' : 'OTK Nazorati',
            totalDays: 5,
            startDate: '2026-08-16',
            endDate: '2026-08-21',
            requestDate: '2026-08-16',
          },
        ];

  return (
    <div className="space-y-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen p-1 transition-colors">
      
      {/* ── PAGE HEADER & BI CONTROL TOOLBAR ── */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            {t('dash.title', 'Asosiy Boshqaruv Paneli & Analitik Svodka')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {t('dash.subtitle', 'Korxona HR ko\'rsatkichlari va tezkor nazorat markazi')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {t('btn.refresh', 'Yangilash')}
          </button>

          <button
            onClick={() => onNavigateTab('svodka')}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md transition active:scale-95 cursor-pointer"
          >
            <Activity className="h-3.5 w-3.5" />
            {t('nav.svodka', 'Ijroiy Svodka')}
          </button>
        </div>
      </div>

      {/* ── SECTION 1: TOP 6 KPI PULSE CARDS STRIP ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Jami Shtat va Xodimlar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t('kpi.total_staff', 'Jami Shtat va Xodimlar')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {metrics.totalStaff}
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
              {language === 'kr' ? '↑ 전월 대비 +12명' : "↑ +12 ta o'sish (Oy)"}
            </span>
          </div>
        </div>

        {/* Card 2: Bugungi Davomat % */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t('kpi.present_today', 'Bugungi Davomat %')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400">
              {presentPct}%
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">
              {metrics.presentToday} / {metrics.totalStaff} {language === 'kr' ? '출근' : 'ishda'}
            </span>
          </div>
        </div>

        {/* Card 3: Kadrlar Qo'nimsizligi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t('kpi.turnover', "Kadrlar Qo'nimsizligi")}
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight text-purple-700 dark:text-purple-400">
              {metrics.turnoverRate}%
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
              {language === 'kr' ? '↓ 목표범위 내 (미만 5%)' : '↓ Me\'yorda (<5.0%)'}
            </span>
          </div>
        </div>

        {/* Card 4: Oylik O'rtacha KPI Bali */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t('kpi.avg_score', "Oylik O'rtacha KPI Bali")}
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight text-amber-700 dark:text-amber-400">
              {metrics.kpiScoreAvg}%
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
              {language === 'kr' ? '↑ 연중 최고 +2.1%' : '↑ +2.1% Yillik Maksimum'}
            </span>
          </div>
        </div>

        {/* Card 5: Faol Ta'tildagilar / BL */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t('kpi.on_leave_bl', "Faol Ta'tildagilar / BL")}
            </span>
            <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-center font-bold">
              <Palmtree className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight text-rose-700 dark:text-rose-400">
              {totalActiveLeaves} {language === 'kr' ? '명' : 'kishi'}
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">
              {metrics.annualLeave} {language === 'kr' ? '연차' : 'ta\'til'} · {metrics.sickLeave} B/L
            </span>
          </div>
        </div>

        {/* Card 6: Imzo Kutayotgan Arizalar Navbati */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t('kpi.pending_approval', 'Imzo Kutayotgan Arizalar Navbati')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center font-bold">
              <FileClock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight text-cyan-700 dark:text-cyan-400">
              {metrics.pendingAppsCount} {language === 'kr' ? '건' : 'ta'}
            </div>
            <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-bold">
              {language === 'kr' ? '결재 대기 중' : 'Rahbariyat Navbatida'}
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: AI SMART STRATEGIC INSIGHTS BANNER ── */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-blue-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-900 dark:text-indigo-300 uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-indigo-400 animate-spin" />
            {t('dash.ai_banner', 'AI Strategik Boshqaruv Xulosalari')}
          </div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
            {language === 'kr' ? '인공지능 분석 엔진' : 'Neyron Tarmoq Generatsiyasi'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* High Risk Alert */}
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold shrink-0 mt-0.5">
              🔴
            </div>
            <div>
              <div className="font-extrabold text-rose-900 dark:text-rose-300">{t('dash.high_risk', 'Yuqori xavf ogohlantirishlari')}</div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold mt-0.5 leading-snug">
                {language === 'kr'
                  ? '조립 A/B 라인의 퇴사율이 +5.2% 상승했습니다. 근무 환경점검이 권장됩니다.'
                  : "Yig'uv Line A/B sexida ishdan bo'shash sur'ati +5.2% ga yetdi. Mehnat sharoitlarini taftish qilish tavsiya etiladi."}
              </p>
            </div>
          </div>

          {/* Operational Warning */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shrink-0 mt-0.5">
              🟡
            </div>
            <div>
              <div className="font-extrabold text-amber-900 dark:text-amber-300">{t('dash.op_warning', 'Operatsion ogohlantirishlar')}</div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold mt-0.5 leading-snug">
                {language === 'kr'
                  ? `${metrics.expiringPermitsCount}명의 임직원 자격증 및 건강검진이 15일 이내 만료됩니다.`
                  : `${metrics.expiringPermitsCount} ta xodimning majburiy HSE med-ko'riq hamda kran ruxsatnomasi 15 kunda tugamoqda.`}
              </p>
            </div>
          </div>

          {/* Positive Metric */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0 mt-0.5">
              🟢
            </div>
            <div>
              <div className="font-extrabold text-emerald-900 dark:text-emerald-300">{t('dash.top_kpi', 'Samaradorlik Lideri')}</div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold mt-0.5 leading-snug">
                {language === 'kr'
                  ? '프레스1공장이 월간 KPI 96.4% 달성으로 전사 1위를 기록했습니다.'
                  : "Shtamplash sexida oylik KPI bali 96.4% ko'rsatkichga erishdi va korxonada 1-o'rinni egalladi."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION: SYSTEM ANNOUNCEMENTS & RELEASE NOTES FEED ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 border-l-4 border-l-blue-600 transition-all space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm">
              <Megaphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                {t('announcements.title', "Tizim Yangilanishlari va E'lonlar Markazi")}
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {language === 'kr' ? '실시간 시스템 업데이트, 모듈 변경 사항 및 주요 공지사항' : "Tizim versiyalari, yangi modullar va muhim e'lonlar markazi"}
              </p>
            </div>
          </div>

          {announcements.length > 0 && (
            <button
              onClick={() => setSelectedAnnouncement(announcements[0])}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <span>{t('btn.view_all', "Barchasini ko'rish")}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Latest 3 Announcements Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {announcements.slice(0, 3).map((item) => {
            const itemTitle = language === 'kr' ? item.title_kr : item.title_uz;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedAnnouncement(item)}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-400 dark:hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {item.category === 'FEATURE' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        🚀 {t('announcements.cat_feature', 'Yangi Imkoniyat')}
                      </span>
                    )}
                    {item.category === 'UPDATE' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                        🔄 {t('announcements.cat_update', "Modul O'zgarishi")}
                      </span>
                    )}
                    {item.category === 'IMPORTANT' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        ⚠️ {t('announcements.cat_important', 'Muhim E\'lon')}
                      </span>
                    )}
                    {item.category === 'MAINTENANCE' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        🛠️ {t('announcements.cat_maintenance', 'Texnik Ishlar')}
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {formatDate(item.createdAt || item.created_at || new Date().toISOString())}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-indigo-400 line-clamp-2 transition-colors">
                    {itemTitle}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>{item.affectedModule === 'ALL' ? (language === 'kr' ? '전체 모듈' : 'Barcha Modullar') : item.affectedModule}</span>
                  <span className="group-hover:translate-x-1 transition-transform text-blue-600">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ROW 2: TURNOVER & ATTRITION (GROUPED BAR) + REAL-TIME ATTENDANCE (DONUT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION 3: Turnover & Attrition Analysis by Department (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t('chart.turnover_title', "Bo'limlar Kesimida Kadrlar Oqimi (Keldi-Ketdi)")}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {language === 'kr' ? '신규 입사자(초록색) 대 퇴사자(빨간색) 현황' : 'Yangi ishga qabul qilinganlar (Yashil) va ishdan bo\'shatilganlar (Qizil) dinamikasi'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('transfers')}
              className="text-xs font-bold text-blue-700 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {t('nav.transfers', "Ko'chishlar Tarixi")}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-[280px] w-full pt-2">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnoverChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '10px' }} />
                  <Bar dataKey="hires" name={t('chart.hires', 'Ishga qabul qilinganlar')} fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="terminations" name={t('chart.terminations', "Ishdan bo'shatilganlar")} fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* SECTION 4: Real-time Attendance & Leave Status Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <PieChartIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t('chart.attendance_title', "Davomat va Ta'tillar Taqsimoti")}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {language === 'kr' ? '금일 출근 및 사유별 휴가/병가 비율' : 'Bugungi davomat va ta\'tillar nisbati'}
                </p>
              </div>
            </div>
          </div>

          {/* Donut Chart with Center Text */}
          <div className="h-[210px] w-full relative flex items-center justify-center">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Center Overlay Stats */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{presentPct}%</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 dark:text-emerald-400">
                {t('chart.present', 'Ishda')}
              </span>
            </div>
          </div>

          {/* Donut Custom Legend Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 truncate">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] truncate">{item.name}</span>
                </div>
                <span className="font-extrabold font-mono text-slate-900 dark:text-white ml-2 text-[11px]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 3: HEADCOUNT BUDGET vs VACANCIES + PERFORMANCE & PAYROLL BONUS TREND ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* SECTION 5: Headcount Budget vs Actual & Open Vacancies Stacked Bar (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t('chart.headcount_title', 'Shtat Rejasi vs Amaldagi Vakansiyalar')}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {language === 'kr' ? '부서별 승인 정원 대비 실제 인원 및 공석 (TO)' : 'Rejadagi shtat, amaldagi hodimlar va vakansiyalar (TO) nisbati'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('departments')}
              className="text-xs font-bold text-blue-700 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {t('nav.departments', "Ierarxiya")}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-[280px] w-full pt-2">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={headcountChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '10px' }} />
                  <Bar dataKey="actual" name={t('chart.actual_staff', 'Amaldagi xodimlar')} stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} maxBarSize={36} />
                  <Bar dataKey="vacancies" name={t('chart.open_vacancies', 'Ochiq vakansiyalar (TO)')} stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* SECTION 6: Performance Score & Payroll Bonus 6-Month Area Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t('chart.kpi_trend_title', 'Oylik KPI va Mukofot Pul Dinamikasi')}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {language === 'kr' ? '최근 6개월 평균 KPI 점수 및 성과급 지급 추이' : "So'nggi 6 oylik KPI bali va mukofot fondi o'sishi"}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('kpi')}
              className="text-xs font-bold text-blue-700 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {t('nav.kpi', 'KPI Engine')}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-[280px] w-full pt-2">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="kpiColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Area type="monotone" dataKey="kpiScore" name="O'rtacha KPI Bali (%)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#kpiColor)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 4: COMPLIANCE & SAFETY RISK RADAR + PENDING APPROVALS DRAWER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* SECTION 7: Compliance & Safety Permits Radar Gauges (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t('radar.title', "Med-ko'rik va Xavfsizlik Ruxsatnomalari Qamrovi")}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {language === 'kr' ? '법정 의무 검진 및 안전 허가서 이수율 현황' : "HSE majburiy guvohnomalari va tibbiy ko'rik ijrosi"}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('hse')}
              className="text-xs font-bold text-blue-700 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {t('nav.hse', 'HSE Moduli')}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-4 py-2">
            {/* Progress Bar 1: Med Checkup Valid */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HeartPulse className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {t('radar.med_valid', "Tibbiy ko'rik amalda")}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono">94.5%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: '94.5%' }} />
              </div>
            </div>

            {/* Progress Bar 2: Forklift Kara Permit */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HardHat className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  {t('radar.forklift', 'Kara minish ruxsatnomalari')}
                </span>
                <span className="text-purple-700 dark:text-purple-400 font-mono">88.2%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: '88.2%' }} />
              </div>
            </div>

            {/* Progress Bar 3: Phone & Security Clearance */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
                  {t('radar.phone_special', 'Telefon va maxsus ruxsatnomalar')}
                </span>
                <span className="text-blue-700 dark:text-indigo-400 font-mono">98.0%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: '98.0%' }} />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>{language === 'kr' ? '안전 관리 준수율' : 'Xavfsizlik Muvofiqlik Indeksi'}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-mono text-sm font-extrabold">93.6 / 100</span>
          </div>
        </div>

        {/* SECTION 8: Pending Approvals Quick Decision Table (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center font-bold">
                <FileClock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t('table.pending_title', 'Imzolanishi Kutilayotgan Arizalar Navbati')}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {language === 'kr' ? '경영진 직속 결재 대기 문서 및 즉시 승인' : 'Tezkor ko\'rib chiqish va 1-click tasdiqlash paneli'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('arizalar')}
              className="text-xs font-bold text-blue-700 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {t('nav.arizalar', 'Barcha Arizalar')}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2.5 text-left">{t('table.fio', 'F.I.O')}</th>
                  <th className="px-3 py-2.5 text-left">{t('table.req_type', 'Ariza Turi')}</th>
                  <th className="px-3 py-2.5 text-center">{t('davomat.col_days', 'Kunlar Soni')}</th>
                  <th className="px-3 py-2.5 text-left">{t('table.date', 'Yuborilgan Sana')}</th>
                  <th className="px-3 py-2.5 text-right">{t('table.actions', 'Harakatlar')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {displayPendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-slate-100">
                      <div>{req.employeeName || req.employee?.lastName + ' ' + req.employee?.firstName}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{req.departmentName || req.employee?.currentDepartment?.name}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        {req.type === 'MEHNAT_TATILI' ? (language === 'kr' ? '연차 휴가' : 'Mehnat ta\'tili') : req.type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-extrabold font-mono text-slate-900 dark:text-white">
                      {req.totalDays} {language === 'kr' ? '일' : 'kun'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                      {formatDate(req.requestDate || req.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleApprovalAction(req.id, 'approve')}
                          disabled={actionLoadingId === req.id}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-sm transition cursor-pointer"
                        >
                          {t('table.approve', 'Tasdiqlash')}
                        </button>
                        <button
                          onClick={() => handleApprovalAction(req.id, 'reject')}
                          disabled={actionLoadingId === req.id}
                          className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-300 hover:text-rose-600 font-bold text-[10px] transition cursor-pointer"
                        >
                          {t('table.reject', 'Rad etish')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Announcement Detail Modal */}
      <AnnouncementDetailModal
        announcement={selectedAnnouncement}
        isOpen={Boolean(selectedAnnouncement)}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </div>
  );
};
