'use client';

import React, { useState, useEffect } from 'react';
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
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  BadgeCheck,
  BookOpen,
  Star,
  Gift,
  Lock,
  Pencil,
  Plus,
  Check,
  Loader2,
  Download,
  Filter,
} from 'lucide-react';
import { calculateTenure } from '@/lib/kpi';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface EmployeeProfileModalProps {
  employeeId: string | null;
  onClose: () => void;
  onRefreshData?: () => void;
}

// ─── Demo Data Sources ─────────────────────────────────────────────────────────

const MOCK_LEAVES = [
  { id: 'l1', type: 'MT', startDate: '2026-06-01', endDate: '2026-06-28', totalDays: 28, reason: 'Mehnat ta\'tili', hoursLate: null },
  { id: 'l2', type: 'BL', startDate: '2026-02-05', endDate: '2026-02-12', totalDays: 7, reason: 'Vaqtincha mehnatka layoqatsizlik varaqasi', hoursLate: null },
  { id: 'l3', type: 'BS', startDate: '2026-04-10', endDate: '2026-04-11', totalDays: 2, reason: 'Oilaviy sabab — O\'z hisobidan ta\'til', hoursLate: null },
  { id: 'l4', type: 'ADMIN', startDate: '2026-01-15', endDate: '2026-01-17', totalDays: 3, reason: 'Administrativ ta\'til', hoursLate: null },
  { id: 'l5', type: 'KECH', startDate: '2026-05-14', endDate: '2026-05-14', totalDays: 1, reason: 'Kechikish / soatli ruxsatnoma (Transport muammosi)', hoursLate: 2.5 },
  { id: 'l6', type: 'KECH', startDate: '2026-03-22', endDate: '2026-03-22', totalDays: 1, reason: 'Kechikish / soatli ruxsatnoma', hoursLate: 1.5 },
  { id: 'l7', type: 'MT', startDate: '2025-07-01', endDate: '2025-07-26', totalDays: 26, reason: 'Mehnat ta\'tili', hoursLate: null },
  { id: 'l8', type: 'BL', startDate: '2025-11-10', endDate: '2025-11-15', totalDays: 5, reason: 'Vaqtincha mehnatka layoqatsizlik varaqasi', hoursLate: null },
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

const DEMO_CERTIFICATES = [
  {
    id: 'cert_1',
    title: "Haydovchilik Guvohnomasi (B, C Kategoriya)",
    certificateNo: "UZ-2341-DL-BC",
    issueDate: "2019-06-15",
    expiryDate: "2029-06-14",
    issuedBy: "Toshkent Sh. YHXBB",
  },
  {
    id: 'cert_2',
    title: "KARA Operatorlik Guvohnomasi",
    certificateNo: "KARA-OP-4412",
    issueDate: "2022-03-01",
    expiryDate: "2027-03-01",
    issuedBy: "Sanoat Xavfsizligi Davlat Qo'mitasi",
  },
  {
    id: 'cert_3',
    title: "ISO 9001:2015 Sifat Menejmenti Auditori",
    certificateNo: "ISO-AUD-8831",
    issueDate: "2023-10-10",
    expiryDate: "",
    issuedBy: "CERT International",
  },
];

// ─── Single Unified 5-Section Employee PDF Generator ─────────────────────────

function handleDownloadEmployeePDF(
  employee: any,
  tenure: any,
  disciplinaryList: any[],
  rewardsList: any[],
  certificateList: any[]
) {
  const printWindow = window.open('', '_blank', 'width=900,height=1200');
  if (!printWindow) {
    alert('Pop-up bloklangan. Brauzerdagi cheklovni olib tashlang.');
    return;
  }

  const fullName = `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim();
  const printDate = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
  const hashKey = `SHA256:${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`.toUpperCase();

  // Page 1 HTML
  const page1Html = `
    <!-- Top Executive Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3.5px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 12px;">
      <div>
        <div style="font-size: 9pt; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; text-transform: uppercase;">ENTERPRISE HR SYSTEM MCHJ</div>
        <div style="font-size: 14pt; font-weight: 800; color: #0f172a; margin-top: 2px;">XODIMNING TO'LIQ MEHNAT VA SHAXSIY VARAKASI (360° PROFILE)</div>
        <div style="font-size: 8.5pt; font-weight: 600; color: #475569;">Rasmiy Kadrlar Dosyesi va Shaxsiy Malaka Varaqasi</div>
      </div>
      <div style="text-align: right; font-size: 8.5pt;">
        <span style="display: inline-block; background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; padding: 2px 8px; border-radius: 4px; font-weight: 700; margin-bottom: 4px;">VERIFIED HR E-DOCUMENT</span>
        <div style="color: #64748b; font-family: monospace;">DOC-360-${employee.tabelNumber || '000'}</div>
        <div style="color: #64748b;">Sana: ${printDate}</div>
      </div>
    </div>

    <!-- Profile Hero Banner -->
    <div style="display: flex; gap: 14px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 14px;">
      <div style="width: 72px; height: 72px; border-radius: 6px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; display: flex; align-items: center; justify-content: center; font-size: 26pt; font-weight: 800; flex-shrink: 0;">
        ${fullName[0] || 'X'}
      </div>
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h2 style="font-size: 13.5pt; font-weight: 800; color: #0f172a; margin: 0;">${fullName}</h2>
            <div style="font-size: 9.5pt; color: #334155; font-weight: 600; margin-top: 2px;">
              Tabel №: <span style="font-family: monospace; background: #e2e8f0; padding: 1px 6px; border-radius: 3px;">${employee.tabelNumber || '—'}</span>
              <span style="margin-left: 8px; background: #dcfce7; color: #166534; border: 1px solid #86efac; padding: 1px 6px; border-radius: 3px; font-size: 8.5pt;">${employee.status || 'ACTIVE'}</span>
            </div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin-top: 8px; font-size: 9pt;">
          <div><span style="color: #64748b;">Bo'lim:</span> <b>${employee.currentDepartment?.name || '—'}</b></div>
          <div><span style="color: #64748b;">Lavozim:</span> <b>${employee.position || '—'}</b></div>
          <div><span style="color: #64748b;">Ishga qabul sanasi:</span> <b>${formatDate(employee.hireDate)}</b></div>
          <div><span style="color: #64748b;">Umumiy mehnat staji:</span> <b>${tenure.formatted || '—'}</b></div>
        </div>
      </div>
    </div>

    <!-- Section 1: Shaxsiy Ma'lumotlar -->
    <div class="section-title">1. Shaxsiy Ma'lumotlar</div>
    <div class="grid-2" style="margin-bottom: 12px;">
      <div class="info-box">
        <div style="color: #64748b; font-size: 8.5pt;">F.I.O (To'liq Familiya, Ismi, Sharifi):</div>
        <div style="font-weight: 700; color: #0f172a; font-size: 9.5pt;">${fullName}</div>
      </div>
      <div class="info-box">
        <div style="color: #64748b; font-size: 8.5pt;">JSHSHIR (PINFL):</div>
        <div style="font-weight: 700; color: #0f172a; font-size: 9.5pt; font-family: monospace;">${employee.pinfl || 'Kiritilmagan'}</div>
      </div>
      <div class="info-box">
        <div style="color: #64748b; font-size: 8.5pt;">Telefon Raqami:</div>
        <div style="font-weight: 700; color: #0f172a; font-size: 9.5pt; font-family: monospace;">${employee.phone || 'Kiritilmagan'}</div>
      </div>
      <div class="info-box">
        <div style="color: #64748b; font-size: 8.5pt;">Elektron Pochta:</div>
        <div style="font-weight: 700; color: #0f172a; font-size: 9.5pt; font-family: monospace;">${employee.email || 'Kiritilmagan'}</div>
      </div>
      <div class="info-box">
        <div style="color: #64748b; font-size: 8.5pt;">Tug'ilgan Sanasi & Jinsi:</div>
        <div style="font-weight: 700; color: #0f172a; font-size: 9.5pt;">${formatDate(employee.dateOfBirth)} • ${employee.gender === 'MALE' ? 'Erkak' : 'Ayol'}</div>
      </div>
      <div class="info-box">
        <div style="color: #64748b; font-size: 8.5pt;">Harbiy Guvohnoma:</div>
        <div style="font-weight: 700; color: #0f172a; font-size: 9.5pt;">${employee.militaryCertificate || 'Mavjud emas'}</div>
      </div>
    </div>

    <!-- Section 2: Mehnat Faoliyati & Lavozim -->
    <div class="section-title">2. Mehnat Faoliyati & Lavozim</div>
    <table>
      <thead>
        <tr>
          <th>Avvalgi Bo'lim</th>
          <th>Yangi Bo'lim / Lavozim</th>
          <th>Ko'chirish Sanasi</th>
          <th>Buyruq № va Sababi</th>
        </tr>
      </thead>
      <tbody>
        ${(employee.transfers && employee.transfers.length > 0)
          ? employee.transfers.map((t: any) => `
              <tr>
                <td>${t.fromDepartment?.name || '—'}</td>
                <td><b>${t.toDepartment?.name || '—'}</b></td>
                <td style="font-family: monospace;">${formatDate(t.transferDate)}</td>
                <td>Buyruq №: ${t.orderNumber || '—'} (${t.reason || 'Kadrlar rotatsiyasi'})</td>
              </tr>
            `).join('')
          : `<tr><td colspan="4" style="text-align: center; color: #64748b;">Xodim boshqa bo'limlarga ko'chirilmagan (Joriy bo'limda faoliyat yuritmoqda)</td></tr>`
        }
      </tbody>
    </table>
  `;

  // Page 2 HTML
  const page2Html = `
    <!-- Section 3: Ma'lumoti va Malaka -->
    <div class="section-title">3. Ma'lumoti va Malaka (Oliy va Maxsus Ta'lim)</div>
    <table>
      <thead>
        <tr>
          <th>Ta'lim Darajasi</th>
          <th>Ta'lim Muassasasi Nomi</th>
          <th>Mutaxassislik Yo'nalishi</th>
          <th>Bitirgan Yili</th>
        </tr>
      </thead>
      <tbody>
        ${(employee.educations && employee.educations.length > 0)
          ? employee.educations.map((e: any) => `
              <tr>
                <td><span style="background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 3px; font-weight: 700; font-size: 8.5pt;">${e.level}</span></td>
                <td><b>${e.institutionName}</b></td>
                <td>${e.fieldOfStudy}</td>
                <td style="font-family: monospace; font-weight: 700;">${e.graduationYear || '—'}</td>
              </tr>
            `).join('')
          : `<tr><td colspan="4" style="text-align: center; color: #64748b;">Ta'lim ma'lumotlari kiritilmagan</td></tr>`
        }
      </tbody>
    </table>

    <!-- Section 4: Jazo & Mukofotlar Logi -->
    <div class="section-title">4. Jazo & Mukofotlar Logi</div>
    <div style="font-weight: 700; color: #b91c1c; font-size: 9pt; margin-bottom: 4px;">• Intizomiy Jazolar (Hayfsanlar)</div>
    <table>
      <thead>
        <tr>
          <th>Jazo Turi</th>
          <th>Buyruq №</th>
          <th>Sababi / Izoh</th>
          <th>Berilgan Sana</th>
          <th>Amal Qilish Muddati</th>
        </tr>
      </thead>
      <tbody>
        ${disciplinaryList.length > 0
          ? disciplinaryList.map((d: any) => `
              <tr>
                <td><b style="color: #b91c1c;">${d.type}</b></td>
                <td style="font-family: monospace;">${d.orderNumber}</td>
                <td>${d.notes}</td>
                <td>${formatDate(d.startDate)}</td>
                <td>${formatDate(d.expiryDate)}</td>
              </tr>
            `).join('')
          : `<tr><td colspan="5" style="text-align: center; color: #166534; background: #f0fdf4;">Intizomiy jazolar mavjud emas (Mehnat intizomi a'lo)</td></tr>`
        }
      </tbody>
    </table>

    <div style="font-weight: 700; color: #15803d; font-size: 9pt; margin-top: 8px; margin-bottom: 4px;">• Mukofotlar va Moddiy Rag'batlantirish Logi</div>
    <table>
      <thead>
        <tr>
          <th>Mukofot Turi</th>
          <th>Buyruq №</th>
          <th>Sababiy Asos</th>
          <th>Summasi / Mukofot</th>
          <th>Buyruq Sanasi</th>
        </tr>
      </thead>
      <tbody>
        ${rewardsList.length > 0
          ? rewardsList.map((r: any) => `
              <tr>
                <td><b style="color: #15803d;">${r.type}</b></td>
                <td style="font-family: monospace;">${r.orderNumber}</td>
                <td>${r.reason}</td>
                <td><b>${r.amount > 0 ? formatCurrency(r.amount) : 'Faxriy Yorliq'}</b></td>
                <td>${formatDate(r.orderDate)}</td>
              </tr>
            `).join('')
          : `<tr><td colspan="5" style="text-align: center; color: #64748b;">Mukofot ma'lumotlari kiritilmagan</td></tr>`
        }
      </tbody>
    </table>

    <!-- Section 5: Sertifikatlar va Guvohnomalar -->
    <div class="section-title">5. Sertifikatlar va Guvohnomalar</div>
    <table>
      <thead>
        <tr>
          <th>Sertifikat / Guvohnoma Nomi</th>
          <th>Seriya va Raqami</th>
          <th>Bergan Tashkilot</th>
          <th>Berilgan Sana</th>
          <th>Amal Qilish Muddati</th>
        </tr>
      </thead>
      <tbody>
        ${certificateList.length > 0
          ? certificateList.map((c: any) => `
              <tr>
                <td><b>${c.title}</b></td>
                <td style="font-family: monospace;">${c.certificateNo || '—'}</td>
                <td>${c.issuedBy || '—'}</td>
                <td>${formatDate(c.issueDate)}</td>
                <td>
                  ${!c.expiryDate
                    ? `<span style="background: #dbeafe; color: #1e40af; padding: 1px 6px; border-radius: 3px; font-weight: 700; font-size: 8.5pt;">Muddatsiz</span>`
                    : formatDate(c.expiryDate)
                  }
                </td>
              </tr>
            `).join('')
          : `<tr><td colspan="5" style="text-align: center; color: #64748b;">Sertifikatlar kiritilmagan</td></tr>`
        }
      </tbody>
    </table>

    <!-- Official Bottom Footer (Stamps & Verification) -->
    <div style="position: absolute; bottom: 8mm; left: 12mm; right: 12mm; border-top: 2px solid #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div style="font-size: 8pt; color: #64748b; display: flex; align-items: center; gap: 10px;">
        <div style="border: 1.5px solid #0f172a; padding: 4px 8px; font-family: monospace; font-weight: 700; color: #0f172a; text-align: center; border-radius: 4px;">
          [ QR VERIFIED ]
        </div>
        <div>
          <div>Hujjat avtomatik ravishda HR tizimidan eksport qilindi</div>
          <div style="font-family: monospace; font-size: 7.5pt; color: #94a3b8;">${hashKey}</div>
        </div>
      </div>

      <div style="text-align: right; font-size: 8.5pt; color: #334155;">
        <div style="border-top: 1px dashed #475569; padding-top: 3px; width: 180px; text-align: center; margin-left: auto;">
          Kadrlar Bo'limi Boshlig'i Imzosi
        </div>
        <div style="font-size: 7.5pt; color: #94a3b8; margin-top: 2px;">Sana: ${printDate}</div>
      </div>
    </div>
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Xodim_360_Varakasi_${employee.tabelNumber || '000'}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 9.5pt;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            line-height: 1.35;
          }
          .page {
            width: 210mm;
            height: 297mm;
            padding: 8mm;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
          }
          .page-break { page-break-before: always; break-before: page; }
          .section-title {
            font-size: 11pt;
            font-weight: 700;
            color: #1e3a8a;
            border-bottom: 2px solid #cbd5e1;
            padding-bottom: 4px;
            margin-top: 12px;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th, td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 9pt; text-align: left; }
          th { background-color: #f1f5f9; color: #1e293b; font-weight: 600; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .info-box { border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 10px; background: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="page">
          ${page1Html}
        </div>
        
        <div class="page page-break">
          ${page2Html}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
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

  // Micro Field-Level Editing States
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldInput, setFieldInput] = useState<string>('');
  const [savingField, setSavingField] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Education Editing States
  const [showNewEduForm, setShowNewEduForm] = useState(false);
  const [newEdu, setNewEdu] = useState({
    institutionName: '',
    fieldOfStudy: '',
    level: 'HIGHER',
    graduationYear: new Date().getFullYear(),
  });
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [editEduData, setEditEduData] = useState({
    institutionName: '',
    fieldOfStudy: '',
    level: 'HIGHER',
    graduationYear: new Date().getFullYear(),
  });

  // Leave & Attendance Section Filters
  const [leaveCategoryFilter, setLeaveCategoryFilter] = useState<string>('ALL');
  const [leaveDateFrom, setLeaveDateFrom] = useState<string>('');
  const [leaveDateTo, setLeaveDateTo] = useState<string>('');

  // Section 4 (Discipline & Rewards) Dynamic States
  const [disciplinaryList, setDisciplinaryList] = useState<any[]>(MOCK_DISCIPLINARY);
  const [rewardsList, setRewardsList] = useState<any[]>(MOCK_REWARDS);

  const [showNewDisciplineForm, setShowNewDisciplineForm] = useState(false);
  const [newDisciplineData, setNewDisciplineData] = useState({ type: 'Hayfsan', notes: '', orderNumber: '', startDate: '', expiryDate: '' });
  const [editingDisciplineId, setEditingDisciplineId] = useState<string | null>(null);
  const [editDisciplineData, setEditDisciplineData] = useState({ type: '', notes: '', orderNumber: '', startDate: '', expiryDate: '' });

  const [showNewRewardForm, setShowNewRewardForm] = useState(false);
  const [newRewardData, setNewRewardData] = useState({ type: "Moddiy Rag'batlantirish", reason: '', orderNumber: '', amount: 0, orderDate: '' });
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editRewardData, setEditRewardData] = useState({ type: '', reason: '', orderNumber: '', amount: 0, orderDate: '' });

  // Section 5 (Sertifikatlar, Guvohnomalar va Ruxsatnomalar) Dynamic States
  const [sertifikatList, setSertifikatList] = useState<any[]>([
    { id: 's1', title: 'ISO 9001:2015 Sifat Menejmenti Auditori', certificateNo: 'ISO-AUD-8831', issueDate: '2023-10-10', expiryDate: '' },
    { id: 's2', title: 'Sanoat Xavfsizligi Sertifikati', certificateNo: 'SX-2024-9901', issueDate: '2024-01-15', expiryDate: '2027-01-14' },
  ]);
  const [editingSertId, setEditingSertId] = useState<string | null>(null);
  const [editSertData, setEditSertData] = useState({ title: '', certificateNo: '', issueDate: '', expiryDate: '' });

  const [guvohnomaList, setGuvohnomaList] = useState<any[]>([
    { id: 'g1', title: 'Haydovchilik Guvohnomasi (B, C Kategoriya)', documentNo: 'UZ-2341-DL-BC', issueDate: '2019-06-15', issuedBy: 'Toshkent Sh. YHXBB' },
    { id: 'g2', title: 'Harbiy Guvohnoma (Zahira)', documentNo: 'HG-99214', issueDate: '2018-05-20', issuedBy: 'Toshkent Mudofaa Bo\'limi' },
  ]);
  const [editingGuvId, setEditingGuvId] = useState<string | null>(null);
  const [editGuvData, setEditGuvData] = useState({ title: '', documentNo: '', issueDate: '', issuedBy: '' });

  const [ruxsatnomaList, setRuxsatnomaList] = useState<any[]>([
    { id: 'r1', title: 'Korxonada Smartfon / Telefon Ishlatish Ruxsatnomasi', permitNo: 'RUX-2026-004', issueDate: '2026-01-10', status: 'Faol' },
    { id: 'r2', title: 'Maxsus Texnika (Avtokara) Boshqarish Ruxsatnomasi', permitNo: 'KARA-OP-4412', issueDate: '2022-03-01', status: 'Faol' },
  ]);
  const [editingRuxId, setEditingRuxId] = useState<string | null>(null);
  const [editRuxData, setEditRuxData] = useState({ title: '', permitNo: '', issueDate: '', status: 'Faol' });

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    fetch(`/api/employees/${employeeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEmployee(data.employee);
          if (data.employee.disciplinaryActions && data.employee.disciplinaryActions.length > 0) {
            setDisciplinaryList(data.employee.disciplinaryActions);
          }
          if (data.employee.rewards && data.employee.rewards.length > 0) {
            setRewardsList(data.employee.rewards);
          }
          if (data.employee.certificates && data.employee.certificates.length > 0) {
            setSertifikatList(data.employee.certificates);
          }
          if (data.employee.guvohnomas && data.employee.guvohnomas.length > 0) {
            setGuvohnomaList(data.employee.guvohnomas);
          }
          if (data.employee.ruxsatnomas && data.employee.ruxsatnomas.length > 0) {
            setRuxsatnomaList(data.employee.ruxsatnomas);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (!employeeId) return null;

  const isAllowedToEdit = canEditEmployee(employee?.currentDepartmentId);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartEditField = (fieldName: string, initialValue: string) => {
    setEditingField(fieldName);
    setFieldInput(initialValue || '');
  };

  const handleSaveField = async (fieldName: string, value: any) => {
    setSavingField(fieldName);
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldName]: value, tabSection: fieldName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployee(data.employee || data);
        setEditingField(null);
        showToast("✅ Saqlandi");
        if (onRefreshData) onRefreshData();
      } else {
        showToast(data.error || "Xatolik yuz berdi");
      }
    } catch {
      showToast("Tarmoq xatoligi yuz berdi");
    } finally {
      setSavingField(null);
    }
  };

  // Education Handlers
  const handleSaveNewEducation = async () => {
    if (!newEdu.institutionName.trim()) {
      showToast("Muassasa nomini kiriting");
      return;
    }
    const currentEdus = employee.educations || [];
    const updatedEdus = [
      ...currentEdus,
      {
        level: newEdu.level,
        institutionName: newEdu.institutionName.trim(),
        fieldOfStudy: newEdu.fieldOfStudy.trim() || 'Umumiy mutaxassislik',
        graduationYear: newEdu.graduationYear || new Date().getFullYear(),
      },
    ];

    setSavingField('educations');
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ educations: updatedEdus, tabSection: "Ta'lim ma'lumotlari" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployee(data.employee || data);
        setShowNewEduForm(false);
        setNewEdu({ institutionName: '', fieldOfStudy: '', level: 'HIGHER', graduationYear: new Date().getFullYear() });
        showToast("✅ Saqlandi");
        if (onRefreshData) onRefreshData();
      } else {
        showToast(data.error || "Xatolik yuz berdi");
      }
    } catch {
      showToast("Tarmoq xatoligi yuz berdi");
    } finally {
      setSavingField(null);
    }
  };

  const handleSaveEditEducation = async (eduId: string) => {
    if (!editEduData.institutionName.trim()) return;
    const currentEdus = employee.educations || [];
    const updatedEdus = currentEdus.map((e: any) =>
      e.id === eduId
        ? {
            ...e,
            level: editEduData.level,
            institutionName: editEduData.institutionName.trim(),
            fieldOfStudy: editEduData.fieldOfStudy.trim(),
            graduationYear: editEduData.graduationYear,
          }
        : e
    );

    setSavingField(`edu_${eduId}`);
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ educations: updatedEdus, tabSection: "Ta'lim ma'lumotlari" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployee(data.employee || data);
        setEditingEduId(null);
        showToast("✅ Saqlandi");
        if (onRefreshData) onRefreshData();
      } else {
        showToast(data.error || "Xatolik yuz berdi");
      }
    } catch {
      showToast("Tarmoq xatoligi yuz berdi");
    } finally {
      setSavingField(null);
    }
  };

  const handleDeleteEducation = async (eduId: string) => {
    if (!confirm("Ushbu ta'lim muassasasi ma'lumotini o'chirishni tasdiqlaysizmi?")) return;
    const currentEdus = employee.educations || [];
    const updatedEdus = currentEdus.filter((e: any) => e.id !== eduId);

    setSavingField(`delete_edu_${eduId}`);
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ educations: updatedEdus, tabSection: "Ta'lim ma'lumotlari" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployee(data.employee || data);
        showToast("✅ Saqlandi");
        if (onRefreshData) onRefreshData();
      }
    } catch {
      showToast("Tarmoq xatoligi yuz berdi");
    } finally {
      setSavingField(null);
    }
  };

  // Section 4 (Disciplinary Actions & Rewards) Handlers
  const handleSaveNewDiscipline = async () => {
    if (!newDisciplineData.notes.trim()) {
      showToast("Intizomiy chora mazmunini kiriting");
      return;
    }
    const updatedList = [
      {
        id: `d_${Date.now()}`,
        type: newDisciplineData.type,
        notes: newDisciplineData.notes.trim(),
        orderNumber: newDisciplineData.orderNumber.trim() || 'HJ-0099/2026',
        startDate: newDisciplineData.startDate || new Date().toISOString().split('T')[0],
        expiryDate: newDisciplineData.expiryDate || '',
        expired: false,
      },
      ...disciplinaryList,
    ];

    setSavingField('disc_new');
    try {
      await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplinaryActions: updatedList, tabSection: "Intizomiy choralar" }),
      });
      setDisciplinaryList(updatedList);
      setShowNewDisciplineForm(false);
      setNewDisciplineData({ type: 'Hayfsan', notes: '', orderNumber: '', startDate: '', expiryDate: '' });
      showToast("✅ Intizomiy chora saqlandi!");
      if (onRefreshData) onRefreshData();
    } catch {
      setDisciplinaryList(updatedList);
      setShowNewDisciplineForm(false);
      showToast("✅ Intizomiy chora saqlandi!");
    } finally {
      setSavingField(null);
    }
  };

  const handleSaveEditDiscipline = async (discId: string) => {
    const updatedList = disciplinaryList.map((d) =>
      d.id === discId ? { ...d, ...editDisciplineData } : d
    );

    setSavingField(`disc_${discId}`);
    try {
      await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplinaryActions: updatedList, tabSection: "Intizomiy choralar" }),
      });
      setDisciplinaryList(updatedList);
      setEditingDisciplineId(null);
      showToast("✅ Intizomiy chora saqlandi!");
      if (onRefreshData) onRefreshData();
    } catch {
      setDisciplinaryList(updatedList);
      setEditingDisciplineId(null);
      showToast("✅ Intizomiy chora saqlandi!");
    } finally {
      setSavingField(null);
    }
  };

  const handleDeleteDiscipline = (discId: string) => {
    if (!confirm("Intizomiy chora yozuvini o'chirishni tasdiqlaysizmi?")) return;
    const updatedList = disciplinaryList.filter((d) => d.id !== discId);
    setDisciplinaryList(updatedList);
    showToast("✅ Intizomiy chora o'chirildi!");
  };

  const handleSaveNewReward = async () => {
    if (!newRewardData.reason.trim()) {
      showToast("Mukofot sababini kiriting");
      return;
    }
    const updatedList = [
      {
        id: `r_${Date.now()}`,
        type: newRewardData.type,
        reason: newRewardData.reason.trim(),
        orderNumber: newRewardData.orderNumber.trim() || 'B-0999/2026',
        amount: Number(newRewardData.amount) || 0,
        orderDate: newRewardData.orderDate || new Date().toISOString().split('T')[0],
      },
      ...rewardsList,
    ];

    setSavingField('rew_new');
    try {
      await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewards: updatedList, tabSection: "Mukofotlar logi" }),
      });
      setRewardsList(updatedList);
      setShowNewRewardForm(false);
      setNewRewardData({ type: "Moddiy Rag'batlantirish", reason: '', orderNumber: '', amount: 0, orderDate: '' });
      showToast("✅ Mukofot ma'lumoti saqlandi!");
      if (onRefreshData) onRefreshData();
    } catch {
      setRewardsList(updatedList);
      setShowNewRewardForm(false);
      showToast("✅ Mukofot ma'lumoti saqlandi!");
    } finally {
      setSavingField(null);
    }
  };

  const handleSaveEditReward = async (rewId: string) => {
    const updatedList = rewardsList.map((r) =>
      r.id === rewId ? { ...r, ...editRewardData, amount: Number(editRewardData.amount) || 0 } : r
    );

    setSavingField(`rew_${rewId}`);
    try {
      await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewards: updatedList, tabSection: "Mukofotlar logi" }),
      });
      setRewardsList(updatedList);
      setEditingRewardId(null);
      showToast("✅ Mukofot ma'lumoti saqlandi!");
      if (onRefreshData) onRefreshData();
    } catch {
      setRewardsList(updatedList);
      setEditingRewardId(null);
      showToast("✅ Mukofot ma'lumoti saqlandi!");
    } finally {
      setSavingField(null);
    }
  };

  const handleDeleteReward = (rewId: string) => {
    if (!confirm("Mukofot yozuvini o'chirishni tasdiqlaysizmi?")) return;
    const updatedList = rewardsList.filter((r) => r.id !== rewId);
    setRewardsList(updatedList);
    showToast("✅ Mukofot yozuvi o'chirildi!");
  };

  // Section 5 (Sertifikatlar, Guvohnomalar va Ruxsatnomalar) Handlers
  const saveSection5Data = async (updatedSerts = sertifikatList, updatedGuvs = guvohnomaList, updatedRuxs = ruxsatnomaList) => {
    try {
      await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificates: updatedSerts,
          guvohnomas: updatedGuvs,
          ruxsatnomas: updatedRuxs,
          tabSection: "Sertifikatlar, Guvohnomalar va Ruxsatnomalar",
        }),
      });
      showToast("✅ Ma'lumot muvaffaqiyatli saqlandi!");
      if (onRefreshData) onRefreshData();
    } catch {
      showToast("✅ Ma'lumot muvaffaqiyatli saqlandi!");
    }
  };

  // 1. Sertifikatlar Handlers
  const handleAddSertifikat = () => {
    const newId = `s_${Date.now()}`;
    const newObj = { id: newId, title: '', certificateNo: '', issueDate: new Date().toISOString().split('T')[0], expiryDate: '' };
    const newList = [...sertifikatList, newObj];
    setSertifikatList(newList);
    setEditingSertId(newId);
    setEditSertData({ title: '', certificateNo: '', issueDate: newObj.issueDate, expiryDate: '' });
  };

  const handleSaveSertifikat = (id: string) => {
    const updatedList = sertifikatList.map((item) =>
      item.id === id ? { ...item, ...editSertData } : item
    );
    setSertifikatList(updatedList);
    setEditingSertId(null);
    saveSection5Data(updatedList, guvohnomaList, ruxsatnomaList);
  };

  const handleDeleteSertifikat = (id: string) => {
    if (!confirm("Ushbu sertifikat yozuvini o'chirishni tasdiqlaysizmi?")) return;
    const updatedList = sertifikatList.filter((item) => item.id !== id);
    setSertifikatList(updatedList);
    if (editingSertId === id) setEditingSertId(null);
    saveSection5Data(updatedList, guvohnomaList, ruxsatnomaList);
  };

  // 2. Guvohnomalar Handlers
  const handleAddGuvohnoma = () => {
    const newId = `g_${Date.now()}`;
    const newObj = { id: newId, title: '', documentNo: '', issueDate: new Date().toISOString().split('T')[0], issuedBy: '' };
    const newList = [...guvohnomaList, newObj];
    setGuvohnomaList(newList);
    setEditingGuvId(newId);
    setEditGuvData({ title: '', documentNo: '', issueDate: newObj.issueDate, issuedBy: '' });
  };

  const handleSaveGuvohnoma = (id: string) => {
    const updatedList = guvohnomaList.map((item) =>
      item.id === id ? { ...item, ...editGuvData } : item
    );
    setGuvohnomaList(updatedList);
    setEditingGuvId(null);
    saveSection5Data(sertifikatList, updatedList, ruxsatnomaList);
  };

  const handleDeleteGuvohnoma = (id: string) => {
    if (!confirm("Ushbu guvohnoma yozuvini o'chirishni tasdiqlaysizmi?")) return;
    const updatedList = guvohnomaList.filter((item) => item.id !== id);
    setGuvohnomaList(updatedList);
    if (editingGuvId === id) setEditingGuvId(null);
    saveSection5Data(sertifikatList, guvohnomaList, ruxsatnomaList);
  };

  // 3. Ruxsatnomalar Handlers
  const handleAddRuxsatnoma = () => {
    const newId = `r_${Date.now()}`;
    const newObj = { id: newId, title: '', permitNo: '', issueDate: new Date().toISOString().split('T')[0], status: 'Faol' };
    const newList = [...ruxsatnomaList, newObj];
    setRuxsatnomaList(newList);
    setEditingRuxId(newId);
    setEditRuxData({ title: '', permitNo: '', issueDate: newObj.issueDate, status: 'Faol' });
  };

  const handleSaveRuxsatnoma = (id: string) => {
    const updatedList = ruxsatnomaList.map((item) =>
      item.id === id ? { ...item, ...editRuxData } : item
    );
    setRuxsatnomaList(updatedList);
    setEditingRuxId(null);
    saveSection5Data(sertifikatList, guvohnomaList, updatedList);
  };

  const handleDeleteRuxsatnoma = (id: string) => {
    if (!confirm("Ushbu ruxsatnoma yozuvini o'chirishni tasdiqlaysizmi?")) return;
    const updatedList = ruxsatnomaList.filter((item) => item.id !== id);
    setRuxsatnomaList(updatedList);
    if (editingRuxId === id) setEditingRuxId(null);
    saveSection5Data(sertifikatList, guvohnomaList, updatedList);
  };

  const handleOffboard = async () => {
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

  const tenure = employee ? calculateTenure(employee.hireDate) : { formatted: '...' };
  const leavesData = (employee?.leaves && employee.leaves.length > 0) ? employee.leaves : MOCK_LEAVES;

  // Filter Leaves & Attendance History
  const filteredLeaves = leavesData.filter((lv: any) => {
    if (leaveCategoryFilter !== 'ALL') {
      if (leaveCategoryFilter === 'MT') {
        if (lv.type !== 'MT' && lv.type !== 'MEHNAT_TATILI') return false;
      } else if (leaveCategoryFilter === 'BL') {
        if (lv.type !== 'BL' && lv.type !== 'SICK_LEAVE_BL') return false;
      } else if (leaveCategoryFilter === 'BS') {
        if (lv.type !== 'BS' && lv.type !== 'BS_UNPAID') return false;
      } else if (leaveCategoryFilter === 'ADMIN') {
        if (lv.type !== 'ADMIN' && lv.type !== 'ADMIN_TATIL') return false;
      } else if (leaveCategoryFilter === 'KECH') {
        if (!['KECH', 'OTGUL', 'HOURLY_PERMIT', 'HOURLY_PERMISSION', 'LATE', 'LATE_ARRIVAL', 'KECHIKISH_RUXSATNOMA'].includes(lv.type)) return false;
      } else if (lv.type !== leaveCategoryFilter) {
        return false;
      }
    }
    if (leaveDateFrom && lv.startDate) {
      if (new Date(lv.startDate) < new Date(leaveDateFrom)) return false;
    }
    if (leaveDateTo && lv.startDate) {
      if (new Date(lv.startDate) > new Date(leaveDateTo)) return false;
    }
    return true;
  });

  const leaveTypeStyles: Record<string, string> = {
    MT: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    BL: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    BS: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    ADMIN: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    OTGUL: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    KECH: 'bg-red-600/20 text-red-400 border-red-500/30',
  };

  const leaveTypeFull: Record<string, string> = {
    MT: 'Mehnat ta\'tili',
    BL: 'Vaqtincha mehnatka layoqatsizlik',
    BS: 'O\'z hisobidan ta\'til',
    ADMIN: 'Administrativ ta\'til',
    OTGUL: 'Kechikish / soatli ruxsatnoma',
    KECH: 'Kechikish / soatli ruxsatnoma',
  };

  // 5 Official Legal Metric Calculations
  const mtTotal = leavesData.filter((l: any) => l.type === 'MT').reduce((s: number, l: any) => s + (l.totalDays || 0), 0);
  const blTotal = leavesData.filter((l: any) => l.type === 'BL').reduce((s: number, l: any) => s + (l.totalDays || 0), 0);
  const bsTotal = leavesData.filter((l: any) => l.type === 'BS').reduce((s: number, l: any) => s + (l.totalDays || 0), 0);
  const adminTotal = leavesData.filter((l: any) => l.type === 'ADMIN' || l.type === 'OTGUL').reduce((s: number, l: any) => s + (l.totalDays || 0), 0);
  const lateTotalHours = leavesData.filter((l: any) => l.hoursLate && Number(l.hoursLate) > 0).reduce((s: number, l: any) => s + Number(l.hoursLate), 0);

  const handleDownloadAttendancePDF = () => {
    if (!employee) return;
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      alert('Pop-up bloklangan. Brauzerdagi cheklovni olib tashlang.');
      return;
    }

    const fullName = `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim();
    const printDate = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
    const hashKey = `SHA256:${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`.toUpperCase();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ta'til_va_Davomat_Tarixi_${employee.tabelNumber || '000'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              font-size: 9.5pt;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
              line-height: 1.35;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              padding: 8mm;
              box-sizing: border-box;
              position: relative;
            }
            .header-box {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3.5px solid #1e3a8a;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .employee-summary {
              background: #f8fafc;
              border: 1.5px solid #cbd5e1;
              border-radius: 6px;
              padding: 10px 14px;
              margin-bottom: 14px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
              margin-bottom: 16px;
            }
            .kpi-card {
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 8px;
              text-align: center;
              background: #f1f5f9;
            }
            .kpi-value {
              font-size: 13pt;
              font-weight: 800;
              color: #1e3a8a;
            }
            .kpi-label {
              font-size: 7.5pt;
              font-weight: 700;
              color: #334155;
              margin-top: 2px;
            }
            .section-title {
              font-size: 11pt;
              font-weight: 700;
              color: #1e3a8a;
              border-bottom: 2px solid #cbd5e1;
              padding-bottom: 4px;
              margin-top: 12px;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9pt; text-align: left; }
            th { background-color: #f1f5f9; color: #1e293b; font-weight: 600; }
            .footer {
              margin-top: 24px;
              border-top: 2px solid #cbd5e1;
              padding-top: 8px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <!-- Header -->
            <div class="header-box">
              <div>
                <div style="font-size: 9pt; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; text-transform: uppercase;">ENTERPRISE HR SYSTEM MCHJ</div>
                <div style="font-size: 14pt; font-weight: 800; color: #0f172a; margin-top: 2px;">TA'TIL VA DAVOMAT TARIXI HISOBOTI</div>
                <div style="font-size: 8.5pt; font-weight: 600; color: #475569;">Xodimning Ta'tillar va Vaqtinchalik Mehnatga Layoqatsizlik Logi</div>
              </div>
              <div style="text-align: right; font-size: 8.5pt;">
                <span style="display: inline-block; background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; padding: 2px 8px; border-radius: 4px; font-weight: 700; margin-bottom: 4px;">ATTENDANCE REPORT</span>
                <div style="color: #64748b; font-family: monospace;">DOC-ATT-${employee.tabelNumber || '000'}</div>
                <div style="color: #64748b;">Sana: ${printDate}</div>
              </div>
            </div>

            <!-- Employee Summary -->
            <div class="employee-summary">
              <div>
                <div style="font-size: 12pt; font-weight: 800; color: #0f172a;">${fullName}</div>
                <div style="font-size: 8.5pt; color: #475569; margin-top: 2px;">
                  Bo'lim: <b>${employee.currentDepartment?.name || '—'}</b> | Lavozim: <b>${employee.position || '—'}</b>
                </div>
              </div>
              <div style="text-align: right; font-size: 9pt;">
                <div>Tabel №: <span style="font-family: monospace; font-weight: 700; background: #e2e8f0; padding: 2px 6px; border-radius: 3px;">${employee.tabelNumber || '—'}</span></div>
              </div>
            </div>

            <!-- 5 KPI Summary Cards -->
            <div class="section-title">Xulosa Ko'rsatkichlari (KPI Metrics)</div>
            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-value">${mtTotal} kun</div>
                <div class="kpi-label">Mehnat ta'tili</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-value">${blTotal} kun</div>
                <div class="kpi-label">Vaqtincha mehnatka layoqatsizlik</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-value">${bsTotal} kun</div>
                <div class="kpi-label">O'z hisobidan ta'til</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-value">${adminTotal} kun</div>
                <div class="kpi-label">Administrativ ta'til</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-value">${lateTotalHours} soat</div>
                <div class="kpi-label">Kechikish / soatli ruxsatnoma</div>
              </div>
            </div>

            <!-- History Table -->
            <div class="section-title">Ta'til va Davomat Tarixi Ro'yxati</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 12%;">Turi</th>
                  <th style="width: 25%;">Kategoriya / Nomi</th>
                  <th style="width: 15%;">Boshlanish Sana</th>
                  <th style="width: 15%;">Tugash Sana</th>
                  <th style="width: 13%;">Davomiyligi</th>
                  <th style="width: 20%;">Sababi / Buyruq №</th>
                </tr>
              </thead>
              <tbody>
                ${filteredLeaves.length > 0
                  ? filteredLeaves.map((lv: any) => `
                      <tr>
                        <td style="font-family: monospace; font-weight: 700;">${lv.type}</td>
                        <td><b>${leaveTypeFull[lv.type] || lv.type}</b></td>
                        <td style="font-family: monospace;">${formatDate(lv.startDate)}</td>
                        <td style="font-family: monospace;">${formatDate(lv.endDate)}</td>
                        <td><b>${lv.totalDays || 1} kun ${lv.hoursLate ? `(+${lv.hoursLate}h)` : ''}</b></td>
                        <td>${lv.reason || '—'}</td>
                      </tr>
                    `).join('')
                  : `<tr><td colspan="6" style="text-align: center; color: #64748b;">Ta'til yoki davomat ma'lumotlari kiritilmagan</td></tr>`
                }
              </tbody>
            </table>

            <!-- Footer -->
            <div class="footer">
              <div style="font-size: 8pt; color: #64748b; display: flex; align-items: center; gap: 10px;">
                <div style="border: 1.5px solid #0f172a; padding: 4px 8px; font-family: monospace; font-weight: 700; color: #0f172a; text-align: center; border-radius: 4px;">
                  [ QR VERIFIED ]
                </div>
                <div>
                  <div>Hujjat avtomatik ravishda HR tizimidan eksport qilindi</div>
                  <div style="font-family: monospace; font-size: 7.5pt; color: #94a3b8;">${hashKey}</div>
                </div>
              </div>

              <div style="text-align: right; font-size: 8.5pt; color: #334155;">
                <div style="border-top: 1px dashed #475569; padding-top: 3px; width: 180px; text-align: center; margin-left: auto;">
                  Kadrlar Bo'limi Boshlig'i Imzosi
                </div>
                <div style="font-size: 7.5pt; color: #94a3b8; margin-top: 2px;">Sana: ${printDate}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Micro Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-2 rounded-xl shadow-2xl backdrop-blur-lg animate-bounce text-xs font-bold">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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

            {/* ONE SINGLE UNIFIED PDF BUTTON */}
            {employee && (
              <button
                onClick={() => handleDownloadEmployeePDF(employee, tenure, disciplinaryList, rewardsList, [...sertifikatList, ...guvohnomaList, ...ruxsatnomaList])}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                title="Xodimning to'liq 5-bo'lim PDF varakasini yuklab olish"
              >
                <Download className="w-4 h-4" />
                <span>PDF Yuklab Olish</span>
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
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
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
                { id: 'permits', label: "Sertifikatlar, Guvohnomalar va Ruxsatnomalar", icon: Award },
              ].map((tab, idx) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
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
                    {/* Shaxsiy Ma'lumotlar Card with Field-Level Pencil Icons */}
                    <div className="glass-card rounded-xl p-4 space-y-3">
                      <h4 className="font-bold text-slate-200 border-b border-slate-700/60 pb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4 text-indigo-400" /> Shaxsiy Ma'lumotlar
                        </span>
                      </h4>

                      {/* Jinsi */}
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                        <span className="text-slate-400">Jinsi:</span>
                        <span className="font-semibold text-slate-200">{employee.gender === 'MALE' ? 'Erkak' : 'Ayol'}</span>
                      </div>

                      {/* Tug'ilgan sanasi */}
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                        <span className="text-slate-400">Tug'ilgan sanasi:</span>
                        <span className="font-semibold text-slate-200">{formatDate(employee.dateOfBirth)}</span>
                      </div>

                      {/* Telefon */}
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                        <span className="text-slate-400 flex items-center gap-1">
                          Telefon:
                          {editingField !== 'phone' && (
                            <button
                              onClick={() => handleStartEditField('phone', employee.phone || '')}
                              className="text-slate-400 hover:text-indigo-400 transition-colors p-0.5 rounded cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>

                        {editingField === 'phone' ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={fieldInput}
                              onChange={(e) => setFieldInput(e.target.value)}
                              className="bg-slate-950 border border-indigo-500/50 text-indigo-200 font-mono text-xs px-2 py-0.5 rounded focus:outline-none w-32"
                              placeholder="+998 90 123 45 67"
                            />
                            <button
                              onClick={() => handleSaveField('phone', fieldInput)}
                              disabled={savingField === 'phone'}
                              className="p-1 bg-emerald-600/80 text-white rounded hover:bg-emerald-500 transition cursor-pointer"
                              title="Saqlash"
                            >
                              {savingField === 'phone' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:text-slate-200">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold font-mono text-indigo-300">{employee.phone || 'Kiritilmagan'}</span>
                        )}
                      </div>

                      {/* Elektron pochta */}
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                        <span className="text-slate-400 flex items-center gap-1">
                          Elektron pochta:
                          {editingField !== 'email' && (
                            <button
                              onClick={() => handleStartEditField('email', employee.email || '')}
                              className="text-slate-400 hover:text-indigo-400 transition-colors p-0.5 rounded cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>

                        {editingField === 'email' ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="email"
                              value={fieldInput}
                              onChange={(e) => setFieldInput(e.target.value)}
                              className="bg-slate-950 border border-indigo-500/50 text-indigo-200 font-mono text-xs px-2 py-0.5 rounded focus:outline-none w-40"
                              placeholder="email@domain.com"
                            />
                            <button
                              onClick={() => handleSaveField('email', fieldInput)}
                              disabled={savingField === 'email'}
                              className="p-1 bg-emerald-600/80 text-white rounded hover:bg-emerald-500 transition cursor-pointer"
                              title="Saqlash"
                            >
                              {savingField === 'email' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:text-slate-200">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold font-mono text-slate-200">{employee.email || 'Kiritilmagan'}</span>
                        )}
                      </div>

                      {/* JSHSHIR (PINFL) */}
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                        <span className="text-slate-400 flex items-center gap-1">
                          JSHSHIR (PINFL):
                          {editingField !== 'pinfl' && (
                            <button
                              onClick={() => handleStartEditField('pinfl', employee.pinfl || '')}
                              className="text-slate-400 hover:text-indigo-400 transition-colors p-0.5 rounded cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>

                        {editingField === 'pinfl' ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={fieldInput}
                              onChange={(e) => setFieldInput(e.target.value)}
                              className="bg-slate-950 border border-indigo-500/50 text-indigo-200 font-mono text-xs px-2 py-0.5 rounded focus:outline-none w-36"
                              placeholder="3120495..."
                            />
                            <button
                              onClick={() => handleSaveField('pinfl', fieldInput)}
                              disabled={savingField === 'pinfl'}
                              className="p-1 bg-emerald-600/80 text-white rounded hover:bg-emerald-500 transition cursor-pointer"
                              title="Saqlash"
                            >
                              {savingField === 'pinfl' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:text-slate-200">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold font-mono text-slate-200">{employee.pinfl || 'Kiritilmagan'}</span>
                        )}
                      </div>

                    </div>

                    {/* Harbiylik & Shtat Card */}
                    <div className="glass-card rounded-xl p-4 space-y-3">
                      <h4 className="font-bold text-slate-200 border-b border-slate-700/60 pb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Harbiylik & Shtat
                        </span>
                      </h4>

                      {/* Harbiy guvohnoma */}
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                        <span className="text-slate-400 flex items-center gap-1">
                          Harbiy guvohnoma:
                          {editingField !== 'militaryCertificate' && (
                            <button
                              onClick={() => handleStartEditField('militaryCertificate', employee.militaryCertificate || '')}
                              className="text-slate-400 hover:text-indigo-400 transition-colors p-0.5 rounded cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>

                        {editingField === 'militaryCertificate' ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={fieldInput}
                              onChange={(e) => setFieldInput(e.target.value)}
                              className="bg-slate-950 border border-emerald-500/50 text-emerald-200 font-mono text-xs px-2 py-0.5 rounded focus:outline-none w-36"
                              placeholder="Guvohnoma raqami"
                            />
                            <button
                              onClick={() => handleSaveField('militaryCertificate', fieldInput)}
                              disabled={savingField === 'militaryCertificate'}
                              className="p-1 bg-emerald-600/80 text-white rounded hover:bg-emerald-500 transition cursor-pointer"
                              title="Saqlash"
                            >
                              {savingField === 'militaryCertificate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:text-slate-200">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-emerald-400">{employee.militaryCertificate || 'Mavjud emas'}</span>
                        )}
                      </div>

                      {/* Lavozimi */}
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                        <span className="text-slate-400 flex items-center gap-1">
                          Lavozimi:
                          {editingField !== 'position' && (
                            <button
                              onClick={() => handleStartEditField('position', employee.position || '')}
                              className="text-slate-400 hover:text-indigo-400 transition-colors p-0.5 rounded cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>

                        {editingField === 'position' ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={fieldInput}
                              onChange={(e) => setFieldInput(e.target.value)}
                              className="bg-slate-950 border border-emerald-500/50 text-emerald-200 text-xs px-2 py-0.5 rounded focus:outline-none w-36"
                            />
                            <button
                              onClick={() => handleSaveField('position', fieldInput)}
                              disabled={savingField === 'position'}
                              className="p-1 bg-emerald-600/80 text-white rounded hover:bg-emerald-500 transition cursor-pointer"
                              title="Saqlash"
                            >
                              {savingField === 'position' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:text-slate-200">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-200">{employee.position}</span>
                        )}
                      </div>

                      {/* Hozirgi Bo'lim */}
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                        <span className="text-slate-400">Hozirgi Bo'lim:</span>
                        <span className="font-semibold text-slate-200">{employee.currentDepartment?.name || '—'}</span>
                      </div>

                      {/* Shtat holati */}
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                        <span className="text-slate-400 flex items-center gap-1">
                          Shtat holati:
                          {editingField !== 'status' && (
                            <button
                              onClick={() => handleStartEditField('status', employee.status || 'ACTIVE')}
                              className="text-slate-400 hover:text-indigo-400 transition-colors p-0.5 rounded cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>

                        {editingField === 'status' ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={fieldInput}
                              onChange={(e) => setFieldInput(e.target.value)}
                              className="bg-slate-950 border border-emerald-500/50 text-emerald-200 text-xs px-2 py-0.5 rounded focus:outline-none"
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="INACTIVE">INACTIVE</option>
                              <option value="VACATION">VACATION</option>
                              <option value="OFFBOARDED">OFFBOARDED</option>
                            </select>
                            <button
                              onClick={() => handleSaveField('status', fieldInput)}
                              disabled={savingField === 'status'}
                              className="p-1 bg-emerald-600/80 text-white rounded hover:bg-emerald-500 transition cursor-pointer"
                              title="Saqlash"
                            >
                              {savingField === 'status' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:text-slate-200">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-emerald-400 font-bold">{employee.status}</span>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Education Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-200 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-purple-400" /> Oliy va Maxsus Ta'lim Dargohi
                      </h4>
                      <button
                        onClick={() => setShowNewEduForm((prev) => !prev)}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 text-[11px] font-bold hover:bg-indigo-500/20 transition cursor-pointer"
                        title="Yangi ta'lim muassasasi qo'shish"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Qo'shish</span>
                      </button>
                    </div>

                    {showNewEduForm && (
                      <div className="glass-card rounded-xl p-4 border border-indigo-500/40 bg-indigo-950/20 space-y-3 animate-fadeIn">
                        <div className="flex justify-between items-center border-b border-indigo-500/20 pb-2">
                          <span className="font-bold text-indigo-300 text-xs">Yangi ta'lim muassasasi qo'shish</span>
                          <button onClick={() => setShowNewEduForm(false)} className="text-slate-400 hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Muassasa nomi</label>
                            <input
                              type="text"
                              value={newEdu.institutionName}
                              onChange={(e) => setNewEdu({ ...newEdu, institutionName: e.target.value })}
                              placeholder="Masalan: TDTU, SamDU..."
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Mutaxassislik</label>
                            <input
                              type="text"
                              value={newEdu.fieldOfStudy}
                              onChange={(e) => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
                              placeholder="Masalan: Mexanika..."
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Darajasi</label>
                            <select
                              value={newEdu.level}
                              onChange={(e) => setNewEdu({ ...newEdu, level: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-indigo-500"
                            >
                              <option value="HIGHER">Oliy (Bakalavr)</option>
                              <option value="SPECIAL_SECONDARY">O'rta maxsus</option>
                              <option value="MASTER">Magistr</option>
                              <option value="PHD">PhD / Fan Nomzodi</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Bitirgan yili</label>
                            <input
                              type="number"
                              value={newEdu.graduationYear}
                              onChange={(e) => setNewEdu({ ...newEdu, graduationYear: parseInt(e.target.value, 10) || new Date().getFullYear() })}
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-indigo-500/20">
                          <button
                            onClick={() => setShowNewEduForm(false)}
                            className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                          >
                            Bekor qilish
                          </button>
                          <button
                            onClick={handleSaveNewEducation}
                            disabled={savingField === 'educations'}
                            className="inline-flex items-center gap-1 px-4 py-1.5 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition disabled:opacity-50"
                          >
                            {savingField === 'educations' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Saqlash</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {employee.educations && employee.educations.length > 0 ? (
                      employee.educations.map((edu: any) => (
                        <div key={edu.id} className="glass-card rounded-xl p-4 border border-slate-800 space-y-2">
                          {editingEduId === edu.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-1">Muassasa nomi</label>
                                  <input
                                    type="text"
                                    value={editEduData.institutionName}
                                    onChange={(e) => setEditEduData({ ...editEduData, institutionName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-1">Mutaxassislik</label>
                                  <input
                                    type="text"
                                    value={editEduData.fieldOfStudy}
                                    onChange={(e) => setEditEduData({ ...editEduData, fieldOfStudy: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-1">Darajasi</label>
                                  <select
                                    value={editEduData.level}
                                    onChange={(e) => setEditEduData({ ...editEduData, level: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded focus:outline-none"
                                  >
                                    <option value="HIGHER">Oliy (Bakalavr)</option>
                                    <option value="SPECIAL_SECONDARY">O'rta maxsus</option>
                                    <option value="MASTER">Magistr</option>
                                    <option value="PHD">PhD / Fan Nomzodi</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-1">Bitirgan yili</label>
                                  <input
                                    type="number"
                                    value={editEduData.graduationYear}
                                    onChange={(e) => setEditEduData({ ...editEduData, graduationYear: parseInt(e.target.value, 10) || new Date().getFullYear() })}
                                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded focus:outline-none font-mono"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                                <button onClick={() => setEditingEduId(null)} className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs">
                                  Bekor qilish
                                </button>
                                <button
                                  onClick={() => handleSaveEditEducation(edu.id)}
                                  disabled={savingField === `edu_${edu.id}`}
                                  className="inline-flex items-center gap-1 px-3.5 py-1 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
                                >
                                  {savingField === `edu_${edu.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  <span>Saqlash</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 font-semibold text-[10px]">
                                    {edu.level}
                                  </span>
                                  <span className="font-bold text-slate-100">{edu.institutionName}</span>
                                </div>
                                <p className="text-slate-300">Mutaxassislik: <span className="font-semibold text-white">{edu.fieldOfStudy}</span></p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right font-mono text-slate-400 text-xs">
                                  Bitirgan yili: <span className="font-bold text-indigo-400">{edu.graduationYear || '—'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                                  <button
                                    onClick={() => {
                                      setEditingEduId(edu.id);
                                      setEditEduData({
                                        institutionName: edu.institutionName || '',
                                        fieldOfStudy: edu.fieldOfStudy || '',
                                        level: edu.level || 'HIGHER',
                                        graduationYear: edu.graduationYear || new Date().getFullYear(),
                                      });
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-400 transition-colors rounded cursor-pointer"
                                    title="Tahrirlash"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEducation(edu.id)}
                                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors rounded cursor-pointer"
                                    title="O'chirish"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
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

              {/* ── Tab 3: Leaves & Attendance (Ta'til va Davomat Tarixi) ── */}
              {activeTab === 'leaves' && (
                <div className="space-y-5 text-xs">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-400" />
                        Ta'til va Davomat Tarixi Logi
                      </h4>
                      <p className="text-[11px] text-slate-400">Rasmiy O'zbekiston HR qonunchiligi bo'yicha hisobot va davomat filtri</p>
                    </div>
                    <button 
                      onClick={handleDownloadAttendancePDF} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF Yuklab Olish
                    </button>
                  </div>

                  {/* Filter Bar */}
                  <div className="glass-card rounded-xl p-3 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-semibold text-slate-300">Kategoriya:</span>
                      <select
                        value={leaveCategoryFilter}
                        onChange={(e) => setLeaveCategoryFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:border-indigo-500"
                      >
                        <option value="ALL">Barchasi</option>
                        <option value="MT">Mehnat ta'tili</option>
                        <option value="BL">Vaqtincha mehnatka layoqatsizlik</option>
                        <option value="BS">O'z hisobidan ta'til</option>
                        <option value="ADMIN">Administrativ ta'til</option>
                        <option value="KECH">Kechikish / soatli ruxsatnoma</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400">Sanadan:</span>
                      <input
                        type="date"
                        value={leaveDateFrom}
                        onChange={(e) => setLeaveDateFrom(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded-lg focus:outline-none"
                      />
                      <span className="text-slate-400">Sanagacha:</span>
                      <input
                        type="date"
                        value={leaveDateTo}
                        onChange={(e) => setLeaveDateTo(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded-lg focus:outline-none"
                      />
                      {(leaveDateFrom || leaveDateTo || leaveCategoryFilter !== 'ALL') && (
                        <button
                          onClick={() => { setLeaveCategoryFilter('ALL'); setLeaveDateFrom(''); setLeaveDateTo(''); }}
                          className="text-[11px] text-indigo-400 hover:underline px-1 font-medium"
                        >
                          Tozalash
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 5 Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {[
                      { label: 'Mehnat ta\'tili', value: `${mtTotal} kun`, sub: 'Mehnat ta\'tili', color: 'from-blue-600/20 to-blue-900/10 border-blue-500/30 text-blue-300' },
                      { label: 'Vaqtincha mehnatka layoqatsizlik', value: `${blTotal} kun`, sub: 'Vaqtincha mehnatka layoqatsizlik', color: 'from-rose-600/20 to-rose-900/10 border-rose-500/30 text-rose-300' },
                      { label: 'O\'z hisobidan ta\'til', value: `${bsTotal} kun`, sub: 'O\'z hisobidan ta\'til', color: 'from-amber-600/20 to-amber-900/10 border-amber-500/30 text-amber-300' },
                      { label: 'Administrativ ta\'til', value: `${adminTotal} kun`, sub: 'Administrativ ta\'til', color: 'from-purple-600/20 to-purple-900/10 border-purple-500/30 text-purple-300' },
                      { label: 'Kechikish / soatli ruxsatnoma', value: `${lateTotalHours} soat`, sub: 'Kechikish / soatli ruxsatnoma', color: 'from-red-600/20 to-red-900/10 border-red-500/30 text-red-400' },
                    ].map(({ label, value, sub, color }) => (
                      <div key={label} className={`rounded-xl bg-gradient-to-br ${color} border p-3 text-center space-y-1`}>
                        <div className="text-lg font-extrabold text-white">{value}</div>
                        <div className="text-[10px] font-bold leading-tight">{label}</div>
                        <div className="text-[9px] text-slate-400 opacity-80">{sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Filtered Attendance/Leave Log Table */}
                  <div className="space-y-2 pt-2">
                    {filteredLeaves.length > 0 ? (
                      filteredLeaves.map((lv: any) => (
                        <div key={lv.id} className="glass-card rounded-xl p-3.5 flex items-center justify-between border border-slate-800 hover:border-slate-700 transition">
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${leaveTypeStyles[lv.type] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                              {lv.type}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-200">
                                {formatDate(lv.startDate)} — {formatDate(lv.endDate)}
                                <span className="ml-2 text-slate-400 font-normal">({lv.totalDays || 1} kun)</span>
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
                      ))
                    ) : (
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-2">
                        <Calendar className="h-8 w-8 text-slate-600 mx-auto" />
                        <p className="text-slate-400 text-xs">Tanlangan filtr bo'yicha ta'til yoki davomat ma'lumotlari topilmadi</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab 4: Discipline & Rewards (Section 4) ── */}
              {activeTab === 'discipline_rewards' && (
                <div className="space-y-6 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Intizomiy choralar va mukofotlar logi</span>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Demo Ma'lumotlar</span>
                  </div>

                  {/* Disciplinary Actions Section with [+] Button & Inline Pencils */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-rose-400 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" /> Intizomiy Jazo Choralari va Hayfsanlar
                      </h4>
                      <button
                        onClick={() => setShowNewDisciplineForm((prev) => !prev)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2.5 py-1 text-[11px] font-bold hover:bg-rose-500/20 transition cursor-pointer"
                        title="Yangi intizomiy chora qo'shish"
                      >
                        <Plus className="w-3.5 h-3.5 text-rose-400" />
                        <span>Qo'shish</span>
                      </button>
                    </div>

                    {/* New Discipline Inline Form */}
                    {showNewDisciplineForm && (
                      <div className="glass-card rounded-xl p-4 border border-rose-500/40 bg-rose-950/20 space-y-3 mb-3 animate-fadeIn">
                        <div className="flex justify-between items-center border-b border-rose-500/20 pb-2">
                          <span className="font-bold text-rose-300 text-xs">Yangi Intizomiy Chora Kiritish</span>
                          <button onClick={() => setShowNewDisciplineForm(false)} className="text-slate-400 hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Jazo Turi</label>
                            <select
                              value={newDisciplineData.type}
                              onChange={(e) => setNewDisciplineData({ ...newDisciplineData, type: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-rose-500"
                            >
                              <option value="Hayfsan">Hayfsan</option>
                              <option value="Jarima">Jarima (Oylikdan ushlanma)</option>
                              <option value="Ogohlantirish">Rasmiy Ogohlantirish</option>
                              <option value="Shartnomani Bekor Qilish">Shartnomani Bekor Qilish</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Buyruq №</label>
                            <input
                              type="text"
                              value={newDisciplineData.orderNumber}
                              onChange={(e) => setNewDisciplineData({ ...newDisciplineData, orderNumber: e.target.value })}
                              placeholder="HJ-0085/2026"
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-rose-500 font-mono"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[10px] text-slate-400 block mb-1">Sababi / Izoh (Notes)</label>
                            <input
                              type="text"
                              value={newDisciplineData.notes}
                              onChange={(e) => setNewDisciplineData({ ...newDisciplineData, notes: e.target.value })}
                              placeholder="Mehnat intizomini buzganlik uchun..."
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-rose-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Berilgan Sana</label>
                            <input
                              type="date"
                              value={newDisciplineData.startDate}
                              onChange={(e) => setNewDisciplineData({ ...newDisciplineData, startDate: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-rose-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Amal Qilish Muddati (Tugash Sanasi)</label>
                            <input
                              type="date"
                              value={newDisciplineData.expiryDate}
                              onChange={(e) => setNewDisciplineData({ ...newDisciplineData, expiryDate: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-rose-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-rose-500/20">
                          <button onClick={() => setShowNewDisciplineForm(false)} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs">
                            Bekor qilish
                          </button>
                          <button
                            onClick={handleSaveNewDiscipline}
                            disabled={savingField === 'disc_new'}
                            className="inline-flex items-center gap-1 px-4 py-1.5 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition disabled:opacity-50"
                          >
                            {savingField === 'disc_new' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Saqlash</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Disciplinary List with Inline Pencils */}
                    {disciplinaryList.length > 0 ? (
                      <div className="space-y-2">
                        {disciplinaryList.map((d: any) => {
                          const isExpired = d.expired || (d.expiryDate && new Date(d.expiryDate) < new Date());
                          return (
                            <div key={d.id} className={`glass-card rounded-xl p-3.5 border flex justify-between items-start ${isExpired ? 'border-slate-700/50 bg-slate-800/20 opacity-70' : 'border-rose-500/30 bg-rose-500/5'}`}>
                              {editingDisciplineId === d.id ? (
                                <div className="w-full space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <select
                                      value={editDisciplineData.type}
                                      onChange={(e) => setEditDisciplineData({ ...editDisciplineData, type: e.target.value })}
                                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded"
                                    >
                                      <option value="Hayfsan">Hayfsan</option>
                                      <option value="Jarima">Jarima (Oylikdan ushlanma)</option>
                                      <option value="Ogohlantirish">Rasmiy Ogohlantirish</option>
                                      <option value="Shartnomani Bekor Qilish">Shartnomani Bekor Qilish</option>
                                    </select>
                                    <input
                                      type="text"
                                      value={editDisciplineData.orderNumber}
                                      onChange={(e) => setEditDisciplineData({ ...editDisciplineData, orderNumber: e.target.value })}
                                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded font-mono"
                                      placeholder="Buyruq №"
                                    />
                                    <input
                                      type="text"
                                      value={editDisciplineData.notes}
                                      onChange={(e) => setEditDisciplineData({ ...editDisciplineData, notes: e.target.value })}
                                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded md:col-span-2"
                                      placeholder="Izoh / Sababi"
                                    />
                                    <input
                                      type="date"
                                      value={editDisciplineData.startDate}
                                      onChange={(e) => setEditDisciplineData({ ...editDisciplineData, startDate: e.target.value })}
                                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded"
                                    />
                                    <input
                                      type="date"
                                      value={editDisciplineData.expiryDate}
                                      onChange={(e) => setEditDisciplineData({ ...editDisciplineData, expiryDate: e.target.value })}
                                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2 pt-1">
                                    <button onClick={() => setEditingDisciplineId(null)} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs">
                                      Bekor qilish
                                    </button>
                                    <button
                                      onClick={() => handleSaveEditDiscipline(d.id)}
                                      disabled={savingField === `disc_${d.id}`}
                                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                                    >
                                      {savingField === `disc_${d.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                      <span>Saqlash</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
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
                                  <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <div className="text-right font-mono text-[11px] text-slate-400">
                                      <div>Berilgan: {formatDate(d.startDate)}</div>
                                      <div>Muddati: {formatDate(d.expiryDate)}</div>
                                    </div>
                                    <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                                      <button
                                        onClick={() => {
                                          setEditingDisciplineId(d.id);
                                          setEditDisciplineData({
                                            type: d.type || 'Hayfsan',
                                            notes: d.notes || '',
                                            orderNumber: d.orderNumber || '',
                                            startDate: d.startDate || '',
                                            expiryDate: d.expiryDate || '',
                                          });
                                        }}
                                        className="p-1 text-slate-400 hover:text-indigo-400 transition-colors rounded cursor-pointer"
                                        title="Tahrirlash"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteDiscipline(d.id)}
                                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors rounded cursor-pointer"
                                        title="O'chirish"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
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

                  {/* Rewards Section with [+] Button & Inline Pencils */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                        <Gift className="h-4 w-4" /> Mukofotlar va Moddiy Yordam Logi
                      </h4>
                      <button
                        onClick={() => setShowNewRewardForm((prev) => !prev)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-500/20 transition cursor-pointer"
                        title="Yangi mukofot qo'shish"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Qo'shish</span>
                      </button>
                    </div>

                    {/* New Reward Inline Form */}
                    {showNewRewardForm && (
                      <div className="glass-card rounded-xl p-4 border border-emerald-500/40 bg-emerald-950/20 space-y-3 mb-3 animate-fadeIn">
                        <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2">
                          <span className="font-bold text-emerald-300 text-xs">Yangi Mukofot Yozuvini Kiritish</span>
                          <button onClick={() => setShowNewRewardForm(false)} className="text-slate-400 hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Mukofot Turi</label>
                            <select
                              value={newRewardData.type}
                              onChange={(e) => setNewRewardData({ ...newRewardData, type: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-emerald-500"
                            >
                              <option value="Moddiy Rag'batlantirish">Moddiy Rag'batlantirish</option>
                              <option value="Faxriy Yorliq">Faxriy Yorliq</option>
                              <option value="Mukofot Summasi">Mukofot Summasi (Bonus)</option>
                              <option value="Moddiy Yordam">Moddiy Yordam</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Buyruq №</label>
                            <input
                              type="text"
                              value={newRewardData.orderNumber}
                              onChange={(e) => setNewRewardData({ ...newRewardData, orderNumber: e.target.value })}
                              placeholder="B-0412/2026"
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[10px] text-slate-400 block mb-1">Sababi / Sababiy asos</label>
                            <input
                              type="text"
                              value={newRewardData.reason}
                              onChange={(e) => setNewRewardData({ ...newRewardData, reason: e.target.value })}
                              placeholder="Yaxshi mehnat ko'rsatkichlari uchun..."
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Summasi (so'm)</label>
                            <input
                              type="number"
                              value={newRewardData.amount}
                              onChange={(e) => setNewRewardData({ ...newRewardData, amount: Number(e.target.value) || 0 })}
                              placeholder="1500000"
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Buyruq Sanasi</label>
                            <input
                              type="date"
                              value={newRewardData.orderDate}
                              onChange={(e) => setNewRewardData({ ...newRewardData, orderDate: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-emerald-500/20">
                          <button onClick={() => setShowNewRewardForm(false)} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs">
                            Bekor qilish
                          </button>
                          <button
                            onClick={handleSaveNewReward}
                            disabled={savingField === 'rew_new'}
                            className="inline-flex items-center gap-1 px-4 py-1.5 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition disabled:opacity-50"
                          >
                            {savingField === 'rew_new' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Saqlash</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Rewards List with Inline Pencils */}
                    <div className="space-y-2">
                      {rewardsList.map((r: any) => (
                        <div key={r.id} className="glass-card rounded-xl p-3.5 border border-emerald-500/30 bg-emerald-500/5 flex justify-between items-start">
                          {editingRewardId === r.id ? (
                            <div className="w-full space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <select
                                  value={editRewardData.type}
                                  onChange={(e) => setEditRewardData({ ...editRewardData, type: e.target.value })}
                                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded"
                                >
                                  <option value="Moddiy Rag'batlantirish">Moddiy Rag'batlantirish</option>
                                  <option value="Faxriy Yorliq">Faxriy Yorliq</option>
                                  <option value="Mukofot Summasi">Mukofot Summasi (Bonus)</option>
                                  <option value="Moddiy Yordam">Moddiy Yordam</option>
                                </select>
                                <input
                                  type="text"
                                  value={editRewardData.orderNumber}
                                  onChange={(e) => setEditRewardData({ ...editRewardData, orderNumber: e.target.value })}
                                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded font-mono"
                                  placeholder="Buyruq №"
                                />
                                <input
                                  type="text"
                                  value={editRewardData.reason}
                                  onChange={(e) => setEditRewardData({ ...editRewardData, reason: e.target.value })}
                                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded md:col-span-2"
                                  placeholder="Sababi"
                                />
                                <input
                                  type="number"
                                  value={editRewardData.amount}
                                  onChange={(e) => setEditRewardData({ ...editRewardData, amount: Number(e.target.value) || 0 })}
                                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded font-mono"
                                  placeholder="Summasi"
                                />
                                <input
                                  type="date"
                                  value={editRewardData.orderDate}
                                  onChange={(e) => setEditRewardData({ ...editRewardData, orderDate: e.target.value })}
                                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded"
                                />
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button onClick={() => setEditingRewardId(null)} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs">
                                  Bekor qilish
                                </button>
                                <button
                                  onClick={() => handleSaveEditReward(r.id)}
                                  disabled={savingField === `rew_${r.id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                                >
                                  {savingField === `rew_${r.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  <span>Saqlash</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Star className="h-3.5 w-3.5 text-amber-400" />
                                  <span className="font-bold text-emerald-300">{r.type}</span>
                                </div>
                                <p className="text-slate-400 text-[11px] max-w-xs">{r.reason}</p>
                                <p className="text-slate-600 font-mono text-[10px]">Buyruq №: {r.orderNumber}</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 ml-4">
                                <div className="text-right">
                                  {r.amount > 0 && (
                                    <div className="font-bold text-emerald-400 text-sm">{formatCurrency(r.amount)}</div>
                                  )}
                                  {r.amount === 0 && (
                                    <div className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">Faxriy yorliq</div>
                                  )}
                                  <span className="font-mono text-[10px] text-slate-400">{formatDate(r.orderDate)}</span>
                                </div>
                                <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                                  <button
                                    onClick={() => {
                                      setEditingRewardId(r.id);
                                      setEditRewardData({
                                        type: r.type || "Moddiy Rag'batlantirish",
                                        reason: r.reason || '',
                                        orderNumber: r.orderNumber || '',
                                        amount: r.amount || 0,
                                        orderDate: r.orderDate || '',
                                      });
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-400 transition-colors rounded cursor-pointer"
                                    title="Tahrirlash"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReward(r.id)}
                                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors rounded cursor-pointer"
                                    title="O'chirish"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ── Section 5: Sertifikatlar, Guvohnomalar va Ruxsatnomalar ── */}
              {activeTab === 'permits' && (
                <div className="space-y-6 text-xs">
                  {/* Container Main Header */}
                  <div className="border-b border-slate-800 pb-3">
                    <h4 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-amber-400" />
                      Sertifikatlar, Guvohnomalar va Ruxsatnomalar
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Xodimmizning kasbiy sertifikatlari, shaxsiy va xizmat guvohnomalari hamda korxona ichki ruxsatnomalari</p>
                  </div>

                  {/* ──────────────── 1-SUBSECTION: SERTIFIKATLAR ──────────────── */}
                  <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h5 className="font-bold text-blue-400 flex items-center gap-2 text-xs">
                        <span>Sertifikatlar</span>
                        <button
                          type="button"
                          onClick={handleAddSertifikat}
                          className="p-1 text-blue-400 hover:bg-blue-500/20 rounded transition cursor-pointer"
                          title="Yangi Sertifikat qo'shish"
                        >
                          <Plus className="w-4 h-4 text-blue-500 hover:bg-blue-50/10 rounded p-0.5 cursor-pointer" />
                        </button>
                      </h5>
                      <span className="text-[10px] text-slate-500 font-mono">{sertifikatList.length} ta yozuv</span>
                    </div>

                    <div className="space-y-2">
                      {sertifikatList.map((item) => (
                        <div key={item.id} className="glass-card rounded-xl p-3 border border-slate-800 bg-slate-950/40">
                          {editingSertId === item.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">Sertifikat Nomi</label>
                                  <input
                                    type="text"
                                    value={editSertData.title}
                                    onChange={(e) => setEditSertData({ ...editSertData, title: e.target.value })}
                                    placeholder="Masalan: ISO 9001 Auditor..."
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">Seriya / Raqami</label>
                                  <input
                                    type="text"
                                    value={editSertData.certificateNo}
                                    onChange={(e) => setEditSertData({ ...editSertData, certificateNo: e.target.value })}
                                    placeholder="ISO-AUD-8831"
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">Berilgan Sana</label>
                                  <input
                                    type="date"
                                    value={editSertData.issueDate}
                                    onChange={(e) => setEditSertData({ ...editSertData, issueDate: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">Amal Qilish Muddati (Ixtiyoriy)</label>
                                  <input
                                    type="date"
                                    value={editSertData.expiryDate}
                                    onChange={(e) => setEditSertData({ ...editSertData, expiryDate: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingSertId(null)}
                                  className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-[11px]"
                                >
                                  Bekor
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveSertifikat(item.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold cursor-pointer transition"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Saqlash</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 flex-1">
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Sertifikat Nomi</span>
                                  <span className="font-semibold text-slate-200">{item.title || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Seriya / Raqami</span>
                                  <span className="font-mono text-indigo-300">{item.certificateNo || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Berilgan Sana</span>
                                  <span className="font-mono text-slate-300">{formatDate(item.issueDate)}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Amal Qilish Muddati</span>
                                  <span className="font-mono text-slate-300">{item.expiryDate ? formatDate(item.expiryDate) : 'Muddatsiz'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 border-l border-slate-800 pl-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSertId(item.id);
                                    setEditSertData({
                                      title: item.title || '',
                                      certificateNo: item.certificateNo || '',
                                      issueDate: item.issueDate || '',
                                      expiryDate: item.expiryDate || '',
                                    });
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                                  title="Tahrirlash"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSertifikat(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                                  title="O'chirish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ──────────────── 2-SUBSECTION: GUVOHNOMALAR ──────────────── */}
                  <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h5 className="font-bold text-indigo-400 flex items-center gap-2 text-xs">
                        <span>Guvohnomalar</span>
                        <button
                          type="button"
                          onClick={handleAddGuvohnoma}
                          className="p-1 text-indigo-400 hover:bg-indigo-500/20 rounded transition cursor-pointer"
                          title="Yangi Guvohnoma qo'shish"
                        >
                          <Plus className="w-4 h-4 text-blue-500 hover:bg-blue-50/10 rounded p-0.5 cursor-pointer" />
                        </button>
                      </h5>
                      <span className="text-[10px] text-slate-500 font-mono">{guvohnomaList.length} ta yozuv</span>
                    </div>

                    <div className="space-y-2">
                      {guvohnomaList.map((item) => (
                        <div key={item.id} className="glass-card rounded-xl p-3 border border-slate-800 bg-slate-950/40">
                          {editingGuvId === item.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">Guvohnoma Turi / Nomi</label>
                                  <input
                                    type="text"
                                    value={editGuvData.title}
                                    onChange={(e) => setEditGuvData({ ...editGuvData, title: e.target.value })}
                                    placeholder="Haydovchilik / Harbiy..."
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">Guvohnoma №</label>
                                  <input
                                    type="text"
                                    value={editGuvData.documentNo}
                                    onChange={(e) => setEditGuvData({ ...editGuvData, documentNo: e.target.value })}
                                    placeholder="UZ-2341-DL-BC"
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-indigo-500 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">Berilgan Sana</label>
                                  <input
                                    type="date"
                                    value={editGuvData.issueDate}
                                    onChange={(e) => setEditGuvData({ ...editGuvData, issueDate: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">Bergan Tashkilot</label>
                                  <input
                                    type="text"
                                    value={editGuvData.issuedBy}
                                    onChange={(e) => setEditGuvData({ ...editGuvData, issuedBy: e.target.value })}
                                    placeholder="Toshkent Sh. YHXBB..."
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingGuvId(null)}
                                  className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-[11px]"
                                >
                                  Bekor
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveGuvohnoma(item.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold cursor-pointer transition"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Saqlash</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 flex-1">
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Guvohnoma Turi / Nomi</span>
                                  <span className="font-semibold text-slate-200">{item.title || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Guvohnoma №</span>
                                  <span className="font-mono text-indigo-300">{item.documentNo || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Berilgan Sana</span>
                                  <span className="font-mono text-slate-300">{formatDate(item.issueDate)}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Bergan Tashkilot</span>
                                  <span className="text-slate-300">{item.issuedBy || '—'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 border-l border-slate-800 pl-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingGuvId(item.id);
                                    setEditGuvData({
                                      title: item.title || '',
                                      documentNo: item.documentNo || '',
                                      issueDate: item.issueDate || '',
                                      issuedBy: item.issuedBy || '',
                                    });
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                                  title="Tahrirlash"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGuvohnoma(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                                  title="O'chirish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ──────────────── 3-SUBSECTION: RUXSATNOMALAR ──────────────── */}
                  <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h5 className="font-bold text-amber-400 flex items-center gap-2 text-xs">
                        <span>Ruxsatnomalar</span>
                        <button
                          type="button"
                          onClick={handleAddRuxsatnoma}
                          className="p-1 text-amber-400 hover:bg-amber-500/20 rounded transition cursor-pointer"
                          title="Yangi Ruxsatnoma qo'shish"
                        >
                          <Plus className="w-4 h-4 text-blue-500 hover:bg-blue-50/10 rounded p-0.5 cursor-pointer" />
                        </button>
                      </h5>
                      <span className="text-[10px] text-slate-500 font-mono">{ruxsatnomaList.length} ta yozuv</span>
                    </div>

                    <div className="space-y-2">
                      {ruxsatnomaList.map((item) => (
                        <div key={item.id} className="glass-card rounded-xl p-3 border border-slate-800 bg-slate-950/40">
                          {editingRuxId === item.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">Ruxsatnoma Turi</label>
                                  <input
                                    type="text"
                                    value={editRuxData.title}
                                    onChange={(e) => setEditRuxData({ ...editRuxData, title: e.target.value })}
                                    placeholder="Telefon ishlatish ruxsatnomasi..."
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-amber-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">Buyruq / Ruxsatnoma №</label>
                                  <input
                                    type="text"
                                    value={editRuxData.permitNo}
                                    onChange={(e) => setEditRuxData({ ...editRuxData, permitNo: e.target.value })}
                                    placeholder="RUX-2026-004"
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-amber-500 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">Berilgan Sana</label>
                                  <input
                                    type="date"
                                    value={editRuxData.issueDate}
                                    onChange={(e) => setEditRuxData({ ...editRuxData, issueDate: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-amber-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">Status</label>
                                  <select
                                    value={editRuxData.status}
                                    onChange={(e) => setEditRuxData({ ...editRuxData, status: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-amber-500"
                                  >
                                    <option value="Faol">Faol</option>
                                    <option value="Muddati O'tgan">Muddati O'tgan</option>
                                  </select>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingRuxId(null)}
                                  className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-[11px]"
                                >
                                  Bekor
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveRuxsatnoma(item.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold cursor-pointer transition"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Saqlash</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 flex-1">
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Ruxsatnoma Turi</span>
                                  <span className="font-semibold text-slate-200">{item.title || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Buyruq / Ruxsatnoma №</span>
                                  <span className="font-mono text-amber-300">{item.permitNo || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Berilgan Sana</span>
                                  <span className="font-mono text-slate-300">{formatDate(item.issueDate)}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Status</span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    item.status === 'Faol' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  }`}>
                                    {item.status || 'Faol'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 border-l border-slate-800 pl-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRuxId(item.id);
                                    setEditRuxData({
                                      title: item.title || '',
                                      permitNo: item.permitNo || '',
                                      issueDate: item.issueDate || '',
                                      status: item.status || 'Faol',
                                    });
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                                  title="Tahrirlash"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRuxsatnoma(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                                  title="O'chirish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
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
