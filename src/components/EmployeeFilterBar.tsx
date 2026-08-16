'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Building2,
  RotateCcw,
  GraduationCap,
  Award,
  Stethoscope,
  Clock,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface FilterState {
  searchVal: string;
  selectedDepartmentId: string;
  educationFilter: string;
  rewardFilter: string;
  medicalFilter: string;
  tenureFilter: string;
  demographicFilter: string;
  permitFilter: string;
  filterStatus: string;
  filterDiscipline: string;
}

export const initialFilterState: FilterState = {
  searchVal: '',
  selectedDepartmentId: '',
  educationFilter: 'ALL',
  rewardFilter: 'ALL',
  medicalFilter: 'ALL',
  tenureFilter: 'ALL',
  demographicFilter: 'ALL',
  permitFilter: 'ALL',
  filterStatus: 'ALL',
  filterDiscipline: 'ALL',
};

interface EmployeeFilterBarProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
  departments: Array<{ id: string; name: string; code: string }>;
  activeFiltersCount: number;
}

export const EmployeeFilterBar: React.FC<EmployeeFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  departments,
  activeFiltersCount,
}) => {
  const { t, language } = useLanguage();

  const [deptSearch, setDeptSearch] = useState<string>('');
  const [deptDropdownOpen, setDeptDropdownOpen] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(true);

  const selectedDepartmentObj = departments.find((d) => d.id === filters.selectedDepartmentId);

  const filteredDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const selectClass =
    "w-full bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors";
  const optionClass = "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100";
  const labelClass = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 space-y-4 transition-colors">
      {/* Header Bar with Toggle & Reset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <Filter className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {language === 'kr' ? '상세 인사 필터 및 검색' : 'Kengaytirilgan Filterlar & Analitika'}
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                {activeFiltersCount} {language === 'kr' ? '개 적용됨' : 'ta faol'}
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              type="button"
              className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer active:scale-95"
              title={t('filter.reset', 'Filtrlarni tiklash')}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t('filter.reset', 'Filtrlarni tiklash')}</span>
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            type="button"
            className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>{language === 'kr' ? '접기' : 'Yashirish'}</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>{language === 'kr' ? '전체 필터 보기' : "Barchasini ko'rsatish"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Row 1: Primary Controls (Search, Dept, Education) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* 1. Live Text Search */}
        <div>
          <label className={labelClass}>
            {t('filter.search', 'Qidiruv (F.I.O, Tabel №)...')}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={filters.searchVal}
              onChange={(e) => onFilterChange('searchVal', e.target.value)}
              placeholder={t('filter.search', 'Qidiruv (F.I.O, Tabel №)...')}
              className="w-full bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs rounded-lg pl-9 pr-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none placeholder-slate-400 transition-colors"
            />
          </div>
        </div>

        {/* 2. Department Combobox */}
        <div className="relative">
          <label className={labelClass}>
            {t('filter.select_dept', "Bo'limni tanlang")} ({departments.length})
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
              className="w-full flex items-center justify-between bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-left transition-colors"
            >
              <span className="truncate">
                {selectedDepartmentObj
                  ? `[${selectedDepartmentObj.code}] ${selectedDepartmentObj.name}`
                  : t('filter.select_dept', "Bo'limni tanlang")}
              </span>
              <Building2 className="h-3.5 w-3.5 text-slate-400 ml-1 shrink-0" />
            </button>

            {deptDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 space-y-1">
                <input
                  type="text"
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder={language === 'kr' ? '부서명 입력...' : "Bo'lim nomini yozing..."}
                  className="w-full bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 p-1.5 text-xs rounded-lg focus:outline-none mb-1"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange('selectedDepartmentId', '');
                    setDeptDropdownOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-semibold"
                >
                  -- {language === 'kr' ? '전체 부서' : "Barcha Bo'limlar"} --
                </button>
                {filteredDepartments.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onFilterChange('selectedDepartmentId', d.id);
                      setDeptDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded-lg truncate transition ${
                      filters.selectedDepartmentId === d.id
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-mono text-blue-600 dark:text-blue-400 mr-1.5">[{d.code}]</span>
                    {d.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Education Filter ("Ma'lumoti bo'yicha") */}
        <div>
          <label className={labelClass}>
            <GraduationCap className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            {t('filter.by_edu', "Ma'lumoti bo'yicha")}:
          </label>
          <select
            value={filters.educationFilter}
            onChange={(e) => onFilterChange('educationFilter', e.target.value)}
            className={selectClass}
          >
            <option value="ALL" className={optionClass}>{language === 'kr' ? '전체 학력' : "Barcha ma'lumot turlari"}</option>
            <option value="HIGHER" className={optionClass}>{t('filter.edu_higher', "Oliy ma'lumotli")}</option>
            <option value="SPECIAL_SECONDARY" className={optionClass}>{t('filter.edu_secondary', "O'rta maxsus / O'rta")}</option>
            <option value="SECONDARY" className={optionClass}>{language === 'kr' ? '고졸' : "O'rta ma'lumotli"}</option>
          </select>
        </div>
      </div>

      {/* Row 2 & 3: Expanded Analytical Filters */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/80 animate-fadeIn">
          {/* 4. Rewards & Financial Aid Filter */}
          <div>
            <label className={labelClass}>
              <Award className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              {language === 'kr' ? '포상 및 지원금 필터' : "Mukofot va Rag'batlantirish"}:
            </label>
            <select
              value={filters.rewardFilter}
              onChange={(e) => onFilterChange('rewardFilter', e.target.value)}
              className={selectClass}
            >
              <option value="ALL" className={optionClass}>{language === 'kr' ? '전체 (포상금)' : 'Barchasi (Mukofotlar)'}</option>
              <option value="REWARDED" className={optionClass}>{language === 'kr' ? '포상 수여 대상' : 'Moddiy mukofot olganlar'}</option>
              <option value="FINANCIAL_AID" className={optionClass}>{language === 'kr' ? '지원금 수령 대상' : 'Moddiy yordam olganlar'}</option>
            </select>
          </div>

          {/* 5. Medical Checkup Status Filter */}
          <div>
            <label className={labelClass}>
              <Stethoscope className="h-3 w-3 text-rose-600 dark:text-rose-400" />
              {t('filter.med_permits', "Med-ko'rik / Ruxsatnomalar")}:
            </label>
            <select
              value={filters.medicalFilter}
              onChange={(e) => onFilterChange('medicalFilter', e.target.value)}
              className={selectClass}
            >
              <option value="ALL" className={optionClass}>{language === 'kr' ? '전체 (검진 상태)' : "Barchasi (Med-ko'rik)"}</option>
              <option value="VALID" className={optionClass}>{t('filter.med_valid', "Med-ko'rik amalda")}</option>
              <option value="EXPIRING_SOON" className={optionClass}>{t('filter.med_expiring', 'Muddati tugayotgan (15 kun)')}</option>
            </select>
          </div>

          {/* 6. Work Tenure Filter */}
          <div>
            <label className={labelClass}>
              <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              {language === 'kr' ? '근속 연수' : 'Korxonadagi Ish Staji'}:
            </label>
            <select
              value={filters.tenureFilter}
              onChange={(e) => onFilterChange('tenureFilter', e.target.value)}
              className={selectClass}
            >
              <option value="ALL" className={optionClass}>{language === 'kr' ? '전체 근속' : 'Barcha stajlar'}</option>
              <option value="UNDER_1_YEAR" className={optionClass}>{language === 'kr' ? '1년 미만 (신입)' : '1 yildan kam'}</option>
              <option value="1_TO_3_YEARS" className={optionClass}>1 - 3 {language === 'kr' ? '년' : 'yil'}</option>
              <option value="OVER_10_YEARS" className={optionClass}>10+ {language === 'kr' ? '년 (장기근속)' : 'yil (Faxriy)'}</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
