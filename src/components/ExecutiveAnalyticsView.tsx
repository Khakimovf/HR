'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Activity,
  ShieldCheck,
  Award,
  Download,
  Loader2,
  RefreshCw,
  Building2,
  AlertTriangle,
  CheckCircle2,
  UserX,
  Sparkles,
  Users,
  UserCheck,
  HeartPulse,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Briefcase,
  Phone,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ExecutiveAnalyticsView: React.FC = () => {
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Top Toolbar Filter State
  const [period, setPeriod] = useState<string>('MONTHLY');
  const [compareMode, setCompareMode] = useState<string>('PREV_MONTH');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');

  // Status Filter Tab State inside Department Drill-Down View
  const [activeStatusTab, setActiveStatusTab] = useState<string>('ACTIVE');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        period,
        compareMode,
        departmentId: selectedDepartmentId,
      });
      const res = await fetch(`/api/analytics/executive?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || (language === 'kr' ? '분석 데이터를 불러오는 중 오류가 발생했습니다.' : "Tahliliy ma'lumotlarni yuklashda xatolik"));
      }
    } catch (err: any) {
      setError(language === 'kr' ? '네트워크 오류가 발생했습니다.' : "Tarmoq xatoligi yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, compareMode, selectedDepartmentId]);

  // Global Corporate Printable A4 PDF Executive Summary Report
  const handleExportPDF = () => {
    if (!data) return;
    const printWindow = window.open('', '_blank', 'width=1100,height=900');
    if (!printWindow) {
      alert(language === 'kr' ? '팝업이 차단되었습니다. 브라우저 설정을 확인하세요.' : 'Pop-up bloklangan. Brauzerdagi cheklovni olib tashlang.');
      return;
    }

    const {
      summary,
      smartInsights,
      headcountBudget,
    } = data;

    const printDate = new Date().toLocaleDateString(language === 'kr' ? 'ko-KR' : 'uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>EXECUTIVE HR ANALYTICS & STRATEGIC REPORT</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: Arial, sans-serif; font-size: 9.5pt; color: #1e293b; line-height: 1.4; margin: 0; padding: 0; background: #ffffff; }

            .header-box { background: #0f172a; color: #ffffff; padding: 14px 18px; border-radius: 6px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
            .header-title { font-size: 13pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
            .header-sub { font-size: 8.5pt; color: #94a3b8; margin-top: 2px; }

            .insights-box { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
            .insights-title { font-size: 9.5pt; font-weight: bold; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; }
            .insight-item { font-size: 8.5pt; margin-bottom: 4px; }

            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
            .kpi-card { border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px; border-radius: 6px; text-align: center; }
            .kpi-value { font-size: 16pt; font-weight: bold; color: #0284c7; }
            .kpi-label { font-size: 8pt; font-weight: 700; color: #475569; margin-top: 2px; text-transform: uppercase; }

            .section-title { font-size: 10pt; font-weight: bold; color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 3px; margin-top: 16px; margin-bottom: 8px; text-transform: uppercase; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
            th, td { border: 1px solid #94a3b8; padding: 5px 7px; font-size: 8.5pt; text-align: left; }
            th { background-color: #e2e8f0; color: #0f172a; font-weight: bold; text-transform: uppercase; font-size: 7.5pt; }
            tr:nth-child(even) { background-color: #f8fafc; }

            .signatures { margin-top: 25px; display: flex; justify-content: space-between; font-size: 8.5pt; }
            .sig-line { width: 180px; border-bottom: 1px solid #0f172a; margin-top: 22px; }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div>
              <div class="header-title">EXECUTIVE HR ANALYTICS & STRATEGIC REPORT</div>
              <div class="header-sub">Executive Leadership & Workforce Analytics • Period: ${period} (${printDate})</div>
            </div>
            <div style="text-align: right; font-size: 8.5pt;">
              <div>HR-EXECUTIVE-SYSTEM</div>
              <div style="color: #38bdf8; font-family: monospace;">CONFIDENTIAL</div>
            </div>
          </div>

          <div class="insights-box">
            <div class="insights-title">⚡ AI STRATEGIC EXECUTIVE INSIGHTS</div>
            ${smartInsights
              ?.map(
                (si: any) => `
              <div class="insight-item">
                <b>${si.type === 'HIGH_RISK' ? '🔴' : si.type === 'WARNING' ? '🟡' : '🟢'} ${si.title}:</b> ${si.text}
              </div>
            `
              )
              .join('')}
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-value" style="color: #dc2626;">${summary?.turnoverRateTotal || 0}%</div>
              <div class="kpi-label">Turnover Rate</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value" style="color: #d97706;">${summary?.totalVacancies || 0}</div>
              <div class="kpi-label">Total Vacancies</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value" style="color: #16a34a;">${summary?.hseCompliancePct || 0}%</div>
              <div class="kpi-label">HSE Medical Compliance</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value" style="color: #0284c7;">${summary?.avgDepartmentHealthScore || 0}%</div>
              <div class="kpi-label">Health Index</div>
            </div>
          </div>

          <div class="section-title">1. HEADCOUNT BUDGET & VACANCY ANALYSIS (PLANNED VS ACTUAL)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">№</th>
                <th>Department Name</th>
                <th style="text-align: center;">Planned (T.O)</th>
                <th style="text-align: center;">Actual Staff</th>
                <th style="text-align: center;">Vacancies</th>
                <th style="text-align: right;">Fill Rate %</th>
              </tr>
            </thead>
            <tbody>
              ${headcountBudget
                ?.slice(0, 15)
                .map(
                  (h: any, idx: number) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><b>[${h.departmentCode}]</b> ${h.departmentName}</td>
                  <td style="text-align: center;">${h.planned}</td>
                  <td style="text-align: center; font-weight: bold; color: #166534;">${h.actual}</td>
                  <td style="text-align: center; font-weight: bold; color: ${h.vacancies > 0 ? '#dc2626' : '#475569'};">${h.vacancies}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">${h.fillRatePct}%</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="signatures">
            <div>
              <div><b>General Director / CEO:</b> Nazarov B.</div>
              <div class="sig-line"></div>
            </div>
            <div>
              <div><b>HR Director:</b> Karimov J.</div>
              <div class="sig-line"></div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Single Department Printable A4 PDF Report with Position Vacancy Matrix & Roster
  const handleExportSingleDeptPDF = () => {
    if (!data || !data.selectedDepartmentDetails) return;
    const { selectedDepartmentDetails: dept } = data;

    const printWindow = window.open('', '_blank', 'width=1000,height=900');
    if (!printWindow) {
      alert(language === 'kr' ? '팝업이 차단되었습니다. 브라우저 설정을 확인하세요.' : 'Pop-up bloklangan. Brauzerdagi cheklovni olib tashlang.');
      return;
    }

    const printDate = new Date().toLocaleDateString(language === 'kr' ? 'ko-KR' : 'uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

    const vacancyRows = dept.positionVacancies
      .map(
        (pv: any, idx: number) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${pv.positionName}</b></td>
          <td style="text-align: center;">${pv.planned}</td>
          <td style="text-align: center; font-weight: bold; color: #166534;">${pv.actual}</td>
          <td style="text-align: center; font-weight: bold; color: ${pv.vacancies > 0 ? '#dc2626' : '#475569'};">${pv.vacancies}</td>
          <td style="text-align: right;"><span style="background: ${pv.vacancies > 0 ? '#fee2e2' : '#dcfce7'}; color: ${pv.vacancies > 0 ? '#991b1b' : '#166534'}; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 7.5pt;">${pv.statusBadge}</span></td>
        </tr>
      `
      )
      .join('');

    const rosterRows = dept.roster
      .map(
        (emp: any, idx: number) => `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: 700;">${emp.tabelNumber}</td>
          <td><b>${emp.fullName}</b></td>
          <td>${emp.position}</td>
          <td>${emp.statusStartDate}</td>
          <td style="font-weight: bold; color: #0284c7;">${emp.returnDate}</td>
          <td>${emp.phone}</td>
        </tr>
      `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DEPARTMENT PASSPORT & VACANCY MATRIX - ${dept.departmentName}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: Arial, sans-serif; font-size: 9.5pt; color: #1e293b; line-height: 1.4; margin: 0; padding: 0; background: #ffffff; }

            .header-box { background: #0f172a; color: #ffffff; padding: 14px 18px; border-radius: 6px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
            .header-title { font-size: 12pt; font-weight: 800; text-transform: uppercase; }
            .header-sub { font-size: 8.5pt; color: #94a3b8; margin-top: 2px; }

            .passport-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; }
            .passport-title { font-size: 8pt; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
            .passport-value { font-size: 11pt; font-weight: bold; color: #0f172a; }

            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
            .stat-card { border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px; border-radius: 6px; text-align: center; }
            .stat-val { font-size: 15pt; font-weight: bold; color: #0284c7; }
            .stat-lbl { font-size: 7.5pt; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 2px; }

            .section-header { font-weight: bold; text-transform: uppercase; font-size: 9.5pt; color: #0f172a; margin-top: 14px; margin-bottom: 6px; border-bottom: 2px solid #0284c7; padding-bottom: 2px; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
            th, td { border: 1px solid #94a3b8; padding: 5px 7px; font-size: 8.5pt; text-align: left; }
            th { background-color: #e2e8f0; color: #0f172a; font-weight: bold; text-transform: uppercase; font-size: 7.5pt; }
            tr:nth-child(even) { background-color: #f8fafc; }

            .signatures { margin-top: 25px; display: flex; justify-content: space-between; font-size: 8.5pt; }
            .sig-line { width: 180px; border-bottom: 1px solid #0f172a; margin-top: 22px; }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div>
              <div class="header-title">[${dept.departmentCode}] ${dept.departmentName} — DEPARTMENT PASSPORT</div>
              <div class="header-sub">Position Vacancy Matrix & Status Summary • ${printDate}</div>
            </div>
          </div>

          <div class="passport-grid">
            <div>
              <div class="passport-title">Department Head</div>
              <div class="passport-value">${dept.deptHead?.fullName || '—'}</div>
              <div style="font-size: 8pt; color: #64748b;">${dept.deptHead?.position || '—'} | Tel: ${dept.deptHead?.phone || '—'}</div>
            </div>
            <div>
              <div class="passport-title">Supervisor / Deputy</div>
              <div class="passport-value">${dept.supervisor?.fullName || '—'}</div>
              <div style="font-size: 8pt; color: #64748b;">${dept.supervisor?.position || '—'}</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-val">${dept.headcount.planned}</div>
              <div class="stat-lbl">Planned Staff</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #166534;">${dept.headcount.actual}</div>
              <div class="stat-lbl">Actual Staff</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: ${dept.headcount.vacancies > 0 ? '#dc2626' : '#475569'};">${dept.headcount.vacancies}</div>
              <div class="stat-lbl">Vacancies</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #0284c7;">${dept.headcount.fillRatePct}%</div>
              <div class="stat-lbl">Fill Rate %</div>
            </div>
          </div>

          <div class="section-header">1. POSITION VACANCY MATRIX</div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">№</th>
                <th>Position Name</th>
                <th style="text-align: center;">Planned</th>
                <th style="text-align: center;">Actual</th>
                <th style="text-align: center;">Vacancies</th>
                <th style="text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${vacancyRows}
            </tbody>
          </table>

          <div class="section-header">2. DEPARTMENT ROSTER & RETURN DATES (${dept.roster.length} EMPLOYEES)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">№</th>
                <th>Tabel №</th>
                <th>F.I.O</th>
                <th>Position</th>
                <th>Status Start</th>
                <th>Return Date</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              ${rosterRows}
            </tbody>
          </table>

          <div class="signatures">
            <div>
              <div><b>Department Head:</b> ${dept.deptHead?.fullName || '__________'}</div>
              <div class="sig-line"></div>
            </div>
            <div>
              <div><b>HR Director:</b> Karimov J.</div>
              <div class="sig-line"></div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading && !data) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-3">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
        <p className="text-slate-400 text-xs">
          {language === 'kr' ? '부서 패스포트 및 분석 데이터를 계산 중입니다...' : "Bo'lim pasporti, lavozimlar vakansiyasi matrixi va statuslar svodkasi hisoblanmoqda..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-rose-500/30 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
        <p className="text-rose-300 font-semibold text-sm">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-700 cursor-pointer"
        >
          {language === 'kr' ? '다시 시도' : 'Qayta urinish'}
        </button>
      </div>
    );
  }

  const {
    departmentsList = [],
    selectedDepartmentDetails,
    summary,
    smartInsights,
    headcountBudget,
    demographics,
    departmentHealthIndex,
  } = data || {};

  // Status Tab definitions for Section 2
  const statusTabsConfig = [
    { key: 'ACTIVE', label: t('dept_modal.status_present', 'Hozirda Ishda'), color: 'emerald' },
    { key: 'VACATION', label: t('dept_modal.status_annual_leave', "Mehnat ta'tili"), color: 'blue' },
    { key: 'SICK_LEAVE', label: t('dept_modal.status_sick_leave', 'Vaqtincha layoqatsizlik (B/L)'), color: 'amber' },
    { key: 'UNPAID_LEAVE', label: t('dept_modal.status_unpaid_leave', "O'z hisobidan ta'til (B/S)"), color: 'purple' },
    { key: 'STUDY_LEAVE', label: t('dept_modal.status_study_leave', "O'qish ta'tili"), color: 'indigo' },
    { key: 'ADMINISTRATIVE_LEAVE', label: t('dept_modal.status_admin_leave', "Administrativ ta'til"), color: 'rose' },
    { key: 'LATE_PERMIT', label: language === 'kr' ? '지각 / 허가서' : 'Kechikish / Ruxsatnoma', color: 'cyan' },
  ];

  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 space-y-6 text-xs p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* ── Top Header & Department Selector Toolbar ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 dark:bg-gradient-to-tr dark:from-indigo-600 dark:via-indigo-500 dark:to-purple-600 flex items-center justify-center shadow-md">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            {t('analytics.title', 'Rahbariyat Uchun Analitik Svodka')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 font-medium">
            {language === 'kr' ? '직위별 공석 현황(TO Matrix) 및 임직원 근태 상태 통합 분석' : "Lavozimlar kesimida vakansiyalar matrixi va 100% statuslar svodkasi"}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* DYNAMIC TOP TOOLBAR DEPARTMENT SELECTOR */}
          <div className="relative">
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs rounded-xl px-3 py-2.5 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">📍 {t('analytics.all_depts', "Barcha Bo'limlar (Umumiy Korxona Svodi)")}</option>
              {departmentsList.map((d: any) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  [{d.code}] {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Comparative Period Selectors */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-sm">
            <Filter className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 ml-1" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-2 py-1 font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="MONTHLY" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '월간' : 'Oylik Davr'}</option>
              <option value="YEARLY" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '연간' : 'Yillik Davr'}</option>
            </select>

            <select
              value={compareMode}
              onChange={(e) => setCompareMode(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-2 py-1 font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="PREV_MONTH" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '전월 대비' : "Solishtirish: O'tgan Oy"}</option>
              <option value="PREV_YEAR" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '전년 대비' : "Solishtirish: O'tgan Yil"}</option>
            </select>
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shadow-sm"
            title={language === 'kr' ? '새로고침' : "Ma'lumotlarni yangilash"}
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {!selectedDepartmentId ? (
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition cursor-pointer active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>📄 {t('analytics.export_pdf', 'PDF Analitik Svodka Yuklash')}</span>
            </button>
          ) : (
            <button
              onClick={handleExportSingleDeptPDF}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition cursor-pointer active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>📄 {t('dept_modal.export_pdf', "Ushbu Bo'lim Pasportini PDF Yuklash")}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── SINGLE DEPARTMENT DRILL-DOWN OVERHAUL ─── */}
      {selectedDepartmentId && selectedDepartmentDetails ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Return Quick Action Link */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">{language === 'kr' ? '선택된 부서:' : "Hozirgi bo'lim ko'rinishi:"}</span>
              <span className="font-extrabold text-blue-700 dark:text-indigo-400">
                [{selectedDepartmentDetails.departmentCode}] {selectedDepartmentDetails.departmentName}
              </span>
            </div>

            <button
              onClick={() => setSelectedDepartmentId('')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{language === 'kr' ? '전체 부서 (통합 요약)로 돌아가기' : "Barcha Bo'limlar (Umumiy Korxona Svodi) ga qaytish"}</span>
            </button>
          </div>

          {/* 1. TOP HEADER & LEADERSHIP PASSPORT */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 dark:text-indigo-400">
                  {t('dept_modal.title', "Bo'lim Pasporti va Chuqur Tahlili")}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                  [{selectedDepartmentDetails.departmentCode}] {selectedDepartmentDetails.departmentName}
                </h3>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-indigo-500/10 text-blue-800 dark:text-indigo-400 border border-blue-300 dark:border-indigo-500/20">
                <Building2 className="h-3.5 w-3.5" /> {language === 'kr' ? '직위 및 상태 분석' : 'Lavozimlar & Statuslar Tahlili'}
              </span>
            </div>

            {/* Leadership Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-200">
                  <UserCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  <span>{t('dept_modal.head', "Bo'lim Boshlig'i")}</span>
                </div>
                {selectedDepartmentDetails.deptHead ? (
                  <div className="space-y-1 pt-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedDepartmentDetails.deptHead.fullName}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      <span>{t('table.tabel_no', 'Tabel №')}: <strong className="text-blue-700 dark:text-indigo-400 font-bold">{selectedDepartmentDetails.deptHead.tabelNumber}</strong></span>
                      <span>{t('dept_modal.phone', 'Kontakt Telefon')}: <strong className="text-slate-900 dark:text-slate-200 font-bold">{selectedDepartmentDetails.deptHead.phone}</strong></span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-indigo-300 font-bold">{selectedDepartmentDetails.deptHead.position}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-500 italic font-medium">{language === 'kr' ? '부서장 미지정' : "Bo'lim boshlig'i biriktirilmagan"}</p>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-200">
                  <Users className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                  <span>{t('dept_modal.deputy', "Katta Usta / O'rinbosar")}</span>
                </div>
                {selectedDepartmentDetails.supervisor ? (
                  <div className="space-y-1 pt-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedDepartmentDetails.supervisor.fullName}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      {t('table.tabel_no', 'Tabel №')}: <strong className="text-blue-700 dark:text-indigo-400 font-bold">{selectedDepartmentDetails.supervisor.tabelNumber}</strong>
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-bold">{selectedDepartmentDetails.supervisor.position}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-500 italic font-medium">{language === 'kr' ? '현장 책임자 미지정' : 'Supervayzer biriktirilmagan'}</p>
                )}
              </div>
            </div>

            {/* High-level Headcount Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-50 dark:bg-slate-900/90 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">{t('analytics.planned', 'Tasdiqlangan Shtat (Reja)')}</span>
                <p className="text-xl font-mono font-extrabold text-slate-900 dark:text-slate-100">
                  {selectedDepartmentDetails.headcount.planned}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/90 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">{t('analytics.actual', 'Amaldagi Xodimlar (Fakt)')}</span>
                <p className="text-xl font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                  {selectedDepartmentDetails.headcount.actual}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/90 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">{t('dept_modal.missing_staff', 'Yetishmayotgan Odamlar (Vakansiya)')}</span>
                <p className={`text-xl font-mono font-extrabold ${
                  selectedDepartmentDetails.headcount.vacancies > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {selectedDepartmentDetails.headcount.vacancies}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/90 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">{t('analytics.fill_rate', "Shtat To'ldirilganlik %")}</span>
                <p className="text-xl font-mono font-extrabold text-blue-700 dark:text-indigo-300">
                  {selectedDepartmentDetails.headcount.fillRatePct}%
                </p>
              </div>
            </div>
          </div>

          {/* 2. SECTION 1: VACANCY MATRIX BY POSITION */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600 dark:text-indigo-400" />
                1. {t('dept_modal.vacancy_map', 'Lavozimlar Kesimida Vakansiyalar Xaritasi')}
              </h3>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                {language === 'kr' ? '공석 직위 수:' : 'Vakansiyali lavozimlar soni:'} <strong className="text-rose-700 dark:text-rose-400 font-bold">{selectedDepartmentDetails.positionVacancies?.filter((pv: any) => pv.vacancies > 0).length || 0}</strong>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase text-[10px] border-b border-slate-300 dark:border-slate-700 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">№</th>
                    <th className="px-4 py-3">{t('dept_modal.position_name', 'Lavozim Nomi')}</th>
                    <th className="px-4 py-3 text-center">{t('analytics.planned', 'Tasdiqlangan Shtat (Reja)')}</th>
                    <th className="px-4 py-3 text-center">{t('analytics.actual', 'Amaldagi Xodimlar (Fakt)')}</th>
                    <th className="px-4 py-3 text-center">{t('dept_modal.missing_staff', 'Yetishmayotgan Odamlar (Vakansiya)')}</th>
                    <th className="px-4 py-3 text-right">{t('table.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 font-mono">
                  {selectedDepartmentDetails.positionVacancies?.map((pv: any, idx: number) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-200 dark:border-slate-800 ${
                        pv.isUnderstaffed ? 'bg-rose-50/60 dark:bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-sans font-bold">{idx + 1}</td>
                      <td className="px-4 py-3 font-sans font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {pv.isUnderstaffed && <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />}
                        <span>{pv.positionName}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-800 dark:text-slate-300 font-semibold">{pv.planned}</td>
                      <td className="px-4 py-3 text-center text-emerald-700 dark:text-emerald-400 font-bold">{pv.actual}</td>
                      <td className="px-4 py-3 text-center">
                        {pv.vacancies > 0 ? (
                          <span className="font-bold text-rose-800 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-500/20">
                            {pv.vacancies} {language === 'kr' ? '명 부족' : 'ta odam yetishmayapti'}
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 font-normal">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-sans">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          pv.isUnderstaffed
                            ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
                            : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                        }`}>
                          {pv.statusBadge}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. SECTION 2: STATUS FILTER TABS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                2. {language === 'kr' ? '상태별 필터 (7개 공식 근태 상태)' : "Statuslar Bo'yicha Biriktirilgan Filter Lenta (7 ta Rasmiy Status)"}
              </h3>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{language === 'kr' ? '상태 선택:' : 'Kerakli statusni tanlang:'}</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {statusTabsConfig.map((tab) => {
                const count = selectedDepartmentDetails.statusCounts[tab.key] || 0;
                const isActive = activeStatusTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveStatusTab(tab.key)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-white text-blue-900 font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. SECTION 3: GRANULAR EMPLOYEE LIST TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                3. {language === 'kr' ? '선택 상태별 임직원 목록 및 복귀 예정일' : "Tanlangan Status Bo'yicha Xodimlar Ro'yxati VA Qaytish Sanalari"}
              </h3>

              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                {language === 'kr' ? '선택 상태:' : 'Saralangan status:'} <strong className="text-blue-700 dark:text-indigo-400 uppercase font-bold">{activeStatusTab}</strong>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase text-[10px] border-b border-slate-300 dark:border-slate-700 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">{t('dept_modal.seq', '№')}</th>
                    <th className="px-4 py-3">{t('dept_modal.tabel_no', 'Tabel №')}</th>
                    <th className="px-4 py-3">{t('dept_modal.fio', 'F.I.O')}</th>
                    <th className="px-4 py-3">{t('dept_modal.position', 'Lavozimi')}</th>
                    <th className="px-4 py-3">{t('dept_modal.status_start', 'Status Boshlanishi')}</th>
                    <th className="px-4 py-3">{t('dept_modal.return_date', 'Qaytish Sanasi / Muddati')}</th>
                    <th className="px-4 py-3 text-right">{t('dept_modal.phone', 'Kontakt Telefon')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 font-mono">
                  {selectedDepartmentDetails.roster
                    .filter((emp: any) => emp.statusCategory === activeStatusTab)
                    .map((emp: any, idx: number) => (
                      <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-200 dark:border-slate-800">
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-sans font-bold">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-blue-700 dark:text-indigo-400">[{emp.tabelNumber}]</td>
                        <td className="px-4 py-3 font-sans font-bold text-slate-900 dark:text-slate-100">{emp.fullName}</td>
                        <td className="px-4 py-3 font-sans text-slate-800 dark:text-slate-300 font-medium">{emp.position}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">{emp.statusStartDate}</td>
                        <td className="px-4 py-3 font-sans">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20">
                            <Calendar className="h-3 w-3" />
                            {emp.returnDate}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-800 dark:text-slate-300 font-sans font-medium">{emp.phone}</td>
                      </tr>
                    ))}

                  {selectedDepartmentDetails.roster.filter((emp: any) => emp.statusCategory === activeStatusTab).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-600 dark:text-slate-400 font-sans font-medium">
                        {language === 'kr' ? '해당 상태의 임직원이 없습니다.' : 'Ushbu status toifasida xodimlar topilmadi'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ─── GLOBAL CORPORATE MACRO SUMMARY VIEW ─── */
        <div className="space-y-6 animate-fadeIn">
          {/* AI SMART STRATEGIC INSIGHTS BANNER */}
          {smartInsights && smartInsights.length > 0 && (
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-indigo-400 animate-pulse" />
                <span>{t('analytics.ai_title', 'AI Strategik Analitik Xulosalar')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {smartInsights.map((insight: any, idx: number) => {
                  const isHigh = insight.type === 'HIGH_RISK';
                  const isWarn = insight.type === 'WARNING';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border space-y-1.5 transition ${
                        isHigh
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          : isWarn
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        {isHigh ? (
                          <AlertTriangle className="h-4 w-4 text-rose-700 dark:text-rose-400 shrink-0" />
                        ) : isWarn ? (
                          <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        )}
                        <span>{insight.title}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed font-medium text-slate-800 dark:text-slate-200">{insight.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TOP EXECUTIVE KPI CARDS WITH TREND BADGES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">
                  {t('analytics.turnover_rate', "Kadrlar Qo'nimsizligi (Turnover Rate)")}
                </span>
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20 font-bold">
                  <UserX className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{summary?.turnoverRateTotal || 0}%</div>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20">
                  <ArrowDownRight className="h-3 w-3" /> {summary?.trends?.turnoverRateTrend || '-0.8'}%
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {language === 'kr' ? '퇴사자:' : 'Resigned:'} <span className="text-rose-700 dark:text-rose-400 font-bold">{summary?.offboardedCount || 0}</span> {language === 'kr' ? '명' : 'ta xodim'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">
                  {t('kpi.vacancies', 'Vakansiyalar Soni')}
                </span>
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20 font-bold">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-extrabold text-amber-800 dark:text-amber-300">{summary?.totalVacancies || 0}</div>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20">
                  <ArrowDownRight className="h-3 w-3" /> {summary?.trends?.vacanciesTrend || '-2'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{t('analytics.fill_rate', "To'ldirilganlik")}: <b className="text-slate-900 dark:text-slate-100 font-bold">{summary?.overallFillRate || 100}%</b></p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">
                  {t('analytics.cert_med_mon', "Sertifikat va Med-ko'rik Monitoringi %")}
                </span>
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{summary?.hseCompliancePct || 0}%</div>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20">
                  <ArrowUpRight className="h-3 w-3" /> +{summary?.trends?.hseComplianceTrend || '1.4'}%
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{language === 'kr' ? '건강검진 완료 비율' : "Tugamagan med-ko'riklar soni"}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">
                  {t('analytics.discipline_index', 'Intizom va Xavfsizlik Indeksi')}
                </span>
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-indigo-500/10 text-blue-700 dark:text-indigo-400 border border-blue-300 dark:border-indigo-500/20 font-bold">
                  <HeartPulse className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-extrabold text-blue-700 dark:text-indigo-300">{summary?.avgDepartmentHealthScore || 0}%</div>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20">
                  <ArrowUpRight className="h-3 w-3" /> +{summary?.trends?.healthIndexTrend || '2.1'}%
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{language === 'kr' ? '복무 규율 및 근태 균형' : 'Intizom va davomat balansi'}</p>
            </div>
          </div>

          {/* HEADCOUNT BUDGET & VACANCY TRACKER (REJA VS FAKT) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-indigo-400" />
                2. {t('analytics.headcount_title', 'Bo\'limlar Kesimida Shtat va Vakansiyalar')}
              </h3>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {language === 'kr' ? '총 정원:' : 'Jami Reja:'} <b className="text-slate-900 dark:text-slate-100 font-bold">{summary?.totalPlannedHeadcount || 0}</b> | {language === 'kr' ? '현원:' : 'Amaldagi:'} <b className="text-emerald-700 dark:text-emerald-400 font-bold">{summary?.totalWorkforce || 0}</b>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase text-[10px] border-b border-slate-300 dark:border-slate-700 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">№</th>
                    <th className="px-4 py-3">{t('analytics.dept_name', "Bo'lim Nomi")}</th>
                    <th className="px-4 py-3 text-center">{t('analytics.planned', 'Tasdiqlangan Shtat (Reja)')}</th>
                    <th className="px-4 py-3 text-center">{t('analytics.actual', 'Amaldagi Xodimlar (Fakt)')}</th>
                    <th className="px-4 py-3 text-center">{t('analytics.vacancies', 'Ochiq Vakansiyalar (TO)')}</th>
                    <th className="px-4 py-3 text-right">{t('analytics.fill_rate', "Shtat To'ldirilganlik %")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 font-mono">
                  {headcountBudget?.map((item: any, idx: number) => (
                    <tr
                      key={item.departmentId}
                      onClick={() => setSelectedDepartmentId(item.departmentId)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition cursor-pointer group border-b border-slate-200 dark:border-slate-800"
                      title={language === 'kr' ? '해당 부서 상세 패스포트 열기' : "Ushbu bo'lim pasporti va vakansiyalari matrixini ochish"}
                    >
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-sans font-bold">{idx + 1}</td>
                      <td className="px-4 py-3 font-sans font-bold text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition">
                        <span className="font-mono text-blue-700 dark:text-indigo-400 mr-2 font-bold">[{item.departmentCode}]</span>
                        {item.departmentName}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-800 dark:text-slate-300 font-semibold">{item.planned}</td>
                      <td className="px-4 py-3 text-center text-emerald-700 dark:text-emerald-400 font-bold">{item.actual}</td>
                      <td className="px-4 py-3 text-center">
                        {item.vacancies > 0 ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            item.isHighVacancy
                              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                              : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                          }`}>
                            {item.vacancies} {language === 'kr' ? '공석' : 'ta vakansiya'}
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 font-normal">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-200">
                        <div className="flex items-center justify-end gap-2">
                          <span>{item.fillRatePct}%</span>
                          <div className="w-16 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
                            <div
                              className={`h-full rounded-full ${
                                item.fillRatePct >= 90 ? 'bg-emerald-600 dark:bg-emerald-400' : item.fillRatePct >= 75 ? 'bg-amber-600 dark:bg-amber-400' : 'bg-rose-600 dark:bg-rose-400'
                              }`}
                              style={{ width: `${Math.min(100, item.fillRatePct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DEMOGRAPHICS & HEALTH INDEX GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DEMOGRAPHIC RISK MATRIX */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                3. {language === 'kr' ? '인구 통계 및 정년 위험 매트릭스 (연령 및 근속)' : "Demografiya va Pensiya Xavfi Matritsasi (Age & Tenure)"}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">{language === 'kr' ? '정년 연령 임직원' : 'Pensiya Yoshidagi Xodimlar'}</span>
                  <p className="text-xl font-mono font-extrabold text-rose-700 dark:text-rose-400">{demographics?.pensionRiskCount || 0}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{language === 'kr' ? '남성 60세+, 여성 55세+' : 'Erkaklar 60+, Ayollar 55+'}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">{language === 'kr' ? '청년층 비율 (< 30세)' : 'Yoshlar Ulushi (< 30 Yosh)'}</span>
                  <p className="text-xl font-mono font-extrabold text-blue-700 dark:text-cyan-400">{demographics?.youthRatio || 0}%</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{language === 'kr' ? '총' : 'Jami'}: {demographics?.youthCount || 0}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-600 dark:text-indigo-400" />
                  {language === 'kr' ? '근속 연수별 분포:' : "Ish Staji Bo'yicha Taqsimot (Tenure Breakdown):"}
                </span>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-800 dark:text-slate-300 font-bold">
                      <span>{language === 'kr' ? '1년 미만 (신입)' : '1 yildan kam (Yangi xodimlar)'}</span>
                      <span className="font-mono font-bold text-blue-700 dark:text-indigo-400">{demographics?.tenureBreakdown?.under1Yr || 0}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
                      <div className="bg-blue-600 dark:bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, ((demographics?.tenureBreakdown?.under1Yr || 0) / (summary?.totalWorkforce || 1)) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-800 dark:text-slate-300 font-bold">
                      <span>{language === 'kr' ? '1 - 5년' : '1 - 5 yil'}</span>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{demographics?.tenureBreakdown?.yr1To5 || 0}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
                      <div className="bg-blue-600 dark:bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, ((demographics?.tenureBreakdown?.yr1To5 || 0) / (summary?.totalWorkforce || 1)) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-800 dark:text-slate-300 font-bold">
                      <span>{language === 'kr' ? '5 - 10년' : '5 - 10 yil'}</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{demographics?.tenureBreakdown?.yr5To10 || 0}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
                      <div className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, ((demographics?.tenureBreakdown?.yr5To10 || 0) / (summary?.totalWorkforce || 1)) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-800 dark:text-slate-300 font-bold">
                      <span>{language === 'kr' ? '10년 이상 (장기 근속)' : '10+ yil (Faxriy xodimlar)'}</span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{demographics?.tenureBreakdown?.over10Yr || 0}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
                      <div className="bg-amber-600 dark:bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, ((demographics?.tenureBreakdown?.over10Yr || 0) / (summary?.totalWorkforce || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DEPARTMENT HEALTH INDEX */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  4. {language === 'kr' ? '부서 건전성 및 복무 규율 지수 (0-100%)' : 'Department Health & Discipline Index (0-100%)'}
                </h3>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  Avg: {summary?.avgDepartmentHealthScore}%
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-72 overflow-y-auto shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase text-[10px] border-b border-slate-300 dark:border-slate-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5">{t('analytics.dept_name', "Bo'lim Nomi")}</th>
                      <th className="px-3 py-2.5 text-center">{language === 'kr' ? '징계' : 'Hayfsan'}</th>
                      <th className="px-3 py-2.5 text-center">{language === 'kr' ? '병가 일수' : 'B/L Kunlar'}</th>
                      <th className="px-3 py-2.5 text-right">{language === 'kr' ? '건전성 지수' : 'Health Index'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 font-mono">
                    {departmentHealthIndex?.map((d: any) => (
                      <tr
                        key={d.departmentId}
                        onClick={() => setSelectedDepartmentId(d.departmentId)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition cursor-pointer group border-b border-slate-200 dark:border-slate-800"
                        title={language === 'kr' ? '해당 부서 상세 패스포트 열기' : "Ushbu bo'lim pasporti va vakansiyalarini ochish"}
                      >
                        <td className="px-3 py-2 font-sans font-bold text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition">
                          <span className="font-mono text-blue-700 dark:text-indigo-400 mr-1 font-bold">[{d.departmentCode}]</span>
                          {d.departmentName}
                        </td>
                        <td className="px-3 py-2 text-center text-rose-700 dark:text-rose-400 font-bold">
                          {d.activePenaltiesCount > 0 ? `${d.activePenaltiesCount}` : '0'}
                        </td>
                        <td className="px-3 py-2 text-center text-amber-700 dark:text-amber-400 font-bold">{d.sickDays} {language === 'kr' ? '일' : 'kun'}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                            d.healthScore >= 85
                              ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                              : d.healthScore >= 70
                              ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-300 dark:border-blue-500/30'
                              : d.healthScore >= 50
                              ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                              : 'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
                          }`}>
                            {d.healthScore}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
