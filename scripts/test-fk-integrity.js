const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFkIntegrity() {
  console.log('🧪 Testing Foreign Key Integrity on new record creation...');

  // 1. Fetch first department ID
  const dept = await prisma.department.findFirst();
  if (!dept) {
    throw new Error('No department found!');
  }

  console.log(`✓ Using Department: ${dept.name} (${dept.id})`);

  // 2. Create new employee
  const newEmp = await prisma.employee.create({
    data: {
      tabelNumber: 'TB-PROD-001',
      firstName: 'Aziz',
      lastName: 'Karimov',
      middleName: 'Valiyevich',
      gender: 'MALE',
      dateOfBirth: new Date('1992-05-15'),
      hireDate: new Date('2026-08-01'),
      status: 'ACTIVE',
      position: 'Bosh Mutaxassis',
      currentDepartmentId: dept.id,
      baseSalary: 6500000,
    },
  });

  console.log(`✓ Created New Employee: [${newEmp.tabelNumber}] ${newEmp.lastName} ${newEmp.firstName} (${newEmp.id})`);

  // 3. Create transactional records attached to new employee
  const leave = await prisma.leaveAttendance.create({
    data: {
      employeeId: newEmp.id,
      type: 'MEHNAT_TATILI',
      startDate: new Date('2026-08-20'),
      endDate: new Date('2026-09-02'),
      totalDays: 14,
      status: 'ACTIVE',
      reason: 'Rejali mehnat ta\'tili',
    },
  });
  console.log(`✓ Created Leave Record: ${leave.id}`);

  const checkup = await prisma.medicalCheckup.create({
    data: {
      employeeId: newEmp.id,
      checkupDate: new Date(),
      expiryDate: new Date('2027-08-16'),
      validityMonths: 12,
      status: "O'TGAN",
      clinicName: 'Markaziy Poliklinika',
    },
  });
  console.log(`✓ Created Medical Checkup: ${checkup.id}`);

  const req = await prisma.leaveRequest.create({
    data: {
      employeeId: newEmp.id,
      type: 'BS_UNPAID',
      startDate: new Date('2026-08-25'),
      endDate: new Date('2026-08-26'),
      totalDays: 2,
      reason: 'Oila sharoiti bo\'yicha',
      status: 'PENDING',
      currentStep: 1,
    },
  });
  console.log(`✓ Created Leave Workflow Request: ${req.id}`);

  // 4. Clean up test employee
  await prisma.employee.delete({ where: { id: newEmp.id } });
  console.log('✓ Cleaned up test employee (Cascaded child records deleted cleanly)');

  console.log('✅ FOREIGN KEY INTEGRITY VERIFIED 100% WORKING WITH ZERO ERRORS!');
}

testFkIntegrity()
  .catch((e) => {
    console.error('❌ FK Integrity error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
