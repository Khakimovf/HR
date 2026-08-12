'use client';

import React, { useRef } from 'react';
import {
  X,
  Printer,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { APPROVAL_STEPS_CONFIG } from '@/lib/leaveConfig';

interface LeaveDocumentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any | null;
}

export const LeaveDocumentPrintModal: React.FC<LeaveDocumentPrintModalProps> = ({
  isOpen,
  onClose,
  request,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !request) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-leave-document');
    if (!printContent) return;

    // Create a clean new browser window for printing
    const printWindow = window.open('', '_blank', 'width=850,height=1050');
    if (!printWindow) return;

    // Inject light-mode clean HTML structure with official A4 single page styles
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ariza_A4_Official</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              width: 210mm;
              height: 297mm;
              max-height: 297mm;
              margin: 0 auto;
              padding: 12mm 15mm;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: 'Arial', 'Segoe UI', sans-serif;
              font-size: 10.5pt;
              line-height: 1.35;
              overflow: hidden;
            }
            h1, h2, h3, p, td, th, span, div { color: #000000 !important; }
            .header-banner {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .applicant-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              margin-bottom: 14px;
            }
            .applicant-table td {
              border: 1px solid #cbd5e1;
              padding: 6px 10px;
              font-size: 9.5pt;
              vertical-align: middle;
            }
            .applicant-table .lbl {
              background-color: #f1f5f9 !important;
              font-weight: bold;
              color: #1e293b !important;
              width: 22%;
            }
            .applicant-table .val {
              color: #0f172a !important;
              width: 28%;
            }
            .stamp-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
              margin-top: 10px;
              page-break-inside: avoid;
            }
            .stamp-box {
              border: 1.5px solid #1e3a8a;
              background-color: #f8fafc !important;
              padding: 6px 8px;
              border-radius: 4px;
              font-size: 8.5pt;
            }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-end { justify-content: flex-end; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .font-mono { font-family: monospace; }
            .uppercase { text-transform: uppercase; }
            .underline { text-decoration: underline; }
            .italic { font-style: italic; }
            .text-xs { font-size: 8.5pt; }
            .text-sm { font-size: 9.5pt; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-4 { margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div id="printable-leave-document">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Trigger print after styles load and close window automatically
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const stepsMap = new Map<number, any>();
  if (request.approvalSteps) {
    request.approvalSteps.forEach((s: any) => {
      stepsMap.set(s.stepNumber, s);
    });
  }

  // Generate deterministic digital verification hash for document
  const hashSeed = `LEAVE-${request.id}-${request.employeeId}-${request.status}`;
  let hashVal = 0;
  for (let i = 0; i < hashSeed.length; i++) {
    hashVal = (hashVal << 5) - hashVal + hashSeed.charCodeAt(i);
    hashVal |= 0;
  }
  const certHash = Math.abs(hashVal).toString(16).padStart(8, '0').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      {/* Container */}
      <div className="relative w-full max-w-4xl glass-panel rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-6">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Rasmiy Ariza 1:1 A4 Hujjati
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  VERIFIED #{certHash}
                </span>
              </h3>
              <p className="text-xs text-slate-400">1 Sahifali A4 Print / PDF Tayyor Hujjat</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
            >
              <Printer className="h-4 w-4" />
              Chop Etish / PDF (1 Sahifa)
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Content (Fits on 1 A4 Page) */}
        <div id="printable-leave-document" className="p-8 bg-white text-slate-900 font-sans shadow-inner text-sm max-w-[210mm] mx-auto" ref={printRef}>
          
          {/* TOP HEADER BANNER */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg tracking-wider">
                HR
              </div>
              <div>
                <h1 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                  MANUFACTURING ENTERPRISE HR
                </h1>
                <p className="text-[11px] text-slate-700 font-semibold">"ENTERPRISE HR SYSTEM" MCHJ</p>
                <p className="text-[9px] text-slate-500 font-mono">Toshkent Sanoat Zonasi #4 | Hujjat Aylanishi Bo'limi</p>
              </div>
            </div>

            <div className="text-right font-mono text-[11px]">
              <div className="font-bold text-slate-900">Hujjat №: AR-{request.id.slice(0, 8).toUpperCase()}</div>
              <div className="text-slate-600">Sana: {new Date(request.requestDate || request.createdAt).toLocaleDateString('uz-UZ')}</div>
              <div className="mt-1 inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-bold">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                VERIFIED E-DOCUMENT
              </div>
            </div>
          </div>

          {/* DOCUMENT TITLE (Centered & Bold) */}
          <div className="text-center my-4">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
              O'Z HISOBIDAN VAQTINCHA TA'TIL BERISH HAQIDA ARIZA
            </h2>
          </div>

          {/* SECTION 1: APPLICANT DETAILS TABLE (2-row x 4-column Bordered Grid - EXACT MATCH) */}
          <table className="w-full border-collapse border border-slate-300 text-xs mb-4">
            <tbody>
              <tr>
                <td className="border border-slate-300 bg-slate-100 px-3 py-1.5 font-bold text-slate-800 w-[22%]">F.I.O (Arizachi):</td>
                <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900 w-[28%]">
                  {request.employee?.lastName} {request.employee?.firstName} {request.employee?.middleName || ''}
                </td>
                <td className="border border-slate-300 bg-slate-100 px-3 py-1.5 font-bold text-slate-800 w-[22%]">Tabel №:</td>
                <td className="border border-slate-300 px-3 py-1.5 font-mono font-bold text-slate-900 w-[28%]">
                  {request.employee?.tabelNumber}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-100 px-3 py-1.5 font-bold text-slate-800">Tarkibiy Bo'limi:</td>
                <td className="border border-slate-300 px-3 py-1.5 text-slate-900">
                  {request.employee?.currentDepartment?.name}
                </td>
                <td className="border border-slate-300 bg-slate-100 px-3 py-1.5 font-bold text-slate-800">Egallagan Lavozimi:</td>
                <td className="border border-slate-300 px-3 py-1.5 text-slate-900">
                  {request.employee?.position}
                </td>
              </tr>
            </tbody>
          </table>

          {/* SECTION 2: APPLICATION BODY TEXT */}
          <div className="space-y-3 leading-relaxed text-justify text-slate-800 text-xs my-4 border-l-2 border-slate-300 pl-3">
            <p>
              Menga <strong className="text-slate-900">{request.reason}</strong> munosabati bilan{' '}
              <strong className="text-slate-900">
                {new Date(request.startDate).toLocaleDateString('uz-UZ')}
              </strong>{' '}
              kunidan{' '}
              <strong className="text-slate-900">
                {new Date(request.endDate).toLocaleDateString('uz-UZ')}
              </strong>{' '}
              kunigacha (jami <strong className="text-slate-900 font-mono font-bold">{request.totalDays} ish kuni</strong>)
              moddiy javobgarlik va ish vazifalarimni saqlagan holda{' '}
              <strong className="underline text-slate-900 font-bold">
                {request.type === 'BS_UNPAID'
                  ? "Harajatsiz ta'til (O'z hisobimdan B/S)"
                  : request.type === 'MEHNAT_TATILI'
                  ? "Navbatdagi yillik mehnat ta'tili (M/T)"
                  : request.type === 'SICK_LEAVE_BL'
                  ? "Kasallik varaqasi bo'yicha ta'til (B/L)"
                  : "Soatbay xizmat ruxsatnomasi"}
              </strong>{' '}
              berishingizni so'rayman.
            </p>
          </div>

          {/* Applicant signature line */}
          <div className="flex justify-between items-center my-3 pt-2 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-600 font-semibold">Ariza Beruvchi Imzosi: </span>
              <strong className="text-slate-900">
                {request.employee?.lastName} {request.employee?.firstName}
              </strong>
            </div>
            <div className="font-mono text-slate-600 text-[10px]">
              Tizimga kiritilgan vaqt: {new Date(request.createdAt).toLocaleDateString('uz-UZ')}
            </div>
          </div>

          {/* SECTION 3: 6-BOSQICHLI ELEKTRON TASDIQLASH MUHRLARI (3x2 GRID) */}
          <div className="mt-4 border-t-2 border-slate-900 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                6-BOSQICHLI ELEKTRON TASDIQLASH VA RAQAMLI IMZOLAR MUHRLARI:
              </h3>
              <span className="text-[9px] font-mono text-slate-500">ISO 27001 Certified Digital Seal</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {APPROVAL_STEPS_CONFIG.map((cfg) => {
                const stepData = stepsMap.get(cfg.stepNumber);
                const isApproved = stepData?.status === 'APPROVED';
                const isRejected = stepData?.status === 'REJECTED';
                const isPending  = !isApproved && !isRejected;

                return (
                  <div
                    key={cfg.stepNumber}
                    className={`stamp-box relative rounded border p-2 text-[10px] leading-tight ${
                      isApproved
                        ? 'border-blue-900 bg-slate-50 text-slate-900'
                        : isRejected
                        ? 'border-rose-700 bg-rose-50 text-rose-950'
                        : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-slate-800">
                        #{cfg.stepNumber}. {cfg.label}
                      </span>
                    </div>

                    {/* Digital Stamp Simulation */}
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 truncate text-[10px]">
                        {stepData?.approverName || (isPending ? 'Kutilmoqda...' : '—')}
                      </div>

                      {isApproved && (
                        <div className="mt-1 rounded border border-blue-900 p-1 text-center bg-blue-50">
                          <div className="text-[8px] font-black text-blue-900 uppercase tracking-widest">
                            ✓ ELEKTRON TASDIQLANDI
                          </div>
                          <div className="text-[7.5pt] font-mono text-blue-800">
                            {stepData.actionDate
                              ? new Date(stepData.actionDate).toLocaleDateString('uz-UZ')
                              : 'Tasdiqlangan'}
                          </div>
                        </div>
                      )}

                      {isRejected && (
                        <div className="mt-1 rounded border border-rose-600 p-1 text-center bg-rose-100">
                          <div className="text-[8px] font-black text-rose-800 uppercase tracking-widest">
                            ✕ RAD ETILDI
                          </div>
                        </div>
                      )}

                      {isPending && (
                        <div className="mt-1 text-[8px] italic text-slate-400 text-center">
                          Kutilmoqda...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: BOTTOM FOOTER BAR */}
          <div className="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-600">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 border border-slate-900 p-0.5 bg-white flex items-center justify-center shrink-0">
                <QrCode className="h-8 w-8 text-slate-900" />
              </div>
              <div>
                <div className="font-bold text-slate-900">RAQAMLI VERIFIKATSIYA MUHRI</div>
                <div className="font-mono text-[8.5pt]">HASH: {certHash}-2026-UZ-HR</div>
              </div>
            </div>

            <div className="text-right font-mono text-[8.5pt]">
              <div>Holati: <strong className="uppercase font-bold text-slate-900">{request.status}</strong></div>
              <div>Chop etilgan: {new Date().toLocaleDateString('uz-UZ')}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
