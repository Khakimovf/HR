'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Users,
  ShieldAlert,
  ArrowLeftRight,
  TrendingUp,
  Building,
  Calendar,
  Download,
  FileCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDate } from '@/lib/utils';

export const ExecutiveSvodka: React.FC = () => {
  const [svodkaData, setSvodkaData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/svodka')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSvodkaData(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExportExcel = () => {
    if (!svodkaData) return;

    const metrics = svodkaData.metrics;
    const depts = svodkaData.departmentMetrics;

    const summarySheetData = [
      ['SANOAT KORXONASI HR IJROYIY SVODKA HISOBOTI'],
      ['Sana:', new Date().toLocaleDateString('uz-UZ')],
      [],
      ['Ko\'rsatkich Nomi', 'Qiymat'],
      ['Umumiy Shtat Baza', metrics.totalEmployees],
      ['Faol Ishlayotgan Xodimlar', metrics.activeEmployees],
      ['Ta\'tildagi Xodimlar (M/T, B/S)', metrics.onLeaveEmployees],
      ['Mehnat shartnomasi bekor qilinganlar', metrics.offboardedEmployees],
      ['Bugun ko\'chirilganlar (Transfers)', metrics.transfersToday],
      ['Faol Intizomiy Hayfsanlar', metrics.activeDisciplinaryActions],
      ['Yillik Mehnat Ta\'tili (M/T)', metrics.leavesByType?.MT || 0],
      ['O\'z Hisobidan Ta\'til (B/S)', metrics.leavesByType?.BS || 0],
      ['Kasallik Varaqasi (B/L)', metrics.leavesByType?.BL || 0],
    ];

    const deptSheetData = [
      ['Bo\'lim Kodi', 'Bo\'lim Nomi', 'Xodimlar Soni'],
      ...depts.map((d: any) => [d.code, d.name, d.employeeCount]),
    ];

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
    const wsDepts = XLSX.utils.aoa_to_sheet(deptSheetData);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ijroiy Svodka');
    XLSX.utils.book_append_sheet(wb, wsDepts, 'Bo\'limlar Tarkibi');

    XLSX.writeFile(wb, `Executive_HR_Svodka_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const metrics = svodkaData?.metrics || {};
  const depts = svodkaData?.departmentMetrics || [];

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <FileCheck className="h-6 w-6 text-amber-400" />
            <span>Bir Bosishli Ijroiy Svodka & Hisobot Generator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Bosh direktor va HR Boshqarmasi uchun korxona shtati, ta'tillar va intizom bo'yicha tezkor svodka
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel Export (Svodka.xlsx)</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition active:scale-95"
          >
            <Printer className="h-4 w-4 text-indigo-400" />
            <span>PDF Chop Etish / Preview</span>
          </button>
        </div>
      </div>

      {/* Metric Grid Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-indigo-500/30 bg-indigo-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
            <span>Umumiy Faol Shtat</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {metrics.activeEmployees || 0} <span className="text-xs font-normal text-slate-400">kishi</span>
          </div>
          <div className="text-[11px] text-slate-400">Jami ro'yxat: {metrics.totalEmployees || 0} kishi</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-amber-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
            <span>Ta'tildagi Xodimlar</span>
            <Calendar className="h-4 w-4" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">
            {metrics.onLeaveEmployees || 0} <span className="text-xs font-normal text-slate-400">kishi</span>
          </div>
          <div className="text-[11px] text-slate-400">
            M/T: {metrics.leavesByType?.MT || 0} | B/S: {metrics.leavesByType?.BS || 0} | B/L: {metrics.leavesByType?.BL || 0}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-rose-500/30 bg-rose-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-rose-300 font-semibold">
            <span>Faol Intizomiy Hayfsanlar</span>
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400">
            {metrics.activeDisciplinaryActions || 0} <span className="text-xs font-normal text-slate-400">buyruq</span>
          </div>
          <div className="text-[11px] text-slate-400">Intizom nazorati ostida</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-purple-500/30 bg-purple-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
            <span>Bugungi Rotatsiyalar</span>
            <ArrowLeftRight className="h-4 w-4" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400">
            {metrics.transfersToday || 0} <span className="text-xs font-normal text-slate-400">o'tkazish</span>
          </div>
          <div className="text-[11px] text-slate-400">Bo'limlararo ko'chirilganlar</div>
        </div>
      </div>

      {/* Departmental Svodka Table */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 printable-area">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Sanoat Korxonasi Bo'limlar Tarkibiy Svodkasi</h3>
            <p className="text-xs text-slate-400">Direksiya, Logistika va Ishlab chiqarish sexlari bo'yicha jonli statistika</p>
          </div>
          <div className="font-mono text-xs text-slate-400">
            Sana: {new Date().toLocaleDateString('uz-UZ')}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Bo'lim Kodi</th>
                <th className="px-4 py-3">Bo'lim Nomi</th>
                <th className="px-4 py-3">Faol Shtat</th>
                <th className="px-4 py-3">Husseynov % Ulushi</th>
                <th className="px-4 py-3 text-right">Holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {depts.map((d: any) => {
                const sharePct = metrics.totalEmployees ? ((d.employeeCount / metrics.totalEmployees) * 100).toFixed(1) : 0;
                return (
                  <tr key={d.id} className="hover:bg-slate-900/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">[{d.code}]</td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{d.name}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-100">{d.employeeCount} kishi</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{sharePct}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                        NORMAL
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
