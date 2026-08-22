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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Ommaviy Excel / CSV Ma'lumotlarni Yuklash Tizimi
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                1-Tugma bilan xodimlarni, bo'limlarni hamda HSE yozuvlarini bazaga integratsiya qilish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadSampleTemplate(importType)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Shablon Excel Yuklash (.xlsx)
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 space-y-5 text-xs">

          {/* Import Category Tabs */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 p-1 shadow-sm">
            {[
              { id: 'EMPLOYEES', label: "Xodimlar Bazasi (Workers)", icon: Users },
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
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/40'
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
            className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-6 text-center transition-all shadow-sm cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
              {fileName ? fileName : "Faylni bering yoki bu yerga tashlang"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Komyuteringizdan <strong className="text-blue-600 dark:text-blue-400">.xlsx</strong>, <strong className="text-blue-600 dark:text-blue-400">.csv</strong> faylini tanlang
            </p>
          </div>

          {/* Validation Summary Bar */}
          {parsing ? (
            <div className="p-8 text-center text-slate-600 dark:text-slate-400 flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
              <span className="font-bold text-xs">Excel fayli o'qilmoqda va tekshirilmoqda...</span>
            </div>
          ) : parsedRows.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Jami o'qilgan qatorlar: <strong className="text-slate-900 dark:text-white font-mono font-extrabold">{parsedRows.length}</strong>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    To'g'ri (Yashil): {validCount}
                  </div>
                  {invalidCount > 0 && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 px-2.5 py-1 rounded-lg">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Xatolik (Qizil): {invalidCount}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleExecuteImport}
                  disabled={validCount === 0 || saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-xs font-extrabold shadow-sm active:scale-95 disabled:opacity-40 transition cursor-pointer"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  🚀 1-Tugma Bilan Bazaga Saqlash ({validCount})
                </button>
              </div>

              {/* Parsed Rows Preview Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-300 dark:border-slate-700">
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
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {parsedRows.map((r) => (
                      <tr
                        key={r._rowId}
                        className={r.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/30'}
                      >
                        <td className="px-3 py-2 text-center font-mono text-slate-500 font-bold">{r._rowId}</td>
                        <td className="px-3 py-2">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="h-3 w-3" /> TO'G'RI
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800">
                              <X className="h-3 w-3" /> XATO
                            </span>
                          )}
                        </td>

                        {importType === 'DEPARTMENTS' ? (
                          <>
                            <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">{r.name}</td>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">{r.parentName || '—'}</td>
                            <td className="px-3 py-2 font-mono text-slate-800 dark:text-slate-200 font-bold">{r.staffLimit}</td>
                          </>
                        ) : importType === 'HSE' ? (
                          <>
                            <td className="px-3 py-2 font-mono font-bold text-blue-700 dark:text-indigo-400">{r.tabelNumber}</td>
                            <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">{r.fullName || '—'}</td>
                            <td className="px-3 py-2 text-amber-700 dark:text-amber-400 font-bold">{r.type}</td>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">{r.title}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 font-mono font-bold text-blue-700 dark:text-indigo-400">{r.tabelNumber}</td>
                            <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">{r.fullName}</td>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">{r.departmentName || '—'}</td>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">{r.position}</td>
                          </>
                        )}

                        <td className="px-3 py-2 text-rose-700 dark:text-rose-400 font-bold text-[11px]">
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
            <div className="rounded-xl bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 p-3 text-rose-800 dark:text-rose-300 text-xs font-bold">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 p-3 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {successMsg}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
