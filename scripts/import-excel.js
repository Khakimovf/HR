const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseExcelDate(value) {
  if (!value) return new Date('1990-01-01');
  
  if (typeof value === 'number') {
    const dateObj = XLSX.SSF.parse_date_code(value);
    if (dateObj && dateObj.y && dateObj.m && dateObj.d) {
      return new Date(Date.UTC(dateObj.y, dateObj.m - 1, dateObj.d));
    }
  }

  if (typeof value === 'string') {
    const parts = value.trim().split(/[\.\-\/]/);
    if (parts.length === 3) {
      // DD.MM.YYYY
      if (parts[2].length === 4) {
        return new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
      }
      // YYYY-MM-DD
      if (parts[0].length === 4) {
        return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
      }
    }
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return new Date('1990-01-01');
}

function parseFIO(fioString) {
  if (!fioString || typeof fioString !== 'string') {
    return { firstName: 'Noma\'lum', lastName: 'Xodim', middleName: null };
  }

  const parts = fioString.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0], middleName: null };
  }
  if (parts.length === 2) {
    return { lastName: parts[0], firstName: parts[1], middleName: null };
  }

  return {
    lastName: parts[0],
    firstName: parts[1],
    middleName: parts.slice(2).join(' ')
  };
}

async function importExcel() {
  console.log('📊 Starting Excel Data Import into Prisma Database...');

  const excelPath = path.resolve(__dirname, 'employees.xlsx');
  console.log(`📁 Reading Excel file from: ${excelPath}`);

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`📄 Loaded sheet "${sheetName}" with ${rows.length} rows.`);

  // Detect Department Name from Header Row 1 (Col 1)
  let defaultDeptName = 'Xodimlar bilan ishlash boʻlimi';
  if (rows[1] && rows[1][1] && typeof rows[1][1] === 'string') {
    defaultDeptName = rows[1][1].trim();
  }

  console.log(`🏢 Default Department: "${defaultDeptName}"`);

  // Filter valid employee data rows (numeric row number in index 0 and FIO in index 1)
  const employeeRows = [];
  for (let r = 3; r < rows.length; r++) {
    const row = rows[r];
    if (row && (typeof row[0] === 'number' || (row[0] && !isNaN(parseInt(row[0])))) && row[1]) {
      employeeRows.push(row);
    }
  }

  const totalEmployees = employeeRows.length;
  console.log(`👥 Found ${totalEmployees} employee records to import.\n`);

  let importedCount = 0;

  for (let i = 0; i < totalEmployees; i++) {
    const row = employeeRows[i];

    const rawFIO = row[1] ? String(row[1]).trim() : '';
    const rawPosition = row[2] ? String(row[2]).trim() : 'Mutaxassis';
    const rawGender = row[4] ? String(row[4]).trim().toLowerCase() : 'erkak';
    const rawTabel = row[5] !== undefined ? String(row[5]).trim() : String(i + 1);
    const rawDob = row[6];
    const rawHireDate = row[7];
    const rawCertifications = row[38] ? String(row[38]).trim() : null;
    const rawAddress = row[43] ? String(row[43]).trim() : null;

    // Normalize FIO
    const { firstName, lastName, middleName } = parseFIO(rawFIO);

    // Normalize Tabel Number (e.g. TB-0516)
    const tabelNumber = rawTabel.toUpperCase().startsWith('TB-')
      ? rawTabel.toUpperCase()
      : `TB-${rawTabel.padStart(4, '0')}`;

    // Normalize Gender
    const gender = (rawGender.includes('ayol') || rawGender.includes('fem')) ? 'FEMALE' : 'MALE';

    // Normalize Dates
    const dateOfBirth = parseExcelDate(rawDob);
    const hireDate = parseExcelDate(rawHireDate);

    // 1. Find or create Department
    let department = await prisma.department.findFirst({
      where: { name: defaultDeptName }
    });

    if (!department) {
      department = await prisma.department.create({
        data: {
          code: 'DEPT-HR',
          name: defaultDeptName,
          description: 'Kadrlar va xodimlarni boshqarish boʻlimi',
          staffLimit: 50,
        }
      });
      console.log(`✨ Created Department: "${department.name}" (${department.id})`);
    }

    // 2. Find or create Position
    let positionRef = await prisma.position.findFirst({
      where: {
        departmentId: department.id,
        title: rawPosition
      }
    });

    if (!positionRef) {
      positionRef = await prisma.position.create({
        data: {
          departmentId: department.id,
          title: rawPosition,
          quotaLimit: 5,
        }
      });
    }

    // 3. Upsert Employee
    await prisma.employee.upsert({
      where: { tabelNumber },
      update: {
        firstName,
        lastName,
        middleName,
        gender,
        dateOfBirth,
        hireDate,
        position: rawPosition,
        positionId: positionRef.id,
        currentDepartmentId: department.id,
        address: rawAddress,
        certifications: rawCertifications,
        status: 'ACTIVE',
      },
      create: {
        tabelNumber,
        firstName,
        lastName,
        middleName,
        gender,
        dateOfBirth,
        hireDate,
        position: rawPosition,
        positionId: positionRef.id,
        currentDepartmentId: department.id,
        address: rawAddress,
        certifications: rawCertifications,
        status: 'ACTIVE',
        employmentType: 'FULL_TIME',
        baseSalary: 5500000,
      }
    });

    importedCount++;
    console.log(`[${importedCount}/${totalEmployees}] Imported: ${lastName} ${firstName} (${tabelNumber}) - ${rawPosition}`);
  }

  console.log(`\n🎉 Import Complete! Successfully processed ${importedCount} employees into Prisma database.`);
}

importExcel()
  .catch((err) => {
    console.error('❌ Import failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
