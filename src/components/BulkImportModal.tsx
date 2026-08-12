'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Layers,
  Users,
  Building2,
  Stethoscope,
  Rocket,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export type ImportType = 'EMPLOYEES' | 'DEPARTMENTS' | 'HSE';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ImportType;
  onSuccess?: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'EMPLOYEES',
  onSuccess,
}) => {
  const [importType, setImportType] = useState<ImportType>(defaultType);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName]     = useState<string>('');
  const [parsing, setParsing]       = useState<boolean>(false);
  const [saving, setSaving]         = useState<boolean>(false);
  const [errorMsg, setErrorMsg]     = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // ─── SAMPLE EXCEL TEMPLATE GENERATORS ───────────────────────────────────────
  const downloadSampleTemplate = (type: ImportType) => {
    let filename = '';
    let data: any[] = [];

    if (type === 'DEPARTMENTS') {
      filename = 'Bolimlar_Shablon.xlsx';
      data = [
        {
          DeptName: "Shtamplash sexi #3",
          ParentDeptName: "Direksiya va Boshqaruv",
          QuotaLimit: 40,
          Description: "Sanoat shtamplash liniyasi",
        },
        {
          DeptName: "Logistika va Ombormudirlik",
          ParentDeptName: "Global xarid va logistika",
          QuotaLimit: 30,
          Description: "Materiallar ombori va transport",
        },
        {
          DeptName: "Avtomatlashtirish Sexi",
          ParentDeptName: "Direksiya va Boshqaruv",
          QuotaLimit: 25,
          Description: "PLC va Robototexnika guruhi",
        },
      ];
    } else if (type === 'HSE') {
      filename = 'Med_Xavfsizlik_Shablon.xlsx';
      data = [
        {
          TabelNumber: "TB-1001",
          FullName: "Karimov Alisher Botirovich",
          Type: "MED_CHECKUP",
          Title: "Yillik Tibbiy Ko'rik",
          CheckupDate: "2026-08-12",
          ValidityMonths: 12,
          InstructorName: "Najot Tibbiyot Markazi",
          ClinicName: "Markaziy Poliklinika #4",
        },
        {
          TabelNumber: "TB-1002",
          FullName: "Tashmatov Javohir Anvarovich",
          Type: "BRIEFING",
          Title: "Elektr Xavfsizligi Yo'riqnomasi",
          CheckupDate: "2026-08-12",
          ValidityMonths: 3,
          InstructorName: "Ergashev J. (HSE Inspektor)",
          ClinicName: "Protokol #XAVF-2026-044",
        },
      ];
    } else {
      filename = 'Xodimlar_Baza_Shablon.xlsx';
      data = [
        {
          TabelNumber: "TB-2501",
          FullName: "Mirzayev Shahzod Anvarovich",
          BirthDate: "1994-05-14",
          HireDate: "2021-03-10",
          DepartmentName: "Shtamplash sexi #1",
          PositionName: "Payvandchi (5-Razryad Master)",
          Gender: "MALE",
          Phone: "+998901234567",
          Email: "tb-2501@enterprise-hr.uz",
        },
        {
          TabelNumber: "TB-2502",
          FullName: "Xodjayeva Nodira Farxodovna",
          BirthDate: "1997-11-20",
          HireDate: "2022-09-01",
          DepartmentName: "Logistika",
          PositionName: "Logistika Menejeri",
          Gender: "FEMALE",
          Phone: "+998909876543",
          Email: "tb-2502@enterprise-hr.uz",
        },
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Shablon');
    XLSX.writeFile(workbook, filename);
  };

  // ─── FILE PARSER ENGINE ─────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsing(true);
    setErrorMsg('');
    setSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(sheet);

        // Validate and normalize row fields according to importType
        const normalized = rawJson.map((row: any, idx: number) => {
          let isValid = true;
          let errors: string[] = [];

          if (importType === 'DEPARTMENTS') {
            const name = row.DeptName || row.Name || row["Bo'lim Nomi"] || '';
            if (!name) {
              isValid = false;
              errors.push("Bo'lim nomi kiritilmagan");
            }
            return {
              _rowId: idx + 1,
              name,
              parentName: row.ParentDeptName || row.ParentName || row["Yuqori Bo'lim"] || '',
              staffLimit: row.QuotaLimit || row.StaffLimit || 25,
              description: row.Description || row.Izoh || '',
              isValid,
              errors,
            };
          } else if (importType === 'HSE') {
            const tabelNumber = row.TabelNumber || row.TabelNo || row["Tabel №"] || '';
            if (!tabelNumber) {
              isValid = false;
              errors.push("Tabel raqami kiritilmagan");
            }
            return {
              _rowId: idx + 1,
              tabelNumber,
              fullName: row.FullName || row["F.I.O"] || '',
              type: row.Type || row.Turi || 'MED_CHECKUP',
              title: row.Title || row.Sarlavha || "Tibbiy Ko'rik",
              checkupDate: row.CheckupDate || row.CompletionDate || row.Sana || new Date().toISOString().split('T')[0],
              validityMonths: row.ValidityMonths || 12,
              instructorName: row.InstructorName || row.Shifoxona || '',
              clinicName: row.ClinicName || row.Klinika || '',
              isValid,
              errors,
            };
          } else {
            // EMPLOYEES
            const tabelNumber = row.TabelNumber || row.TabelNo || row["Tabel №"] || '';
            const fullName    = row.FullName || row["F.I.O"] || row.Name || '';
            const position    = row.PositionName || row.Position || row["Lavozimi"] || '';

            if (!tabelNumber) {
              isValid = false;
              errors.push("Tabel № kiritilmagan");
            }
            if (!fullName) {
              isValid = false;
              errors.push("Xodim F.I.O. kiritilmagan");
            }

            // Split full name into Last, First, Middle
            const parts = fullName.trim().split(/\s+/);
            const lastName = parts[0] || '';
            const firstName = parts[1] || '';
            const middleName = parts.slice(2).join(' ') || null;

            return {
              _rowId: idx + 1,
              tabelNumber,
              fullName,
              lastName,
              firstName,
              middleName,
              dateOfBirth: row.BirthDate || row.DateOfBirth || '1992-05-15',
              hireDate: row.HireDate || row["Ishga Kirgan Sana"] || new Date().toISOString().split('T')[0],
              departmentName: row.DepartmentName || row.Department || row["Bo'limi"] || '',
              position,
              gender: (row.Gender || '').toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE',
              phone: row.Phone || row.Telefon || '',
              email: row.Email || '',
              isValid,
              errors,
            };
          }
        });

        setParsedRows(normalized);
      } catch (err: any) {
        setErrorMsg(`Excel faylini o'qishda xatolik: ${err.message}`);
      }
      setParsing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // ─── 1-BUTTON BATCH IMPORT EXECUTION ───────────────────────────────────────
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg("Saqlash uchun to'g'ri qatorlar topilmadi");
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let endpoint = '/api/employees/import';
      let payloadKey = 'employees';

      if (importType === 'DEPARTMENTS') {
        endpoint = '/api/departments/import';
        payloadKey = 'departments';
      } else if (importType === 'HSE') {
        endpoint = '/api/hse/import';
        payloadKey = 'items';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [payloadKey]: validRows }),
      });

      const data = await res.json();
      setSaving(false);

      if (data.success) {
        const count = data.createdCount || data.medCreatedCount + data.safetyCreatedCount || validRows.length;
        setSuccessMsg(`🚀 Muvaffaqiyatli saqlandi! Bazaga ${count} ta yangi yozuv qo'shildi.`);
        setParsedRows([]);
        setFileName('');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setErrorMsg(data.error || "Bazaga saqlashda xatolik yuz berdi");
      }
    } catch (err: any) {
      setSaving(false);
      setErrorMsg(`Server bilam aloqada xatolik: ${err.message}`);
    }
  };

  const validCount   = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl glass-panel rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Ommaviy Excel / CSV Ma'lumotlarni Yuklash Tizimi
              </h3>
              <p className="text-xs text-slate-400">
                1-Tugma bilan 1500+ xodimlarni, bo'limlarni hamda HSE yozuvlarini bazaga integratsiya qilish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadSampleTemplate(importType)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-emerald-400 hover:bg-slate-700 hover:text-white transition"
            >
              <Download className="h-4 w-4" />
              Shablon Excel Yuklash (.xlsx)
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 space-y-5 text-xs">

          {/* Import Category Tabs */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-950/80 p-1">
            {[
              { id: 'EMPLOYEES', label: "Xodimlar Bazasi (1500+ Workers)", icon: Users },
              { id: 'DEPARTMENTS', label: "Tashkiliy Bo'limlar Ierarxiyasi", icon: Building2 },
              { id: 'HSE', label: "Med-Ko'rik va Xavfsizlik Shablonlari", icon: Stethoscope },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = importType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setImportType(tab.id as ImportType);
                    setParsedRows([]);
                    setFileName('');
                    setErrorMsg('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Drag & Drop Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-6 text-center bg-slate-950/40 cursor-pointer transition group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              {fileName ? fileName : "Excel yoki CSV faylini shu yerga tashlang"}
            </h4>
            <p className="text-xs text-slate-400">
              Komyuteringizdan <strong className="text-emerald-400">.xlsx</strong>, <strong className="text-emerald-400">.csv</strong> faylini tanlang
            </p>
          </div>

          {/* Validation Summary Bar */}
          {parsing ? (
            <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
              <span>Excel fayli o'qilmoqda va tekshirilmoqda...</span>
            </div>
          ) : parsedRows.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="text-xs font-semibold text-slate-300">
                    Jami o'qilgan qatorlar: <strong className="text-white font-mono">{parsedRows.length}</strong>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    To'g'ri (Yashil): {validCount}
                  </div>
                  {invalidCount > 0 && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Xatoli (Qizil): {invalidCount}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleExecuteImport}
                  disabled={validCount === 0 || saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-xl shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-500 active:scale-95 disabled:opacity-40 transition"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  🚀 1-Tugma Bilan Bazaga Saqlash ({validCount})
                </button>
              </div>

              {/* Parsed Rows Preview Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-center w-12">№</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      {importType === 'DEPARTMENTS' ? (
                        <>
                          <th className="px-3 py-2 text-left">Bo'lim Nomi</th>
                          <th className="px-3 py-2 text-left">Yuqori Bo'lim</th>
                          <th className="px-3 py-2 text-left">Kvote Limit</th>
                        </>
                      ) : importType === 'HSE' ? (
                        <>
                          <th className="px-3 py-2 text-left">Tabel №</th>
                          <th className="px-3 py-2 text-left">F.I.O</th>
                          <th className="px-3 py-2 text-left">Turi</th>
                          <th className="px-3 py-2 text-left">Sarlavha</th>
                        </>
                      ) : (
                        <>
                          <th className="px-3 py-2 text-left">Tabel №</th>
                          <th className="px-3 py-2 text-left">F.I.O (Xodim)</th>
                          <th className="px-3 py-2 text-left">Bo'limi</th>
                          <th className="px-3 py-2 text-left">Lavozimi</th>
                        </>
                      )}
                      <th className="px-3 py-2 text-left">Xatolik Izohi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                    {parsedRows.map((r) => (
                      <tr
                        key={r._rowId}
                        className={r.isValid ? 'hover:bg-emerald-500/5' : 'bg-rose-500/10 hover:bg-rose-500/15'}
                      >
                        <td className="px-3 py-2 text-center font-mono text-slate-500">{r._rowId}</td>
                        <td className="px-3 py-2">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3" /> TO'G'RI
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30">
                              <X className="h-3 w-3" /> XATO
                            </span>
                          )}
                        </td>

                        {importType === 'DEPARTMENTS' ? (
                          <>
                            <td className="px-3 py-2 font-bold text-slate-200">{r.name}</td>
                            <td className="px-3 py-2 text-slate-400">{r.parentName || '—'}</td>
                            <td className="px-3 py-2 font-mono text-slate-300">{r.staffLimit}</td>
                          </>
                        ) : importType === 'HSE' ? (
                          <>
                            <td className="px-3 py-2 font-mono font-bold text-indigo-400">{r.tabelNumber}</td>
                            <td className="px-3 py-2 font-semibold text-slate-200">{r.fullName || '—'}</td>
                            <td className="px-3 py-2 text-amber-400 font-bold">{r.type}</td>
                            <td className="px-3 py-2 text-slate-300">{r.title}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 font-mono font-bold text-indigo-400">{r.tabelNumber}</td>
                            <td className="px-3 py-2 font-semibold text-slate-200">{r.fullName}</td>
                            <td className="px-3 py-2 text-slate-400">{r.departmentName || '—'}</td>
                            <td className="px-3 py-2 text-slate-400">{r.position}</td>
                          </>
                        )}

                        <td className="px-3 py-2 text-rose-400 font-semibold text-[11px]">
                          {r.errors.length > 0 ? r.errors.join(', ') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {errorMsg && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-rose-300 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              {successMsg}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
