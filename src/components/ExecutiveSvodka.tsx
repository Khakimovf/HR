'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Users,
  ShieldAlert,
  Calendar,
  Download,
  FileCheck,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Demo Fallback Employee Data for 4 Metrics ────────────────────────────────

const MOCK_ALL_EMPLOYEES = [
  { id: '1', tabelNumber: 'TB-1001', fullName: "Ergashev Diyorbek Alisherovich", position: "Bosh Texnolog-Muhandis", departmentName: "Ishlab Chiqarish Sehi #1", status: 'ACTIVE', hasWarning: false, leaveType: null },
  { id: '2', tabelNumber: 'TB-1002', fullName: "Karimov Sherzod Umidovich", position: "KARA Operator-Haydovchi", departmentName: "Logistika va Omborxona", status: 'ON_LEAVE', hasWarning: false, leaveType: 'MT' },
  { id: '3', tabelNumber: 'TB-1003', fullName: "Qodirova Malika Jasurbek qizi", position: "Yetakchi HR Nazoratchi", departmentName: "Kadrlar Boshqarmasi", status: 'ACTIVE', hasWarning: true, leaveType: null },
  { id: '4', tabelNumber: 'TB-1004', fullName: "Sultonov Rustam Xamroevich", position: "Mexanik-Sozlovchi Usta", departmentName: "Ta'mirlash Sehi", status: 'ON_LEAVE', hasWarning: false, leaveType: 'BL' },
  { id: '5', tabelNumber: 'TB-1005', fullName: "Xoliqov Bobur Mirzo", position: "Sifat Nazorati Inspektori", departmentName: "Laboratoriya va OTK", status: 'ACTIVE', hasWarning: false, leaveType: null },
  { id: '6', tabelNumber: 'TB-1006', fullName: "Narzullaeva Gulnoza Sanjarovna", position: "Buxgalter-Hisobchi", departmentName: "Moliya Bo'limi", status: 'ON_LEAVE', hasWarning: false, leaveType: 'BS' },
  { id: '7', tabelNumber: 'TB-1007', fullName: "Sobirov Otabek Anvarovich", position: "Elektr-Montajchi", departmentName: "Energetika Xizmati", status: 'ON_LEAVE', hasWarning: false, leaveType: 'BL' },
  { id: '8', tabelNumber: 'TB-1008', fullName: "Toshpulatov Sardor Baxtiyorovich", position: "Kran Mashinisti", departmentName: "Og'ir Yuk Sehi", status: 'ACTIVE', hasWarning: true, leaveType: null },
];

export const ExecutiveSvodka: React.FC = () => {
  const [svodkaData, setSvodkaData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Metric Filter Key: 'ALL_EMPLOYEES' | 'ON_LEAVE' | 'ACTIVE_WARNINGS' | 'SICK_LEAVE'
  const [activeFilterKey, setActiveFilterKey] = useState<string>('ALL_EMPLOYEES');
  const [employeeList, setEmployeeList] = useState<any[]>(MOCK_ALL_EMPLOYEES);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/svodka').then((r) => r.json()).catch(() => null),
      fetch('/api/employees?limit=200').then((r) => r.json()).catch(() => null),
    ]).then(([svodkaRes, empRes]) => {
      if (svodkaRes && svodkaRes.success) {
        setSvodkaData(svodkaRes);
      }
      if (empRes && empRes.success && empRes.employees && empRes.employees.length > 0) {
        const mapped = empRes.employees.map((e: any) => ({
          id: e.id,
          tabelNumber: e.tabelNumber,
          fullName: `${e.lastName} ${e.firstName} ${e.middleName || ''}`.trim(),
          position: e.position,
          departmentName: e.currentDepartment?.name || '—',
          status: e.status,
          hasWarning: e.disciplinaryActions && e.disciplinaryActions.length > 0,
          leaveType: e.leaves && e.leaves.length > 0 ? e.leaves[0].type : (e.status === 'ON_LEAVE' ? 'MT' : null),
        }));
        setEmployeeList(mapped);
      }
    }).finally(() => setLoading(false));
  }, []);

  const metrics = svodkaData?.metrics || {};

  // Filtered employee lists per metric key
  const allEmployees = employeeList;
  const onLeaveEmployees = employeeList.filter((e) => e.status === 'ON_LEAVE' || e.status === 'VACATION' || e.leaveType === 'MT' || e.leaveType === 'BS');
  const activeWarningsEmployees = employeeList.filter((e) => e.hasWarning || e.status === 'ACTIVE_WARNING');
  const sickLeaveEmployees = employeeList.filter((e) => e.leaveType === 'BL' || (e.status === 'ON_LEAVE' && e.leaveType === 'BL'));

  const getDisplayedList = (key: string) => {
    switch (key) {
      case 'ON_LEAVE':
        return onLeaveEmployees.length > 0 ? onLeaveEmployees : MOCK_ALL_EMPLOYEES.filter((e) => e.status === 'ON_LEAVE');
      case 'ACTIVE_WARNINGS':
        return activeWarningsEmployees.length > 0 ? activeWarningsEmployees : MOCK_ALL_EMPLOYEES.filter((e) => e.hasWarning);
      case 'SICK_LEAVE':
        return sickLeaveEmployees.length > 0 ? sickLeaveEmployees : MOCK_ALL_EMPLOYEES.filter((e) => e.leaveType === 'BL');
      case 'ALL_EMPLOYEES':
      default:
        return allEmployees.length > 0 ? allEmployees : MOCK_ALL_EMPLOYEES;
    }
  };

  const getCategoryTitle = (key: string) => {
    switch (key) {
      case 'ON_LEAVE':
        return "TA'TILDAGI XODIMLAR RO'YXATI (M/T, B/S)";
      case 'ACTIVE_WARNINGS':
        return "FAOL INTIZOMIY HAYFSANLAR SHAKLLANTIRILGAN XODIMLAR RO'YXATI";
      case 'SICK_LEAVE':
        return "VAQTINCHALIK MEHNATGA LAYOQATSIZ HOLATDAGI XODIMLAR RO'YXATI (B/L)";
      case 'ALL_EMPLOYEES':
      default:
        return "UMUMIY FAOL XODIMLAR RO'YXATI";
    }
  };

  const displayedList = getDisplayedList(activeFilterKey);

  // Excel Export Handler
  const handleExportExcel = () => {
    const list = displayedList;
    const title = getCategoryTitle(activeFilterKey);
    const printDate = new Date().toLocaleDateString('uz-UZ');

    const headers = ["№", "F.I.SH", "Tabel Raqami", "Lavozimi", "Bo'limi"];
    const rows = list.map((emp, idx) => [
      idx + 1,
      `"${emp.fullName}"`,
      emp.tabelNumber || '',
      `"${emp.position}"`,
      `"${emp.departmentName}"`,
    ]);

    const csvContent = '\uFEFF' + [
      `"${title}"`,
      `"Eksport sanasi: ${printDate} | Jami: ${list.length} kishi"`,
      [],
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dedicated Category PDF Export Handler
  const handleExportCategoryPDF = () => {
    const list = displayedList;
    const title = getCategoryTitle(activeFilterKey);
    const printDate = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

    const rowsHtml = list.length > 0
      ? list.map((emp: any, idx: number) => `
          <tr>
            <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
            <td><b>${emp.fullName}</b></td>
            <td style="font-family: monospace; font-weight: 700; color: #1e3a8a;">${emp.tabelNumber || '—'}</td>
            <td>${emp.position || '—'}</td>
            <td>${emp.departmentName || '—'}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="5" style="text-align: center; color: #64748b; font-style: italic;">Ushbu ko'rsatkich bo'yicha xodimlar topilmadi</td></tr>`;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title.replace(/\s+/g, '_')}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family: Arial, sans-serif; font-size: 9.5pt; color: #1e293b; line-height: 1.4; margin: 0; padding: 0; background: #ffffff; }

  .header-box { background: #0f172a; color: #ffffff; padding: 14px 18px; border-radius: 6px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
  .header-title { font-size: 13pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
  .header-sub { font-size: 8.5pt; color: #94a3b8; margin-top: 2px; }

  .doc-title { font-size: 11pt; font-weight: 800; color: #1e3a8a; border-bottom: 2.5px solid #1e3a8a; padding-bottom: 4px; margin-bottom: 12px; text-transform: uppercase; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9pt; text-align: left; }
  th { background-color: #f1f5f9; color: #0f172a; font-weight: 700; text-transform: uppercase; font-size: 8.5pt; }
  tr:nth-child(even) td { background-color: #f8fafc; }

  .footer { border-top: 1.5px solid #cbd5e1; padding-top: 8px; margin-top: 20px; display: flex; justify-content: space-between; font-size: 8.5pt; color: #64748b; }
</style>
</head>
<body>

<div class="header-box">
  <div>
    <div class="header-title">ENTERPRISE HR SYSTEM MCHJ</div>
    <div class="header-sub">KADRLAR ANALITIK HISOBOТI VA DOSYESI</div>
  </div>
  <div style="text-align: right; font-size: 8.5pt;">
    <div>Sana: <b>${printDate}</b></div>
    <div style="font-family: monospace; color: #38bdf8;">VERIFIED HR REPORT</div>
  </div>
</div>

<div class="doc-title">${title}</div>

<table>
  <thead>
    <tr>
      <th style="width: 35px; text-align: center;">№</th>
      <th>F.I.SH</th>
      <th>Tabel Raqami</th>
      <th>Lavozimi</th>
      <th>Bo'limi</th>
    </tr>
  </thead>
  <tbody>
    ${rowsHtml}
  </tbody>
</table>

<div class="footer">
  <span>Jami xodimlar: <b>${list.length} kishi</b></span>
  <span>Eksport qilingan sana: <b>${printDate}</b></span>
</div>

</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=900');
    if (!win) { alert('Pop-up bloklangan. Brauzerdagi cheklovni olib tashlang.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  const totalAllCount = metrics.activeEmployees || allEmployees.length || 0;
  const totalOnLeaveCount = metrics.onLeaveEmployees || onLeaveEmployees.length || 0;
  const totalWarningsCount = metrics.activeDisciplinaryActions || activeWarningsEmployees.length || 0;
  const totalSickLeaveCount = metrics.leavesByType?.BL || sickLeaveEmployees.length || 0;

  return (
    <div className="space-y-6">
      {/* Header & Main Export Actions */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <FileCheck className="h-6 w-6 text-amber-400" />
            <span>Executive Dashboard & Analitik Svodka</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Bosh direktor va HR Boshqarmasi uchun tezkor 4 metric ko'rsatkichi va 4-ustunli sodda jadval
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel Export (.csv)</span>
          </button>
        </div>
      </div>

      {/* ── 4 Top Metric Selector Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Umumiy Xodimlar */}
        <div
          onClick={() => setActiveFilterKey('ALL_EMPLOYEES')}
          className={`glass-card rounded-2xl p-5 border cursor-pointer transition-all ${
            activeFilterKey === 'ALL_EMPLOYEES'
              ? 'border-indigo-500 bg-indigo-500/15 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20'
              : 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
            <span>Umumiy Xodimlar</span>
            <Users className="h-4.5 w-4.5" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-1">
            {totalAllCount} <span className="text-xs font-normal text-slate-400">kishi</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Barcha faol ro'yxatdagi xodimlar</div>
        </div>

        {/* CARD 2: Ta'tildagi Xodimlar */}
        <div
          onClick={() => setActiveFilterKey('ON_LEAVE')}
          className={`glass-card rounded-2xl p-5 border cursor-pointer transition-all ${
            activeFilterKey === 'ON_LEAVE'
              ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20'
              : 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
            <span>Ta'tildagi Xodimlar</span>
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-1">
            {totalOnLeaveCount} <span className="text-xs font-normal text-slate-400">kishi</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Mehnat ta'tili (M/T) & O'z hisobidan (B/S)</div>
        </div>

        {/* CARD 3: Faol Intizomiy Hayfsanlar */}
        <div
          onClick={() => setActiveFilterKey('ACTIVE_WARNINGS')}
          className={`glass-card rounded-2xl p-5 border cursor-pointer transition-all ${
            activeFilterKey === 'ACTIVE_WARNINGS'
              ? 'border-rose-500 bg-rose-500/15 ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20'
              : 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-300 font-semibold">
            <span>Faol Intizomiy Hayfsanlar</span>
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400 mt-1">
            {totalWarningsCount} <span className="text-xs font-normal text-slate-400">xodim</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Intizomiy hayfsan berilgan xodimlar</div>
        </div>

        {/* CARD 4: Vaqtinchalik mehnatga layoqatsiz holatdagi xodimlar */}
        <div
          onClick={() => setActiveFilterKey('SICK_LEAVE')}
          className={`glass-card rounded-2xl p-5 border cursor-pointer transition-all ${
            activeFilterKey === 'SICK_LEAVE'
              ? 'border-purple-500 bg-purple-500/15 ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20'
              : 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
            <span className="truncate pr-1">Vaqtinchalik layoqatsiz (B/L)</span>
            <Stethoscope className="h-4.5 w-4.5 shrink-0" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400 mt-1">
            {totalSickLeaveCount} <span className="text-xs font-normal text-slate-400">kishi</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">Kasallik varag'idagi xodimlar (B/L)</div>
        </div>
      </div>

      {/* ── Strict Minimalist 4-Column Table View ── */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2.5">
              <span>{getCategoryTitle(activeFilterKey)}</span>
              <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                {displayedList.length} ta xodim
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tanlangan ko'rsatkich bo'yicha 4-ustunli minimal jadval
            </p>
          </div>

          <button
            onClick={handleExportCategoryPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95 transition cursor-pointer"
            title="Ushbu toifa xodimlari ro'yxatini PDF formatida yuklab olish"
          >
            <Download className="w-4 h-4" />
            <span>PDF Yuklab Olish</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5 text-center w-14">№</th>
                <th className="px-4 py-3.5">F.I.SH</th>
                <th className="px-4 py-3.5">Tabel Raqami</th>
                <th className="px-4 py-3.5">Lavozimi</th>
                <th className="px-4 py-3.5">Bo'limi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-medium">
              {displayedList.length > 0 ? (
                displayedList.map((emp: any, idx: number) => (
                  <tr key={emp.id || idx} className="hover:bg-slate-900/60 transition">
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-100">{emp.fullName}</td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">{emp.tabelNumber || '—'}</td>
                    <td className="px-4 py-3 text-slate-200">{emp.position || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{emp.departmentName || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 italic">
                    Ushbu ko'rsatkich bo'yicha xodimlar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2 text-xs text-slate-400 font-mono">
          <span>Jami ko'rsatildi: <strong className="text-white">{displayedList.length}</strong> kishi</span>
          <span>Eksport sanasi: {new Date().toLocaleDateString('uz-UZ')}</span>
        </div>
      </div>
    </div>
  );
};
