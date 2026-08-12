'use client';

import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Users,
  Building2,
  Stethoscope,
  Rocket,
  X,
  FileCheck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const ImportHubView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'EMPLOYEES' | 'DEPARTMENTS' | 'HSE'>('EMPLOYEES');
  const [parsedRows, setParsedRows]       = useState<any[]>([]);
  const [fileName, setFileName]           = useState<string>('');
  const [parsing, setParsing]             = useState<boolean>(false);
  const [saving, setSaving]               = useState<boolean>(false);
  const [errorMsg, setErrorMsg]           = useState<string>('');
  const [successMsg, setSuccessMsg]       = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── TEMPLATE GENERATOR HANDLERS ──────────────────────────────────────────
  const downloadTemplate = (section: 'EMPLOYEES' | 'DEPARTMENTS' | 'HSE') => {
    let filename = '';
    let data: any[] = [];

    if (section === 'DEPARTMENTS') {
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
    } else if (section === 'HSE') {
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

  // ─── FILE PARSING ENGINE ──────────────────────────────────────────────────
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

        const normalized = rawJson.map((row: any, idx: number) => {
          let isValid = true;
          let errors: string[] = [];

          if (activeSection === 'DEPARTMENTS') {
            const name = row.DeptName || row.DepartmentName || row.Name || row["Bo'lim Nomi"] || '';
            if (!name) {
              isValid = false;
              errors.push("Bo'lim nomi shart");
            }
            return {
              _rowId: idx + 1,
              name,
              parentName: row.ParentDeptName || row.ParentDepartmentName || row["Yuqori Bo'lim"] || '',
              staffLimit: row.QuotaLimit || row.StaffLimit || 25,
              description: row.Description || row.Izoh || '',
              isValid,
              errors,
            };
          } else if (activeSection === 'HSE') {
            const tabelNumber = row.TabelNumber || row.TabelNo || row["Tabel №"] || '';
            if (!tabelNumber) {
              isValid = false;
              errors.push("Tabel raqami shart");
            }
            return {
              _rowId: idx + 1,
              tabelNumber,
              fullName: row.FullName || row["F.I.O"] || '',
              type: row.Type || row.Turi || 'MED_CHECKUP',
              title: row.Title || row.Sarlavha || "Tibbiy Ko'rik",
              checkupDate: row.CheckupDate || row.CompletionDate || new Date().toISOString().split('T')[0],
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
              errors.push("Xodim F.I.O kiritilmagan");
            }

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
        setErrorMsg(`Excel o'qishda xatolik: ${err.message}`);
      }
      setParsing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // ─── 1-BUTTON BATCH SAQLASH HANDLER ───────────────────────────────────────
  const handleSaveToDatabase = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg("Bazaga saqlash uchun to'g'ri qatorlar topilmadi");
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let endpoint = '/api/import/employees';
      let payloadKey = 'employees';

      if (activeSection === 'DEPARTMENTS') {
        endpoint = '/api/import/departments';
        payloadKey = 'departments';
      } else if (activeSection === 'HSE') {
        endpoint = '/api/import/hse';
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
        const count = data.createdCount || (data.medCreatedCount + data.safetyCreatedCount) || validRows.length;
        setSuccessMsg(`🚀 Muvaffaqiyatli saqlandi! Bazaga ${count} ta yangi yozuv integratsiya qilindi.`);
        setParsedRows([]);
        setFileName('');
      } else {
        setErrorMsg(data.error || "Bazaga saqlashda xatolik yuz berdi");
      }
    } catch (err: any) {
      setSaving(false);
      setErrorMsg(`Server bilan aloqa xatoligi: ${err.message}`);
    }
  };

  const validCount   = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Ommaviy Fayllarni Yuklash va Integratsiya Markazi
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              1500+ Xodimlarni, 70+ bo'limlar hamda HSE yo'riqnomalarini markaziy boshqaruv sahifasidan yuklash
            </p>
          </div>
        </div>

        <button
          onClick={() => downloadTemplate(activeSection)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-slate-700 hover:text-white transition shadow-md"
        >
          <Download className="h-4 w-4" />
          Shablonni Yuklab Olish (.xlsx)
        </button>
      </div>

      {/* 3 Main Import Category Cards Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            id: 'EMPLOYEES',
            title: "1. Xodimlarni Ommaviy Yuklash",
            subtitle: "1500+ Ishchilar bazasi, tabel № va lavozimlar",
            icon: Users,
            color: "from-indigo-600 to-blue-600",
          },
          {
            id: 'DEPARTMENTS',
            title: "2. Bo'limlar va Sexlarni Yuklash",
            subtitle: "70+ Bo'limlar ierarxiyasi va shtat kvotalari",
            icon: Building2,
            color: "from-purple-600 to-indigo-600",
          },
          {
            id: 'HSE',
            title: "3. Med-Ko'rik & HSE Shablonlari",
            subtitle: "Tibbiy ko'riqlar va xavfsizlik yo'riqnomalari",
            icon: Stethoscope,
            color: "from-emerald-600 to-teal-600",
          },
        ].map((card) => {
          const Icon = card.icon;
          const isActive = activeSection === card.id;
          return (
            <div
              key={card.id}
              onClick={() => {
                setActiveSection(card.id as any);
                setParsedRows([]);
                setFileName('');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isActive
                  ? 'bg-slate-900 border-emerald-500/80 shadow-2xl ring-2 ring-emerald-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="h-5 w-5" />
                </div>
                {isActive && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    FAOL TANLANGAN
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{card.title}</h3>
              <p className="text-xs text-slate-400">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Drag & Drop File Upload Dropzone */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center bg-slate-950/40 cursor-pointer transition group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
            <UploadCloud className="h-7 w-7" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">
            {fileName ? fileName : "Excel (.xlsx) yoki CSV faylingizni shu yerga tashlang"}
          </h4>
          <p className="text-xs text-slate-400">
            Kompyuteringizdan <strong className="text-emerald-400">.xlsx</strong>, <strong className="text-emerald-400">.csv</strong> fayllarni tanlang
          </p>
        </div>

        {/* Live Validation & Preview Section */}
        {parsing ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
            <span>Excel sheet o'qilmoqda va validator tomonidan tekshirilmoqda...</span>
          </div>
        ) : parsedRows.length > 0 ? (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-300 font-semibold">
                  Jami parsing qilingan: <strong className="text-white font-mono">{parsedRows.length}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  To'g me'zon (Yashil): {validCount}
                </span>
                {invalidCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-lg">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Xatolik (Qizil): {invalidCount}
                  </span>
                )}
              </div>

              <button
                onClick={handleSaveToDatabase}
                disabled={validCount === 0 || saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-xl shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-500 active:scale-95 disabled:opacity-40 transition"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                🚀 1-Tugma Bilan Bazaga Saqlash ({validCount})
              </button>
            </div>

            {/* Preview Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden max-h-[350px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-12">№</th>
                    <th className="px-3 py-2.5">Status</th>
                    {activeSection === 'DEPARTMENTS' ? (
                      <>
                        <th className="px-3 py-2.5">Bo'lim Nomi</th>
                        <th className="px-3 py-2.5">Yuqori Bo'lim</th>
                        <th className="px-3 py-2.5">Kvote Limit</th>
                      </>
                    ) : activeSection === 'HSE' ? (
                      <>
                        <th className="px-3 py-2.5">Tabel №</th>
                        <th className="px-3 py-2.5">F.I.O</th>
                        <th className="px-3 py-2.5">Turi</th>
                        <th className="px-3 py-2.5">Sarlavha</th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-2.5">Tabel №</th>
                        <th className="px-3 py-2.5">F.I.O (Xodim)</th>
                        <th className="px-3 py-2.5">Bo'limi</th>
                        <th className="px-3 py-2.5">Lavozimi</th>
                      </>
                    )}
                    <th className="px-3 py-2.5">Xatolik Izohi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
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

                      {activeSection === 'DEPARTMENTS' ? (
                        <>
                          <td className="px-3 py-2 font-bold text-slate-200">{r.name}</td>
                          <td className="px-3 py-2 text-slate-400">{r.parentName || '—'}</td>
                          <td className="px-3 py-2 font-mono text-slate-300">{r.staffLimit}</td>
                        </>
                      ) : activeSection === 'HSE' ? (
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
  );
};
