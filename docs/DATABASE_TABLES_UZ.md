# Ma'lumotlar bazasi jadvallari (24 ta)

DigitalOcean MySQL ga o'tganda ham **xuddi shu 24 ta jadval** yaratiladi.

Manba: `prisma/schema.prisma`

---

## 1. Tashkilot va kadrlar

### `Department` — Bo'limlar

**Ma'nosi:** Korxona bo'limlari, ierarxiya va shtat chegarasi.

| Ustun | Turi | Izoh |
|-------|------|------|
| id | String (UUID) | Asosiy kalit |
| code | String? | Bo'lim kodi (masalan: DEPT-01) |
| name | String | Bo'lim nomi |
| description | String? | Tavsif |
| parentId | String? | Yuqori bo'lim (ierarxiya) |
| staffLimit | Int? | Shtat chegarasi |
| createdAt, updatedAt | DateTime | Yaratilgan / yangilangan vaqt |

**Bog'lanishlar:** Position, Employee, User, KpiTemplate

---

### `Position` — Lavozimlar

**Ma'nosi:** Har bir bo'limdagi lavozimlar, kvota va boshqaruv zanjiri.

| Ustun | Turi | Izoh |
|-------|------|------|
| id | String | Asosiy kalit |
| departmentId | String | Bo'lim ID |
| title | String | Lavozim nomi |
| quotaLimit | Int | Lavozim kvotasi |
| reportsToPositionId | String? | Kimga hisobot beradi |

**Bog'lanishlar:** Department, Employee

---

### `Employee` — Xodimlar

**Ma'nosi:** Barcha xodimlar haqidagi asosiy ma'lumot (kadrlar kartochkasi).

| Guruh | Asosiy ustunlar |
|-------|-----------------|
| Shaxsiy | tabelNumber, firstName, lastName, middleName, gender, dateOfBirth, phone, email, pinfl, passportNumber |
| Ish | currentDepartmentId, position, positionId, hireDate, status, employmentType, baseSalary, workSchedule |
| Ta'lim | educationLevel, institutionName, fieldOfStudy, diplomaNumber, foreignLanguages |
| Oilaviy | maritalStatus, familyCount, emergencyContactName, emergencyContactPhone |
| Hujjatlar | passportScanUrl, diplomaScanUrl, contractPdfUrl, stirInpsPdfUrl, avatarUrl |

**Status:** ACTIVE, ON_LEAVE, TRANSFERRED, OFFBOARDED

**Bog'lanishlar:** Education, Leave, KPI, HSE, Discipline va boshqalar

---

### `Education` — Ta'lim tarixi

**Ma'nosi:** Xodimning alohida ta'lim yozuvlari.

| Ustun | Izoh |
|-------|------|
| employeeId | Xodim ID |
| level | Ta'lim darajasi (HIGHER, SECONDARY_SPECIAL...) |
| institutionName | O'quv muassasasi |
| fieldOfStudy | Mutaxassislik |
| graduationYear | Bitirgan yili |

---

## 2. Ko'chirish, davomat va ta'til

### `DepartmentTransfer` — Bo'lim o'tkazmalari

**Ma'nosi:** Xodimning bo'limdan bo'limga ko'chirish tarixi.

| Ustun | Izoh |
|-------|------|
| employeeId | Xodim |
| fromDepartmentId | Qaysi bo'limdan |
| toDepartmentId | Qaysi bo'limga |
| transferDate | O'tkazish sanasi |
| orderNumber | Buyruq raqami |
| reason | Sabab |

---

### `LeaveAttendance` — Ta'til va davomat yozuvlari

**Ma'nosi:** Mehnat ta'tili, kasallik, kechikish, ruxsatnoma va h.k.

| Ustun | Izoh |
|-------|------|
| type | MEHNAT_TATILI, BS_UNPAID, SICK_LEAVE_BL, OTGUL, ADMIN_TATIL... |
| startDate, endDate | Boshlanish / tugash |
| totalDays | Kunlar soni |
| totalHours, startTime, endTime | Soatlik ruxsatnomalar uchun |
| status | ACTIVE, COMPLETED, CANCELLED |
| orderNumber, reason | Buyruq / sabab |

---

### `LeaveRequest` — Ta'til arizalari

**Ma'nosi:** 6 bosqichli tasdiqlash jarayonidagi arizalar.

| Ustun | Izoh |
|-------|------|
| type | BS_UNPAID, MEHNAT_TATILI, SICK_LEAVE_BL, HOURLY_PERMIT |
| startDate, endDate, totalDays | Ta'til davri |
| status | PENDING, APPROVED, REJECTED, CANCELLED |
| currentStep | Joriy bosqich (1–6) |
| step3ApproverType | 3-bosqich tasdiqlovchi turi |
| rejectionComment | Rad etish sababi |

---

### `LeaveApprovalStep` — Tasdiqlash bosqichlari

**Ma'nosi:** Har bir ariza uchun 6 bosqichli tasdiqlash holati.

| Ustun | Izoh |
|-------|------|
| requestId | Ariza ID |
| stepNumber | Bosqich (1–6) |
| approverRole | DEPARTMENT_HEAD, HR_OFFICER, TECHNICAL_DIRECTOR... |
| approverName | Tasdiqlovchi ismi |
| status | PENDING, APPROVED, REJECTED |
| comment, actionDate | Izoh va harakat vaqti |

**6 bosqich:** Bo'lim boshlig'i → HR → Texnik direktor → O'rinbosar → Moliya → Bosh direktor

---

## 3. KPI tizimi

### `KpiRecord` — KPI / bonus yozuvlari (eski)

**Ma'nosi:** Oylik bonus va davomat asosidagi hisob-kitob.

| Ustun | Izoh |
|-------|------|
| month | Oy |
| baseBonus, finalBonus | Asosiy va yakuniy bonus |
| unworkedDays, sickDays, lateHours | Hisobga olinadigan kun/soat |
| deductionPercentage | Ushlab qolish foizi |
| attendanceRate | Davomat foizi |

---

### `KpiTemplate` — KPI shablonlari

**Ma'nosi:** Bo'lim/lavozim uchun KPI baholash shabloni.

| Ustun | Izoh |
|-------|------|
| departmentId | Bo'lim |
| position | Lavozim (ixtiyoriy) |
| title | Shablon nomi |

---

### `KpiCriterion` — KPI mezonlari

**Ma'nosi:** Shablon ichidagi baholash mezonlari.

| Ustun | Izoh |
|-------|------|
| templateId | Shablon ID |
| name | Mezon nomi |
| weight | Vazn (%) |
| target | Maqsad |

---

### `KpiEvaluation` — KPI baholash

**Ma'nosi:** Xodimning davriy KPI bahosi.

| Ustun | Izoh |
|-------|------|
| employeeId, departmentId | Xodim va bo'lim |
| period | Davr (masalan: 2026-08) |
| totalScore | Umumiy ball (0–100) |
| status | EXCELLENT, GOOD, AVERAGE, UNSATISFACTORY |
| notes | Izohlar |

---

### `KpiCriterionScore` — Mezon bo'yicha ball

**Ma'nosi:** Har bir baholash ichidagi mezon ballari.

| Ustun | Izoh |
|-------|------|
| evaluationId | Baholash ID |
| criterionName | Mezon nomi |
| weight, score | Vazn va ball |

---

## 4. HSE — Xavfsizlik va salomatlik

### `MedicalCheckup` — Tibbiy ko'rik

**Ma'nosi:** Xodimning tibbiy ko'rik ma'lumotlari.

| Ustun | Izoh |
|-------|------|
| checkupDate, expiryDate | Ko'rik va amal qilish muddati |
| validityMonths | Amal qilish (6 yoki 12 oy) |
| status | O'TGAN, O'TMAGAN, MUDDATI_TUGAGAN |
| clinicName, orderRef, notes | Klinika, buyruq, izoh |

---

### `SafetyBriefing` — Xavfsizlik yo'riqnomasi

**Ma'nosi:** Xodimning xavfsizlik o'qitish / brifing yozuvlari.

| Ustun | Izoh |
|-------|------|
| title | Mavzu (masalan: Elektr xavfsizligi) |
| completionDate, expiryDate | Bajarilgan va tugash sanasi |
| validityDays | Amal qilish kunlari (90 yoki 365) |
| instructorName, protocolNumber | O'qituvchi, protokol raqami |

---

### `PermitLicense` — Litsenziya va sertifikatlar

**Ma'nosi:** Haydovchilik, vilka, telefon va boshqa ruxsatnomalar.

| Ustun | Izoh |
|-------|------|
| licenseType | DRIVING, FORKLIFT_KARA, MOBILE_PHONE_ON_SITE... |
| category | Kategoriya (A, B, C...) |
| certificateNo | Sertifikat raqami |
| issueDate, expiryDate | Berilgan va tugash sanasi |
| status | ACTIVE, EXPIRED |

---

## 5. Intizom va mukofot

### `DisciplinaryAction` — Intizomiy chora

**Ma'nosi:** Ogohlantirish, hayfsan, jazo va h.k.

| Ustun | Izoh |
|-------|------|
| type | WARNING, REPRIMAND, SEVERE_REPRIMAND, FINANCIAL_PENALTY |
| orderNumber | Buyruq raqami |
| startDate, expiryDate | Boshlanish / tugash |
| status | ACTIVE, EXPIRED, CANCELLED |
| notes | Izoh |

---

### `RewardFinancialAid` — Mukofot va moddiy yordam

**Ma'nosi:** Mukofot, bonus, moddiy yordam.

| Ustun | Izoh |
|-------|------|
| type | REWARD, FINANCIAL_AID, BONUS |
| amount | Summa |
| reason | Sabab |
| orderNumber, orderDate | Buyruq raqami va sanasi |

---

## 6. Foydalanuvchilar va ruxsatlar (RBAC)

### `User` — Tizim foydalanuvchilari

**Ma'nosi:** Login qiladigan HR xodimlari va adminlar.

| Ustun | Izoh |
|-------|------|
| username, email | Login va email |
| passwordHash | Parol (xesh) |
| fullName, tabelNumber, position | F.I.O, tabel, lavozim |
| role | SUPER_ADMIN, EXECUTIVE_DIRECTOR, HR_OFFICER, AUDITOR |
| userDepartmentId | Asosiy bo'lim |
| isActive | Faol / faol emas |

---

### `UserDepartmentAccess` — Bo'lim ruxsatlari

**Ma'nosi:** Foydalanuvchi qaysi bo'limlarga kirishi mumkin.

| Ustun | Izoh |
|-------|------|
| userId | Foydalanuvchi |
| departmentId | Bo'lim |

---

### `SystemModule` — Tizim modullari

**Ma'nosi:** workforce, kpi, hse, audit va boshqa modullar ro'yxati.

| Ustun | Izoh |
|-------|------|
| key | Modul kaliti (asosiy kalit) |
| title | Modul nomi |
| iconName | Ikonka |
| sortOrder | Tartib raqami |

---

### `UserModuleAccess` — Modul ruxsatlari

**Ma'nosi:** Foydalanuvchi qaysi modulda tahrirlash huquqiga ega.

| Ustun | Izoh |
|-------|------|
| userId | Foydalanuvchi |
| moduleKey | Modul |
| canEdit | Tahrirlash ruxsati |

---

### `HrUser` — Eski foydalanuvchi modeli (legacy)

**Ma'nosi:** Eski versiya bilan moslik uchun saqlangan jadval.

| Ustun | Izoh |
|-------|------|
| username, passwordHash | Login ma'lumotlari |
| fullName, role | Ism va rol |
| assignedDepartments | Bo'limlar (matn) |
| isActive | Faol holati |

---

## 7. Tizim va audit

### `AuditLog` — Audit jurnali

**Ma'nosi:** Kim, qachon, nima o'zgartirgani haqida yozuv.

| Ustun | Izoh |
|-------|------|
| hrUserId, hrName | Kim o'zgartirdi |
| action | Harakat tavsifi |
| targetEmployeeId | Qaysi xodim |
| fieldChanged, oldValue, newValue | O'zgargan maydon |
| departmentName, ipAddress | Bo'lim, IP |
| metadata | Qo'shimcha JSON ma'lumot |

---

### `Announcement` — Tizim e'lonlari

**Ma'nosi:** Dashboarddagi yangilanish va e'lonlar (UZ/KR).

| Ustun | Izoh |
|-------|------|
| title_uz, title_kr | Sarlavha |
| content_uz, content_kr | Matn |
| category | FEATURE, UPDATE, MAINTENANCE, IMPORTANT |
| affectedModule | ALL, KPI, ATTENDANCE... |
| priority | HIGH, MEDIUM, LOW |
| is_published | Nashr qilinganmi |

---

## Umumiy tuzilma

```
Department
    ├── Position
    ├── Employee ──┬── Education
    │              ├── DepartmentTransfer
    │              ├── LeaveAttendance
    │              ├── LeaveRequest → LeaveApprovalStep
    │              ├── KpiRecord / KpiEvaluation
    │              ├── MedicalCheckup / SafetyBriefing
    │              ├── PermitLicense
    │              └── DisciplinaryAction / RewardFinancialAid
    └── KpiTemplate → KpiCriterion

User ──┬── UserDepartmentAccess
       ├── UserModuleAccess
       └── AuditLog

SystemModule ← UserModuleAccess
Announcement (mustaqil)
HrUser (legacy)
```

---

## Qisqa xulosa

| Guruh | Jadvallar soni | Vazifasi |
|-------|----------------|----------|
| Tashkilot va kadrlar | 4 | Bo'lim, lavozim, xodim, ta'lim |
| Ko'chirish va ta'til | 4 | O'tkazma, davomat, ariza, tasdiqlash |
| KPI | 5 | Shablon, baholash, bonus |
| HSE | 3 | Tibbiy ko'rik, xavfsizlik, litsenziya |
| Intizom | 2 | Jazo va mukofot |
| Foydalanuvchi / RBAC | 5 | Login, ruxsatlar |
| Tizim | 2 | Audit va e'lonlar |
| **Jami** | **24** | |
