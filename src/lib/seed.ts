import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Enterprise HR Database Seeding (50+ Departments & 1500+ Employees)...');

  // Clean existing data
  await prisma.kpiRecord.deleteMany();
  await prisma.rewardFinancialAid.deleteMany();
  await prisma.disciplinaryAction.deleteMany();
  await prisma.leaveAttendance.deleteMany();
  await prisma.departmentTransfer.deleteMany();
  await prisma.permitLicense.deleteMany();
  await prisma.education.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();

  // 1. Define 52 Enterprise Departments
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
    "Robototexnika va PLC Avtomatlashtirish",
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
      },
    });
    createdDepartments.push(dept);
  }

  // 2. Data generator helper pools
  const maleFirstNames = ['Alisher', 'Javohir', 'Sardor', 'Bekzod', 'Dilshod', 'Shahrzod', 'Jamshid', 'Otabek', 'Azamat', 'Rustam', 'Sherzod', 'Sanjar', 'Bobur', 'Ilhom', 'Qobil', 'Jasur', 'Farhod', 'Shohruh', 'Ulug\'bek', 'Davron', 'Anvar', 'Elyor', 'Umid', 'Muzaffar', 'Akmal'];
  const femaleFirstNames = ['Nodira', 'Malika', 'Sevara', 'Gulnoza', 'Feruza', 'Madina', 'Kamola', 'Zuhra', 'Shahnoza', 'Nilufar', 'Lola', 'Dildora', 'Zilola', 'Nargiza', 'Aziza'];
  const lastNames = ['Karimov', 'Tashmatov', 'Abdullayev', 'Usmanov', 'Raximov', 'Sultanov', 'Ismoilov', 'Kamilov', 'Nazarov', 'Yusupov', 'Xodjayev', 'Tursunov', 'Axmedov', 'Aliyev', 'Mirzayev', 'Qodirov', 'Qayumov', 'Sobirov', 'Ergashev', 'Oripov'];
  const maleMiddleNames = ['Anvarovich', 'Botirovich', 'Shavkatovich', 'Rustamovich', 'Dilshodovich', 'Jasurovich', 'Farxodovich', 'Ilhomovich', 'Qobilovich', 'Ulug\'bekovich'];
  const femaleMiddleNames = ['Anvarovna', 'Botirovna', 'Shavkatovna', 'Rustamovna', 'Dilshodovna', 'Jasurovna', 'Farxodovna', 'Ilhomovna', 'Qobilovna'];

  const positions = [
    'Bosh Muhandis',
    'Bosh Texnolog',
    'Bo\'lim Boshlig\'i',
    'Sex Mudiri',
    'Katta Nazoratchi (QC)',
    'KARA / Avtoyuklagich Haydovchisi',
    'Shtamplash Operatori',
    'Konveyer Yig\'uvchisi',
    'PLC Avtomatlashtirish Muhandisi',
    'Tarjimon-Kordinatyor (Xitoy/Koreys/Ingliz)',
    'Logistika Menejeri',
    'Omborxona Mudiri',
    'Laborant-Kimyogar',
    'Mехаnik-Sozlovchi',
    'Bosh Energetik',
    'HSE Sanoat Xavfsizligi Mutaxassisi',
    'Xalqaro Yuk Tashuvchi Haydovchi',
    'IT Infratuzilma Muhandisi',
    'Moliya Tahlilchisi',
    'Turniket Xavfsizlik Nazoratchisi'
  ];

  const institutions = [
    'Toshkent Davlat Texnika Universiteti (TDTU)',
    'Toshkent Avtomobil Yo\'llari Universiteti (TAYI)',
    'Toshkent Axborot Texnologiyalari Universiteti (TATU)',
    'O\'zbekiston Milliy Universiteti (O\'zMU)',
    'Toshkent Kimyo-Texnologiya Instituti (TKTI)',
    'Samarqand Davlat Universiteti (SamDU)',
    'Andijon Mashinasozlik Instituti',
    'Toshkent Sanoat Kolleji'
  ];

  const fieldsOfStudy = [
    'Mashinasozlik va Avtomatlashtirish',
    'Transport Logistikasi',
    'Axborot Xavfsizligi va IT',
    'Sanoat Muhandisligi',
    'Biznesni Boshqarish (MBA)',
    'Kimyoviy Texnologiyalar',
    'Elektr energetika',
    'Xalqaro Huquq va Tarjimonlik'
  ];

  const TOTAL_EMPLOYEES = 1500;
  console.log(`👥 Generating ${TOTAL_EMPLOYEES} realistic enterprise employee records...`);

  // Batch insert optimization for high speed
  const empBatches = [];
  const batchSize = 100;

  for (let i = 1; i <= TOTAL_EMPLOYEES; i++) {
    const isFemale = i % 5 === 0;
    const gender = isFemale ? 'FEMALE' : 'MALE';
    const firstName = isFemale ? femaleFirstNames[i % femaleFirstNames.length] : maleFirstNames[i % maleFirstNames.length];
    const lastName = lastNames[i % lastNames.length] + (isFemale ? 'a' : '');
    const middleName = isFemale ? femaleMiddleNames[i % femaleMiddleNames.length] : maleMiddleNames[i % maleMiddleNames.length];

    const tabelNumber = `TB-${8000 + i}`;
    const dept = createdDepartments[i % createdDepartments.length];
    const position = positions[i % positions.length];

    const birthYear = 1970 + (i % 32);
    const dateOfBirth = new Date(birthYear, i % 12, (i % 27) + 1);

    const hireYear = 2010 + (i % 15);
    const hireDate = new Date(hireYear, (i * 2) % 12, (i * 3) % 27 + 1);

    const status = i % 25 === 0 ? 'ON_LEAVE' : i % 40 === 0 ? 'OFFBOARDED' : 'ACTIVE';
    const militaryCert = !isFemale ? `HBI-${700000 + i} (Zaxiradagi serjant)` : null;

    const phone = `+998 90 ${100 + (i % 899)} ${10 + (i % 89)} ${10 + ((i * 3) % 89)}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@enterprise-hr.uz`;

    const empData = {
      id: `emp-id-${i}`,
      tabelNumber,
      firstName,
      lastName,
      middleName,
      gender,
      dateOfBirth,
      hireDate,
      status,
      phone,
      email,
      militaryCertificate: militaryCert,
      currentDepartmentId: dept.id,
      position,
    };

    empBatches.push(empData);
  }

  // Create Employees in chunks
  console.log('⚡ Inserting employees into SQLite database...');
  for (let i = 0; i < empBatches.length; i += batchSize) {
    const chunk = empBatches.slice(i, i + batchSize);
    await prisma.employee.createMany({
      data: chunk,
    });
  }

  console.log('🎖️ Seeding Permits, Education, Leaves, Transfers, Discipline & KPI records for employees...');

  // Select sample subset for rich child records
  const sampleEmployees = await prisma.employee.findMany({ take: 300 });

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

    // Permits & Licenses
    if (idx % 2 === 0 || emp.position.includes('KARA') || emp.position.includes('Haydovchi')) {
      await prisma.permitLicense.create({
        data: {
          employeeId: emp.id,
          licenseType: 'DRIVING',
          category: idx % 3 === 0 ? 'A, B, C, D, E, F' : 'B, C',
          certificateNo: `DL-UZ-${900000 + idx}`,
          issueDate: new Date(2019, 1, 15),
          expiryDate: new Date(2029, 1, 15),
          status: 'ACTIVE',
        },
      });
    }

    if (idx % 3 === 0 || emp.position.includes('KARA')) {
      await prisma.permitLicense.create({
        data: {
          employeeId: emp.id,
          licenseType: 'FORKLIFT_KARA',
          category: 'KARA Heavy Equipment Operator',
          certificateNo: `KARA-PERMIT-${1000 + idx}`,
          issueDate: new Date(2021, 4, 10),
          expiryDate: new Date(2027, 12, 31),
          status: 'ACTIVE',
        },
      });
    }

    if (idx % 4 === 0 || emp.position.includes('Bosh') || emp.position.includes('Menejer')) {
      await prisma.permitLicense.create({
        data: {
          employeeId: emp.id,
          licenseType: 'MOBILE_PHONE_ON_SITE',
          category: 'Ruxsat etilgan Smartfon',
          certificateNo: `PHONE-ALLOW-${500 + idx}`,
          issueDate: new Date(2024, 0, 1),
          expiryDate: new Date(2027, 0, 1),
          status: 'ACTIVE',
        },
      });
    }

    // Professional Certs
    await prisma.permitLicense.create({
      data: {
        employeeId: emp.id,
        licenseType: 'PROFESSIONAL_CERT',
        category: 'Sanoat Xavfsizligi va HSE Sertifikati',
        certificateNo: `HSE-CERT-${2000 + idx}`,
        issueDate: new Date(2023, 2, 1),
        expiryDate: new Date(2026, 2, 1),
        status: 'ACTIVE',
      },
    });

    // Leave records
    if (idx % 5 === 0) {
      await prisma.leaveAttendance.create({
        data: {
          employeeId: emp.id,
          type: 'BS',
          startDate: new Date(2026, 7, 1),
          endDate: new Date(2026, 7, 3),
          totalDays: 3,
          reason: 'Oilaviy sharoitiga ko\'ra (O\'z hisobidan ta\'til)',
          status: 'APPROVED',
        },
      });
    }

    if (idx % 7 === 0) {
      await prisma.leaveAttendance.create({
        data: {
          employeeId: emp.id,
          type: 'BL',
          startDate: new Date(2026, 6, 12),
          endDate: new Date(2026, 6, 18),
          totalDays: 6,
          reason: 'Kasallik varaqasi (B/L)',
          status: 'APPROVED',
        },
      });
    }

    // Disciplinary Actions
    if (idx % 12 === 0) {
      await prisma.disciplinaryAction.create({
        data: {
          employeeId: emp.id,
          orderNumber: `BUYRUK-DISC-${300 + idx}`,
          type: 'WARNING',
          startDate: new Date(2026, 1, 15),
          expiryDate: new Date(2027, 1, 15),
          status: 'ACTIVE',
          notes: 'Ish smenasiga kechikkanligi va intizom buzilishi uchun hayfsan',
        },
      });
    }

    // Transfers
    if (idx % 9 === 0) {
      const prevDept = createdDepartments[(idx + 1) % createdDepartments.length];
      await prisma.departmentTransfer.create({
        data: {
          employeeId: emp.id,
          fromDepartmentId: prevDept.id,
          toDepartmentId: emp.currentDepartmentId,
          transferDate: new Date(2025, idx % 12, 10),
          orderNumber: `BUYRUK-TR-${500 + idx}`,
          reason: 'Ishlab chiqarish zaruriyati va rotatsiya dasturi',
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

  console.log('✅ Enterprise HR Database Seeding Completed Successfully (1500 Employees & 52 Departments)!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
