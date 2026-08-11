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
  UserX,
  Building,
  Briefcase,
  SlidersHorizontal,
  BadgeCheck,
  Shield,
  FileCheck,
  LayoutGrid,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

// ─── Action color map ─────────────────────────────────────────────────────────

function getActionColor(action: string): string {
  if (action.includes('tahrirlandi') || action.includes('yangilandi')) return 'text-amber-300 bg-amber-500/10 border-amber-500/20';
  if (action.includes("qo'shildi") || action.includes('yaratildi'))   return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
  if (action.includes("bekor") || action.includes("o'chirildi"))      return 'text-rose-300 bg-rose-500/10 border-rose-500/20';
  if (action.includes('kirdi') || action.includes('chiqdi'))           return 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20';
  return 'text-slate-300 bg-slate-700/40 border-slate-700';
}

// ─── Role Badges ──────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  if (role === 'SUPER_ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <Crown className="h-3 w-3 text-amber-400" /> SUPER_ADMIN
      </span>
    );
  }
  if (role === 'EXECUTIVE_DIRECTOR') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
        <Briefcase className="h-3 w-3 text-purple-400" /> EXECUTIVE_DIRECTOR
      </span>
    );
  }
  if (role === 'AUDITOR' || role === 'VIEWER_ONLY') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
        <Eye className="h-3 w-3 text-teal-400" /> AUDITOR
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
      <Building2 className="h-3 w-3 text-indigo-400" /> HR_OFFICER
    </span>
  );
}

// ─── 3-Tab Dedicated Role & Member Management Modal ─────────────────────────────

const RoleAndMemberModal: React.FC<{
  user: any;
  departments: any[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ user, departments, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'role_status' | 'modules' | 'scoping'>('role_status');

  // Tab 1 state
  const [role, setRole]         = useState<string>(user.role || 'HR_OFFICER');
  const [isActive, setIsActive] = useState<boolean>(user.isActive ?? true);
  const [newPassword, setNewPassword] = useState<string>('');

  // System Modules state (dynamically fetched from DB)
  const [systemModules, setSystemModules] = useState<any[]>([]);
  const [allowedModuleKeys, setAllowedModuleKeys] = useState<string[]>(
    user.moduleAccess?.map((m: any) => m.moduleKey) || user.allowedModuleKeys || []
  );

  // Tab 3 Department Scoping state
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>(
    user.departmentAccess?.map((d: any) => d.id) || user.assignedDepartmentIds || []
  );
  const [deptSearch, setDeptSearch] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Fetch System Modules dynamically
  useEffect(() => {
    fetch('/api/modules')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSystemModules(data.modules || []);
        }
      });
  }, []);

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(deptSearch.toLowerCase()))
  );

  // Module toggle handlers
  const toggleModule = (key: string) => {
    setAllowedModuleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };
  const selectAllModules = () => setAllowedModuleKeys(systemModules.map((m) => m.key));
  const clearAllModules  = () => setAllowedModuleKeys([]);

  // Department toggle handlers
  const toggleDept = (id: string) => {
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };
  const selectAllDepts = () => setSelectedDeptIds(departments.map((d) => d.id));
  const clearAllDepts  = () => setSelectedDeptIds([]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    const payload: any = {
      id: user.id,
      role,
      isActive,
      assignedDepartmentIds: selectedDeptIds,
      allowedModuleKeys: allowedModuleKeys,
    };

    if (newPassword && newPassword.trim().length >= 4) {
      payload.password = newPassword.trim();
    }

    const res = await fetch('/api/auth/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);

    if (data.success) {
      onSuccess();
      onClose();
    } else {
      setError(data.error || 'Saqlashda xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">2D Matrix Rollar va Huquqlarni Boshqarish</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-mono text-indigo-400 font-bold">{user.tabelNumber || 'TB-1000'}</span>
                <span>•</span>
                <span className="font-semibold text-slate-200">{user.fullName}</span>
                <span>•</span>
                <span>{user.position || 'HR Mutaxassis'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-white" /></button>
        </div>

        {/* 3 Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('role_status')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'role_status'
                ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Shield className="h-3.5 w-3.5" /> Tab 1: Rol & Holat
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'modules'
                ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Tab 2: Menyu Modullari ({allowedModuleKeys.length})
          </button>

          <button
            onClick={() => setActiveTab('scoping')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'scoping'
                ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Building className="h-3.5 w-3.5" /> Tab 3: Bo'limlar Scope ({selectedDeptIds.length})
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          {/* TAB 1: Role & Active Status */}
          {activeTab === 'role_status' && (
            <div className="space-y-5">
              <div>
                <label className="text-slate-400 font-semibold mb-2 block uppercase text-[10px] tracking-wider">
                  Asosiy Tizim Roli (Primary System Role) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'SUPER_ADMIN', label: '👑 SUPER_ADMIN', desc: 'Barcha bo\'limlar va modullarga to\'liq ruxsat' },
                    { id: 'EXECUTIVE_DIRECTOR', label: '💼 EXECUTIVE_DIRECTOR', desc: 'Kompaniya bo\'yicha ko\'rish & PDF Svodkalar' },
                    { id: 'HR_OFFICER', label: '🏢 HR_OFFICER', desc: 'Tanlangan modullar va sexlarda tahrirlash' },
                    { id: 'AUDITOR', label: '🔍 AUDITOR', desc: 'Xavfsizlik va muvofiqlik auditori (Faqat ko\'rish)' },
                  ].map((r) => {
                    const isSelected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`p-3.5 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-extrabold flex items-center justify-between">
                          <span>{r.label}</span>
                          {isSelected && <Check className="h-4 w-4 text-indigo-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-1 leading-relaxed">{r.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                <div>
                  <label className="text-slate-400 font-semibold mb-1.5 block">Akkaunt Holati (Status)</label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full flex items-center justify-between rounded-xl px-4 py-2.5 border font-semibold text-xs transition ${
                      isActive
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isActive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      {isActive ? 'Faol Akkaunt (Active)' : 'Bloklangan (Blocked)'}
                    </span>
                    <span className="text-[10px] font-bold underline">{isActive ? 'Bloklash' : 'Faollashtirish'}</span>
                  </button>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold mb-1.5 block">Parolni Yangilash (Ixtiyoriy)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Yangi parol kiriting..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Menyu va Modullar Ruxsati */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Sidebar Menyu Modullari Ruxsati</h4>
                  <p className="text-[11px] text-slate-400">Xodim uchun ochiladigan va tahrirlashga ruxsat berilgan modullar</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={selectAllModules} className="text-[11px] font-bold text-indigo-400 hover:underline">Barchasini Tanlash</button>
                  <span className="text-slate-600">•</span>
                  <button onClick={clearAllModules} className="text-[11px] font-bold text-rose-400 hover:underline">Tozalash</button>
                </div>
              </div>

              {/* Dynamic Module Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-slate-800 rounded-xl p-3 bg-slate-950/40">
                {systemModules.map((m) => {
                  const isAllowed = allowedModuleKeys.includes(m.key);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggleModule(m.key)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                        isAllowed
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-white font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {isAllowed ? (
                        <CheckSquare className="h-4 w-4 text-indigo-400 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs truncate">{m.title}</div>
                        <div className="font-mono text-[9px] text-slate-500">Key: {m.key}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Department Scope */}
          {activeTab === 'scoping' && (
            <div className="space-y-3">
              {role === 'SUPER_ADMIN' ? (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-amber-300 text-xs flex items-center gap-3">
                  <Crown className="h-6 w-6 shrink-0" />
                  <div>
                    <strong>SUPER_ADMIN rolidagi foydalanuvchi!</strong><br />
                    Tizim barcha 50+ bo'limlarga avtomatik to'liq tahrirlash ruxsatini beradi.
                  </div>
                </div>
              ) : role === 'EXECUTIVE_DIRECTOR' || role === 'AUDITOR' ? (
                <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 p-4 text-purple-300 text-xs flex items-center gap-3">
                  <Lock className="h-6 w-6 shrink-0" />
                  <div>
                    <strong>Faqat Ko'rish (Read-Only) roli!</strong><br />
                    Tizim barcha bo'lim ma'lumotlarini ko'rish va hisobotlarni yuklab olish ruxsatini beradi.
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 font-semibold">
                      Tahrirlash Uchun Biriktirilgan Bo'limlar (<span className="text-indigo-400 font-bold">{selectedDeptIds.length} / {departments.length}</span>)
                    </label>
                    <div className="flex gap-2">
                      <button onClick={selectAllDepts} className="text-[11px] font-bold text-indigo-400 hover:underline">Barchasini Tanlash</button>
                      <span className="text-slate-600">•</span>
                      <button onClick={clearAllDepts} className="text-[11px] font-bold text-rose-400 hover:underline">Tozalash</button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      value={deptSearch}
                      onChange={(e) => setDeptSearch(e.target.value)}
                      placeholder="Bo'lim nomi bo'yicha..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto border border-slate-800 rounded-xl p-2 bg-slate-950/40">
                    {filteredDepts.map((d) => {
                      const isSelected = selectedDeptIds.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleDept(d.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-[11px] transition ${
                            isSelected ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-semibold' : 'text-slate-400 bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {isSelected ? <CheckSquare className="h-4 w-4 text-indigo-400 shrink-0" /> : <Square className="h-4 w-4 text-slate-600 shrink-0" />}
                          <span className="truncate">{d.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Footer controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button onClick={onClose} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700">
              Bekor qilish
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Saqlash va Ruxsatlarni Yangilash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── User Registration Modal ───────────────────────────────────────────────────

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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/90">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-indigo-400" /> Yangi Foydalanuvchi Ro'yxatdan O'tkazish
          </h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400 hover:text-white" /></button>
        </div>

        <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* Identity Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-slate-400 font-semibold mb-1 block">F.I.O. (To'liq Ismi) *</label>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Jasur Rahimov"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Tabel № *</label>
              <input
                value={form.tabelNumber}
                onChange={(e) => setForm({ ...form, tabelNumber: e.target.value })}
                placeholder="TB-1010"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Lavozimi (Job Title) *</label>
              <input
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="Kadrlar bo'limi inspektori"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Asosiy Ish Bo'limi (Home Dept)</label>
              <select
                value={form.userDepartmentId}
                onChange={(e) => setForm({ ...form, userDepartmentId: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- Bo'limni Tanlang --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Account Credentials */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Username (Login) *</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="j.rahimov"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Xizmat Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="j.rahimov@enterprise-hr.uz"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Vaqtinchalik Parol *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="text-slate-400 font-semibold mb-2 block">Tizimdagi Roli (System Role) *</label>
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
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-[11px]">{r.label}</div>
                    <div className="text-[9px] text-slate-500 mt-1 leading-tight">{r.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Department Selection (for HR_OFFICER) */}
          {form.role === 'HR_OFFICER' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 font-semibold">
                  Tahrirlash Uchun Biriktiriladigan Bo'limlar ({form.assignedDepartmentIds.length} / {departments.length})
                </label>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-[10px] font-semibold text-indigo-400 hover:underline">Barchasini Tanlash</button>
                  <span className="text-slate-600">•</span>
                  <button onClick={clearAll} className="text-[10px] font-semibold text-rose-400 hover:underline">Tozalash</button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="Bo'lim nomi bo'yicha..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-slate-800 rounded-xl p-2 bg-slate-950/40">
                {filteredDepts.map((d) => {
                  const isSelected = form.assignedDepartmentIds.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDept(d.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left text-[11px] transition ${
                        isSelected ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="h-3.5 w-3.5 text-indigo-400" /> : <Square className="h-3.5 w-3.5 text-slate-600" />}
                      <span className="truncate">{d.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button onClick={onClose} className="rounded-xl bg-slate-800 px-4 py-2 font-semibold text-slate-300">Bekor</button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 font-bold text-white shadow-lg hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Ro'yxatdan O'tkazish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── HR User Management Panel ─────────────────────────────────────────────────

const HrUserPanel: React.FC<{ departments: any[] }> = ({ departments }) => {
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-indigo-400" /> Tizim Foydalanuvchilari va 2D Ruxsatlar Matrix (RBAC)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Ro'yxatga olingan foydalanuvchilar, menyu modullari va sexlar ruxsatlari ({users.length} ta)</p>
        </div>
        <button
          onClick={() => setShowRegModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" /> + Yangi Foydalanuvchi Qo'shish
        </button>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 gap-2"><Loader2 className="h-5 w-5 text-indigo-400 animate-spin" /><span className="text-xs text-slate-400">Yuklanmoqda...</span></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800 tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Tabel №</th>
                  <th className="px-4 py-3 text-left">F.I.O. & Lavozimi</th>
                  <th className="px-4 py-3 text-left">Username & Email</th>
                  <th className="px-4 py-3 text-left">Tizim Roli</th>
                  <th className="px-4 py-3 text-left">Biriktirilgan Bo'limlar</th>
                  <th className="px-4 py-3 text-center">Holati</th>
                  <th className="px-4 py-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const deptAccess = u.departmentAccess || [];
                  const isSuperAdmin = u.role === 'SUPER_ADMIN';
                  const isExecutive  = u.role === 'EXECUTIVE_DIRECTOR';
                  const isAuditor    = u.role === 'AUDITOR' || u.role === 'VIEWER_ONLY';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/25 transition-colors">
                      {/* Tabel № */}
                      <td className="px-4 py-3 font-mono font-bold text-indigo-400 text-xs">
                        {u.tabelNumber || 'TB-1000'}
                      </td>

                      {/* Name & Position */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{u.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{u.position || 'HR Mutaxassis'}</div>
                      </td>

                      {/* Username & Email */}
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] text-indigo-300">@{u.username}</div>
                        <div className="font-mono text-[10px] text-slate-500">{u.email || '—'}</div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>

                      {/* Assigned Departments */}
                      <td className="px-4 py-3 max-w-[240px]">
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            <Crown className="h-2.5 w-2.5" /> Barcha 50+ Bo'limlar
                          </span>
                        ) : isExecutive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                            <Briefcase className="h-2.5 w-2.5" /> Barcha Bo'limlar (Faqat Ko'rish)
                          </span>
                        ) : isAuditor ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-md">
                            <Eye className="h-2.5 w-2.5" /> Audit (Faqat Ko'rish)
                          </span>
                        ) : deptAccess.length === 0 ? (
                          <span className="text-[10px] text-rose-400 font-semibold">Biriktirilmagan</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {deptAccess.slice(0, 2).map((d: any) => (
                              <span key={d.id} className="inline-block text-[9px] font-medium bg-slate-800 text-indigo-300 border border-slate-700 px-1.5 py-0.5 rounded">
                                {d.name}
                              </span>
                            ))}
                            {deptAccess.length > 2 && (
                              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                +{deptAccess.length - 2} ta
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {u.isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                          {u.isActive ? 'Faol' : 'Bloklangan'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setManageUser(u)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition shadow-sm"
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
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ departments = [] }) => {
  const [activeSection, setActiveSection] = useState<'logs' | 'users'>('logs');
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
              <ShieldAlert className="h-5 w-5 text-slate-200" />
            </div>
            Tizim Auditi va Loglar
          </h2>
          <p className="text-sm text-slate-400 mt-1">HR amallarining to'liq audit logi va 2D ruxsatlar boshqaruvi (RBAC)</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex rounded-xl border border-slate-800 overflow-hidden">
        {[
          { id: 'logs',  label: 'Audit Loglari', icon: Activity },
          { id: 'users', label: 'HR Foydalanuvchilar & RBAC', icon: UserIcon },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all ${
                activeSection === s.id ? 'bg-slate-700/50 text-white' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />{s.label}
            </button>
          );
        })}
      </div>

      {/* ── Audit Logs Section ── */}
      {activeSection === 'logs' && (
        <div className="space-y-4">
          <div className="glass-panel rounded-xl border border-slate-800 p-3 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="HR xodim nomi, amal turi yoki bo'lim..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 pl-8 pr-3 py-2 text-xs text-slate-200 focus:border-slate-500 focus:outline-none"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:border-slate-500 focus:outline-none"
            >
              <option value="ALL">Barcha amallar</option>
              {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:outline-none"
            />
            <span className="text-slate-600 text-xs">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:outline-none"
            />
            <button onClick={fetchLogs} className="rounded-xl p-2 border border-slate-700 text-slate-400 hover:bg-slate-800">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            {hasFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300">
                <XCircle className="h-3.5 w-3.5" /> Tozalash
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Jami:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-700/40 text-slate-300 font-bold text-xs">{logs.length} ta yozuv</span>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-12 gap-3">
                <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                <span className="text-slate-400 text-sm">Loglar yuklanmoqda...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Activity className="h-10 w-10 text-slate-700 mx-auto" />
                <p className="text-slate-400">Audit loglari topilmadi</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800 tracking-wide">
                      <tr>
                        <th className="px-4 py-3 text-left">Vaqt</th>
                        <th className="px-4 py-3 text-left">HR Xodim</th>
                        <th className="px-4 py-3 text-left">Amal</th>
                        <th className="px-4 py-3 text-left">Maqsad Bo'lim</th>
                        <th className="px-4 py-3 text-left">IP Manzil</th>
                        <th className="px-4 py-3 text-left">Qo'shimcha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {pagedLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/25 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString('uz-UZ', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white text-[11px]">{log.hrName}</div>
                            {log.hrUser && <div className="font-mono text-[10px] text-indigo-400">@{log.hrUser.username}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{log.departmentName || '—'}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{log.ipAddress || '—'}</td>
                          <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">
                            {log.metadata ? (() => { try { const m = JSON.parse(log.metadata); return Object.entries(m).map(([k,v]) => `${k}: ${v}`).join(' · '); } catch { return log.metadata; } })() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/40">
                    <span className="text-[11px] text-slate-500">{logs.length} yozuvdan {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, logs.length)} ko'rsatilmoqda</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 disabled:opacity-30">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({length: totalPages}, (_, i) => i+1).filter(p => Math.abs(p-page) <= 2).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-semibold ${p===page ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>{p}</button>
                      ))}
                      <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 disabled:opacity-30">
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

      {/* ── HR Users & RBAC Section ── */}
      {activeSection === 'users' && <HrUserPanel departments={departments} />}

      {activeSection === 'users' && (
        <div className="rounded-2xl bg-gradient-to-r from-indigo-900/30 to-purple-900/20 border border-indigo-500/20 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-indigo-300 text-sm">2D Matrix Rollar va Ruxsatlar Tizimi (RBAC 2D Matrix)</div>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              <strong className="text-indigo-300">1-O'lchov (Sidebar Modullar):</strong> Tab 2 orqali xodimga qaysi menyular ochilishi belgilab beriladi (masalan: <em>Xodimlar Baza</em> va <em>Davomat</em> berilib, <em>KPI Dvigateli</em> taqiqlanishi mumkin).<br />
              <strong className="text-amber-300">2-O'lchov (Bo'lim Scoping):</strong> Tab 3 orqali xodimmiz ruxsat berilgan modullar ichida faqat qaysi zavod sexlarini tahrirlay olishi belgilanadi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
