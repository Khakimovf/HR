'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Crown,
  Building2,
  Eye,
  Lock,
  KeyRound,
  CheckSquare,
  Square,
  X,
  Check,
  Plus,
  Activity,
  UserCheck,
  UserPlus,
  UserX,
  Building,
  Briefcase,
  SlidersHorizontal,
  BadgeCheck,
  Shield,
  FileCheck,
  LayoutGrid,
  Megaphone,
  Edit,
  Trash2,
  Sparkles,
  AlertTriangle,
  Wrench,
  Layers,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnnouncementCreateModal } from './AnnouncementCreateModal';
import { AnnouncementDetailModal, AnnouncementType } from './AnnouncementDetailModal';

// ─── Action color map ─────────────────────────────────────────────────────────

function getActionColor(action: string): string {
  if (action.includes('tahrirlandi') || action.includes('yangilandi') || action.includes('UPDATE')) {
    return 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold';
  }
  if (action.includes("qo'shildi") || action.includes('yaratildi') || action.includes('CREATE')) {
    return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold';
  }
  if (action.includes("o'chirildi") || action.includes('bekor') || action.includes('DELETE')) {
    return 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold';
  }
  if (action.includes('Tizimga kirdi') || action.includes('LOGIN')) {
    return 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800 font-bold';
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold';
}

// ─── Role Badges ──────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  if (role === 'SUPER_ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 font-extrabold text-[10px] text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full">
        <Crown className="h-3 w-3 text-amber-600 dark:text-amber-400" /> SUPER_ADMIN
      </span>
    );
  }
  if (role === 'EXECUTIVE_DIRECTOR') {
    return (
      <span className="inline-flex items-center gap-1 font-extrabold text-[10px] text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-800 px-2 py-0.5 rounded-full">
        <Briefcase className="h-3 w-3 text-purple-600 dark:text-purple-400" /> EXECUTIVE
      </span>
    );
  }
  if (role === 'AUDITOR' || role === 'VIEWER_ONLY') {
    return (
      <span className="inline-flex items-center gap-1 font-extrabold text-[10px] text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-800 px-2 py-0.5 rounded-full">
        <Eye className="h-3 w-3 text-teal-600 dark:text-teal-400" /> AUDITOR
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-extrabold text-[10px] text-blue-800 dark:text-indigo-300 bg-blue-100 dark:bg-indigo-950/80 border border-blue-300 dark:border-indigo-800 px-2 py-0.5 rounded-full">
      <Building className="h-3 w-3 text-blue-600 dark:text-indigo-400" /> HR_OFFICER
    </span>
  );
}

// ─── Announcement Admin Panel Component ────────────────────────────────────────

const AnnouncementAdminPanel: React.FC = () => {
  const { t, language } = useLanguage();
  const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);
  const [loading, setLoading]             = useState(true);

  const [isCreateOpen, setIsCreateOpen]   = useState(false);
  const [editingItem, setEditingItem]     = useState<AnnouncementType | null>(null);
  const [viewingItem, setViewingItem]     = useState<AnnouncementType | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/announcements?all=true');
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'kr' ? '이 공지사항을 삭제하시겠습니까?' : "Ushbu e'lonni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      fetchAnnouncements();
    } catch {}
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'FEATURE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">🚀 {t('announcements.cat_feature', 'Yangi Imkoniyat')}</span>;
      case 'UPDATE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">🔄 {t('announcements.cat_update', "Modul O'zgarishi")}</span>;
      case 'IMPORTANT':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">⚠️ {t('announcements.cat_important', 'Muhim E\'lon')}</span>;
      case 'MAINTENANCE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">🛠️ {t('announcements.cat_maintenance', 'Texnik Ishlar')}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">{category}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-blue-600 dark:text-indigo-400" />
            {t('announcements.manage_tab', "📢 Tizim E'lonlari Boshqaruvi")}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            {language === 'kr' ? '시스템 공지사항, 모듈 업데이트 및 점검 안내 등록/관리' : "Foydalanuvchilar dashboardida ko'rinadigan tizim yangilanishlari va e'lonlar markazi"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnnouncements}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setEditingItem(null); setIsCreateOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('announcements.add_new', "+ Yangi E'lon Qo'shish")}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 gap-2">
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-indigo-400 animate-spin" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">{language === 'kr' ? '공지사항을 불러오는 중입니다...' : 'Yuklanmoqda...'}</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Megaphone className="h-10 w-10 text-slate-400 mx-auto" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">{language === 'kr' ? '등록된 공지사항이 없습니다.' : "Chop etilgan e'lonlar mavjud emas"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase text-[10px] border-b border-slate-300 dark:border-slate-700 tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Sana</th>
                  <th className="px-4 py-3.5 text-left">Sarlavha (UZ / KR)</th>
                  <th className="px-4 py-3.5 text-left">Kategoriya</th>
                  <th className="px-4 py-3.5 text-left">Tegishli Modul</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Harakatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {announcements.map((item) => {
                  return (
                    <tr key={item.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {formatDate(item.createdAt || item.created_at || new Date().toISOString())}
                      </td>

                      <td className="px-4 py-3 max-w-[280px]">
                        <div
                          onClick={() => setViewingItem(item)}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-indigo-400 cursor-pointer truncate"
                        >
                          {item.title_uz}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate font-medium">{item.title_kr}</div>
                      </td>

                      <td className="px-4 py-3">
                        {getCategoryBadge(item.category)}
                      </td>

                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-bold">
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          <Layers className="h-3 w-3 text-blue-600" />
                          {item.affectedModule}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.is_published
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}>
                          {item.is_published ? t('announcements.published', 'Chop etildi') : t('announcements.draft', 'Qoralama')}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingItem(item)}
                            className="p-1 text-slate-500 hover:text-blue-600 transition cursor-pointer"
                            title={t('common.view', 'Ko\'rish')}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditingItem(item); setIsCreateOpen(true); }}
                            className="p-1 text-slate-500 hover:text-amber-600 transition cursor-pointer"
                            title={t('common.edit', 'Tahrirlash')}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                            title={t('common.delete', 'O\'chirish')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation/Edit Modal */}
      <AnnouncementCreateModal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setEditingItem(null); }}
        onSuccess={fetchAnnouncements}
        editingAnnouncement={editingItem}
      />

      {/* Detail Modal */}
      <AnnouncementDetailModal
        announcement={viewingItem}
        isOpen={Boolean(viewingItem)}
        onClose={() => setViewingItem(null)}
      />
    </div>
  );
};

// ─── RoleAndMemberModal Component ──────────────────────────────────────────────

const RoleAndMemberModal: React.FC<{
  user: any;
  departments: any[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ user, departments, onClose, onSuccess }) => {
  const [activeTab, setActiveTab]         = useState<'role' | 'modules' | 'scoping'>('role');
  const [role, setRole]                   = useState(user.role || 'HR_OFFICER');
  const [newPassword, setNewPassword]     = useState('');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>(
    user.departmentAccess?.map((d: any) => d.id || d.departmentId) || []
  );

  const ALL_MODULE_KEYS = [
    'workforce', 'departments', 'arizalar', 'kpi', 'svodka',
    'analytics', 'transfers', 'discipline', 'davomat', 'hse', 'import', 'audit'
  ];

  const [allowedModuleKeys, setAllowedModuleKeys] = useState<string[]>(
    user.moduleAccess?.map((m: any) => m.moduleKey) || ['workforce', 'davomat', 'transfers']
  );

  const [deptSearch, setDeptSearch] = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const systemModules = [
    { key: 'workforce', title: 'Xodimlar Bazasi' },
    { key: 'departments', title: "Bo'limlar Ierarxiyasi" },
    { key: 'arizalar', title: 'Arizalar & Hujjatlar' },
    { key: 'kpi', title: 'KPI & Samaradorlik' },
    { key: 'svodka', title: 'Ijroiy Svodka' },
    { key: 'analytics', title: 'Rahbariyat Analitikasi' },
    { key: 'transfers', title: "Bo'limlararo Ko'chish Tarixi" },
    { key: 'discipline', title: 'Intizom & Mukofotlar' },
    { key: 'davomat', title: "Davomat & Ta'tillar" },
    { key: 'hse', title: "Med-ko'rik & Xavfsizlik (HSE)" },
    { key: 'import', title: 'Ommaviy Fayllarni Yuklash' },
    { key: 'audit', title: 'Tizim Auditi' },
  ];

  const toggleModule = (key: string) => {
    setAllowedModuleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAllModules = () => setAllowedModuleKeys(ALL_MODULE_KEYS);
  const clearAllModules  = () => setAllowedModuleKeys([]);

  const toggleDept = (id: string) => {
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const selectAllDepts = () => setSelectedDeptIds(departments.map((d) => d.id));
  const clearAllDepts  = () => setSelectedDeptIds([]);

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/auth/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          newPassword: newPassword || undefined,
          assignedDepartmentIds: selectedDeptIds,
          allowedModuleKeys,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Saqlashda xatolik yuz berdi');
      }
    } catch {
      setError('Tarmoq xatoligi yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <SlidersHorizontal className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Rollar va 2D Ruxsatlarni Boshqarish: {user.fullName}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                @{user.username} • {user.position}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 p-1 text-xs">
          {[
            { id: 'role', label: "1. Tizim Roli & Parol" },
            { id: 'modules', label: "2. Menyu Modullari Ruxsati" },
            { id: 'scoping', label: "3. Biriktirilgan Sexlar Scope" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 py-2 font-bold rounded-lg transition ${
                activeTab === t.id
                  ? 'bg-white dark:bg-slate-800 text-indigo-900 dark:text-white shadow-sm font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {activeTab === 'role' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold mb-2 block">Tizimdagi Roli (System Role)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'SUPER_ADMIN', label: '👑 SUPER_ADMIN', desc: 'Barcha bo\'limlarga to\'liq tahrirlash' },
                    { id: 'EXECUTIVE_DIRECTOR', label: '💼 EXECUTIVE', desc: 'Kompaniya bo\'yicha ko\'rish & hisobotlar' },
                    { id: 'HR_OFFICER', label: '🏢 HR_OFFICER', desc: 'Biriktirilgan bo\'limlarda tahrirlash' },
                    { id: 'AUDITOR', label: '🔍 AUDITOR', desc: 'Muvofiqlik va HSE bo\'yicha auditor' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        role === r.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-white font-bold shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-extrabold">{r.label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Parolni O'zgartirish (Ixtiyoriy)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yangi parol..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">Sidebar Menyu Modullari Ruxsati</span>
                <div className="flex gap-2">
                  <button onClick={selectAllModules} className="text-[10px] font-bold text-indigo-600 hover:underline">Barchasini Tanlash</button>
                  <span>•</span>
                  <button onClick={clearAllModules} className="text-[10px] font-bold text-rose-600 hover:underline">Tozalash</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950/40">
                {systemModules.map((m) => {
                  const isAllowed = allowedModuleKeys.includes(m.key);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggleModule(m.key)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition ${
                        isAllowed ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 text-indigo-900 dark:text-white font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
                      }`}
                    >
                      {isAllowed ? <CheckSquare className="h-4 w-4 text-indigo-600 shrink-0" /> : <Square className="h-4 w-4 text-slate-400 shrink-0" />}
                      <span className="truncate font-bold">{m.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'scoping' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">Biriktirilgan Sexlar ({selectedDeptIds.length} / {departments.length})</span>
                <div className="flex gap-2">
                  <button onClick={selectAllDepts} className="text-[10px] font-bold text-indigo-600 hover:underline">Barchasi</button>
                  <span>•</span>
                  <button onClick={clearAllDepts} className="text-[10px] font-bold text-rose-600 hover:underline">Tozalash</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-950/40">
                {filteredDepts.map((d) => {
                  const isSelected = selectedDeptIds.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDept(d.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left text-[11px] font-bold transition ${
                        isSelected ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 border border-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="h-3.5 w-3.5 text-indigo-600 shrink-0" /> : <Square className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                      <span className="truncate">{d.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && <div className="text-rose-600 font-bold text-xs p-2 bg-rose-50 rounded-xl">{error}</div>}

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <button onClick={onClose} className="rounded-xl bg-slate-200 dark:bg-slate-800 px-4 py-2 font-bold text-slate-800 dark:text-slate-300">Bekor</button>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-6 py-2.5 font-bold shadow-sm cursor-pointer">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── User Register Modal & Panel (Kept intact) ─────────────────────────────────

const UserRegisterModal: React.FC<{
  departments: any[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ departments, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    fullName: '',
    tabelNumber: '',
    position: '',
    userDepartmentId: '',
    username: '',
    email: '',
    password: '',
    role: 'HR_OFFICER',
    assignedDepartmentIds: [] as string[],
    allowedModuleKeys: ['workforce', 'davomat', 'transfers'],
  });
  const [deptSearch, setDeptSearch] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(deptSearch.toLowerCase()))
  );

  const toggleDept = (id: string) => {
    setForm((f) => ({
      ...f,
      assignedDepartmentIds: f.assignedDepartmentIds.includes(id)
        ? f.assignedDepartmentIds.filter((d) => d !== id)
        : [...f.assignedDepartmentIds, id],
    }));
  };

  const selectAll = () => setForm((f) => ({ ...f, assignedDepartmentIds: departments.map((d) => d.id) }));
  const clearAll  = () => setForm((f) => ({ ...f, assignedDepartmentIds: [] }));

  const handleSubmit = async () => {
    if (!form.fullName || !form.tabelNumber || !form.position || !form.username || !form.password) {
      setError("F.I.O, Tabel №, Lavozimi, Username va Parol to'ldirilishi shart");
      return;
    }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      onSuccess();
      onClose();
    } else {
      setError(data.error || "Xatolik yuz berdi");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900/90">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-blue-600 dark:text-indigo-400" /> Yangi Foydalanuvchi Ro'yxatdan O'tkazish
          </h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-500 hover:text-slate-900 dark:hover:text-white" /></button>
        </div>

        <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">F.I.O. (To'liq Ismi) *</label>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Jasur Rahimov"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Tabel № *</label>
              <input
                value={form.tabelNumber}
                onChange={(e) => setForm({ ...form, tabelNumber: e.target.value })}
                placeholder="TB-1010"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Lavozimi (Job Title) *</label>
              <input
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="Kadrlar bo'limi inspektori"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Asosiy Ish Bo'limi (Home Dept)</label>
              <select
                value={form.userDepartmentId}
                onChange={(e) => setForm({ ...form, userDepartmentId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">-- Bo'limni Tanlang --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Username (Login) *</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="j.rahimov"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Xizmat Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="j.rahimov@enterprise-hr.uz"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Vaqtinchalik Parol *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold mb-2 block">Tizimdagi Roli (System Role) *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'SUPER_ADMIN', label: '👑 SUPER_ADMIN', desc: 'Barcha bo\'limlarga to\'liq tahrirlash' },
                { id: 'EXECUTIVE_DIRECTOR', label: '💼 EXECUTIVE', desc: 'Kompaniya bo\'yicha ko\'rish & hisobotlar' },
                { id: 'HR_OFFICER', label: '🏢 HR_OFFICER', desc: 'Biriktirilgan bo\'limlarda tahrirlash' },
                { id: 'AUDITOR', label: '🔍 AUDITOR', desc: 'Muvofiqlik va HSE bo\'yicha auditor' },
              ].map((r) => {
                const isSelected = form.role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.id })}
                    className={`p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-white font-bold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-extrabold text-[11px]">{r.label}</div>
                    <div className="text-[9px] text-slate-600 dark:text-slate-400 mt-1 leading-tight">{r.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <div className="text-rose-600 font-bold text-xs p-2 bg-rose-50 rounded-xl">{error}</div>}

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <button onClick={onClose} className="rounded-xl bg-slate-200 dark:bg-slate-800 px-4 py-2 font-bold text-slate-800 dark:text-slate-300">Bekor</button>
            <button onClick={handleSubmit} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-6 py-2.5 font-bold shadow-sm cursor-pointer">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Ro'yxatdan O'tkazish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HrUserPanel: React.FC<{ departments: any[]; onOpenAddEmployee?: () => void }> = ({ departments, onOpenAddEmployee }) => {
  const [users, setUsers]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);
  const [manageUser, setManageUser]   = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('/api/auth/users');
    const data = await res.json();
    if (data.success) setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-blue-600 dark:text-indigo-400" /> Tizim Foydalanuvchilari va 2D Ruxsatlar Matrix (RBAC)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">Ro'yxatga olingan foydalanuvchilar ({users.length} ta)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRegModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Yangi Foydalanuvchi Qo'shish</span>
          </button>

          {onOpenAddEmployee && (
            <button
              onClick={onOpenAddEmployee}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>+ Yangi Xodim Qo'shish</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 gap-2"><Loader2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-spin" /><span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Yuklanmoqda...</span></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase text-[10px] border-b border-slate-300 dark:border-slate-700 tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Tabel №</th>
                  <th className="px-4 py-3.5 text-left">F.I.O. & Lavozimi</th>
                  <th className="px-4 py-3.5 text-left">Username & Email</th>
                  <th className="px-4 py-3.5 text-left">Tizim Roli</th>
                  <th className="px-4 py-3.5 text-left">Biriktirilgan Bo'limlar</th>
                  <th className="px-4 py-3.5 text-center">Holati</th>
                  <th className="px-4 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {users.map((u) => {
                  const deptAccess = u.departmentAccess || [];
                  const isSuperAdmin = u.role === 'SUPER_ADMIN';
                  const isExecutive  = u.role === 'EXECUTIVE_DIRECTOR';
                  const isAuditor    = u.role === 'AUDITOR' || u.role === 'VIEWER_ONLY';

                  return (
                    <tr key={u.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700 dark:text-indigo-400 text-xs">
                        {u.tabelNumber || 'TB-1000'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{u.fullName}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{u.position || 'HR Mutaxassis'}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] text-blue-700 dark:text-indigo-300 font-bold">@{u.username}</div>
                        <div className="font-mono text-[10px] text-slate-500 font-medium">{u.email || '—'}</div>
                      </td>

                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>

                      <td className="px-4 py-3 max-w-[240px]">
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-md">
                            <Crown className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" /> Barcha 50+ Bo'limlar
                          </span>
                        ) : isExecutive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-800 px-2 py-0.5 rounded-md">
                            <Briefcase className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" /> Barcha Bo'limlar (Faqat Ko'rish)
                          </span>
                        ) : isAuditor ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-800 px-2 py-0.5 rounded-md">
                            <Eye className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400" /> Audit (Faqat Ko'rish)
                          </span>
                        ) : deptAccess.length === 0 ? (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Biriktirilmagan</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {deptAccess.slice(0, 2).map((d: any) => (
                              <span key={d.id} className="inline-block text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-indigo-300 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded">
                                {d.name}
                              </span>
                            ))}
                            {deptAccess.length > 2 && (
                              <span className="text-[9px] font-bold text-blue-700 dark:text-indigo-400 bg-blue-50 dark:bg-indigo-950/80 border border-blue-200 dark:border-indigo-800 px-1.5 py-0.5 rounded">
                                +{deptAccess.length - 2} ta
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        }`}>
                          {u.isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                          {u.isActive ? 'Faol' : 'Bloklangan'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setManageUser(u)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition shadow-sm cursor-pointer"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" /> Rollar va Huquqlarni Boshqarish
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRegModal && (
        <UserRegisterModal
          departments={departments}
          onClose={() => setShowRegModal(false)}
          onSuccess={fetchUsers}
        />
      )}

      {manageUser && (
        <RoleAndMemberModal
          user={manageUser}
          departments={departments}
          onClose={() => setManageUser(null)}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
};

// ─── Main AuditLogView Component ──────────────────────────────────────────────

interface AuditLogViewProps {
  departments?: any[];
  onOpenAddEmployee?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ departments = [], onOpenAddEmployee }) => {
  const { t, language } = useLanguage();
  const [activeSection, setActiveSection] = useState<'logs' | 'announcements' | 'users'>('logs');
  const [logs, setLogs]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [page, setPage]         = useState(1);
  const PAGE_SIZE = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '200' });
    if (search)      params.set('search', search);
    if (actionFilter !== 'ALL') params.set('action', actionFilter);
    if (dateFrom)    params.set('startDate', dateFrom);
    if (dateTo)      params.set('endDate', dateTo);
    const res = await fetch(`/api/audit?${params}`);
    const data = await res.json();
    if (data.success) setLogs(data.logs || []);
    setLoading(false);
  }, [search, actionFilter, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const pagedLogs  = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action))).slice(0, 15);

  const resetFilters = () => { setSearch(''); setActionFilter('ALL'); setDateFrom(''); setDateTo(''); setPage(1); };
  const hasFilters = search || actionFilter !== 'ALL' || dateFrom || dateTo;

  return (
    <div className="space-y-5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen p-1 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-700 dark:bg-slate-800 text-white flex items-center justify-center shadow-sm">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            {language === 'kr' ? '시스템 감사 및 공지사항 관리' : 'Tizim Auditi va E\'lonlar Markazi'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {language === 'kr' ? '인사 시스템 감사 로그, 시스템 공지사항 및 2D RBAC 권한 관리' : "HR amallarining to'liq audit logi, tizim e'lonlari va 2D ruxsatlar boshqaruvi (RBAC)"}
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 p-1 shadow-sm">
        {[
          { id: 'logs',  label: language === 'kr' ? '감사 로그' : 'Audit Loglari', icon: Activity },
          { id: 'announcements', label: t('announcements.manage_tab', "📢 Tizim E'lonlari Boshqaruvi"), icon: Megaphone },
          { id: 'users', label: language === 'kr' ? 'HR 사용자 & RBAC' : 'HR Foydalanuvchilar & RBAC', icon: UserIcon },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeSection === s.id
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-extrabold'
                  : 'text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className="h-4 w-4 text-blue-600 dark:text-indigo-400" />{s.label}
            </button>
          );
        })}
      </div>

      {/* ── Section 1: Audit Logs ── */}
      {activeSection === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="HR xodim nomi, amal turi yoki bo'lim..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-8 pr-3 py-2 text-xs font-bold placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Barcha amallar</option>
              {uniqueActions.map((a) => <option key={a} value={a} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{a}</option>)}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
            <span className="text-slate-400 font-bold text-xs">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
            <button onClick={fetchLogs} className="rounded-lg p-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            {hasFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer">
                <XCircle className="h-3.5 w-3.5" /> Tozalash
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Jami:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs">{logs.length} ta yozuv</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-12 gap-3">
                <Loader2 className="h-5 w-5 text-slate-500 animate-spin" />
                <span className="text-slate-600 dark:text-slate-400 text-sm font-bold">Loglar yuklanmoqda...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Activity className="h-10 w-10 text-slate-400 mx-auto" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">Audit loglari topilmadi</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase text-[10px] border-b border-slate-300 dark:border-slate-700 tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5 text-left">Vaqt</th>
                        <th className="px-4 py-3.5 text-left">HR Xodim</th>
                        <th className="px-4 py-3.5 text-left">Amal</th>
                        <th className="px-4 py-3.5 text-left">Maqsad Bo'lim</th>
                        <th className="px-4 py-3.5 text-left">IP Manzil</th>
                        <th className="px-4 py-3.5 text-left">Qo'shimcha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {pagedLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString('uz-UZ', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">{log.hrName}</div>
                            {log.hrUser && <div className="font-mono text-[10px] text-blue-700 dark:text-indigo-400 font-bold">@{log.hrUser.username}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{log.departmentName || '—'}</td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 font-medium">{log.ipAddress || '—'}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs font-mono max-w-[180px] truncate">
                            {log.metadata ? (() => { try { const m = JSON.parse(log.metadata); return Object.entries(m).map(([k,v]) => `${k}: ${v}`).join(' · '); } catch { return log.metadata; } })() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{logs.length} yozuvdan {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, logs.length)} ko'rsatilmoqda</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="rounded-lg p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({length: totalPages}, (_, i) => i+1).filter(p => Math.abs(p-page) <= 2).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer ${p===page ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>{p}</button>
                      ))}
                      <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="rounded-lg p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Section 2: Announcements Admin Control Panel ── */}
      {activeSection === 'announcements' && (
        <AnnouncementAdminPanel />
      )}

      {/* ── Section 3: HR Users & RBAC ── */}
      {activeSection === 'users' && (
        <HrUserPanel departments={departments} onOpenAddEmployee={onOpenAddEmployee} />
      )}
    </div>
  );
};
