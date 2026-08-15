'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Award,
  Save,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Building2,
  TrendingUp,
  Percent,
  DollarSign,
  Users,
  Edit,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Criterion {
  id?: string;
  name: string;
  weight: number;
  target: string;
}

interface KpiManagementViewProps {
  departments?: Department[];
}

export const KpiManagementView: React.FC<KpiManagementViewProps> = ({ departments = [] }) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'evaluations' | 'payroll'>('templates');
  const [deptList, setDeptList] = useState<Department[]>(departments);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [period, setPeriod] = useState<string>('2026-08');

  // Fetch departments if not provided as prop
  useEffect(() => {
    if (deptList.length === 0) {
      fetch('/api/departments')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.departments)) {
            setDeptList(data.departments);
            if (data.departments.length > 0 && !selectedDeptId) {
              setSelectedDeptId(data.departments[0].id);
            }
          }
        })
        .catch((e) => console.error(e));
    } else if (deptList.length > 0 && !selectedDeptId) {
      setSelectedDeptId(deptList[0].id);
    }
  }, [deptList]);

  // ─── TAB 1 STATE: TEMPLATE CONFIGURATION ──────────────────────────────────
  const [positionTitle, setPositionTitle] = useState<string>('');
  const [templateTitle, setTemplateTitle] = useState<string>("Bo'lim KPI Mezonlari va Og'irliklari");
  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: '1', name: 'Braksiz mahsulot ulushi', weight: 40, target: '98%' },
    { id: '2', name: 'Ishlab chiqarish rejasi bajarilishi', weight: 40, target: '100%' },
    { id: '3', name: 'Mehnat va texnika intizomi', weight: 20, target: '0 xatolik' },
  ]);
  const [newCritName, setNewCritName] = useState<string>('');
  const [newCritWeight, setNewCritWeight] = useState<number>(10);
  const [newCritTarget, setNewCritTarget] = useState<string>('100%');
  const [savingTemplate, setSavingTemplate] = useState<boolean>(false);
  const [templateMsg, setTemplateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Total criteria weight validation
  const totalWeight = useMemo(() => {
    return criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  }, [criteria]);

  const fetchTemplateForDept = (deptId: string) => {
    if (!deptId) return;
    fetch(`/api/kpi/templates?departmentId=${deptId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.templates && data.templates.length > 0) {
          const t = data.templates[0];
          setTemplateTitle(t.title || "Bo'lim KPI Mezonlari va Og'irliklari");
          setPositionTitle(t.position || '');
          if (Array.isArray(t.criteria) && t.criteria.length > 0) {
            setCriteria(
              t.criteria.map((c: any) => ({
                id: c.id,
                name: c.name,
                weight: c.weight,
                target: c.target,
              }))
            );
          }
        }
      })
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    if (selectedDeptId) {
      fetchTemplateForDept(selectedDeptId);
    }
  }, [selectedDeptId]);

  const handleAddCriterion = () => {
    if (!newCritName.trim()) {
      alert("Mezon nomini kiriting");
      return;
    }
    setCriteria([
      ...criteria,
      {
        id: Date.now().toString(),
        name: newCritName.trim(),
        weight: Number(newCritWeight) || 0,
        target: newCritTarget.trim() || '100%',
      },
    ]);
    setNewCritName('');
    setNewCritWeight(10);
    setNewCritTarget('100%');
  };

  const handleDeleteCriterion = (id?: string, index?: number) => {
    setCriteria(criteria.filter((c, idx) => (id ? c.id !== id : idx !== index)));
  };

  const handleSaveTemplate = async () => {
    if (Math.abs(totalWeight - 100) > 0.01) {
      setTemplateMsg({
        type: 'error',
        text: `Mezonlar og'irliklari yig'indisi 100% bo'lishi shart! (Hozirgi yig'indi: ${totalWeight}%)`,
      });
      return;
    }

    setSavingTemplate(true);
    setTemplateMsg(null);

    try {
      const res = await fetch('/api/kpi/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: selectedDeptId,
          position: positionTitle,
          title: templateTitle,
          criteria,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplateMsg({ type: 'success', text: "KPI Shablon va mezonlar muvaffaqiyatli saqlandi!" });
      } else {
        setTemplateMsg({ type: 'error', text: data.error || "Saqlashda xatolik" });
      }
    } catch (e: any) {
      setTemplateMsg({ type: 'error', text: e.message || "Server xatosi" });
    } finally {
      setSavingTemplate(false);
    }
  };

  // ─── TAB 2 STATE: MONTHLY SCORING EVALUATION ──────────────────────────────
  const [evalEmps, setEvalEmps] = useState<any[]>([]);
  const [evalLoading, setEvalLoading] = useState<boolean>(false);
  const [savingEvaluations, setSavingEvaluations] = useState<boolean>(false);
  const [evalScores, setEvalScores] = useState<{ [empId: string]: number }>({});
  const [evalMsg, setEvalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEvaluations = () => {
    setEvalLoading(true);
    const params = new URLSearchParams({
      period,
      departmentId: selectedDeptId,
    });
    fetch(`/api/kpi/evaluations?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvalEmps(data.employees || []);
          const initialScores: { [id: string]: number } = {};
          (data.employees || []).forEach((e: any) => {
            const ev = e.kpiEvaluations && e.kpiEvaluations[0];
            initialScores[e.id] = ev ? ev.totalScore : 85.0;
          });
          setEvalScores(initialScores);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setEvalLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'evaluations' || activeTab === 'payroll') {
      fetchEvaluations();
    }
  }, [activeTab, selectedDeptId, period]);

  const getScoreBadge = (score: number) => {
    if (score >= 90) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> A'lo ({score}%)
        </span>
      );
    } else if (score >= 70) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-400 border border-blue-500/20">
          Yaxshi ({score}%)
        </span>
      );
    } else if (score >= 50) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20">
          O'rta ({score}%)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-400 border border-rose-500/20">
          Qoniqarsiz (Mukofot 0%)
        </span>
      );
    }
  };

  const handleSaveEvaluations = async () => {
    setSavingEvaluations(true);
    setEvalMsg(null);

    const payload = evalEmps.map((emp) => ({
      employeeId: emp.id,
      totalScore: evalScores[emp.id] ?? 85.0,
      notes: "Oylik KPI baholash natijasi",
    }));

    try {
      const res = await fetch('/api/kpi/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          departmentId: selectedDeptId,
          evaluations: payload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEvalMsg({ type: 'success', text: `${data.count} ta xodimning KPI baholash ko'rsatkichlari saqlandi!` });
      } else {
        setEvalMsg({ type: 'error', text: data.error || "Saqlashda xatolik" });
      }
    } catch (e: any) {
      setEvalMsg({ type: 'error', text: e.message || "Server xatosi" });
    } finally {
      setSavingEvaluations(false);
    }
  };

  // ─── TAB 3 STATE: PAYROLL SUMMARY & EXPORTS ──────────────────────────────
  const [payrollRows, setPayrollRows] = useState<any[]>([]);
  const [payrollStats, setPayrollStats] = useState<any>({
    totalEmployees: 0,
    eligibleCount: 0,
    totalBaseSalary: 0,
    totalBonusAmount: 0,
    avgKpiScore: 0,
  });
  const [payrollLoading, setPayrollLoading] = useState<boolean>(false);

  const fetchPayrollSummary = () => {
    setPayrollLoading(true);
    const params = new URLSearchParams({
      period,
      departmentId: selectedDeptId,
    });
    fetch(`/api/kpi/payroll-summary?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPayrollRows(data.rows || []);
          setPayrollStats(data.stats || {});
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setPayrollLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'payroll') {
      fetchPayrollSummary();
    }
  }, [activeTab, selectedDeptId, period]);

  const selectedDepartmentObj = deptList.find((d) => d.id === selectedDeptId);

  // Excel / CSV Export
  const handleExportPayrollExcel = () => {
    if (payrollRows.length === 0) {
      alert("Eksport qilish uchun ma'lumot yo'q");
      return;
    }

    const printDate = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
    const deptName = selectedDepartmentObj ? selectedDepartmentObj.name : "Barcha Bo'limlar";

    const lines = [
      `"YIRIK ISHLAB CHIQARISH KORXONASI - MUKOFOT VA PAYROLL SVODKASI"`,
      `"Davr: ${period} | Bo'lim: ${deptName} | Eksport sanasi: ${printDate}"`,
      ``,
      `"1. EXECUTUVE PAYROLL SUMMARY"`,
      `"Ko'rsatkich","Qiymat"`,
      `"Jami Xodimlar",${payrollStats.totalEmployees}`,
      `"Mukofot Oladigan Xodimlar Soni",${payrollStats.eligibleCount}`,
      `"Jami Oklad Fondi (UZS)",${payrollStats.totalBaseSalary}`,
      `"Jami Mukofot Fondi (UZS)",${payrollStats.totalBonusAmount}`,
      `"O'rtacha KPI Bali",${payrollStats.avgKpiScore}%`,
      ``,
      `"2. DETAILED PAYROLL BONUS LIST"`,
      `"№","Tabel №","F.I.O","Bo'lim","Oklad (UZS)","KPI Bali (%)","Mukofot Stavkasi (%)","To'lanadigan Mukofot (UZS)"`,
      ...payrollRows.map((r, idx) =>
        [
          idx + 1,
          r.tabelNumber,
          `"${r.fullName}"`,
          `"${r.departmentName}"`,
          r.baseSalary,
          `${r.kpiScore}%`,
          `${r.bonusRatePct}%`,
          r.bonusAmountUzs,
        ].join(',')
      ),
    ];

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KPI_Payroll_Svodka_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable A4 PDF Export
  const handleExportPayrollPDF = () => {
    if (payrollRows.length === 0) {
      alert("PDF eksport qilish uchun ma'lumot yo'q");
      return;
    }

    const printDate = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
    const deptName = selectedDepartmentObj ? selectedDepartmentObj.name : "Barcha Bo'limlar";

    const rowsHtml = payrollRows
      .map(
        (r, idx) => `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: 700;">${r.tabelNumber}</td>
          <td><b>${r.fullName}</b></td>
          <td>${r.departmentName}</td>
          <td style="text-align: right; font-family: monospace;">${formatCurrency(r.baseSalary)}</td>
          <td style="text-align: center; font-weight: bold; color: ${r.kpiScore >= 70 ? '#16a34a' : r.kpiScore >= 50 ? '#d97706' : '#dc2626'};">${r.kpiScore}%</td>
          <td style="text-align: center; font-family: monospace; font-weight: 700;">${r.bonusRatePct}%</td>
          <td style="text-align: right; font-family: monospace; font-weight: 800; color: #0284c7;">${formatCurrency(r.bonusAmountUzs)}</td>
        </tr>
      `
      )
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>KPI_Payroll_Svodka_${period}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family: Arial, sans-serif; font-size: 9.5pt; color: #1e293b; line-height: 1.4; margin: 0; padding: 0; background: #ffffff; }

  .header-box { background: #0f172a; color: #ffffff; padding: 14px 18px; border-radius: 6px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
  .header-title { font-size: 13pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
  .header-sub { font-size: 8.5pt; color: #94a3b8; margin-top: 2px; }

  .summary-banner { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; font-size: 9pt; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { border: 1px solid #94a3b8; padding: 6px 8px; font-size: 8.5pt; }
  th { background-color: #e2e8f0; color: #0f172a; font-weight: bold; text-transform: uppercase; font-size: 8pt; text-align: left; }
  tr:nth-child(even) { background-color: #f8fafc; }

  .signatures { margin-top: 30px; display: flex; justify-content: space-between; font-size: 8.5pt; }
  .sig-line { width: 200px; border-bottom: 1px solid #0f172a; margin-top: 25px; }
</style>
</head>
<body>

<div class="header-box">
  <div>
    <div class="header-title">YIRIK ISHLAB CHIQARISH KORXONASI</div>
    <div class="header-sub">KPI SAMARADORLIK VA OYLIK MUKOFOT PAYROLL SVODKASI</div>
  </div>
  <div style="text-align: right; font-size: 8.5pt;">
    <div>Davr: <b>${period}</b></div>
    <div>Sana: <b>${printDate}</b></div>
  </div>
</div>

<div class="summary-banner">
  <div><b>Bo'lim:</b> ${deptName} | <b>Jami Xodimlar:</b> ${payrollStats.totalEmployees} ta</div>
  <div><b>Oklad Fondi:</b> ${formatCurrency(payrollStats.totalBaseSalary)} UZS | <b>Jami Mukofot Fondi:</b> <b style="color: #0284c7;">${formatCurrency(payrollStats.totalBonusAmount)} UZS</b></div>
</div>

<table>
  <thead>
    <tr>
      <th style="width: 30px; text-align: center;">№</th>
      <th>Tabel №</th>
      <th>F.I.O</th>
      <th>Bo'lim</th>
      <th style="text-align: right;">Oklad (UZS)</th>
      <th style="text-align: center;">KPI Bali (%)</th>
      <th style="text-align: center;">Mukofot Stavkasi (%)</th>
      <th style="text-align: right;">To'lanadigan Mukofot (UZS)</th>
    </tr>
  </thead>
  <tbody>
    ${rowsHtml}
  </tbody>
</table>

<div class="signatures">
  <div>
    <div><b>Bosh Direktor:</b> Nazarov B.</div>
    <div class="sig-line"></div>
  </div>
  <div>
    <div><b>HR Boshlig'i:</b> Karimov J.</div>
    <div class="sig-line"></div>
  </div>
  <div>
    <div><b>Bosh Buxgalter:</b> Usmonova M.</div>
    <div class="sig-line"></div>
  </div>
</div>

</body>
</html>`;

    const win = window.open('', '_blank', 'width=1100,height=800');
    if (!win) { alert('Pop-up bloklangan. Brauzerdagi cheklovni olib tashlang.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              KPI & Samaradorlikni Baholash Dvigateli
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">
                20% Max Bonus Formula
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Shablonlar, oylik baholash va base salary (Oklad) bo'yicha mukofot svodkasi
            </p>
          </div>
        </div>

        {/* Global Filters: Department & Period */}
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Bo'lim (Department):
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Barcha Bo'limlar --</option>
              {deptList.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.code}] {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Baholash Davri (Period):
            </label>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3 Operational Sub-Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-indigo-600 text-white border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>1. KPI Shablonlari va Mezonlar</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition cursor-pointer ${
            activeTab === 'evaluations'
              ? 'bg-indigo-600 text-white border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>2. Oylik Baholash Oynasi</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition cursor-pointer ${
            activeTab === 'payroll'
              ? 'bg-indigo-600 text-white border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>3. Mukofot Svodkasi va Payroll</span>
        </button>
      </div>

      {/* ── TAB 1: TEMPLATE CONFIGURATION ── */}
      {activeTab === 'templates' && (
        <div className="space-y-6 animate-fadeIn">
          {templateMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                templateMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              <span>{templateMsg.text}</span>
              <button onClick={() => setTemplateMsg(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Bo'lim KPI Baholash Mezonlari va Og'irliklari
                </h3>
                <p className="text-xs text-slate-400">
                  Bo'lim uchun mezonlar va % og'irliklarini sozlang. Barcha og'irliklar yig'indisi aniq 100% bo'lishi kerak.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border ${
                    Math.abs(totalWeight - 100) < 0.01
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  Jami Og'irlik: {totalWeight}% / 100%
                </div>

                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition active:scale-95 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>💾 Shablonni Saqlash</span>
                </button>
              </div>
            </div>

            {/* Existing Criteria Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">№</th>
                    <th className="px-4 py-3">Mezon Nomi (Criterion Name)</th>
                    <th className="px-4 py-3 text-center">Og'irligi % (Weight)</th>
                    <th className="px-4 py-3">Maqsad (Target Value)</th>
                    <th className="px-4 py-3 text-right">Harakatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {criteria.map((crit, idx) => (
                    <tr key={crit.id || idx} className="hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-100">
                        <input
                          type="text"
                          value={crit.name}
                          onChange={(e) => {
                            const updated = [...criteria];
                            updated[idx].name = e.target.value;
                            setCriteria(updated);
                          }}
                          className="bg-slate-800 border border-slate-700 text-xs text-slate-100 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-indigo-400">
                        <input
                          type="number"
                          value={crit.weight}
                          onChange={(e) => {
                            const updated = [...criteria];
                            updated[idx].weight = Number(e.target.value);
                            setCriteria(updated);
                          }}
                          className="bg-slate-800 border border-slate-700 text-xs text-indigo-300 rounded px-2 py-1 w-20 text-center font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 mx-auto"
                        />
                        %
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={crit.target}
                          onChange={(e) => {
                            const updated = [...criteria];
                            updated[idx].target = e.target.value;
                            setCriteria(updated);
                          }}
                          className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteCriterion(crit.id, idx)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition cursor-pointer"
                          title="🗑️ O'chirish"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New Criterion Box */}
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-indigo-400" />
                Yangi Mezon Qo'shish
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newCritName}
                    onChange={(e) => setNewCritName(e.target.value)}
                    placeholder="Mezon nomi (masalan: Mehnat muhofazasi)..."
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={newCritWeight}
                    onChange={(e) => setNewCritWeight(Number(e.target.value))}
                    placeholder="Og'irligi %"
                    className="w-full bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <button
                    onClick={handleAddCriterion}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>[+] Mezon Qo'shish</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MONTHLY SCORING EVALUATION ── */}
      {activeTab === 'evaluations' && (
        <div className="space-y-6 animate-fadeIn">
          {evalMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                evalMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              <span>{evalMsg.text}</span>
              <button onClick={() => setEvalMsg(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Oylik KPI Baholash Kiritish ({period})
              </h3>
              <p className="text-xs text-slate-400">
                Xodimlar bo'yicha KPI ko'rsatkichlarini (0-100%) kiriting. Baho statusi real-vaqtda yangilanadi.
              </p>
            </div>

            <button
              onClick={handleSaveEvaluations}
              disabled={savingEvaluations}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition active:scale-95"
            >
              <Save className="h-4 w-4" />
              <span>💾 Oylik Baholashni Saqlash</span>
            </button>
          </div>

          {/* Evaluations Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">№</th>
                  <th className="px-4 py-3.5">Tabel № / F.I.O</th>
                  <th className="px-4 py-3.5">Bo'lim & Lavozim</th>
                  <th className="px-4 py-3.5 text-center">Jami KPI Bali (0-100%)</th>
                  <th className="px-4 py-3.5 text-center">Baholash Statusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {evalLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      Ma'lumotlar yuklanmoqda...
                    </td>
                  </tr>
                ) : evalEmps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      Ushbu bo'limda faol xodimlar topilmadi
                    </td>
                  </tr>
                ) : (
                  evalEmps.map((emp, idx) => {
                    const score = evalScores[emp.id] ?? 85.0;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-900/60 transition">
                        <td className="px-4 py-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400">
                              {emp.tabelNumber}
                            </span>
                            <span className="font-semibold text-slate-100">
                              {emp.lastName} {emp.firstName} {emp.middleName || ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <span>{emp.position}</span>
                          <p className="text-[11px] text-indigo-300">{emp.currentDepartment?.name}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={score}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                setEvalScores({ ...evalScores, [emp.id]: val });
                              }}
                              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 w-20 text-center font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <span className="font-mono text-slate-400">%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">{getScoreBadge(score)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: BONUS & PAYROLL SUMMARY ── */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive KPI Payroll Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
                <span>Jami Oklad Fondi</span>
                <DollarSign className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-xl font-mono font-bold text-white">
                {formatCurrency(payrollStats.totalBaseSalary)} UZS
              </p>
              <p className="text-[11px] text-slate-500">{payrollStats.totalEmployees} ta xodim bo'yicha</p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
                <span>Hisoblangan Mukofot Fondi</span>
                <Award className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-xl font-mono font-bold text-emerald-400">
                {formatCurrency(payrollStats.totalBonusAmount)} UZS
              </p>
              <p className="text-[11px] text-slate-500">Max 20% stavka bo'yicha</p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
                <span>O'rtacha KPI Bali</span>
                <Percent className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-xl font-mono font-bold text-blue-400">{payrollStats.avgKpiScore}%</p>
              <p className="text-[11px] text-slate-500">Bo'lim ko'rsatkichi</p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
                <span>Mukofot Oladiganlar</span>
                <Users className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-xl font-mono font-bold text-amber-400">
                {payrollStats.eligibleCount} / {payrollStats.totalEmployees}
              </p>
              <p className="text-[11px] text-slate-500">KPI ≥ 50% bo'lganlar</p>
            </div>
          </div>

          {/* Action Bar with Exports */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Oylik Mukofot Svodkasi va Payroll ({period})
              </h3>
              <p className="text-xs text-slate-400">
                Formula: Mukofot % = IF KPI ≥ 50% THEN (20% × KPI / 100) ELSE 0%. Mukofot Summasi = Oklad × Mukofot %.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportPayrollExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>📊 Excel Mukofot Svodkasini Yuklash</span>
              </button>

              <button
                onClick={handleExportPayrollPDF}
                className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>📄 PDF KPI Svodka Yuklash</span>
              </button>
            </div>
          </div>

          {/* Summary Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">№</th>
                  <th className="px-4 py-3.5">Tabel № / F.I.O</th>
                  <th className="px-4 py-3.5">Bo'limi</th>
                  <th className="px-4 py-3.5 text-right">Okladi (UZS)</th>
                  <th className="px-4 py-3.5 text-center">KPI Bali (%)</th>
                  <th className="px-4 py-3.5 text-center">Mukofot Stavkasi (%)</th>
                  <th className="px-4 py-3.5 text-right">To'lanadigan Mukofot (UZS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                {payrollLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-sans">
                      Mukofot svodkasi hisoblanmoqda...
                    </td>
                  </tr>
                ) : payrollRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-sans">
                      Ushbu bo'limda ma'lumot yo'q
                    </td>
                  </tr>
                ) : (
                  payrollRows.map((row, idx) => (
                    <tr key={row.employeeId || idx} className="hover:bg-slate-900/60 transition">
                      <td className="px-4 py-3 font-bold text-slate-400 font-sans">{idx + 1}</td>
                      <td className="px-4 py-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-400">
                            {row.tabelNumber}
                          </span>
                          <span className="font-semibold text-slate-100">{row.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-sans text-indigo-300">{row.departmentName}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-200">
                        {formatCurrency(row.baseSalary)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            row.kpiScore >= 90
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : row.kpiScore >= 70
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : row.kpiScore >= 50
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {row.kpiScore}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-400">
                        {row.bonusRatePct}%
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-400">
                        {formatCurrency(row.bonusAmountUzs)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
