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

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'Barcha kategoriyalar' },
  { value: 'DIR', label: 'Direksiya' },
  { value: 'LOG', label: 'Logistika' },
  { value: 'QC', label: 'Sifat Nazorati' },
  { value: 'HR', label: 'HR / Kadrlar' },
  { value: 'FIN', label: 'Moliya' },
  { value: 'PROD', label: 'Ishlab Chiqarish' },
  { value: 'MAINT', label: 'Texnik Xizmat' },
  { value: 'SAFE', label: 'Xavfsizlik' },
];

const VACANCY_OPTIONS = [
  { value: 'ALL', label: "Barchasi" },
  { value: 'VACANT', label: "Faqat bo'sh o'rinli" },
  { value: 'FULL', label: 'To\'liq staffed' },
];

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

          return (
            <div key={node.id} className="select-none">
              <div
                id={`dept-node-${node.id}`}
                onClick={() => onNodeClick(node)}
                style={{ paddingLeft: `${depth * 22 + 10}px` }}
                className={`group relative flex items-center justify-between rounded-xl py-2.5 pr-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                    : 'glass-card hover:bg-slate-800/90 text-slate-200 hover:ring-1 hover:ring-slate-700/50'
                }`}
              >
                {/* Left */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {hasChildren ? (
                    <button
                      onClick={(e) => toggleExpand(node.id, e)}
                      className={`p-1 rounded-md flex-shrink-0 transition ${
                        isSelected
                          ? 'text-white/70 hover:text-white hover:bg-white/10'
                          : 'text-slate-500 hover:text-white hover:bg-slate-700/50'
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
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${getDepthColor(depth)} ${
                      isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-90'
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5 text-white" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          isSelected ? 'bg-white/15 text-white/80' : 'bg-indigo-500/10 text-indigo-300'
                        }`}
                      >
                        {node.code}
                      </span>
                      <span className="text-sm font-semibold leading-tight truncate">{node.name}</span>
                    </div>
                    {node.headName && (
                      <div
                        className={`flex items-center gap-1 mt-0.5 text-[10px] ${
                          isSelected ? 'text-white/60' : 'text-slate-500'
                        }`}
                      >
                        <User className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate">{node.headName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: staffing badge + vacancy indicator */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <div
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold border ${
                      isSelected
                        ? 'bg-white/15 border-white/20 text-white'
                        : 'bg-slate-900/80 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <Users className="h-3 w-3 opacity-70" />
                    <span>{empCount}</span>
                    <span className="opacity-40 text-[10px]">/</span>
                    <span className="opacity-60 text-[10px]">{staffLimit}</span>
                  </div>
                  {isFull ? (
                    <span
                      title="Bo'sh ish o'rinlari yo'q"
                      className={`flex-shrink-0 ${isSelected ? 'text-red-300' : 'text-rose-500'}`}
                    >
                      <AlertCircle className="h-4 w-4" />
                    </span>
                  ) : (
                    <span
                      title={`${vacancyCount} ta bo'sh o'rin mavjud`}
                      className={`flex-shrink-0 ${isSelected ? 'text-green-300' : 'text-emerald-500'}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>

              {/* Children */}
              {hasChildren && isExpanded && (
                <div className="mt-1 ml-6 pl-3 border-l border-indigo-500/15">
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
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
      {/* ── PAGE HEADER ── */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-800/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              Sanoat Korxonasi Bo'limlar Ierarxiyasi
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Direksiya → Boshqarmalar → Bo'limlar → Sexlar / Uchastkalar
              {totalDepts > 0 && (
                <span className="ml-2 font-mono text-indigo-400">({totalDepts} bo'lim)</span>
              )}
            </p>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {onOpenBulkModal && (
              <button
                onClick={onOpenBulkModal}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition active:scale-95"
              >
                <span>📥 Excel Orqali Ommaviy Yuklash</span>
              </button>
            )}
            <button
              id="btn-expand-collapse-all"
              onClick={handleExpandCollapseAll}
              disabled={!!hasActiveFilters}
              title={hasActiveFilters ? 'Filtr faol paytida qo\'lda kengaytirish' : (allExpanded ? 'Hammasini yopish' : 'Hammasini ochish')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {allExpanded ? (
                <><ChevronsDownUp className="h-3.5 w-3.5 text-indigo-400" />Hammasini Yopish</>
              ) : (
                <><ChevronsUpDown className="h-3.5 w-3.5 text-indigo-400" />Barcha Bo'limlar</>
              )}
            </button>
          </div>
        </div>

        {/* ── FILTER TOOLBAR ── */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* 1. Text search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Bo'lim nomi yoki kodi (masalan: DEPT-27, Bo'yoqlash)"
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 py-2.5 pl-9 pr-8 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* 2. Category filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none rounded-xl bg-slate-950 border border-slate-700/80 py-2.5 pl-9 pr-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* 3. Vacancy filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                <select
                  value={vacancyFilter}
                  onChange={(e) => setVacancyFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl bg-slate-950 border border-slate-700/80 py-2.5 pl-9 pr-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
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
                  title="Filtrlarni tozalash"
                  className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Tozalash
                </button>
              )}
            </div>
          </div>

          {/* Active filter summary */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] text-slate-500">Filtr:</span>
              {search && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-400">
                  Nom/Kod: "{search}"
                  <button onClick={() => setSearch('')}><X className="h-2.5 w-2.5" /></button>
                </span>
              )}
              {categoryFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] text-purple-400">
                  Kategoriya: {CATEGORY_OPTIONS.find(o => o.value === categoryFilter)?.label}
                  <button onClick={() => setCategoryFilter('ALL')}><X className="h-2.5 w-2.5" /></button>
                </span>
              )}
              {vacancyFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">
                  Vakansiya: {VACANCY_OPTIONS.find(o => o.value === vacancyFilter)?.label}
                  <button onClick={() => setVacancyFilter('ALL')}><X className="h-2.5 w-2.5" /></button>
                </span>
              )}
              <span className="text-[10px] text-slate-500 ml-1">
                → {flattenTree(filteredTree).length} ta bo'lim ko'rsatilmoqda
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 px-1">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />Bo'sh o'rin mavjud
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <AlertCircle className="h-3 w-3 text-rose-500" />Shtat to'liq
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Users className="h-3 w-3 text-slate-400" />Amaldagi / Shtat limiti
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 ml-auto italic">
            Har bir kartaga bosing → Batafsil modal
          </div>
        </div>
      </div>

      {/* ── TREE CONTENT ── */}
      <div className="p-4">
        {departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-3">
            <Layers className="h-10 w-10 text-slate-700" />
            <p>Bo'limlar ma'lumoti yuklanmoqda...</p>
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm gap-3">
            <Search className="h-8 w-8 text-slate-700" />
            <p>Tanlangan filtrlarga mos keluvchi bo'lim topilmadi</p>
            <button onClick={clearFilters} className="text-xs text-indigo-400 hover:text-indigo-300">
              Filtrlarni tozalash
            </button>
          </div>
        ) : (
          renderTree(filteredTree)
        )}
      </div>
    </div>
  );
};
