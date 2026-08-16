'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  ChevronRight,
  ChevronDown,
  Users,
  Layers,
  ChevronsDownUp,
  ChevronsUpDown,
  User,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface DepartmentNode {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  headName?: string | null;
  staffLimit?: number | null;
  children?: DepartmentNode[];
  _count?: { employees: number };
}

interface DepartmentTreeProps {
  departments: DepartmentNode[];
  onNodeClick: (dept: DepartmentNode) => void;
  selectedDepartmentId?: string;
  onOpenBulkModal?: () => void;
}

/* ── helpers ── */
function collectAllIds(nodes: DepartmentNode[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  const walk = (list: DepartmentNode[]) => {
    for (const n of list) {
      result[n.id] = true;
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return result;
}

/** Flatten tree to a list for filter matching */
function flattenTree(nodes: DepartmentNode[]): DepartmentNode[] {
  const result: DepartmentNode[] = [];
  const walk = (list: DepartmentNode[]) => {
    for (const n of list) {
      result.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return result;
}

/**
 * Filter tree: keeps a node if it (or any descendant) matches.
 * Returns a new tree with only matching subtrees.
 */
function filterTree(
  nodes: DepartmentNode[],
  predicate: (n: DepartmentNode) => boolean
): DepartmentNode[] {
  return nodes
    .map((node) => {
      const filteredChildren = node.children
        ? filterTree(node.children, predicate)
        : [];
      if (predicate(node) || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    })
    .filter(Boolean) as DepartmentNode[];
}

function getDepthColor(depth: number) {
  if (depth === 0) return 'from-indigo-600 to-purple-600';
  if (depth === 1) return 'from-indigo-500 to-blue-500';
  if (depth === 2) return 'from-cyan-500 to-teal-500';
  return 'from-teal-500 to-emerald-500';
}

export const DepartmentTree: React.FC<DepartmentTreeProps> = ({
  departments,
  onNodeClick,
  selectedDepartmentId,
  onOpenBulkModal,
}) => {
  const { t, language } = useLanguage();

  const CATEGORY_OPTIONS = [
    { value: 'ALL', label: language === 'kr' ? '전체 카테고리' : 'Barcha kategoriyalar' },
    { value: 'DIR', label: language === 'kr' ? '경영진 / 임원' : 'Direksiya' },
    { value: 'LOG', label: language === 'kr' ? '물류 / 유통' : 'Logistika' },
    { value: 'QC', label: language === 'kr' ? '품질 관리 (QC)' : 'Sifat Nazorati' },
    { value: 'HR', label: language === 'kr' ? '인사 / HR' : 'HR / Kadrlar' },
    { value: 'FIN', label: language === 'kr' ? '재무 / 회계' : 'Moliya' },
    { value: 'PROD', label: language === 'kr' ? '생산 / 현장' : 'Ishlab Chiqarish' },
    { value: 'MAINT', label: language === 'kr' ? '설비 / 정비' : 'Texnik Xizmat' },
    { value: 'SAFE', label: language === 'kr' ? '안전 / HSE' : 'Xavfsizlik' },
  ];

  const VACANCY_OPTIONS = [
    { value: 'ALL', label: language === 'kr' ? '전체' : "Barchasi" },
    { value: 'VACANT', label: language === 'kr' ? '공석 있음' : "Faqat bo'sh o'rinli" },
    { value: 'FULL', label: language === 'kr' ? '충원 완료' : 'To\'liq staffed' },
  ];

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [vacancyFilter, setVacancyFilter] = useState('ALL');

  const allIds = useMemo(() => collectAllIds(departments), [departments]);
  const totalDepts = Object.keys(allIds).length;

  const handleExpandCollapseAll = () => {
    if (allExpanded) {
      setExpanded({});
      setAllExpanded(false);
    } else {
      setExpanded(allIds);
      setAllExpanded(true);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setVacancyFilter('ALL');
  };

  const hasActiveFilters = search || categoryFilter !== 'ALL' || vacancyFilter !== 'ALL';

  /** Build the filtered tree */
  const filteredTree = useMemo(() => {
    if (!hasActiveFilters) return departments;

    return filterTree(departments, (node) => {
      const empCount = node._count?.employees ?? 0;
      const staffLimit = node.staffLimit ?? Math.ceil(empCount * 1.12) + 2;
      const isFull = empCount >= staffLimit;

      const matchesSearch =
        !search ||
        node.name.toLowerCase().includes(search.toLowerCase()) ||
        node.code.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === 'ALL' ||
        node.code.toUpperCase().startsWith(categoryFilter);

      const matchesVacancy =
        vacancyFilter === 'ALL' ||
        (vacancyFilter === 'VACANT' && !isFull) ||
        (vacancyFilter === 'FULL' && isFull);

      return matchesSearch && matchesCategory && matchesVacancy;
    });
  }, [departments, search, categoryFilter, vacancyFilter, hasActiveFilters]);

  // When filters active, auto-expand all to show matches
  const effectiveExpanded = useMemo(() => {
    if (hasActiveFilters) return allIds; // show all matches
    return expanded;
  }, [hasActiveFilters, allIds, expanded]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const allIn = Object.keys(allIds).every((k) => next[k]);
      setAllExpanded(allIn);
      return next;
    });
  };

  const renderTree = (nodes: DepartmentNode[], depth = 0): React.ReactNode => {
    return (
      <div className="space-y-1.5">
        {nodes.map((node) => {
          const hasChildren = node.children && node.children.length > 0;
          const isExpanded = !!effectiveExpanded[node.id];
          const isSelected = selectedDepartmentId === node.id;
          const empCount = node._count?.employees ?? 0;
          const staffLimit = node.staffLimit ?? Math.ceil(empCount * 1.12) + 2;
          const vacancyCount = Math.max(0, staffLimit - empCount);
          const isFull = vacancyCount === 0;
          const isTopExecutiveLevel = depth === 0;

          return (
            <div key={node.id} className="select-none">
              <div
                id={`dept-node-${node.id}`}
                onClick={() => onNodeClick(node)}
                style={{ paddingLeft: `${depth * 22 + 10}px` }}
                className={`group relative flex items-center justify-between rounded-xl py-2.5 pr-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-500'
                    : isTopExecutiveLevel
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-500 text-slate-900 dark:text-slate-100 shadow-sm hover:shadow-md hover:border-blue-600'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                {/* Left */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {hasChildren ? (
                    <button
                      onClick={(e) => toggleExpand(node.id, e)}
                      className={`p-1 rounded-lg flex-shrink-0 transition border cursor-pointer ${
                        isSelected
                          ? 'text-white border-white/30 bg-white/10 hover:bg-white/20'
                          : 'text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="w-[26px] flex-shrink-0" />
                  )}

                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${getDepthColor(depth)} shadow-sm`}
                  >
                    <Building2 className="h-3.5 w-3.5 text-white" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-100 dark:bg-indigo-500/10 text-blue-800 dark:text-indigo-300 border border-blue-200 dark:border-indigo-500/20'
                        }`}
                      >
                        {node.code}
                      </span>
                      <span className={`text-xs font-bold leading-tight truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                        {node.name}
                      </span>
                    </div>
                    {node.headName && (
                      <div
                        className={`flex items-center gap-1 mt-0.5 text-[10px] font-medium ${
                          isSelected ? 'text-white/80' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <User className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate">{t('node.dept_head', "Bo'lim Rahbari:")} {node.headName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: staffing badge + vacancy indicator */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <div
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold border ${
                      isSelected
                        ? 'bg-white/20 border-white/30 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <Users className="h-3 w-3 opacity-80" />
                    <span>{empCount}</span>
                    <span className="opacity-50 text-[10px]">/</span>
                    <span className="opacity-70 text-[10px]">{staffLimit}</span>
                  </div>
                  {isFull ? (
                    <span
                      title={language === 'kr' ? '공석 없음' : "Bo'sh ish o'rinlari yo'q"}
                      className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`}
                    >
                      <AlertCircle className="h-4 w-4" />
                    </span>
                  ) : (
                    <span
                      title={`${vacancyCount} ${t('node.vacancy_suffix', 'ta vakansiya')}`}
                      className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>

              {/* Children */}
              {hasChildren && isExpanded && (
                <div className="mt-1 ml-6 pl-3 border-l-2 border-slate-300 dark:border-slate-700">
                  {renderTree(node.children!, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* ── PAGE HEADER ── */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600 dark:text-indigo-400" />
              {t('hierarchy.title', "Sanoat Korxonasi Bo'limlar Ierarxiyasi")}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
              {t('hierarchy.subtitle', 'Tashkiliy tuzilma va boshqaruv zanjiri')}
              {totalDepts > 0 && (
                <span className="ml-2 font-mono text-blue-600 dark:text-indigo-400 font-bold">({totalDepts} {language === 'kr' ? '개 부서' : "bo'lim"})</span>
              )}
            </p>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {onOpenBulkModal && (
              <button
                onClick={onOpenBulkModal}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
              >
                <span>📥 {language === 'kr' ? '엑셀 일괄 업로드' : 'Excel Orqali Ommaviy Yuklash'}</span>
              </button>
            )}
            <button
              id="btn-expand-collapse-all"
              onClick={handleExpandCollapseAll}
              disabled={!!hasActiveFilters}
              title={hasActiveFilters ? (language === 'kr' ? '필터링 중에는 수동으로 펼치기 불가' : 'Filtr faol paytida qo\'lda kengaytirish') : (allExpanded ? (language === 'kr' ? '전체 접기' : 'Hammasini yopish') : (language === 'kr' ? '전체 펼치기' : 'Hammasini ochish'))}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {allExpanded ? (
                <><ChevronsDownUp className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />{t('hierarchy.collapse_all', "Barchasini yig'ish")}</>
              ) : (
                <><ChevronsUpDown className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />{t('hierarchy.expand_all', 'Barchasini yoyish')}</>
              )}
            </button>
          </div>
        </div>

        {/* ── FILTER TOOLBAR ── */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* 1. Text search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('hierarchy.search', "Bo'lim yoki F.I.O bo'yicha qidiruv...")}
                className="w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 py-2.5 pl-9 pr-8 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none font-medium"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* 2. Category filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none font-medium cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* 3. Vacancy filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={vacancyFilter}
                  onChange={(e) => setVacancyFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none font-medium cursor-pointer"
                >
                  {VACANCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  title={language === 'kr' ? '필터 초기화' : 'Filtrlarni tozalash'}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-800 dark:text-rose-400 hover:bg-rose-200 transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {language === 'kr' ? '초기화' : 'Tozalash'}
                </button>
              )}
            </div>
          </div>

          {/* Active filter summary */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">{language === 'kr' ? '적용된 필터:' : 'Filtr:'}</span>
              {search && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-indigo-500/10 border border-blue-300 dark:border-indigo-500/20 px-2 py-0.5 text-[10px] text-blue-800 dark:text-indigo-400 font-bold">
                  {language === 'kr' ? '검색어' : 'Nom/Kod'}: "{search}"
                  <button onClick={() => setSearch('')} className="cursor-pointer"><X className="h-2.5 w-2.5" /></button>
                </span>
              )}
              {categoryFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/20 px-2 py-0.5 text-[10px] text-purple-800 dark:text-purple-400 font-bold">
                  {language === 'kr' ? '카테고리' : 'Kategoriya'}: {CATEGORY_OPTIONS.find(o => o.value === categoryFilter)?.label}
                  <button onClick={() => setCategoryFilter('ALL')} className="cursor-pointer"><X className="h-2.5 w-2.5" /></button>
                </span>
              )}
              {vacancyFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-800 dark:text-emerald-400 font-bold">
                  {language === 'kr' ? '공석 여부' : 'Vakansiya'}: {VACANCY_OPTIONS.find(o => o.value === vacancyFilter)?.label}
                  <button onClick={() => setVacancyFilter('ALL')} className="cursor-pointer"><X className="h-2.5 w-2.5" /></button>
                </span>
              )}
              <span className="text-[10px] text-slate-600 dark:text-slate-400 ml-1 font-medium">
                → {flattenTree(filteredTree).length} {language === 'kr' ? '개 부서 표시 중' : "ta bo'lim ko'rsatilmoqda"}
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 px-1 font-medium">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-500" />{language === 'kr' ? '공석 존재' : "Bo'sh o'rin mavjud"}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
            <AlertCircle className="h-3 w-3 text-rose-600 dark:text-rose-500" />{language === 'kr' ? '정원 완료' : "Shtat to'liq"}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
            <Users className="h-3 w-3 text-slate-500" />{t('node.actual_staff', 'Amaldagi Shtat')} / {t('node.total_staff', 'Jami Xodimlar Soni')}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 ml-auto italic">
            {language === 'kr' ? '부서 카드 클릭 → 상세 팝업' : 'Har bir kartaga bosing → Batafsil modal'}
          </div>
        </div>
      </div>

      {/* ── TREE CONTENT ── */}
      <div className="p-4">
        {departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600 dark:text-slate-400 text-sm gap-3 font-medium">
            <Layers className="h-10 w-10 text-slate-400" />
            <p>{language === 'kr' ? '조직도 데이터를 불러오는 중...' : "Bo'limlar ma'lumoti yuklanmoqda..."}</p>
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600 dark:text-slate-400 text-sm gap-3 font-medium">
            <Search className="h-8 w-8 text-slate-400" />
            <p>{language === 'kr' ? '검색 조건에 일치하는 부서가 없습니다.' : "Tanlangan filtrlarga mos keluvchi bo'lim topilmadi"}</p>
            <button onClick={clearFilters} className="text-xs text-blue-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer">
              {language === 'kr' ? '필터 초기화' : 'Filtrlarni tozalash'}
            </button>
          </div>
        ) : (
          renderTree(filteredTree)
        )}
      </div>
    </div>
  );
};
