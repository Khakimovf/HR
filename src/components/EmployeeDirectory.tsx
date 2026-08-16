'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  FileSpreadsheet,
  Download,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmployeeFilterBar, FilterState, initialFilterState } from './EmployeeFilterBar';
import { EmployeeListTable, Employee } from './EmployeeListTable';

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

interface EmployeeDirectoryProps {
  departments: Array<{ id: string; name: string; code: string }>;
  onSelectEmployee: (employeeId: string) => void;
  onTransferEmployee: (employeeId: string) => void;
  onOpenBulkModal?: () => void;
  selectedDepartmentId?: string;
  onSelectDepartmentId?: (deptId: string) => void;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  departments,
  onSelectEmployee,
  onTransferEmployee,
  onOpenBulkModal,
  selectedDepartmentId = '',
  onSelectDepartmentId,
}) => {
  const { canEditEmployee } = useAuth();
  const { t, language } = useLanguage();

  // 9 Analytical Filters state
  const [filters, setFilters] = useState<FilterState>({
    ...initialFilterState,
    selectedDepartmentId: selectedDepartmentId || '',
  });

  // Sync prop selectedDepartmentId into local filter state if external selection changes
  useEffect(() => {
    if (selectedDepartmentId !== filters.selectedDepartmentId) {
      setFilters((prev) => ({ ...prev, selectedDepartmentId }));
    }
  }, [selectedDepartmentId]);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key === 'selectedDepartmentId' && onSelectDepartmentId) {
      onSelectDepartmentId(value as string);
    }
    setPage(1);
  };

  const getQueryParams = (isAllForExport = false) => {
    const params = new URLSearchParams();
    if (filters.searchVal) params.set('search', filters.searchVal);
    if (filters.selectedDepartmentId) params.set('departmentId', filters.selectedDepartmentId);
    if (filters.educationFilter !== 'ALL') params.set('educationFilter', filters.educationFilter);
    if (filters.rewardFilter !== 'ALL') params.set('rewardFilter', filters.rewardFilter);
    if (filters.medicalFilter !== 'ALL') params.set('medicalFilter', filters.medicalFilter);
    if (filters.tenureFilter !== 'ALL') params.set('tenureFilter', filters.tenureFilter);
    if (filters.demographicFilter !== 'ALL') params.set('demographicFilter', filters.demographicFilter);
    if (filters.permitFilter !== 'ALL') params.set('permitFilter', filters.permitFilter);
    if (filters.filterStatus !== 'ALL') params.set('status', filters.filterStatus);
    if (filters.filterDiscipline !== 'ALL') params.set('disciplineStatus', filters.filterDiscipline);

    if (isAllForExport) {
      params.set('limit', '10000');
    } else {
      params.set('page', page.toString());
      params.set('limit', limit.toString());
    }
    return params;
  };

  const fetchEmployeesData = () => {
    setLoading(true);
    const params = getQueryParams(false);

    fetch(`/api/employees?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEmployees(data.employees || []);
          setPagination(data.pagination || {
            total: data.employees?.length || 0,
            page: 1,
            limit: 20,
            totalPages: 1,
            hasPrev: false,
            hasNext: false,
          });
        }
      })
      .catch((err) => console.error('Failed to fetch employees:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployeesData();
  }, [
    filters.searchVal,
    filters.selectedDepartmentId,
    filters.educationFilter,
    filters.rewardFilter,
    filters.medicalFilter,
    filters.tenureFilter,
    filters.demographicFilter,
    filters.permitFilter,
    filters.filterStatus,
    filters.filterDiscipline,
    page,
    limit,
  ]);

  const activeFiltersCount = [
    filters.searchVal ? 1 : 0,
    filters.selectedDepartmentId ? 1 : 0,
    filters.educationFilter !== 'ALL' ? 1 : 0,
    filters.rewardFilter !== 'ALL' ? 1 : 0,
    filters.medicalFilter !== 'ALL' ? 1 : 0,
    filters.tenureFilter !== 'ALL' ? 1 : 0,
    filters.demographicFilter !== 'ALL' ? 1 : 0,
    filters.permitFilter !== 'ALL' ? 1 : 0,
    filters.filterStatus !== 'ALL' ? 1 : 0,
    filters.filterDiscipline !== 'ALL' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const resetAllFilters = () => {
    setFilters(initialFilterState);
    if (onSelectDepartmentId) onSelectDepartmentId('');
    setPage(1);
  };

  // ─── Filter-Aware Analytical HR Export Handlers ───
  const fetchAllFilteredEmployees = async (): Promise<Employee[]> => {
    const params = getQueryParams(true);
    const res = await fetch(`/api/employees?${params.toString()}`);
    const data = await res.json();
    return data.success ? data.employees || [] : employees;
  };

  const handleExportFilteredExcel = async () => {
    setExporting(true);
    try {
      const exportList = await fetchAllFilteredEmployees();
      if (exportList.length === 0) {
        alert(language === 'kr' ? '내보낼 데이터가 없습니다.' : "Export qilish uchun ma'lumot topilmadi");
        return;
      }

      const selectedDepartmentObj = departments.find((d) => d.id === filters.selectedDepartmentId);
      const deptName = selectedDepartmentObj ? selectedDepartmentObj.name : (language === 'kr' ? '전체 부서' : "Barcha Bo'limlar");
      const printDate = new Date().toLocaleDateString(language === 'kr' ? 'ko-KR' : 'uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

      const activeEmps = exportList.filter((e) => e.status === 'ACTIVE');
      const onLeaveEmps = exportList.filter((e) => e.status === 'ON_LEAVE' || e.status === 'VACATION');

      const formatEmpRows = (list: any[]) =>
        list.map((emp, idx) => [
          idx + 1,
          emp.tabelNumber || '',
          `"${emp.lastName} ${emp.firstName} ${emp.middleName || ''}"`.trim(),
          `"${emp.currentDepartment?.name || ''}"`,
          `"${emp.position || ''}"`,
          `"${emp.phone || ''}"`,
          emp.hireDate ? new Date(emp.hireDate).toLocaleDateString(language === 'kr' ? 'ko-KR' : 'uz-UZ') : '',
          emp.status || '',
        ].join(','));

      const lines = [
        `"HR ANALYTICS EXPORT REPORT"`,
        `"Export Date: ${printDate} | Department: ${deptName} | Total Count: ${exportList.length}"`,
        ``,
        `"1. EXECUTIVE KPI SUMMARY"`,
        `"Category","Count"`,
        `"Filtered Total",${exportList.length}`,
        `"Active Employees",${activeEmps.length}`,
        `"On Leave Employees",${onLeaveEmps.length}`,
        ``,
        `"2. DETAILED EMPLOYEE LIST (${exportList.length})"`,
        `"№","Tabel №","F.I.O","Department","Position","Phone","Hire Date","Status"`,
        ...formatEmpRows(exportList),
      ];

      const csvContent = '\uFEFF' + lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `HR_Analitik_Svodka_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Excel export jarayonida xatolik yuz berdi");
    } finally {
      setExporting(false);
    }
  };

  const handleExportFilteredPDF = async () => {
    setExporting(true);
    try {
      const exportList = await fetchAllFilteredEmployees();
      if (exportList.length === 0) {
        alert(language === 'kr' ? '내보낼 데이터가 없습니다.' : "PDF eksport qilish uchun ma'lumot topilmadi");
        return;
      }

      const selectedDepartmentObj = departments.find((d) => d.id === filters.selectedDepartmentId);
      const deptName = selectedDepartmentObj ? selectedDepartmentObj.name : (language === 'kr' ? '전체 부서' : "Barcha Bo'limlar");
      const printDate = new Date().toLocaleDateString(language === 'kr' ? 'ko-KR' : 'uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

      const activeEmps = exportList.filter((e) => e.status === 'ACTIVE');
      const onLeaveEmps = exportList.filter((e) => e.status === 'ON_LEAVE' || e.status === 'VACATION');

      const renderTableRows = (list: any[]) =>
        list.length > 0
          ? list.map((emp, idx) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                <td style="font-family: monospace; font-weight: 700;">${emp.tabelNumber || '—'}</td>
                <td><b>${emp.lastName} ${emp.firstName} ${emp.middleName || ''}</b></td>
                <td>${emp.currentDepartment?.name || '—'}</td>
                <td>${emp.position || '—'}</td>
                <td style="font-family: monospace;">${emp.phone || '—'}</td>
                <td style="font-family: monospace;">${emp.hireDate ? new Date(emp.hireDate).toLocaleDateString(language === 'kr' ? 'ko-KR' : 'uz-UZ') : '—'}</td>
                <td><span style="background: #e2e8f0; padding: 2px 6px; border-radius: 3px; font-size: 8pt; font-weight: 700;">${emp.status}</span></td>
              </tr>
            `).join('')
          : `<tr><td colspan="8" style="text-align: center; color: #64748b; font-style: italic;">Xodimlar topilmadi</td></tr>`;

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>HR_Analitik_Svodka_${new Date().toISOString().split('T')[0]}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family: Arial, sans-serif; font-size: 9.5pt; color: #1e293b; line-height: 1.4; margin: 0; padding: 0; background: #ffffff; }

  .header-box { background: #0f172a; color: #ffffff; padding: 14px 18px; border-radius: 6px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
  .header-title { font-size: 13pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
  .header-sub { font-size: 8.5pt; color: #94a3b8; margin-top: 2px; }

  .filter-banner { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 8.5pt; color: #334155; }

  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .kpi-card { border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px; border-radius: 6px; text-align: center; }
  .kpi-value { font-size: 16pt; font-weight: bold; color: #0284c7; }
  .kpi-label { font-size: 8pt; font-weight: 700; color: #475569; margin-top: 2px; text-transform: uppercase; }

  .category-title { font-size: 10.5pt; font-weight: bold; color: #0f172a; border-bottom: 2.5px solid #0284c7; padding-bottom: 4px; margin-top: 18px; margin-bottom: 8px; text-transform: uppercase; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { border: 1px solid #94a3b8; padding: 5px 7px; font-size: 8.5pt; text-align: left; }
  th { background-color: #e2e8f0; color: #0f172a; font-weight: bold; text-transform: uppercase; font-size: 8pt; }
  tr:nth-child(even) { background-color: #f8fafc; }

  .footer { border-top: 1.5px solid #94a3b8; padding-top: 8px; margin-top: 20px; display: flex; justify-content: space-between; font-size: 8pt; color: #64748b; }
</style>
</head>
<body>

<div class="header-box">
  <div>
    <div class="header-title">ENTERPRISE HR MANAGEMENT</div>
    <div class="header-sub">HR ANALYTICS EXPORT REPORT</div>
  </div>
  <div style="text-align: right; font-size: 8.5pt;">
    <div>Sana: <b>${printDate}</b></div>
    <div style="font-family: monospace; color: #38bdf8;">HR-SVODKA-SYSTEM</div>
  </div>
</div>

<div class="filter-banner">
  <b>Filter Info:</b> Department: <u>${deptName}</u> | Search: <u>${filters.searchVal || "None"}</u> | Count: <b>${exportList.length}</b>
</div>

<div class="category-title">1. EXECUTIVE KPI SUMMARY</div>
<div class="kpi-grid">
  <div class="kpi-card">
    <div class="kpi-value" style="color: #0284c7;">${exportList.length}</div>
    <div class="kpi-label">Filtered Count</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-value" style="color: #16a34a;">${activeEmps.length}</div>
    <div class="kpi-label">Active</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-value" style="color: #2563eb;">${onLeaveEmps.length}</div>
    <div class="kpi-label">On Leave</div>
  </div>
</div>

<div class="category-title">2. DETAILED EMPLOYEE LIST (${exportList.length})</div>
<table>
  <thead>
    <tr>
      <th style="width: 30px; text-align: center;">№</th>
      <th>Tabel №</th>
      <th>F.I.O</th>
      <th>Department</th>
      <th>Position</th>
      <th>Phone</th>
      <th>Hire Date</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${renderTableRows(exportList)}
  </tbody>
</table>

<div class="footer">
  <span>System Report • ${printDate}</span>
  <span>Total: ${exportList.length}</span>
</div>

</body>
</html>`;

      const win = window.open('', '_blank', 'width=1000,height=900');
      if (!win) { alert('Pop-up bloklangan. Brauzerdagi cheklovni olib tashlang.'); return; }
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 300);
    } catch (e) {
      alert("PDF eksport qilishda xatolik yuz berdi");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
      {/* Header Title & Filter-Aware Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t('emp.title', 'Xodimlar Bazasi va Profil Kartalari')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'kr'
                  ? '1500+ 임직원, 52개 부서, 학력, 근속, 건강검진, 포상 및 인적 필터'
                  : "1500+ Xodimlar, 52 ta bo'lim, Ta'lim, Staj, Med-ko'rik, Mukofotlar va Demografik filterlar"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {activeFiltersCount > 0 && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-2 text-xs font-semibold hover:bg-rose-500/20 transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t('filter.reset', 'Filtrlarni tiklash')} ({activeFiltersCount})</span>
            </button>
          )}

          {/* Filter-Aware Excel Export Button */}
          <button
            onClick={handleExportFilteredExcel}
            disabled={exporting}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
            title="Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📊 {language === 'kr' ? '엑셀 내보내기' : 'Excel Yuklab Olish'}</span>
          </button>

          {/* Filter-Aware PDF Export Button */}
          <button
            onClick={handleExportFilteredPDF}
            disabled={exporting}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
            title="PDF"
          >
            <Download className="w-4 h-4" />
            <span>📄 {language === 'kr' ? 'PDF 내보내기' : 'PDF Yuklab Olish'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic 9-Filter Control Toolbar */}
      <EmployeeFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={resetAllFilters}
        departments={departments}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Main Employee Table / Cards List */}
      <EmployeeListTable
        employees={employees}
        loading={loading}
        canEditEmployee={canEditEmployee}
        onSelectEmployee={onSelectEmployee}
        onTransferEmployee={onTransferEmployee}
      />

      {/* High-Performance Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>{language === 'kr' ? '페이지당 항목 수:' : 'Sahifadagi yozuvlar:'}</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-lg bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-2 py-1 focus:outline-none"
          >
            <option value={20} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">20</option>
            <option value={50} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">50</option>
            <option value={100} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">100</option>
          </select>
          <span className="ml-2 font-mono">
            {language === 'kr' ? (
              <>
                총 <strong className="text-slate-900 dark:text-white">{pagination.total}</strong>명 중{' '}
                <strong className="text-blue-600 dark:text-blue-400">
                  {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} -{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </strong>{' '}
                표시 중
              </>
            ) : (
              <>
                Jami: <strong className="text-slate-900 dark:text-white">{pagination.total}</strong> ta xodimdan{' '}
                <strong className="text-blue-600 dark:text-blue-400">
                  {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} -{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </strong>{' '}
                ko'rsatilyapti
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={() => setPage(1)}
            disabled={!pagination.hasPrev}
            className="rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
          >
            « {language === 'kr' ? '처음' : 'Birinchi'}
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
            className="rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
          >
            ‹ {language === 'kr' ? '이전' : 'Oldingi'}
          </button>
          <span className="px-3 py-1 font-semibold text-slate-800 dark:text-slate-200">
            {language === 'kr' ? '페이지' : 'Sahifa'} <span className="text-blue-600 dark:text-blue-400">{pagination.page}</span> / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={!pagination.hasNext}
            className="rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
          >
            {language === 'kr' ? '다음' : 'Keyingi'} ›
          </button>
          <button
            onClick={() => setPage(pagination.totalPages)}
            disabled={!pagination.hasNext}
            className="rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
          >
            {language === 'kr' ? '마지막' : 'Oxirgi'} »
          </button>
        </div>
      </div>
    </div>
  );
};
