import { PrismaClient } from '@prisma/client';
import { hashPassword } from './rbac';
import { APPROVAL_STEPS_CONFIG } from './leaveConfig';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Enterprise HR Database Seeding (52 Departments & 1500+ Employees)...');

  // 0. Clean existing data in correct dependency order
  console.log('🧹 Cleaning existing database records...');
  await prisma.leaveApprovalStep.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.kpiRecord.deleteMany();
  await prisma.rewardFinancialAid.deleteMany();
  await prisma.disciplinaryAction.deleteMany();
  await prisma.leaveAttendance.deleteMany();
  await prisma.departmentTransfer.deleteMany();
  await prisma.permitLicense.deleteMany();
  await prisma.education.deleteMany();
  await prisma.medicalCheckup.deleteMany();
  await prisma.safetyBriefing.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.userDepartmentAccess.deleteMany();
  await prisma.userModuleAccess.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hrUser.deleteMany();
  await prisma.systemModule.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();

  // 1. Seed System Modules
  console.log('📦 Seeding System Modules...');
  const moduleKeys = [
    { key: 'workforce', title: 'Xodimlar Kontingenti', iconName: 'Users', sortOrder: 1 },
    { key: 'departments', title: 'Tashkiliy Tuzilma', iconName: 'Building2', sortOrder: 2 },
    { key: 'kpi', title: 'KPI Engine & Deductions', iconName: 'TrendingUp', sortOrder: 3 },
    { key: 'svodka', title: 'Operativ Svodka', iconName: 'FileSpreadsheet', sortOrder: 4 },
    { key: 'transfers', title: "Kadrlar Ko'chishi (Rotatsiya)", iconName: 'ArrowRightLeft', sortOrder: 5 },
    { key: 'discipline', title: 'Intizom & Rag\'bat', iconName: 'Award', sortOrder: 6 },
    { key: 'davomat', title: 'Davomat & Ta\'tillar', iconName: 'Calendar', sortOrder: 7 },
    { key: 'arizalar', title: 'Arizalar & Hujjat Aylanishi', iconName: 'FileCheck', sortOrder: 8 },
    { key: 'hse', title: 'Mehnat Muhofazasi (HSE)', iconName: 'ShieldAlert', sortOrder: 9 },
    { key: 'audit', title: 'Audit Logs & Xavfsizlik', iconName: 'History', sortOrder: 10 },
  ];

  for (const m of moduleKeys) {
    await prisma.systemModule.create({ data: m });
  }

  // 2. Define 52 Enterprise Departments
  const deptNames = [
    "Direksiya va Boshqaruv",
    "Tarjimonlar bo'limi",
    "Global xarid va logistika",
    "Sifat nazorati boshqarmasi (QA/QC)",
    "Xom-ashyo ombori (Irmash)",
    "Kazakhstan CKD Loyihasi",
    "Shtamplash sexi #1",
    "Shtamplash sexi #2",
    "Payvandlash sexi (Weld Plant)",
    "Bo'yoqlash sexi (Paint Shop)",
    "Yig'uv sexi (Assembly Line A)",
    "Yig'uv sexi (Assembly Line B)",
    "Dvigatel yig'uv sexi",
    "Kolip va Shtamplarni Ta'mirlash (Die Maintenance)",
    "Robototexnika va PLC Avtomatlashtwristiruv",
    "Bosh Energetik Bo'limi",
    "Texnik Xizmat va Mexanika",
    "Eksport Logistikasi",
    "Ichki Transport Parki va KARA Xizmati",
    "Sifat Auditi va Laboratoriya",
    "Kadrlar Bilan Ishlash (HR Operations)",
    "Mehnat Muhofazasi va Sanoat Xavfsizligi (HSE)",
    "Moliyaviy Rejalashtirish va Buxgalteriya",
    "Tannarx va Audit",
    "IT Infratuzilma va Tarmoqlar",
    "Dasturiy Ta'minot va ERP Rivojlantirish",
    "Akkreditasiya va Sertifikatlashtirish",
    "Yuridik Xizmat",
    "Xavfsizlik va Turniket Nazorati",
    "Korporativ Kommunikatsiya va PR",
    "Tadqiqot va Ishlanmalar (R&D)",
    "Mahsulot Sinov Poligoni",
    "Lokalizatsiya va Import o'rnini bosish",
    "Ehtiyot Qismlar Ombori",
    "Gidravlika va Pnevmatika",
    "Instrumental Sex (Tooling Shop)",
    "Ventilyatsiya va Klimat Nazorati",
    "Ekologiya va Chiqindilarni Qayta Ishlash",
    "Ijtimoiy Ta'minot va Oshxona",
    "Kadrlar Malakasini Oshirish Markazi",
    "Strategik Marketing",
    "Dilerlik Tarmoqlarini Qo'llab-quvvatlash",
    "Kafolatli Xizmat Ko'rsatish (Warranty)",
    "Kompressor va Gaz Xo'jaligi",
    "Kabel va Elektr Tarmog'i",
    "Plastmassa Quyuv Sexi",
    "Galvanika va Qoplama",
    "Termik Ishlov Berish (Heat Treatment)",
    "Metrologiya va O'lchov Uskunalari",
    "Standardlashtirish va ISO",
    "Tashqi Aloqalar va Bojxona",
    "Kapital Qurilish va Ta'mirlash"
  ];

  console.log(`🏢 Creating ${deptNames.length} Enterprise Departments...`);
  const createdDepartments: any[] = [];

  for (let i = 0; i < deptNames.length; i++) {
    const code = `DEPT-${String(i + 1).padStart(2, '0')}`;
    const name = deptNames[i];
    const dept = await prisma.department.create({
      data: {
        code,
        name,
        description: `Sanoat korxonasining ${name} tarkibiy bo'linmasi`,
        staffLimit: 30 + Math.floor(Math.random() * 40),
      },
    });
    createdDepartments.push(dept);
  }

  // 3. Create Default Super Admin & HR User Accounts
  console.log('🔑 Creating Default Admin & HR Accounts...');
  const defaultAdminPasswordHash = await hashPassword('Admin123');
  const superAdminUser = await prisma.user.create({
    data: {
      username: 'Admin',
      email: 'admin@enterprise.uz',
      passwordHash: defaultAdminPasswordHash,
      fullName: 'Alisher Botirovich Karimov (Super Admin)',
      role: 'SUPER_ADMIN',
      position: 'Bosh Direktor / HR Admin',
      tabelNumber: 'TB-1000',
      userDepartmentId: createdDepartments[0].id,
      isActive: true,
    },
  });

  // Assign department access to Super Admin (all 52 departments)
  for (const dept of createdDepartments) {
    await prisma.userDepartmentAccess.create({
      data: {
        userId: superAdminUser.id,
        departmentId: dept.id,
      },
    });
  }

  // Assign module access to Super Admin (all 10 modules)
  for (const m of moduleKeys) {
    await prisma.userModuleAccess.create({
      data: {
        userId: superAdminUser.id,
        moduleKey: m.key,
        canEdit: true,
      },
    });
  }

  // Also seed in HrUser legacy model for backward compatibility
  await prisma.hrUser.create({
    data: {
      username: 'Admin',
      passwordHash: defaultAdminPasswordHash,
      fullName: 'Alisher Botirovich Karimov (Super Admin)',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // 4. Data generator helper pools for 1500+ employees
  const maleFirstNames = ['Alisher', 'Javohir', 'Sardor', 'Bekzod', 'Dilshod', 'Shahrzod', 'Jamshid', 'Otabek', 'Azamat', 'Rustam', 'Sherzod', 'Sanjar', 'Bobur', 'Ilhom', 'Qobil', 'Jasur', 'Farhod', 'Shohruh', 'Ulug\'bek', 'Davron', 'Anvar', 'Elyor', 'Umid', 'Muzaffar', 'Akmal'];
  const femaleFirstNames = ['Nodira', 'Malika', 'Sevara', 'Gulnoza', 'Feruza', 'Madina', 'Kamola', 'Zuhra', 'Shahnoza', 'Nilufar', 'Lola', 'Dildora', 'Zilola', 'Nargiza', 'Aziza'];
  const lastNames = ['Karimov', 'Tashmatov', 'Abdullayev', 'Usmanov', 'Raximov', 'Sultanov', 'Ismoilov', 'Kamilov', 'Nazarov', 'Yusupov', 'Xodjayev', 'Tursunov', 'Axmedov', 'Aliyev', 'Mirzayev', 'Qodirov', 'Qayumov', 'Sobirov', 'Ergashev', 'Oripov'];
  const maleMiddleNames = ['Anvarovich', 'Botirovich', 'Shavkatovich', 'Rustamovich', 'Dilshodovich', 'Jasurovich', 'Farxodovich', 'Ilhomovich', 'Qobilovich', 'Ulug\'bekovich'];
  const femaleMiddleNames = ['Anvarovna', 'Botirovna', 'Shavkatovna', 'Rustamovna', 'Dilshodovna', 'Jasurovna', 'Farxodovna', 'Ilhomovna', 'Qobilovna'];

  const positions = [
    'Bosh Muhandis',
    'Bosh Texnolog',
    'Sex Boshlig\'i',
    'Seksiya Boshlig\'i',
    'Katta Mutaxassis',
    'Logistika Menejeri',
    'Sifat Nazoratchisi (QA Inspector)',
    'PLC Dasturchi va Avtomatlashtirish Muhandisi',
    'Robot Operator',
    'Stanok Sozlovchisi (CNC Setter)',
    'Payvandchi (3-Razryad)',
    'Payvandchi (5-Razryad Master)',
    'Shtamplovchi',
    'KARA Haydovchisi (Forklift Operator)',
    'Omborxona Mudiri',
    'Omborchi',
    'KONTROLER (QC)',
    'Bosh Buxgalter O\'rinbosari',
    'HR Meneger',
    'HSE Inspektor',
    'Elekrik (4-Guruh)',
    'Mexanik-Ta\'mirchi',
    'Yig\'uvchi Usta (Assembler)',
    'Laborant',
    'Axborot Xavfsizligi Mutaxassisi'
  ];

  const institutions = [
    'Toshkent Davlat Texnika Universiteti (TDTU)',
    'Toshkent Avtomobil Yo\'llari Universiteti (TAYI)',
    'Toshkent Axborot Texnologiyalari Universiteti (TATU)',
    'Samarqand Davlat Universiteti',
    'Farg\'ona Politexnika Instituti',
    'Andijon Mashinasozlik Instituti',
    'Toshkent Sanoat va Avtomobil Kasset Kolleji',
    'Turin Politexnika Universiteti (TTPU)',
    'Inha Universiteti Toshkentda'
  ];

  const fieldsOfStudy = [
    'Mashinasozlik va Avtomatlashtirish',
    'Transport Logistikasi',
    'Dasturiy Muhandislik',
    'Mehnat Muhofazasi va Ekologiya',
    'Elektr Energetikasi',
    'Moliya va Buxgalteriya',
    'Materialshunoslik va Payvandlash',
    'Robototexnika',
    'Sanoat Menejmenti'
  ];

  const TOTAL_EMPLOYEES = 1500;
  console.log(`👨‍💼 Generating ${TOTAL_EMPLOYEES} Mock Employee Records...`);

  const createdEmployees: any[] = [];
  const empBatchData: any[] = [];

  for (let i = 1; i <= TOTAL_EMPLOYEES; i++) {
    const isFemale = i % 4 === 0;
    const firstName = isFemale 
      ? femaleFirstNames[i % femaleFirstNames.length] 
      : maleFirstNames[i % maleFirstNames.length];
    const lastName = lastNames[i % lastNames.length] + (isFemale ? 'a' : '');
    const middleName = isFemale 
      ? femaleMiddleNames[i % femaleMiddleNames.length] 
      : maleMiddleNames[i % maleMiddleNames.length];

    const tabelNumber = `TB-${1000 + i}`;
    const dept = createdDepartments[i % createdDepartments.length];
    const position = positions[i % positions.length];
    const isOnLeave = i % 25 === 0; // ~4% on leave

    // Spread hire dates from 2012 to 2026
    const hireYear = 2012 + (i % 14);
    const hireMonth = (i % 12);
    const hireDay = 1 + (i % 27);
    const hireDate = new Date(hireYear, hireMonth, hireDay);

    empBatchData.push({
      tabelNumber,
      firstName,
      lastName,
      middleName,
      gender: isFemale ? 'FEMALE' : 'MALE',
      currentDepartmentId: dept.id,
      position,
      status: isOnLeave ? 'ON_LEAVE' : 'ACTIVE',
      hireDate,
      dateOfBirth: new Date(1975 + (i % 25), i % 12, 1 + (i % 25)),
      phone: `+99890${String(1000000 + i).slice(0, 7)}`,
      email: `${tabelNumber.toLowerCase()}@enterprise-hr.uz`,
    });
  }

  // Insert in batches of 300 for SQLite efficiency
  for (let i = 0; i < empBatchData.length; i += 300) {
    const batch = empBatchData.slice(i, i + 300);
    for (const empData of batch) {
      const emp = await prisma.employee.create({ data: empData });
      createdEmployees.push(emp);
    }
  }

  console.log(`✅ Created ${createdEmployees.length} Employee records.`);

  // 5. Seed Child Records (Education, Permits, HSE, KPI, Leaves)
  console.log('🎖️ Seeding Child Records (Permits, Education, HSE, KPI)...');
  const sampleEmployees = createdEmployees.slice(0, 400);

  for (let idx = 0; idx < sampleEmployees.length; idx++) {
    const emp = sampleEmployees[idx];

    // Education
    await prisma.education.create({
      data: {
        employeeId: emp.id,
        level: idx % 2 === 0 ? 'HIGHER' : 'SECONDARY_SPECIAL',
        institutionName: institutions[idx % institutions.length],
        fieldOfStudy: fieldsOfStudy[idx % fieldsOfStudy.length],
        graduationYear: 2005 + (idx % 18),
      },
    });

    // Medical Checkup
    await prisma.medicalCheckup.create({
      data: {
        employeeId: emp.id,
        checkupDate: new Date(2025, idx % 12, 10),
        expiryDate: new Date(2026, idx % 12, 10),
        status: idx % 15 === 0 ? "MUDDATI_TUGAGAN" : "O'TGAN",
        clinicName: "Toshkent Shoshilinch Tibbiy Markazi #4",
        notes: "Yillik majburiy tibbiy ko'rikdan o'tdi",
      },
    });

    // Safety Briefing
    await prisma.safetyBriefing.create({
      data: {
        employeeId: emp.id,
        title: idx % 2 === 0 ? "Elektr Xavfsizligi va Stanok Yo'riqnomasi" : "Sanoat Xavfsizligi va Yong'in Xavfsizligi",
        completionDate: new Date(2026, 0, 15),
        expiryDate: new Date(2027, 0, 15),
        instructorName: "Ergashev Jamshid (Bosh HSE Inspektor)",
      },
    });

    // Permits
    if (idx % 2 === 0 || emp.position.includes('KARA')) {
      await prisma.permitLicense.create({
        data: {
          employeeId: emp.id,
          licenseType: emp.position.includes('KARA') ? 'FORKLIFT_KARA' : 'DRIVING',
          category: emp.position.includes('KARA') ? 'KARA Heavy Equipment' : 'B, C',
          certificateNo: `PERMIT-UZ-${900000 + idx}`,
          issueDate: new Date(2021, 1, 15),
          expiryDate: new Date(2028, 1, 15),
          status: 'ACTIVE',
        },
      });
    }

    // KPI record
    await prisma.kpiRecord.create({
      data: {
        employeeId: emp.id,
        month: '2026-08',
        baseBonus: 3500000,
        unworkedDays: idx % 5 === 0 ? 3 : 0,
        sickDays: idx % 7 === 0 ? 6 : 0,
        lateHours: idx % 4 === 0 ? 2 : 0,
        deductionPercentage: idx % 5 === 0 ? 7.5 : 0,
        finalBonus: idx % 5 === 0 ? 3237500 : 3500000,
        attendanceRate: idx % 5 === 0 ? 92.5 : 100,
      },
    });
  }

  // 6. Seed Sample Leave Requests with 6-Step Approval Workflows
  console.log('📄 Seeding Demo Leave Requests & 6-Step Approvals...');
  const leaveTypes = ['BS_UNPAID', 'MEHNAT_TATILI', 'SICK_LEAVE_BL', 'HOURLY_PERMIT'];
  const leaveReasons = [
    "Oilaviy sharoitiga ko'ra o'z hisobimdan navbatsiz ta'til berishingizni so'rayman.",
    "Navbatdagi yillik mehnat ta'tili grafik bo'yicha berilishi uchun.",
    "Shukronalik va salomatlikni tiklash maqsadida qisqa muddatli ruxsatnoma.",
    "Shaxsiy masalalar yuzasidan 2 ish kuniga o'z hisobimdan ta'til."
  ];

  const leaveSampleEmps = createdEmployees.slice(0, 30);

  for (let i = 0; i < leaveSampleEmps.length; i++) {
    const emp = leaveSampleEmps[i];
    const type = leaveTypes[i % leaveTypes.length];
    const reason = leaveReasons[i % leaveReasons.length];

    // Determine status (Pending, Approved, Rejected)
    const isApproved = i % 3 === 0;
    const isRejected = i % 7 === 0;
    const status = isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING';
    const currentStep = isApproved ? 6 : isRejected ? (1 + (i % 3)) : (1 + (i % 5));

    const startDate = new Date(2026, 7, 10 + (i % 10));
    const endDate = new Date(2026, 7, 12 + (i % 10));
    const totalDays = 3;

    const req = await prisma.leaveRequest.create({
      data: {
        employeeId: emp.id,
        type,
        requestDate: new Date(2026, 7, 1 + (i % 5)),
        startDate,
        endDate,
        totalDays,
        reason,
        status,
        currentStep,
        rejectionComment: isRejected ? "Hozirgi smenada ishchi kuchi yetishmasligi sababli rad etildi" : null,
      },
    });

    // Create the 6 approval steps for this request
    for (const cfg of APPROVAL_STEPS_CONFIG) {
      let stepStatus = 'PENDING';
      let approverName: string | null = null;
      let actionDate: Date | null = null;
      let comment: string | null = null;

      if (cfg.stepNumber < currentStep || isApproved) {
        stepStatus = 'APPROVED';
        approverName = `${cfg.label} (Mas'ul Rahbar)`;
        actionDate = new Date(2026, 7, 2 + cfg.stepNumber);
        comment = "Hujjat tekshirildi va tasdiqlandi";
      } else if (cfg.stepNumber === currentStep && isRejected) {
        stepStatus = 'REJECTED';
        approverName = `${cfg.label} (Mas'ul Rahbar)`;
        actionDate = new Date(2026, 7, 3);
        comment = "Smenada mutaxassis yetarli emas";
      } else if (cfg.stepNumber === currentStep && !isApproved) {
        stepStatus = 'PENDING';
        approverName = `${cfg.label}`;
      }

      await prisma.leaveApprovalStep.create({
        data: {
          requestId: req.id,
          stepNumber: cfg.stepNumber,
          approverRole: cfg.approverRole,
          approverName,
          status: stepStatus,
          comment,
          actionDate,
        },
      });
    }

    // Also populate LeaveAttendance if approved
    if (isApproved) {
      await prisma.leaveAttendance.create({
        data: {
          employeeId: emp.id,
          type: type === 'BS_UNPAID' ? 'BS' : type === 'SICK_LEAVE_BL' ? 'BL' : 'TATIL',
          startDate,
          endDate,
          totalDays,
          reason,
          status: 'APPROVED',
        },
      });
    }
  }

  console.log('🎉 Enterprise HR Database Seeding Finished Successfully!');
  console.log(`📊 Summary:
  - 52 Departments Created
  - 10 System Modules Created
  - 1 Super Admin User (Username: admin, Password: admin)
  - 1500 Employee Records Created (TB-1001 to TB-2500)
  - 400 Child Records (Education, HSE, Permits, KPI)
  - 30 Leave Requests with 6-Step Approval Workflows
  `);
}

main()
  .catch((e) => {
    console.error('❌ Database Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
