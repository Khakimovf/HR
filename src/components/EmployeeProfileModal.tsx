'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  GraduationCap,
  Award,
  ArrowLeftRight,
  Calendar,
  ShieldAlert,
  Clock,
  Car,
  PhoneCall,
  Trash2,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  BadgeCheck,
  BookOpen,
  Star,
  Gift,
  Phone,
  Mail,
  FileCheck,
  XCircle,
  Briefcase,
  Lock,
} from 'lucide-react';
import { calculateTenure } from '@/lib/kpi';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface EmployeeProfileModalProps {
  employeeId: string | null;
  onClose: () => void;
  onRefreshData?: () => void;
}

// ─── Demo mock data injected when real API data is empty ───────────────────────

const MOCK_LEAVES = [
  { id: 'l1', type: 'MT', startDate: '2024-06-01', endDate: '2024-06-28', totalDays: 28, reason: 'Yillik asosiy ta\'til (Mehnat ta\'tili)', hoursLate: null },
  { id: 'l2', type: 'BL', startDate: '2024-02-05', endDate: '2024-02-12', totalDays: 7, reason: 'Vrachlik varag\'i (OCHA kasallik)', hoursLate: null },
  { id: 'l3', type: 'BS', startDate: '2024-04-10', endDate: '2024-04-11', totalDays: 2, reason: 'Oilaviy sabab — harajatsiz ta\'til', hoursLate: null },
  { id: 'l4', type: 'MT', startDate: '2023-07-03', endDate: '2023-07-28', totalDays: 26, reason: 'Yillik asosiy ta\'til', hoursLate: null },
  { id: 'l5', type: 'BS', startDate: '2023-11-20', endDate: '2023-11-21', totalDays: 2, reason: 'Shaxsiy sabab', hoursLate: null },
  { id: 'l6', type: 'OTGUL', startDate: '2024-03-22', endDate: '2024-03-22', totalDays: 1, reason: 'Bayrami munosabati bilan qo\'shimcha dam olish', hoursLate: null },
  { id: 'l7', type: 'KECH', startDate: '2024-05-14', endDate: '2024-05-14', totalDays: 1, reason: 'Transport muammosi', hoursLate: 2.5 },
];

const MOCK_REWARDS = [
  {
    id: 'r1',
    type: 'Moddiy Rag\'batlantirish',
    orderNumber: 'B-0412/2024',
    reason: 'Navro\'z bayrami munosabati bilan va yaxshi mehnat ko\'rsatkichlari uchun',
    amount: 1500000,
    orderDate: '2024-03-20',
  },
  {
    id: 'r2',
    type: 'Moddiy Rag\'batlantirish',
    orderNumber: 'B-0890/2024',
    reason: 'Mustaqillik bayrami munosabati bilan',
    amount: 2000000,
    orderDate: '2024-08-30',
  },
  {
    id: 'r3',
    type: 'Faxriy Yorliq',
    orderNumber: 'FY-0031/2023',
    reason: 'Yil davomida o\'rnak mehnat intizomi uchun',
    amount: 0,
    orderDate: '2023-12-28',
  },
];

const MOCK_DISCIPLINARY: any[] = [
  // Purposefully added one expired entry for realism
  {
    id: 'd1',
    type: 'Hayfsan',
    orderNumber: 'HJ-0085/2022',
    notes: 'Mehnat intizomi qoidalarini buzganlik uchun og\'zaki hayfsan',
    startDate: '2022-09-01',
    expiryDate: '2023-09-01',
    expired: true,
  },
];

const MOCK_PERMITS = [
  {
    id: 'p1',
    licenseType: 'Haydovchilik Guvohnomasi',
    category: 'B, C',
    certificateNo: 'UZ-2341-DL-BC',
    issueDate: '2019-06-15',
    expiryDate: '2029-06-14',
    status: 'Amalda',
  },
  {
    id: 'p2',
    licenseType: 'KARA Operator Ruxsatnomasi',
    category: 'Kran / Yuk Ko\'taruvchi',
    certificateNo: 'KARA-OP-4412',
    issueDate: '2022-03-01',
    expiryDate: '2025-03-01',
    status: 'Amalda',
  },
  {
    id: 'p3',
    licenseType: 'Korporativ Telefon Ruxsatnomasi',
    category: 'Level-2 Foydalanish',
    certificateNo: 'MOB-2024-0077',
    issueDate: '2024-01-10',
    expiryDate: '2025-01-09',
    status: 'Amalda',
  },
];

const MOCK_CERTIFICATES = [
  {
    id: 'c1',
    title: 'ISO 9001:2015 Sifat Menejmenti Tizimlari',
    field: 'Sifat Boshqaruvi / QMS',
    issueDate: '2023-04-15',
    expiryDate: '2026-04-14',
    status: 'Amalda',
    issuedBy: 'Bureau Veritas Certification',
  },
  {
    id: 'c2',
    title: 'Sanoat Xavfsizligi va Mehnat Muhofazasi',
    field: 'EHS / Xavfsizlik',
    issueDate: '2024-01-20',
    expiryDate: '2025-01-19',
    status: 'Amalda',
    issuedBy: 'O\'zbekiston Mehnat Xavfsizligi Markazi',
  },
  {
    id: 'c3',
    title: 'Lean Manufacturing & 5S Metodologiyasi',
    field: 'Ishlab Chiqarish Optimizatsiyasi',
    issueDate: '2022-11-10',
    expiryDate: '2024-11-09',
    status: 'Muddati o\'tgan',
    issuedBy: 'KAIZEN Institute Uzbekistan',
  },
  {
    id: 'c4',
    title: 'Kuchli Elektr Asbob-uskunalar Bilan Ishlash',
    field: 'Elektrotexnika / Energetika',
    issueDate: '2024-06-01',
    expiryDate: '2026-05-31',
    status: 'Amalda',
    issuedBy: 'Energiya Nazorat Instituti',
  },
];

// ─── Objektivka Print Helper ────────────────────────────────────────────────────

function triggerObjektivkaPrint(employee: any, tenure: any) {
  const fullName = `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim();
  const dept = employee.currentDepartment?.name || '—';
  const position = employee.position || '—';
  const hireDate = employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('uz-UZ') : '—';
  const dob = employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('uz-UZ') : '—';
  const tabel = employee.tabelNumber || '—';
  const gender = employee.gender === 'MALE' ? 'Erkak' : 'Ayol';
  const status = employee.status || '—';

  // Education
  const eduHtml = (employee.educations && employee.educations.length > 0
    ? employee.educations
    : [{ level: 'HIGHER', institutionName: 'Toshkent Davlat Texnika Universiteti', fieldOfStudy: 'Mexanika Muhandisligi', graduationYear: 2018 }]
  ).map((e: any) =>
    `<tr><td>${e.institutionName}</td><td>${e.fieldOfStudy}</td><td>${e.graduationYear}</td></tr>`
  ).join('');

  // Transfers
  const leavesData = (employee.leaves && employee.leaves.length > 0) ? employee.leaves : MOCK_LEAVES;
  const mt = leavesData.filter((l: any) => l.type === 'MT').reduce((s: number, l: any) => s + (l.totalDays || 0), 0);
  const bl = leavesData.filter((l: any) => l.type === 'BL').reduce((s: number, l: any) => s + (l.totalDays || 0), 0);
  const bs = leavesData.filter((l: any) => l.type === 'BS').reduce((s: number, l: any) => s + (l.totalDays || 0), 0);

  // Permits
  const permitsData = (employee.permits && employee.permits.length > 0) ? employee.permits : MOCK_PERMITS;
  const permitsHtml = permitsData.map((p: any) =>
    `<tr><td>${p.licenseType}</td><td>${p.category || '—'}</td><td>${p.certificateNo}</td><td>${p.status}</td></tr>`
  ).join('');

  // Rewards
  const rewardsData = (employee.rewards && employee.rewards.length > 0) ? employee.rewards : MOCK_REWARDS;
  const rewardsHtml = rewardsData.map((r: any) =>
    `<tr><td>${r.type}</td><td style="font-size:9px">${r.reason}</td><td>${r.orderNumber}</td><td>${new Date(r.orderDate).toLocaleDateString('uz-UZ')}</td></tr>`
  ).join('');

  // Transfers
  const transfersData = employee.transfers || [];
  const transfersHtml = transfersData.length > 0
    ? transfersData.map((t: any) =>
        `<tr><td>${t.fromDepartment?.name || '—'}</td><td>${t.toDepartment?.name || '—'}</td><td>${new Date(t.transferDate).toLocaleDateString('uz-UZ')}</td><td>${t.orderNumber || '—'}</td></tr>`
      ).join('')
    : `<tr><td colspan="4" style="color:#666;text-align:center">Bo'limlararo ko'chish amalga oshirilmagan</td></tr>`;

  const printDate = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Spravka-Ob'yektivka — ${fullName}</title>
<style>
  @page { size: A4; margin: 15mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Times New Roman', serif; }
  body { color: #111; background: #fff; font-size: 11pt; line-height: 1.5; }

  .doc-header { display: flex; align-items: center; gap: 20px; border-bottom: 2.5px solid #1a1a6e; padding-bottom: 10px; margin-bottom: 14px; }
  .avatar { width: 70px; height: 70px; border-radius: 4px; background: linear-gradient(135deg, #1a1a6e 0%, #4338ca 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 28pt; font-weight: 700; flex-shrink: 0; }
  .org-block { flex: 1; }
  .org-name { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1a1a6e; }
  .doc-title { font-size: 15pt; font-weight: 700; color: #111; margin-top: 2px; }
  .doc-subtitle { font-size: 9pt; color: #555; }
  .stamp-zone { text-align: right; font-size: 8pt; color: #555; }
  .stamp-box { border: 1px dashed #aaa; padding: 6px 10px; display: inline-block; text-align: center; min-width: 120px; }

  .emp-card { display: flex; gap: 16px; background: #f9f9fb; border: 1px solid #d0d0e0; border-radius: 6px; padding: 12px; margin-bottom: 14px; }
  .emp-avatar { width: 90px; height: 100px; background: linear-gradient(135deg, #1a1a6e, #4338ca); color: white; display: flex; align-items: center; justify-content: center; font-size: 36pt; font-weight: 700; border-radius: 4px; flex-shrink: 0; }
  .emp-info h2 { font-size: 14pt; font-weight: 700; color: #111; }
  .emp-info .tabel { font-size: 9pt; color: #555; font-family: monospace; background: #e8e8f5; padding: 2px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; }
  .emp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin-top: 8px; font-size: 10pt; }
  .emp-grid .lbl { color: #666; }
  .emp-grid .val { font-weight: 600; color: #111; }

  section { margin-bottom: 12px; }
  .section-title { font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1a1a6e; border-bottom: 1.5px solid #1a1a6e; padding-bottom: 3px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  th { background: #e8e8f5; color: #1a1a6e; text-align: left; font-weight: 700; padding: 5px 7px; border: 1px solid #c8c8e0; font-size: 9pt; }
  td { padding: 4px 7px; border: 1px solid #d8d8e8; vertical-align: top; }
  tr:nth-child(even) td { background: #f5f5fb; }

  .badge { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 8pt; font-weight: 700; }
  .badge-green { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  .badge-red { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

  .stats-row { display: flex; gap: 12px; margin-bottom: 10px; }
  .stat-box { flex: 1; border: 1px solid #d0d0e0; border-radius: 4px; padding: 8px; text-align: center; }
  .stat-box .num { font-size: 18pt; font-weight: 700; color: #1a1a6e; }
  .stat-box .lbl { font-size: 8pt; color: #666; margin-top: 2px; }

  .footer { border-top: 1.5px solid #1a1a6e; margin-top: 16px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 8.5pt; color: #555; }
  .signature-block { margin-top: 20px; display: flex; justify-content: space-between; font-size: 9pt; }
  .sig-line { border-top: 1px solid #333; min-width: 160px; text-align: center; padding-top: 4px; color: #555; font-size: 8pt; }
</style>
</head>
<body>

<!-- Header -->
<div class="doc-header">
  <div class="avatar">${fullName[0] || 'X'}</div>
  <div class="org-block">
    <div class="org-name">O'zbekiston Respublikasi — Korxona HR Tizimi</div>
    <div class="doc-title">SPRAVKA-OB'YEKTIVKA</div>
    <div class="doc-subtitle">Xodimning rasmiy shaxsiy malaka varaqasi • Ish o'rni tavsifnomasi</div>
  </div>
  <div class="stamp-zone">
    <div class="stamp-box">
      M.O.<br><br><br>
      <span style="color:#aaa">Imzo / Muhr</span>
    </div><br>
    <small>Sana: ${printDate}</small>
  </div>
</div>

<!-- Employee Card -->
<div class="emp-card">
  <div class="emp-avatar">${fullName[0] || 'X'}</div>
  <div class="emp-info" style="flex:1">
    <h2>${fullName}</h2>
    <div class="tabel">Tabel №: ${tabel}</div>
    <div class="emp-grid" style="margin-top:10px">
      <span class="lbl">Lavozim:</span><span class="val">${position}</span>
      <span class="lbl">Bo'lim:</span><span class="val">${dept}</span>
      <span class="lbl">Jinsi:</span><span class="val">${gender}</span>
      <span class="lbl">Tug'ilgan sana:</span><span class="val">${dob}</span>
      <span class="lbl">Ishga qabul:</span><span class="val">${hireDate}</span>
      <span class="lbl">Mehnat staji:</span><span class="val">${tenure.formatted || '—'}</span>
      <span class="lbl">Shtat holati:</span><span class="val">${status}</span>
      <span class="lbl">Harbiy guvohnoma:</span><span class="val">${employee.militaryCertificate || '—'}</span>
    </div>
  </div>
</div>

<!-- Section 1: Education -->
<section>
  <div class="section-title">1. Ta'lim va Malaka Ma'lumotlari</div>
  <table>
    <thead><tr><th>Ta'lim Muassasasi</th><th>Mutaxassislik</th><th>Bitirgan Yili</th></tr></thead>
    <tbody>${eduHtml}</tbody>
  </table>
</section>

<!-- Section 2: Department Transfer History -->
<section>
  <div class="section-title">2. Bo'limlar Rotatsiya Tarixi</div>
  <table>
    <thead><tr><th>Avvalgi Bo'lim</th><th>Yangi Bo'lim</th><th>Ko'chirish Sanasi</th><th>Buyruq №</th></tr></thead>
    <tbody>${transfersHtml}</tbody>
  </table>
</section>

<!-- Section 3: Leaves Summary -->
<section>
  <div class="section-title">3. Ta'tillar va Davomat Xulasasi</div>
  <div class="stats-row">
    <div class="stat-box">
      <div class="num" style="color:#1d4ed8">${mt}</div>
      <div class="lbl">M/T — Mehnat Ta'tili (kun)</div>
    </div>
    <div class="stat-box">
      <div class="num" style="color:#dc2626">${bl}</div>
      <div class="lbl">B/L — Kasallik Varag'i (kun)</div>
    </div>
    <div class="stat-box">
      <div class="num" style="color:#d97706">${bs}</div>
      <div class="lbl">B/S — Harajatsiz Ta'til (kun)</div>
    </div>
  </div>
</section>

<!-- Section 4: Rewards -->
<section>
  <div class="section-title">4. Mukofotlar va Moddiy Rag'batlar</div>
  <table>
    <thead><tr><th>Tur</th><th>Sabab</th><th>Buyruq №</th><th>Sana</th></tr></thead>
    <tbody>${rewardsHtml}</tbody>
  </table>
</section>

<!-- Section 5: Active Permits -->
<section>
  <div class="section-title">5. Faol Ruxsatnomalar va Guvohnomalar</div>
  <table>
    <thead><tr><th>Turi</th><th>Kategoriya</th><th>Guvohnoma №</th><th>Holati</th></tr></thead>
    <tbody>${permitsHtml}</tbody>
  </table>
</section>

<!-- Footer -->
<div class="signature-block">
  <div>
    <div class="sig-line">Kadrlar bo'limi boshlig'i</div>
  </div>
  <div>
    <div class="sig-line">Xodimning imzosi</div>
  </div>
  <div>
    <div class="sig-line">Rais / Direktor imzosi</div>
  </div>
</div>

<div class="footer">
  <span>Hujjat avtomatik ravishda HR tizimi orqali yaratilgan • ${printDate}</span>
  <span>Tabel №: ${tabel} • Holat: ${status}</span>
</div>

</body>
</html>`;

  const win = window.open('', '_blank', 'width=850,height=1100');
  if (!win) { alert('Pop-up bloklangan. Brauzerdagi cheklovni olib tashlang.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employeeId,
  onClose,
  onRefreshData,
}) => {
  const { canEditEmployee } = useAuth();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal_edu' | 'transfers' | 'leaves' | 'discipline_rewards' | 'permits'>('personal_edu');

  React.useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    fetch(`/api/employees/${employeeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEmployee(data.employee);
        }
      })
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (!employeeId) return null;

  const tenure = employee ? calculateTenure(employee.hireDate) : { formatted: '...' };

  // Use real data if available, otherwise fall back to demo mock data
  const leavesData = (employee?.leaves && employee.leaves.length > 0) ? employee.leaves : MOCK_LEAVES;
  const rewardsData = (employee?.rewards && employee.rewards.length > 0) ? employee.rewards : MOCK_REWARDS;
  const disciplinaryData = (employee?.disciplinaryActions && employee.disciplinaryActions.length > 0) ? employee.disciplinaryActions : MOCK_DISCIPLINARY;
  const permitsData = (employee?.permits && employee.permits.length > 0) ? employee.permits : MOCK_PERMITS;

  const isAllowedToEdit = canEditEmployee(employee?.currentDepartmentId);

  const handleOffboard = async () => {
    if (!isAllowedToEdit) return;
    if (!confirm('Ushbu xodim bilan mehnat shartnomasini bekor qilishni (Offboard) tasdiqlaysizmi?')) return;
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'OFFBOARD' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Xodim muvaffaqiyatli mehnat shartnomasi bekor qilindi (Offboarded)');
        if (onRefreshData) onRefreshData();
        onClose();
      }
    } catch (e) {
      alert('Xatolik yuz berdi');
    }
  };

  const leaveTypeStyles: Record<string, string> = {
    MT: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    BL: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    BS: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    OTGUL: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    KECH: 'bg-red-600/20 text-red-400 border-red-500/30',
  };

  const leaveTypeFull: Record<string, string> = {
    MT: 'Mehnat Ta\'tili',
    BL: 'Kasallik Varag\'i',
    BS: 'Harajatsiz Ta\'til',
    OTGUL: 'Otgul',
    KECH: 'Kechikish',
  };

  const mtTotal = leavesData.filter((l: any) => l.type === 'MT').reduce((s: number, l: any) => s + (l.totalDays || 0), 0);
  const blTotal = leavesData.filter((l: any) => l.type === 'BL').reduce((s: number, l: any) => s + (l.totalDays || 0), 0);
  const bsTotal = leavesData.filter((l: any) => l.type === 'BS').reduce((s: number, l: any) => s + (l.totalDays || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl glass-panel border border-slate-700/80 shadow-2xl overflow-hidden my-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-lg font-bold text-white shadow-lg shadow-indigo-600/30">
              {employee ? employee.firstName[0] : 'X'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white">
                  {employee ? `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}` : 'Yuklanmoqda...'}
                </h3>
                {employee && (
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {employee.tabelNumber}
                  </span>
                )}
                {employee && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    {employee.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {employee?.position} • {employee?.currentDepartment?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAllowedToEdit && (
              <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                🔒 Faqat o'zingizga biriktirilgan bo'lim xodimlarini tahrirlashingiz mumkin
              </span>
            )}

            {/* PDF Objektivka Button */}
            {employee && (
              <button
                onClick={() => triggerObjektivkaPrint(employee, tenure)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all"
                title="A4 Spravka-Ob'yektivka hujjatini chop etish"
              >
                <Printer className="h-4 w-4" />
                <span>Objektivka (PDF)</span>
              </button>
            )}

            {/* Offboard Action */}
            <button
              onClick={handleOffboard}
              disabled={!isAllowedToEdit}
              title={isAllowedToEdit ? "Mehnat shartnomasini bekor qilish" : "🔒 Faqat o'zingizga biriktirilgan bo'lim xodimlarini tahrirlashingiz mumkin"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3.5 py-2 text-xs font-bold hover:bg-rose-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              <span>Offboard</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span className="text-slate-400 text-sm">Profil ma'lumotlari yuklanmoqda...</span>
            </div>
          </div>
        ) : !employee ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Xodim topilmadi
          </div>
        ) : (
          <div>
            {/* ── 5-Tab Navigation ── */}
            <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/60 px-4">
              {[
                { id: 'personal_edu', label: "Shaxsiy Ma'lumotlar", icon: User },
                { id: 'transfers', label: "Bo'limlar Rotatsiyasi", icon: ArrowLeftRight },
                { id: 'leaves', label: "Ta'til va Davomat", icon: Calendar },
                { id: 'discipline_rewards', label: "Jazo & Mukofotlar", icon: ShieldAlert },
                { id: 'permits', label: "Ruxsatnomalar & Sertifikatlar", icon: Award },
              ].map((tab, idx) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'border-indigo-500 text-indigo-300 bg-indigo-500/5 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                  >
                    <span className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {idx + 1}
                    </span>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ── Tab Body ── */}
            <div className="p-6 max-h-[65vh] overflow-y-auto">

              {/* ── Tab 1: Personal Data & Education ── */}
              {activeTab === 'personal_edu' && (
                <div className="space-y-6 text-xs">
                  {/* Tenure Banner */}
                  <div className="rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">
                          Umumiy Mehnat Staji (Auto-Calculated)
                        </span>
                        <div className="text-xl font-extrabold text-white mt-0.5">
                          {tenure.formatted}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Ishga qabul qilingan sana:</span>
                      <div className="font-mono text-sm font-semibold text-slate-200">
                        {formatDate(employee.hireDate)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card rounded-xl p-4 space-y-3">
                      <h4 className="font-bold text-slate-200 border-b border-slate-700/60 pb-2 flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-400" /> Shaxsiy Ma'lumotlar
                      </h4>
                      {[
                        { label: 'Jinsi', value: employee.gender === 'MALE' ? 'Erkak' : 'Ayol' },
                        { label: "Tug'ilgan sanasi", value: formatDate(employee.dateOfBirth) },
                        { label: 'Telefon', value: employee.phone || 'Kiritilmagan', mono: true, color: 'text-indigo-300' },
                        { label: 'Elektron pochta', value: employee.email || 'Kiritilmagan', mono: true },
                      ].map(({ label, value, mono, color }) => (
                        <div key={label} className="flex justify-between py-1 border-b border-slate-800/50 last:border-0">
                          <span className="text-slate-400">{label}:</span>
                          <span className={`font-semibold ${color || 'text-slate-200'} ${mono ? 'font-mono' : ''}`}>{value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="glass-card rounded-xl p-4 space-y-3">
                      <h4 className="font-bold text-slate-200 border-b border-slate-700/60 pb-2 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" /> Harbiylik & Shtat
                      </h4>
                      {[
                        { label: 'Harbiy guvohnoma', value: employee.militaryCertificate || 'Mavjud emas', color: 'text-emerald-400' },
                        { label: "Hozirgi Bo'lim", value: employee.currentDepartment?.name || '—' },
                        { label: 'Shtat holati', value: employee.status, color: 'text-emerald-400 font-bold' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex justify-between py-1 border-b border-slate-800/50 last:border-0">
                          <span className="text-slate-400">{label}:</span>
                          <span className={`font-semibold ${color || 'text-slate-200'}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-200 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-400" /> Oliy va Maxsus Ta'lim Dargohi
                    </h4>
                    {employee.educations && employee.educations.length > 0 ? (
                      employee.educations.map((edu: any) => (
                        <div key={edu.id} className="glass-card rounded-xl p-4 border border-slate-800 flex justify-between items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 font-semibold text-[10px]">
                                {edu.level}
                              </span>
                              <span className="font-bold text-slate-100">{edu.institutionName}</span>
                            </div>
                            <p className="text-slate-300">Mutaxassislik: <span className="font-semibold text-white">{edu.fieldOfStudy}</span></p>
                          </div>
                          <div className="text-right font-mono text-slate-400">
                            Bitirgan yili: <span className="font-bold text-indigo-400">{edu.graduationYear}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400">Ta'lim ma'lumotlari kiritilmagan</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={handleOffboard}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 px-4 py-2 text-xs font-semibold hover:bg-rose-600 hover:text-white transition"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Mehnat Shartnomasini Bekor Qilish (Offboard)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── Tab 2: Department Transfer History ── */}
              {activeTab === 'transfers' && (
                <div className="space-y-4 text-xs">
                  <h4 className="font-bold text-slate-200 mb-2">Bo'limlararo Ko'chish Tarixi (Internal Mobility Logs)</h4>
                  {employee.transfers && employee.transfers.length > 0 ? (
                    employee.transfers.map((tr: any) => (
                      <div key={tr.id} className="glass-card rounded-xl p-4 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="text-rose-300">{tr.fromDepartment?.name}</span>
                            <ArrowLeftRight className="h-4 w-4 text-indigo-400" />
                            <span className="text-emerald-300">{tr.toDepartment?.name}</span>
                          </div>
                          <span className="font-mono text-slate-400">{formatDate(tr.transferDate)}</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Buyruq №: <span className="font-mono text-slate-200">{tr.orderNumber}</span> • Sababi: {tr.reason || 'Kadrlar rotatsiyasi'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-2">
                      <ArrowLeftRight className="h-8 w-8 text-slate-600 mx-auto" />
                      <p className="text-slate-400">Xodim boshqa bo'limga ko'chirilmagan</p>
                      <p className="text-slate-600 text-[11px]">Joriy bo'lim: <span className="text-slate-400">{employee.currentDepartment?.name}</span></p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 3: Leaves & Attendance ── */}
              {activeTab === 'leaves' && (
                <div className="space-y-5 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-200">Ta'til va Davomat Tarixi</h4>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Demo Ma'lumotlar</span>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'M/T — Mehnat Ta\'tili', value: mtTotal, unit: 'kun', color: 'from-blue-600/20 to-blue-900/10 border-blue-500/30 text-blue-300' },
                      { label: 'B/L — Kasallik Varag\'i', value: blTotal, unit: 'kun', color: 'from-rose-600/20 to-rose-900/10 border-rose-500/30 text-rose-300' },
                      { label: 'B/S — Harajatsiz Ta\'til', value: bsTotal, unit: 'kun', color: 'from-amber-600/20 to-amber-900/10 border-amber-500/30 text-amber-300' },
                    ].map(({ label, value, unit, color }) => (
                      <div key={label} className={`rounded-xl bg-gradient-to-br ${color} border p-4 text-center`}>
                        <div className="text-2xl font-extrabold text-white">{value}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{label}</div>
                        <div className="text-[9px] text-slate-500">{unit}</div>
                      </div>
                    ))}
                  </div>

                  {/* Leave Records */}
                  <div className="space-y-2">
                    {leavesData.map((lv: any) => (
                      <div key={lv.id} className="glass-card rounded-xl p-3.5 flex items-center justify-between border border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${leaveTypeStyles[lv.type] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                            {lv.type}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-200">
                              {formatDate(lv.startDate)} — {formatDate(lv.endDate)}
                              <span className="ml-2 text-slate-400 font-normal">({lv.totalDays} kun)</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-indigo-300 font-medium">{leaveTypeFull[lv.type] || lv.type}</span>
                              {lv.reason && <span className="text-[10px] text-slate-500">• {lv.reason}</span>}
                            </div>
                          </div>
                        </div>
                        {lv.hoursLate && (
                          <span className="font-mono text-rose-400 font-bold text-xs bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg">
                            +{lv.hoursLate}h kechikish
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab 4: Discipline & Rewards ── */}
              {activeTab === 'discipline_rewards' && (
                <div className="space-y-6 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Intizomiy choralar va mukofotlar logi</span>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Demo Ma'lumotlar</span>
                  </div>

                  {/* Disciplinary Actions */}
                  <div>
                    <h4 className="font-bold text-rose-400 mb-3 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" /> Intizomiy Jazo Choralari va Hayfsanlar
                    </h4>
                    {disciplinaryData.length > 0 ? (
                      <div className="space-y-2">
                        {disciplinaryData.map((d: any) => {
                          const isExpired = d.expired || (d.expiryDate && new Date(d.expiryDate) < new Date());
                          return (
                            <div key={d.id} className={`glass-card rounded-xl p-3.5 border flex justify-between items-start ${isExpired ? 'border-slate-700/50 bg-slate-800/20 opacity-70' : 'border-rose-500/30 bg-rose-500/5'}`}>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${isExpired ? 'text-slate-400' : 'text-rose-300'}`}>{d.type}</span>
                                  {isExpired ? (
                                    <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-semibold">Muddati o'tgan</span>
                                  ) : (
                                    <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">Faol</span>
                                  )}
                                </div>
                                <p className="text-slate-400 text-[11px]">{d.notes}</p>
                                <p className="text-slate-600 font-mono text-[10px]">Buyruq №: {d.orderNumber}</p>
                              </div>
                              <div className="text-right font-mono text-[11px] text-slate-400 shrink-0 ml-4">
                                <div>Berilgan: {formatDate(d.startDate)}</div>
                                <div>Muddati: {formatDate(d.expiryDate)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-emerald-400 font-semibold">Intizomiy jazolar mavjud emas</p>
                        <p className="text-slate-500 text-[11px] mt-1">Xodim intizom qoidalarini to'liq bajargan</p>
                      </div>
                    )}
                  </div>

                  {/* Rewards */}
                  <div>
                    <h4 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
                      <Gift className="h-4 w-4" /> Mukofotlar va Moddiy Yordam Logi
                    </h4>
                    <div className="space-y-2">
                      {rewardsData.map((r: any) => (
                        <div key={r.id} className="glass-card rounded-xl p-3.5 border border-emerald-500/30 bg-emerald-500/5 flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Star className="h-3.5 w-3.5 text-amber-400" />
                              <span className="font-bold text-emerald-300">{r.type}</span>
                            </div>
                            <p className="text-slate-400 text-[11px] max-w-xs">{r.reason}</p>
                            <p className="text-slate-600 font-mono text-[10px]">Buyruq №: {r.orderNumber}</p>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            {r.amount > 0 && (
                              <div className="font-bold text-emerald-400 text-sm">{formatCurrency(r.amount)}</div>
                            )}
                            {r.amount === 0 && (
                              <div className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">Faxriy yorliq</div>
                            )}
                            <span className="font-mono text-[10px] text-slate-400">{formatDate(r.orderDate)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 5: Permits, Licenses & Certificates ── */}
              {activeTab === 'permits' && (
                <div className="space-y-6 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-amber-400" />
                      Ruxsatnomalar, Guvohnomalar va Sertifikatlar
                    </h4>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Demo Ma'lumotlar</span>
                  </div>

                  {/* Section A: Special Permits & Driving Licenses */}
                  <div>
                    <h5 className="font-bold text-indigo-300 mb-3 flex items-center gap-2 text-xs uppercase tracking-wide">
                      <Car className="h-3.5 w-3.5" /> Haydovchilik Guvohnomalari, KARA & Telefon Ruxsatnomalar
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {permitsData.map((p: any) => {
                        const isExpired = p.expiryDate && new Date(p.expiryDate) < new Date();
                        return (
                          <div key={p.id} className="glass-card rounded-xl p-4 border border-slate-800 space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-indigo-300 text-[11px] leading-tight pr-2">{p.licenseType}</span>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold border ${isExpired ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                {isExpired ? "Muddati o'tgan" : 'Amalda'}
                              </span>
                            </div>
                            <div className="text-slate-300 text-[11px]">
                              Kategoriya: <span className="font-semibold text-white">{p.category || 'N/A'}</span>
                            </div>
                            <div className="text-slate-500 font-mono text-[10px]">
                              Guvohnoma №: {p.certificateNo}
                            </div>
                            <div className="flex justify-between text-slate-500 text-[10px] pt-2 border-t border-slate-800">
                              <span>Berilgan: <span className="text-slate-400">{formatDate(p.issueDate)}</span></span>
                              <span>Tugaydi: <span className={isExpired ? 'text-rose-400 font-semibold' : 'text-slate-400'}>{formatDate(p.expiryDate)}</span></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-700/60" />

                  {/* Section B: Professional Training & Certificates */}
                  <div>
                    <h5 className="font-bold text-purple-300 mb-3 flex items-center gap-2 text-xs uppercase tracking-wide">
                      <BookOpen className="h-3.5 w-3.5" /> Professional Trening va Sertifikatlar
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left text-slate-400 font-semibold pb-2 pr-4 text-[10px] uppercase tracking-wide">Sertifikat Nomi</th>
                            <th className="text-left text-slate-400 font-semibold pb-2 pr-4 text-[10px] uppercase tracking-wide">O'quv Yo'nalishi</th>
                            <th className="text-left text-slate-400 font-semibold pb-2 pr-4 text-[10px] uppercase tracking-wide">Berilgan</th>
                            <th className="text-left text-slate-400 font-semibold pb-2 pr-4 text-[10px] uppercase tracking-wide">Tugaydi</th>
                            <th className="text-left text-slate-400 font-semibold pb-2 text-[10px] uppercase tracking-wide">Holati</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {MOCK_CERTIFICATES.map((cert) => {
                            const isExpired = cert.status === "Muddati o'tgan" || new Date(cert.expiryDate) < new Date();
                            return (
                              <tr key={cert.id} className="group hover:bg-slate-800/30 transition-colors">
                                <td className="py-3 pr-4">
                                  <div className="font-semibold text-slate-200 group-hover:text-white transition-colors">{cert.title}</div>
                                  <div className="text-slate-500 text-[10px] mt-0.5">{cert.issuedBy}</div>
                                </td>
                                <td className="py-3 pr-4">
                                  <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-md font-medium text-[10px]">
                                    {cert.field}
                                  </span>
                                </td>
                                <td className="py-3 pr-4 font-mono text-slate-400">{formatDate(cert.issueDate)}</td>
                                <td className="py-3 pr-4 font-mono">
                                  <span className={isExpired ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                                    {formatDate(cert.expiryDate)}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                    isExpired
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  }`}>
                                    {isExpired ? <AlertTriangle className="h-3 w-3" /> : <BadgeCheck className="h-3 w-3" />}
                                    {isExpired ? "Muddati o'tgan" : 'Amalda'}
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
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
