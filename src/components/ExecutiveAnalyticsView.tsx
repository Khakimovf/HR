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

export const ExecutiveAnalyticsView: React.FC = () => {
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
        setError(json.error || "Tahliliy ma'lumotlarni yuklashda xatolik");
      }
    } catch (err: any) {
      setError("Tarmoq xatoligi yuz berdi");
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
      alert('Pop-up bloklangan. Brauzerdagi cheklovni olib tashlang.');
      return;
    }

    const {
      summary,
      smartInsights,
      headcountBudget,
      departmentHealthIndex,
    } = data;

    const printDate = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KORXONA HR ANALITIK SVODKASI VA STRATEGIK HISOBOTI</title>
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
              <div class="header-title">KORXONA HR ANALITIK SVODKASI VA STRATEGIK HISOBOTI</div>
              <div class="header-sub">Ijroiy Boshqaruv va Kadrlar Analitikasi • Davr: ${period} (${printDate})</div>
            </div>
            <div style="text-align: right; font-size: 8.5pt;">
              <div>HR-EXECUTIVE-SYSTEM</div>
              <div style="color: #38bdf8; font-family: monospace;">CONFIDENTIAL</div>
            </div>
          </div>

          <div class="insights-box">
            <div class="insights-title">⚡ AI STRATEGIK ANALITIK XULOSALAR (SMART INSIGHTS)</div>
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
              <div class="kpi-label">Vakansiyalar Soni</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value" style="color: #16a34a;">${summary?.hseCompliancePct || 0}%</div>
              <div class="kpi-label">Med-Ko'rik Compliance</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value" style="color: #0284c7;">${summary?.avgDepartmentHealthScore || 0}%</div>
              <div class="kpi-label">Health Index</div>
            </div>
          </div>

          <div class="section-title">1. SHTAT VA VAKANSIYALAR TAHLILI (REJA VS FAKT)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">№</th>
                <th>Bo'lim Nomi</th>
                <th style="text-align: center;">Tasdiqlangan (Reja)</th>
                <th style="text-align: center;">Amaldagi (Fakt)</th>
                <th style="text-align: center;">Vakansiya</th>
                <th style="text-align: right;">To'ldirilganlik %</th>
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
              <div><b>Bosh Direktor:</b> Nazarov B.</div>
              <div class="sig-line"></div>
            </div>
            <div>
              <div><b>HR Direktor:</b> Karimov J.</div>
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
      alert('Pop-up bloklangan. Brauzerdagi cheklovni olib tashlang.');
      return;
    }

    const printDate = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

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
          <title>BO'LIM PASPORTI VA VAKANSIYALAR MATRIXI - ${dept.departmentName}</title>
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
              <div class="header-title">[${dept.departmentCode}] ${dept.departmentName} — CHUQUR BO'LIM PASPORTI</div>
              <div class="header-sub">Lavozimlar Kesimida Vakansiyalar Matrixi va Statuslar Svodkasi • ${printDate}</div>
            </div>
          </div>

          <div class="passport-grid">
            <div>
              <div class="passport-title">Bo'lim Boshlig'i (Department Head)</div>
              <div class="passport-value">${dept.deptHead?.fullName || 'Noma\'lum'}</div>
              <div style="font-size: 8pt; color: #64748b;">${dept.deptHead?.position || '—'} | Tel: ${dept.deptHead?.phone || '—'}</div>
            </div>
            <div>
              <div class="passport-title">Katta Usta / O'rinbosar</div>
              <div class="passport-value">${dept.supervisor?.fullName || 'Biriktirilmagan'}</div>
              <div style="font-size: 8pt; color: #64748b;">${dept.supervisor?.position || '—'}</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-val">${dept.headcount.planned}</div>
              <div class="stat-lbl">Tasdiqlangan Shtat</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #166534;">${dept.headcount.actual}</div>
              <div class="stat-lbl">Amaldagi Xodimlar</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: ${dept.headcount.vacancies > 0 ? '#dc2626' : '#475569'};">${dept.headcount.vacancies}</div>
              <div class="stat-lbl">Jami Vakansiyalar</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #0284c7;">${dept.headcount.fillRatePct}%</div>
              <div class="stat-lbl">To'ldirilganlik %</div>
            </div>
          </div>

          <div class="section-header">1. LAVOZIMLAR KESIMIDA VAKANSIYALAR MATRIXI</div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">№</th>
                <th>Lavozim Nomi</th>
                <th style="text-align: center;">Rejadagi Shtat</th>
                <th style="text-align: center;">Amaldagi Xodimlar</th>
                <th style="text-align: center;">Vakansiyalar Soni</th>
                <th style="text-align: right;">Holati / Status</th>
              </tr>
            </thead>
            <tbody>
              ${vacancyRows}
            </tbody>
          </table>

          <div class="section-header">2. BO'LIM XODIMLARI RO'YXATI VA QAYTISH SANALARI (${dept.roster.length} TA XODIM)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">№</th>
                <th>Tabel №</th>
                <th>F.I.O</th>
                <th>Lavozimi</th>
                <th>Status Boshlanishi</th>
                <th>Qaytish Sanasi / Muddati</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              ${rosterRows}
            </tbody>
          </table>

          <div class="signatures">
            <div>
              <div><b>Bo'lim Boshlig'i:</b> ${dept.deptHead?.fullName || '__________'}</div>
              <div class="sig-line"></div>
            </div>
            <div>
              <div><b>HR Direktor / Inspektor:</b> Karimov J.</div>
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

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-3">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
        <p className="text-slate-400 text-xs">
          Bo'lim pasporti, lavozimlar vakansiyasi matrixi va statuslar svodkasi hisoblanmoqda...
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
          className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-700"
        >
          Qayta urinish
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
    { key: 'ACTIVE', label: 'Hozirda Ishda', color: 'emerald' },
    { key: 'VACATION', label: "Mehnat ta'tili", color: 'blue' },
    { key: 'SICK_LEAVE', label: 'Vaqtincha layoqatsizlik (B/L)', color: 'amber' },
    { key: 'UNPAID_LEAVE', label: "O'z hisobidan ta'til (B/S)", color: 'purple' },
    { key: 'STUDY_LEAVE', label: "O'qish ta'tili", color: 'indigo' },
    { key: 'ADMINISTRATIVE_LEAVE', label: "Administrativ ta'til", color: 'rose' },
    { key: 'LATE_PERMIT', label: 'Kechikish / Ruxsatnoma', color: 'cyan' },
  ];

  return (
    <div className="space-y-6 text-xs">
      {/* ── Top Header & Department Selector Toolbar ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            Executive Analytics & Department Drill-Down
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Lavozimlar kesimida vakansiyalar matrixi va 100% statuslar svodkasi
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* DYNAMIC TOP TOOLBAR DEPARTMENT SELECTOR */}
          <div className="relative">
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="bg-slate-900 text-slate-100 border border-indigo-500/40 text-xs rounded-xl px-3 py-2.5 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-lg cursor-pointer"
            >
              <option value="">📍 Barcha Bo'limlar (Umumiy Korxona Svodi)</option>
              {departmentsList.map((d: any) => (
                <option key={d.id} value={d.id}>
                  [{d.code}] {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Comparative Period Selectors */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-1" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="MONTHLY">Oylik Davr</option>
              <option value="YEARLY">Yillik Davr</option>
            </select>

            <select
              value={compareMode}
              onChange={(e) => setCompareMode(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="PREV_MONTH">Solishtirish: O'tgan Oy</option>
              <option value="PREV_YEAR">Solishtirish: O'tgan Yil</option>
            </select>
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            title="Ma'lumotlarni yangilash"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {!selectedDepartmentId ? (
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition cursor-pointer active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>📄 PDF Analitik Svodka Yuklash</span>
            </button>
          ) : (
            <button
              onClick={handleExportSingleDeptPDF}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition cursor-pointer active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>📄 Ushbu Bo'lim Pasporti va Vakansiyalarini PDF Yuklash</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── SINGLE DEPARTMENT DRILL-DOWN OVERHAUL ─── */}
      {selectedDepartmentId && selectedDepartmentDetails ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Return Quick Action Link */}
          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Hozirgi bo'lim ko'rinishi:</span>
              <span className="font-bold text-indigo-400">
                [{selectedDepartmentDetails.departmentCode}] {selectedDepartmentDetails.departmentName}
              </span>
            </div>

            <button
              onClick={() => setSelectedDepartmentId('')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Barcha Bo'limlar (Umumiy Korxona Svodi) ga qaytish</span>
            </button>
          </div>

          {/* 1. TOP HEADER & LEADERSHIP PASSPORT */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                  Bo'lim Pasporti va Rahbariyat Tarkibi
                </span>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
                  [{selectedDepartmentDetails.departmentCode}] {selectedDepartmentDetails.departmentName}
                </h3>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Building2 className="h-3.5 w-3.5" /> Lavozimlar & Statuslar Tahlili
              </span>
            </div>

            {/* Leadership Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                  <span>Bo'lim Boshlig'i (Department Head)</span>
                </div>
                {selectedDepartmentDetails.deptHead ? (
                  <div className="space-y-1 pt-1">
                    <p className="text-sm font-extrabold text-white">
                      {selectedDepartmentDetails.deptHead.fullName}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>Tabel №: <strong className="text-indigo-400">{selectedDepartmentDetails.deptHead.tabelNumber}</strong></span>
                      <span>Tel: <strong className="text-slate-200">{selectedDepartmentDetails.deptHead.phone}</strong></span>
                    </div>
                    <p className="text-xs text-indigo-300 font-medium">{selectedDepartmentDetails.deptHead.position}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Bo'lim boshlig'i biriktirilmagan</p>
                )}
              </div>

              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span>Katta Usta / O'rinbosar (Supervisor)</span>
                </div>
                {selectedDepartmentDetails.supervisor ? (
                  <div className="space-y-1 pt-1">
                    <p className="text-sm font-extrabold text-white">
                      {selectedDepartmentDetails.supervisor.fullName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Tabel №: <strong className="text-indigo-400">{selectedDepartmentDetails.supervisor.tabelNumber}</strong>
                    </p>
                    <p className="text-xs text-blue-300 font-medium">{selectedDepartmentDetails.supervisor.position}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Supervayzer biriktirilmagan</p>
                )}
              </div>
            </div>

            {/* High-level Headcount Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Tasdiqlangan Shtat (Reja)</span>
                <p className="text-xl font-mono font-bold text-slate-100">
                  {selectedDepartmentDetails.headcount.planned} ta
                </p>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Amaldagi Xodimlar (Fakt)</span>
                <p className="text-xl font-mono font-bold text-emerald-400">
                  {selectedDepartmentDetails.headcount.actual} ta
                </p>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Jami Vakansiyalar</span>
                <p className={`text-xl font-mono font-bold ${
                  selectedDepartmentDetails.headcount.vacancies > 0 ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {selectedDepartmentDetails.headcount.vacancies} ta
                </p>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Shtat To'ldirilganlik %</span>
                <p className="text-xl font-mono font-bold text-indigo-300">
                  {selectedDepartmentDetails.headcount.fillRatePct}%
                </p>
              </div>
            </div>
          </div>

          {/* 2. SECTION 1: VACANCY MATRIX BY POSITION */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-400" />
                1. Lavozimlar Kesimida Vakansiyalar Matrixi (Shtat Yetishmovchiligi)
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Vakansiyali lavozimlar soni: <strong className="text-rose-400">{selectedDepartmentDetails.positionVacancies?.filter((pv: any) => pv.vacancies > 0).length || 0} ta</strong>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">№</th>
                    <th className="px-4 py-3">Lavozim Nomi</th>
                    <th className="px-4 py-3 text-center">Rejadagi Shtat</th>
                    <th className="px-4 py-3 text-center">Amaldagi Xodimlar</th>
                    <th className="px-4 py-3 text-center">Yetishmayotgan Odamlar (Vakansiya)</th>
                    <th className="px-4 py-3 text-right">Status / Holati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                  {selectedDepartmentDetails.positionVacancies?.map((pv: any, idx: number) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-900/60 transition ${
                        pv.isUnderstaffed ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-500 font-sans">{idx + 1}</td>
                      <td className="px-4 py-3 font-sans font-bold text-slate-100 flex items-center gap-2">
                        {pv.isUnderstaffed && <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                        <span>{pv.positionName}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300">{pv.planned}</td>
                      <td className="px-4 py-3 text-center text-emerald-400 font-bold">{pv.actual}</td>
                      <td className="px-4 py-3 text-center">
                        {pv.vacancies > 0 ? (
                          <span className="font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            {pv.vacancies} ta odam yetishmayapti
                          </span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-sans">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          pv.isUnderstaffed
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
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
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Filter className="h-4 w-4 text-cyan-400" />
                2. Statuslar Bo'yicha Biriktirilgan Filter Lenta (7 ta Rasmiy Status)
              </h3>
              <span className="text-xs text-slate-400">Kerakli statusni tanlang:</span>
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
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-white text-indigo-900 font-extrabold' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. SECTION 3: GRANULAR EMPLOYEE LIST TABLE */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                3. Tanlangan Status Bo'yicha Xodimlar Ro'yxati VA Qaytish Sanalari
              </h3>

              <span className="text-xs text-slate-400">
                Saralangan status: <strong className="text-indigo-400 uppercase">{activeStatusTab}</strong>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">№</th>
                    <th className="px-4 py-3">Tabel №</th>
                    <th className="px-4 py-3">F.I.O</th>
                    <th className="px-4 py-3">Lavozimi</th>
                    <th className="px-4 py-3">Status Boshlanishi</th>
                    <th className="px-4 py-3">Qaytish Sanasi / Muddati</th>
                    <th className="px-4 py-3 text-right">Contact / Telefon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                  {selectedDepartmentDetails.roster
                    .filter((emp: any) => emp.statusCategory === activeStatusTab)
                    .map((emp: any, idx: number) => (
                      <tr key={emp.id} className="hover:bg-slate-900/60 transition">
                        <td className="px-4 py-3 text-slate-500 font-sans">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-indigo-400">{emp.tabelNumber}</td>
                        <td className="px-4 py-3 font-sans font-semibold text-slate-100">{emp.fullName}</td>
                        <td className="px-4 py-3 font-sans text-slate-300">{emp.position}</td>
                        <td className="px-4 py-3 text-slate-400">{emp.statusStartDate}</td>
                        <td className="px-4 py-3 font-sans">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                            <Calendar className="h-3 w-3" />
                            {emp.returnDate}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300 font-sans">{emp.phone}</td>
                      </tr>
                    ))}

                  {selectedDepartmentDetails.roster.filter((emp: any) => emp.statusCategory === activeStatusTab).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-500 font-sans">
                        Ushbu status toifasida xodimlar topilmadi
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
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-indigo-500/30 p-5 space-y-3 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                <span>AI Smart Strategic Insights & Strategik Xulosalar</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {smartInsights.map((insight: any, idx: number) => {
                  const isHigh = insight.type === 'HIGH_RISK';
                  const isWarn = insight.type === 'WARNING';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border space-y-1.5 transition hover:scale-[1.01] ${
                        isHigh
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : isWarn
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        {isHigh ? (
                          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                        ) : isWarn ? (
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                        <span>{insight.title}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300">{insight.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TOP EXECUTIVE KPI CARDS WITH TREND BADGES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Turnover Rate
                </span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <UserX className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-extrabold text-white">{summary?.turnoverRateTotal || 0}%</div>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <ArrowDownRight className="h-3 w-3" /> {summary?.trends?.turnoverRateTrend || '-0.8'}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Resigned: <span className="text-rose-400 font-bold">{summary?.offboardedCount || 0} ta</span> xodim
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Vakansiyalar Soni
                </span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-extrabold text-amber-300">{summary?.totalVacancies || 0} ta</div>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <ArrowDownRight className="h-3 w-3" /> {summary?.trends?.vacanciesTrend || '-2'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">To'ldirilganlik: <b>{summary?.overallFillRate || 100}%</b></p>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  HSE Med-Ko'rik Compliance
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-extrabold text-emerald-400">{summary?.hseCompliancePct || 0}%</div>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <ArrowUpRight className="h-3 w-3" /> +{summary?.trends?.hseComplianceTrend || '1.4'}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Tugamagan med-ko'riklar soni</p>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Avg Department Health Index
                </span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <HeartPulse className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-extrabold text-indigo-300">{summary?.avgDepartmentHealthScore || 0}%</div>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <ArrowUpRight className="h-3 w-3" /> +{summary?.trends?.healthIndexTrend || '2.1'}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Intizom va davomat balansi</p>
            </div>
          </div>

          {/* HEADCOUNT BUDGET & VACANCY TRACKER (REJA VS FAKT) */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-400" />
                2. Headcount Budget & Vacancy Tracker (Shtat Reja vs Fakt)
              </h3>
              <span className="text-[11px] text-slate-400">
                Jami Reja: <b>{summary?.totalPlannedHeadcount || 0}</b> | Amaldagi: <b className="text-emerald-400">{summary?.totalWorkforce || 0}</b>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">№</th>
                    <th className="px-4 py-3">Bo'lim Nomi</th>
                    <th className="px-4 py-3 text-center">Tasdiqlangan Shtat (Reja)</th>
                    <th className="px-4 py-3 text-center">Amaldagi Xodimlar (Fakt)</th>
                    <th className="px-4 py-3 text-center">Vakansiyalar Soni</th>
                    <th className="px-4 py-3 text-right">To'ldirilganlik %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                  {headcountBudget?.map((item: any, idx: number) => (
                    <tr
                      key={item.departmentId}
                      onClick={() => setSelectedDepartmentId(item.departmentId)}
                      className="hover:bg-slate-900/80 transition cursor-pointer group"
                      title="Ushbu bo'lim pasporti va vakansiyalari matrixini ochish"
                    >
                      <td className="px-4 py-3 text-slate-500 font-sans">{idx + 1}</td>
                      <td className="px-4 py-3 font-sans font-semibold text-slate-200 group-hover:text-indigo-400 transition">
                        <span className="font-mono text-indigo-400 mr-2">[{item.departmentCode}]</span>
                        {item.departmentName}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300">{item.planned}</td>
                      <td className="px-4 py-3 text-center text-emerald-400 font-bold">{item.actual}</td>
                      <td className="px-4 py-3 text-center">
                        {item.vacancies > 0 ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            item.isHighVacancy
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {item.vacancies} ta vakansiya
                          </span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-200">
                        <div className="flex items-center justify-end gap-2">
                          <span>{item.fillRatePct}%</span>
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.fillRatePct >= 90 ? 'bg-emerald-400' : item.fillRatePct >= 75 ? 'bg-amber-400' : 'bg-rose-400'
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
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-cyan-400" />
                3. Demografiya va Pensiya Xavfi Matritsasi (Age & Tenure)
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Pensiya Yoshidagi Xodimlar</span>
                  <p className="text-xl font-mono font-bold text-rose-400">{demographics?.pensionRiskCount || 0} ta</p>
                  <p className="text-[10px] text-slate-500">Erkaklar 60+, Ayollar 55+</p>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Yoshlar Ulushi (&lt; 30 Yosh)</span>
                  <p className="text-xl font-mono font-bold text-cyan-400">{demographics?.youthRatio || 0}%</p>
                  <p className="text-[10px] text-slate-500">Jami: {demographics?.youthCount || 0} ta yosh xodim</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  <Clock className="h-3 w-3 text-indigo-400" />
                  Ish Staji Bo'yicha Taqsimot (Tenure Breakdown):
                </span>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>1 yildan kam (Yangi xodimlar)</span>
                      <span className="font-mono font-bold text-indigo-400">{demographics?.tenureBreakdown?.under1Yr || 0} ta</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, ((demographics?.tenureBreakdown?.under1Yr || 0) / (summary?.totalWorkforce || 1)) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>1 - 5 yil</span>
                      <span className="font-mono font-bold text-blue-400">{demographics?.tenureBreakdown?.yr1To5 || 0} ta</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, ((demographics?.tenureBreakdown?.yr1To5 || 0) / (summary?.totalWorkforce || 1)) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>5 - 10 yil</span>
                      <span className="font-mono font-bold text-emerald-400">{demographics?.tenureBreakdown?.yr5To10 || 0} ta</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, ((demographics?.tenureBreakdown?.yr5To10 || 0) / (summary?.totalWorkforce || 1)) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>10+ yil (Faxriy xodimlar)</span>
                      <span className="font-mono font-bold text-amber-400">{demographics?.tenureBreakdown?.over10Yr || 0} ta</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, ((demographics?.tenureBreakdown?.over10Yr || 0) / (summary?.totalWorkforce || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DEPARTMENT HEALTH INDEX */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-rose-400" />
                  4. Department Health & Discipline Index (0-100%)
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  Avg: {summary?.avgDepartmentHealthScore}%
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5">Bo'lim</th>
                      <th className="px-3 py-2.5 text-center">Hayfsan</th>
                      <th className="px-3 py-2.5 text-center">B/L Kunlar</th>
                      <th className="px-3 py-2.5 text-right">Health Index</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                    {departmentHealthIndex?.map((d: any) => (
                      <tr
                        key={d.departmentId}
                        onClick={() => setSelectedDepartmentId(d.departmentId)}
                        className="hover:bg-slate-900/80 transition cursor-pointer group"
                        title="Ushbu bo'lim pasporti va vakansiyalarini ochish"
                      >
                        <td className="px-3 py-2 font-sans font-semibold text-slate-200 group-hover:text-indigo-400 transition">
                          <span className="font-mono text-indigo-400 mr-1">[{d.departmentCode}]</span>
                          {d.departmentName}
                        </td>
                        <td className="px-3 py-2 text-center text-rose-400 font-bold">
                          {d.activePenaltiesCount > 0 ? `${d.activePenaltiesCount} ta` : '0'}
                        </td>
                        <td className="px-3 py-2 text-center text-amber-400">{d.sickDays} kun</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                            d.healthScore >= 85
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : d.healthScore >= 70
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : d.healthScore >= 50
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
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
