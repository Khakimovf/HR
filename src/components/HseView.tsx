'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  X,
  Printer,
  Filter,
  ChevronRight,
  Stethoscope,
  HardHat,
  Building2,
  User,
  FileText,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
    "O'TGAN":          { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle2,  label: "O'TGAN" },
    "O'TMAGAN":        { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30',    icon: X,             label: "O'TMAGAN" },
    'MUDDATI_TUGAGAN': { bg: 'bg-red-600/15',     text: 'text-red-400',     border: 'border-red-500/30',     icon: AlertTriangle,  label: 'MUDDATI TUGAGAN' },
    'YAQINLASHMOQDA':  { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   icon: Clock,         label: 'YAQIN MUDDATI' },
    'AMALDA':          { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: ShieldCheck,   label: 'AMALDA' },
  };
  const meta = cfg[status] || { bg: 'bg-slate-700', text: 'text-slate-300', border: 'border-slate-600', icon: Clock, label: status };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}>
      <Icon className="h-3 w-3" />{meta.label}
    </span>
  );
}

// ─── Days until expiry helper ─────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const now = new Date();
  const d   = new Date(dateStr);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 3600 * 24));
}

// ─── Medical Checkup Form Modal ───────────────────────────────────────────────

const MedicalForm: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [empSearch, setEmpSearch]   = useState('');
  const [empResults, setEmpResults] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [form, setForm] = useState({
    checkupDate: new Date().toISOString().split('T')[0],
    validityMonths: '12',
    status: "O'TGAN",
    clinicName: '',
    orderRef: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (empSearch.length < 2) { setEmpResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/employees?search=${encodeURIComponent(empSearch)}&limit=6`);
      const d = await res.json();
      setEmpResults(d.employees || []);
    }, 300);
    return () => clearTimeout(t);
  }, [empSearch]);

  const handleSubmit = async () => {
    if (!selectedEmp) { setError('Xodim tanlanmagan'); return; }
    setLoading(true);
    const res = await fetch('/api/hse/medical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: selectedEmp.id, ...form }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) { onSuccess(); onClose(); }
    else setError(data.error);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-900/80">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-emerald-400" /> Yangi Tibbiy Ko'rik Yozuvi
          </h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400 hover:text-white" /></button>
        </div>
        <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {/* Employee selector */}
          {selectedEmp ? (
            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3">
              <div className="font-semibold text-white">{selectedEmp.lastName} {selectedEmp.firstName}
                <span className="ml-2 font-mono text-emerald-400 text-[11px]">{selectedEmp.tabelNumber}</span>
              </div>
              <button onClick={() => setSelectedEmp(null)}><X className="h-3.5 w-3.5 text-slate-400" /></button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input value={empSearch} onChange={(e) => setEmpSearch(e.target.value)}
                placeholder="Xodim ismi yoki tabel raqami..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
              {empResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                  {empResults.map((e) => (
                    <button key={e.id} onClick={() => { setSelectedEmp(e); setEmpSearch(''); setEmpResults([]); }}
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-800 text-left transition">
                      <span className="font-semibold text-white">{e.lastName} {e.firstName}</span>
                      <span className="font-mono text-indigo-400 text-[10px]">{e.tabelNumber}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Ko'rik Sanasi</label>
              <input type="date" value={form.checkupDate} onChange={(e) => setForm({...form, checkupDate: e.target.value})}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Amal Qilish Muddati</label>
              <select value={form.validityMonths} onChange={(e) => setForm({...form, validityMonths: e.target.value})}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none">
                <option value="6">6 oy</option>
                <option value="12">12 oy (1 yil)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-semibold mb-1 block">Ko'rik Natijasi</label>
            <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none">
              <option value="O'TGAN">O'TGAN ✓</option>
              <option value="O'TMAGAN">O'TMAGAN ✗</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Klinika / Shifoxona</label>
              <input value={form.clinicName} onChange={(e) => setForm({...form, clinicName: e.target.value})}
                placeholder="«Najot» Tibbiyot Markazi" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Buyruq / Yo'llanma №</label>
              <input value={form.orderRef} onChange={(e) => setForm({...form, orderRef: e.target.value})}
                placeholder="MED-2026-0041" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-semibold mb-1 block">Izoh</label>
            <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none resize-none" />
          </div>

          {error && <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</div>}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button onClick={onClose} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700">Bekor</button>
            <button onClick={handleSubmit} disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-lg disabled:opacity-40">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Safety Briefing Form Modal ───────────────────────────────────────────────

const SafetyForm: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [empSearch, setEmpSearch]   = useState('');
  const [empResults, setEmpResults] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    completionDate: new Date().toISOString().split('T')[0],
    validityDays: '365',
    instructorName: '',
    protocolNumber: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const PREDEFINED_TITLES = [
    'Elektr Xavfsizligi',
    "Stanok Boshqarish Yo'riqnomasi",
    "Yong'in Xavfsizligi",
    'OSH Umumiy Yo\'riqnomasi',
    "Kimyoviy Moddalar Bilan Ishlash",
    "Balandlikda Ishlash Xavfsizligi",
    "Qo'lda Ko'tarish Texnikasi",
    "Shaxsiy Himoya Vositalarini Taqish",
  ];

  useEffect(() => {
    if (empSearch.length < 2) { setEmpResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/employees?search=${encodeURIComponent(empSearch)}&limit=6`);
      const d = await res.json();
      setEmpResults(d.employees || []);
    }, 300);
    return () => clearTimeout(t);
  }, [empSearch]);

  const handleSubmit = async () => {
    if (!selectedEmp) { setError('Xodim tanlanmagan'); return; }
    if (!form.title)  { setError("Yo'riqnoma sarlavhasi kiritilmagan"); return; }
    setLoading(true);
    const res = await fetch('/api/hse/safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: selectedEmp.id, ...form }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) { onSuccess(); onClose(); }
    else setError(data.error);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <HardHat className="h-4 w-4 text-amber-400" /> Yangi Xavfsizlik Yo'riqnomasi
          </h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400 hover:text-white" /></button>
        </div>
        <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {selectedEmp ? (
            <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
              <div className="font-semibold text-white">{selectedEmp.lastName} {selectedEmp.firstName}
                <span className="ml-2 font-mono text-amber-400 text-[11px]">{selectedEmp.tabelNumber}</span>
              </div>
              <button onClick={() => setSelectedEmp(null)}><X className="h-3.5 w-3.5 text-slate-400" /></button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} placeholder="Xodim ismi yoki tabel raqami..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none" />
              {empResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                  {empResults.map((e) => (
                    <button key={e.id} onClick={() => { setSelectedEmp(e); setEmpSearch(''); setEmpResults([]); }}
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-800 text-left">
                      <span className="font-semibold text-white">{e.lastName} {e.firstName}</span>
                      <span className="font-mono text-indigo-400 text-[10px]">{e.tabelNumber}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-slate-400 font-semibold mb-1 block">Yo'riqnoma / Briefing Turi</label>
            <select value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none mb-1">
              <option value="">— Tanlang yoki quyida kiriting —</option>
              {PREDEFINED_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
              placeholder="Yoki o'zingiz kiriting..." className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">O'tkazilgan Sana</label>
              <input type="date" value={form.completionDate} onChange={(e) => setForm({...form, completionDate: e.target.value})}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Amal Qilish Muddati</label>
              <select value={form.validityDays} onChange={(e) => setForm({...form, validityDays: e.target.value})}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none">
                <option value="90">90 kun (Kvartal)</option>
                <option value="180">180 kun (Yarim yil)</option>
                <option value="365">365 kun (Yillik)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Instructor / Yo'riqchi</label>
              <input value={form.instructorName} onChange={(e) => setForm({...form, instructorName: e.target.value})}
                placeholder="F.I.O. yo'riqchi" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Protokol / Akt №</label>
              <input value={form.protocolNumber} onChange={(e) => setForm({...form, protocolNumber: e.target.value})}
                placeholder="XAVF-2026-0019" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none" />
            </div>
          </div>

          {error && <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</div>}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button onClick={onClose} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700">Bekor</button>
            <button onClick={handleSubmit} disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2 text-xs font-bold text-white shadow-lg disabled:opacity-40">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HardHat className="h-3.5 w-3.5" />}
              Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main HseView Component ───────────────────────────────────────────────────

interface HseViewProps {
  departments?: Array<{ id: string; name: string }>;
}

export const HseView: React.FC<HseViewProps> = ({ departments = [] }) => {
  const [activeTab, setActiveTab] = useState<'medical' | 'safety'>('medical');

  // Medical state
  const [checkups, setCheckups]     = useState<any[]>([]);
  const [medStats, setMedStats]     = useState<any>({});
  const [medLoading, setMedLoading] = useState(true);
  const [medSearch, setMedSearch]   = useState('');
  const [medFilter, setMedFilter]   = useState('ALL');
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);

  // Safety state
  const [briefings, setBriefings]     = useState<any[]>([]);
  const [safetyStats, setSafetyStats] = useState<any>({});
  const [safetyLoading, setSafetyLoading] = useState(true);
  const [safetySearch, setSafetySearch]   = useState('');
  const [incidentDate, setIncidentDate]   = useState('');
  const [showSafetyForm, setShowSafetyForm] = useState(false);
  const [incidentResult, setIncidentResult] = useState<any[]>([]);
  const [isIncidentSearch, setIsIncidentSearch] = useState(false);

  const fetchMedical = useCallback(async () => {
    setMedLoading(true);
    const params = new URLSearchParams();
    if (medSearch) params.set('search', medSearch);
    if (medFilter !== 'ALL') params.set('status', medFilter);
    if (alertsOnly) params.set('alertsOnly', 'true');
    const res = await fetch(`/api/hse/medical?${params}`);
    const data = await res.json();
    if (data.success) { setCheckups(data.checkups || []); setMedStats(data.stats || {}); }
    setMedLoading(false);
  }, [medSearch, medFilter, alertsOnly]);

  const fetchSafety = useCallback(async (search?: string, iDate?: string) => {
    setSafetyLoading(true);
    const params = new URLSearchParams();
    if (search ?? safetySearch) params.set('search', search ?? safetySearch);
    if (iDate ?? incidentDate) params.set('incidentDate', iDate ?? incidentDate);
    const res = await fetch(`/api/hse/safety?${params}`);
    const data = await res.json();
    if (data.success) { setBriefings(data.briefings || []); setSafetyStats(data.stats || {}); }
    setSafetyLoading(false);
  }, [safetySearch, incidentDate]);

  useEffect(() => { fetchMedical(); }, [fetchMedical]);
  useEffect(() => { if (activeTab === 'safety') fetchSafety(); }, [activeTab, fetchSafety]);

  const handleIncidentAudit = async () => {
    if (!safetySearch && !incidentDate) return;
    setIsIncidentSearch(true);
    const params = new URLSearchParams();
    if (safetySearch) params.set('search', safetySearch);
    if (incidentDate) params.set('incidentDate', incidentDate);
    const res = await fetch(`/api/hse/safety?${params}`);
    const data = await res.json();
    setIncidentResult(data.briefings || []);
  };

  const printIncidentReport = () => {
    if (incidentResult.length === 0) return;
    const rows = incidentResult.map((b) =>
      `<tr>
        <td>${b.employee?.lastName} ${b.employee?.firstName} [${b.employee?.tabelNumber}]</td>
        <td>${b.title}</td>
        <td>${new Date(b.completionDate).toLocaleDateString('uz-UZ')}</td>
        <td>${new Date(b.expiryDate).toLocaleDateString('uz-UZ')}</td>
        <td>${b.instructorName || '—'}</td>
        <td>${b.protocolNumber || '—'}</td>
      </tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><title>Xavfsizlik Audit Hisoboti</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; }
      h2 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { background: #1e3a8a; color: white; padding: 6px 8px; text-align: left; font-size: 9pt; }
      td { padding: 5px 8px; border: 1px solid #ddd; font-size: 9pt; }
      tr:nth-child(even) td { background: #f5f8ff; }
      .meta { color: #555; font-size: 9pt; margin-bottom: 10px; }
    </style></head><body>
    <h2>Xavfsizlik Muvofiqlik Audit Hisoboti</h2>
    <div class="meta">
      Xodim: <strong>${safetySearch || '—'}</strong> &nbsp;|&nbsp;
      Hodisa Sanasi: <strong>${incidentDate || '—'}</strong> &nbsp;|&nbsp;
      Hisobot Sanasi: <strong>${new Date().toLocaleDateString('uz-UZ')}</strong>
    </div>
    <table><thead><tr>
      <th>Xodim (Tabel №)</th><th>Yo'riqnoma</th><th>O'tkazilgan</th><th>Muddati</th><th>Instructor</th><th>Protokol №</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <p style="margin-top:20px;font-size:8pt;color:#888">Jami: ${incidentResult.length} ta amal qiluvchi yo'riqnoma.</p>
    </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            Med-Ko'rik va Xavfsizlik (HSE)
          </h2>
          <p className="text-sm text-slate-400 mt-1">Tibbiy Ko'rik Monitori va Xavfsizlik Yo'riqnomalari Boshqaruvi</p>
        </div>
        <button
          onClick={() => activeTab === 'medical' ? setShowMedForm(true) : setShowSafetyForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          {activeTab === 'medical' ? "Yangi Ko'rik Yozuvi" : "Yangi Yo'riqnoma"}
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40">
        {[
          { id: 'medical', label: "Tibbiy Ko'rik Monitori", icon: Stethoscope, badge: (medStats.expired || 0) + (medStats.failed || 0) },
          { id: 'safety',  label: "Xavfsizlik Yo'riqnomalari Logi", icon: HardHat, badge: safetyStats.expired || 0 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all ${
                isActive ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-300 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}>
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── MEDICAL TAB ── */}
      {activeTab === 'medical' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Jami Ko\'riklar', val: medStats.total || 0, color: 'text-indigo-400', bg: 'border-indigo-500/30 bg-indigo-500/5' },
              { label: "O'tgan", val: medStats.passed || 0, color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-500/5' },
              { label: "O'tmagan", val: medStats.failed || 0, color: 'text-rose-400', bg: 'border-rose-500/30 bg-rose-500/5' },
              { label: 'Muddati Tugagan', val: medStats.expired || 0, color: 'text-red-400', bg: 'border-red-500/30 bg-red-500/5' },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className={`glass-card rounded-2xl p-4 border flex items-center justify-between ${bg}`}>
                <div className="text-xs text-slate-400">{label}</div>
                <div className={`text-2xl font-extrabold ${color}`}>{val}</div>
              </div>
            ))}
          </div>

          {/* Alert Banner */}
          {(medStats.expired || 0) + (medStats.failed || 0) > 0 && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <div className="font-bold text-rose-300 text-sm">Tibbiy Ko'rik Ogohlantirishlari</div>
                <p className="text-rose-200/70 text-xs mt-0.5">
                  {medStats.expired} xodimning tibbiy ko'rik muddati tugagan, {medStats.failed} xodim ko'rikdan o'tmagan.
                  Ular ishga kirishdan <strong>cheklanishi</strong> kerak.
                </p>
                <button onClick={() => { setAlertsOnly(!alertsOnly); }} className="mt-2 text-xs text-rose-400 hover:text-rose-300 font-semibold underline">
                  {alertsOnly ? 'Barcha ko\'riklarni ko\'rsatish' : 'Faqat muammolillarni ko\'rsatish →'}
                </button>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="glass-panel rounded-xl border border-slate-800 p-3 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input value={medSearch} onChange={(e) => setMedSearch(e.target.value)}
                placeholder="Xodim ismi yoki tabel №..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 pl-8 pr-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none" />
            </div>
            <select value={medFilter} onChange={(e) => setMedFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none">
              <option value="ALL">Barcha holat</option>
              <option value="O'TGAN">O'tgan</option>
              <option value="O'TMAGAN">O'tmagan</option>
              <option value="MUDDATI_TUGAGAN">Muddati tugagan</option>
              <option value="YAQINLASHMOQDA">Yaqin muddati</option>
            </select>
            <button onClick={fetchMedical} className="rounded-xl p-2 border border-slate-700 text-slate-400 hover:bg-slate-800">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Medical Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            {medLoading ? (
              <div className="flex items-center justify-center p-12 gap-3">
                <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
                <span className="text-slate-400 text-sm">Yuklanmoqda...</span>
              </div>
            ) : checkups.length === 0 ? (
              <div className="p-12 text-center">
                <Stethoscope className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">Ko'rik yozuvlari topilmadi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wide text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Xodim</th>
                      <th className="px-4 py-3 text-left">Bo'lim</th>
                      <th className="px-4 py-3 text-left">Ko'rik Sanasi</th>
                      <th className="px-4 py-3 text-left">Muddati</th>
                      <th className="px-4 py-3 text-left">Qolgan Kun</th>
                      <th className="px-4 py-3 text-left">Klinika</th>
                      <th className="px-4 py-3 text-left">Buyruq №</th>
                      <th className="px-4 py-3 text-center">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {checkups.map((c) => {
                      const days = daysUntil(c.expiryDate);
                      const isAlert = ['MUDDATI_TUGAGAN', "O'TMAGAN"].includes(c.effectiveStatus);
                      return (
                        <tr key={c.id} className={`hover:bg-slate-800/30 transition-colors ${isAlert ? 'bg-rose-500/3' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-200">{c.employee?.lastName} {c.employee?.firstName}</div>
                            <div className="font-mono text-[10px] text-indigo-400">{c.employee?.tabelNumber}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-[11px]">{c.employee?.currentDepartment?.name}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{formatDate(c.checkupDate)}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{formatDate(c.expiryDate)}</td>
                          <td className="px-4 py-3 font-bold">
                            {days < 0 ? (
                              <span className="text-red-400">{Math.abs(days)} kun o'tdi</span>
                            ) : days <= 30 ? (
                              <span className="text-amber-400">{days} kun qoldi</span>
                            ) : (
                              <span className="text-emerald-400">{days} kun</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{c.clinicName || '—'}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{c.orderRef || '—'}</td>
                          <td className="px-4 py-3 text-center"><StatusBadge status={c.effectiveStatus} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SAFETY TAB ── */}
      {activeTab === 'safety' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Jami Yo\'riqnomalar', val: safetyStats.total || 0, color: 'text-indigo-400', bg: 'border-indigo-500/30' },
              { label: 'Amalda',             val: safetyStats.active || 0, color: 'text-emerald-400', bg: 'border-emerald-500/30' },
              { label: 'Muddati Tugagan',    val: safetyStats.expired || 0, color: 'text-rose-400', bg: 'border-rose-500/30' },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className={`glass-card rounded-2xl p-4 border flex items-center justify-between ${bg}`}>
                <div className="text-xs text-slate-400">{label}</div>
                <div className={`text-2xl font-extrabold ${color}`}>{val}</div>
              </div>
            ))}
          </div>

          {/* Incident Audit Search Widget */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-900/30 to-orange-900/20 border border-amber-500/30 p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <HardHat className="h-4 w-4" />
              Xavfsizlik Auditi — Hodisa Tekshiruvi
            </div>
            <p className="text-xs text-slate-400">Xodim ismi/tabel raqami va hodisa sanasini kiriting → tanlangan sanada amal qilgan barcha yo'riqnomalar chiqariladi.</p>
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input value={safetySearch} onChange={(e) => setSafetySearch(e.target.value)}
                  placeholder="Xodim ismi yoki tabel №..."
                  className="w-full rounded-xl border border-amber-500/30 bg-slate-950/80 pl-8 pr-3 py-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none" />
              </div>
              <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)}
                className="rounded-xl border border-amber-500/30 bg-slate-950/80 px-3 py-2.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
                title="Hodisa sanasi (shu sanada amalda bo'lgan yo'riqnomalar)" />
              <button onClick={handleIncidentAudit}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-400">
                <Search className="h-3.5 w-3.5" /> Tekshirish
              </button>
              {incidentResult.length > 0 && (
                <button onClick={printIncidentReport}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700">
                  <Printer className="h-3.5 w-3.5" /> Chop Etish
                </button>
              )}
            </div>

            {/* Audit results */}
            {isIncidentSearch && incidentResult.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                <div className="text-xs font-bold text-amber-300">{incidentResult.length} ta amal qiluvchi yo'riqnoma topildi</div>
                {incidentResult.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white">{b.title}</span>
                      <span className="text-slate-500 ml-2">— {b.employee?.lastName} {b.employee?.firstName}</span>
                    </div>
                    <span className="font-mono text-emerald-400">{formatDate(b.completionDate)} → {formatDate(b.expiryDate)}</span>
                  </div>
                ))}
              </div>
            )}
            {isIncidentSearch && incidentResult.length === 0 && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                Tanlangan sana va xodim uchun amalda bo'lgan yo'riqnoma topilmadi.
              </div>
            )}
          </div>

          {/* Safety table toolbar */}
          <div className="glass-panel rounded-xl border border-slate-800 p-3 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input value={safetySearch} onChange={(e) => setSafetySearch(e.target.value)}
                placeholder="Xodim yoki yo'riqnoma turi bo'yicha..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 pl-8 pr-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none" />
            </div>
            <button onClick={() => fetchSafety()} className="rounded-xl p-2 border border-slate-700 text-slate-400 hover:bg-slate-800">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Safety Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            {safetyLoading ? (
              <div className="flex items-center justify-center p-12 gap-3">
                <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
                <span className="text-slate-400 text-sm">Yuklanmoqda...</span>
              </div>
            ) : briefings.length === 0 ? (
              <div className="p-12 text-center">
                <HardHat className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">Yo'riqnoma yozuvlari topilmadi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wide text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Xodim</th>
                      <th className="px-4 py-3 text-left">Yo'riqnoma / Briefing Turi</th>
                      <th className="px-4 py-3 text-left">O'tkazilgan</th>
                      <th className="px-4 py-3 text-left">Muddati</th>
                      <th className="px-4 py-3 text-left">Qolgan</th>
                      <th className="px-4 py-3 text-left">Instructor</th>
                      <th className="px-4 py-3 text-left">Protokol №</th>
                      <th className="px-4 py-3 text-center">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {briefings.map((b) => {
                      const days = daysUntil(b.expiryDate);
                      return (
                        <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-200">{b.employee?.lastName} {b.employee?.firstName}</div>
                            <div className="font-mono text-[10px] text-indigo-400">{b.employee?.tabelNumber}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-amber-300">{b.title}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{formatDate(b.completionDate)}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{formatDate(b.expiryDate)}</td>
                          <td className="px-4 py-3 font-bold">
                            {days < 0 ? <span className="text-red-400">{Math.abs(days)} kun o'tdi</span>
                              : days <= 30 ? <span className="text-amber-400">{days} kun</span>
                              : <span className="text-emerald-400">{days} kun</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{b.instructorName || '—'}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{b.protocolNumber || '—'}</td>
                          <td className="px-4 py-3 text-center"><StatusBadge status={b.effectiveStatus} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showMedForm    && <MedicalForm    onClose={() => setShowMedForm(false)}    onSuccess={() => { setShowMedForm(false);    fetchMedical(); }} />}
      {showSafetyForm && <SafetyForm     onClose={() => setShowSafetyForm(false)} onSuccess={() => { setShowSafetyForm(false); fetchSafety(); }} />}
    </div>
  );
};
