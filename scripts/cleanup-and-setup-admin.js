/**
 * cleanup-and-setup-admin.js
 *
 * One-shot cleanup + admin bootstrap script.
 *
 * What this script does:
 *  1. Identifies the 9 REAL employees imported from employees.xlsx
 *     (tabelNumbers starting with TB-0xxx, TB-1140, TB-1972, TB-2002, TB-2203).
 *  2. Deletes ALL fake/seeded employees that are NOT in that set.
 *  3. Deletes ALL departments that have 0 employees remaining after the purge.
 *  4. Deletes ALL non-admin users.
 *  5. Upserts 9 SystemModules into the SystemModule table.
 *  6. Upserts a SINGLE SUPER_ADMIN user (admin / admin123 via bcrypt) with
 *     full access to all 9 modules and all real departments.
 *
 * Safe: Does NOT delete or touch the 9 real employee records from employees.xlsx.
 *
 * Run: node scripts/cleanup-and-setup-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// The 9 tabel numbers imported directly from employees.xlsx
const REAL_TABEL_NUMBERS = [
  'TB-0516',  // MADRAXIMOVA
  'TB-2002',  // SAIDOV
  'TB-0026',  // RUZIAXUNOV
  'TB-0511',  // BOBAJONOV
  'TB-0315',  // AXMADJONOVA
  'TB-2203',  // TOJIDINOV
  'TB-1972',  // ESANOV
  'TB-0796',  // YAXSHIBOYEV
  'TB-1140',  // QURBONOV
];

const SYSTEM_MODULES = [
  { key: 'workforce',   title: 'Xodimlar Baza va Profil Kartalari',       iconName: 'Users',          sortOrder: 1 },
  { key: 'departments', title: "Bo'limlar Ierarxiyasi va Strukturasi",     iconName: 'GitFork',        sortOrder: 2 },
  { key: 'kpi',         title: 'KPI & Mukofot Dvigateli',                  iconName: 'Calculator',     sortOrder: 3 },
  { key: 'svodka',      title: 'Ijroiy Svodka & Hisobot',                  iconName: 'FileBarChart',   sortOrder: 4 },
  { key: 'transfers',   title: "Bo'limlararo Ko'chish (Rotatsiya)",         iconName: 'ArrowLeftRight', sortOrder: 5 },
  { key: 'discipline',  title: 'Intizomiy Jazo & Mukofotlar Logi',         iconName: 'ShieldAlert',    sortOrder: 6 },
  { key: 'davomat',     title: "Davomat & Ta'tillar Boshqaruvi",           iconName: 'CalendarClock',  sortOrder: 7 },
  { key: 'hse',         title: "Med-Ko'rik va Xavfsizlik (HSE)",           iconName: 'HeartPulse',     sortOrder: 8 },
  { key: 'audit',       title: 'Tizim Auditi va Loglar (RBAC)',            iconName: 'ClipboardList',  sortOrder: 9 },
];

async function main() {
  console.log('🚀 Starting database cleanup + admin bootstrap...\n');

  // ── STEP 1: Identify real employees ──────────────────────────────────────
  const realEmployees = await prisma.employee.findMany({
    where: { tabelNumber: { in: REAL_TABEL_NUMBERS } },
    select: { id: true, tabelNumber: true, firstName: true, lastName: true, currentDepartmentId: true },
  });

  console.log(`✅ Found ${realEmployees.length} real employees from employees.xlsx:`);
  realEmployees.forEach(e => console.log(`   ${e.tabelNumber} — ${e.lastName} ${e.firstName}`));

  if (realEmployees.length !== REAL_TABEL_NUMBERS.length) {
    const foundTNs = realEmployees.map(e => e.tabelNumber);
    const missing = REAL_TABEL_NUMBERS.filter(t => !foundTNs.includes(t));
    console.warn(`\n⚠️  Warning: ${missing.length} expected employees not found in DB: ${missing.join(', ')}`);
    console.warn('   Import them first with: node scripts/import-excel.js\n');
  }

  const realEmployeeIds   = realEmployees.map(e => e.id);
  const realDepartmentIds = [...new Set(realEmployees.map(e => e.currentDepartmentId).filter(Boolean))];

  // ── STEP 2: Delete child records of fake employees ────────────────────────
  console.log('\n🧹 Deleting child records of fake employees (sequential to avoid deadlocks)...');
  let childTotal = 0;
  const d1  = await prisma.leaveApprovalStep.deleteMany({ where: { request: { employee: { id: { notIn: realEmployeeIds } } } } });
  childTotal += d1.count;
  const d2  = await prisma.leaveRequest.deleteMany({      where: { employeeId: { notIn: realEmployeeIds } } });
  childTotal += d2.count;
  const d3  = await prisma.kpiCriterionScore.deleteMany({ where: { evaluation: { employeeId: { notIn: realEmployeeIds } } } });
  childTotal += d3.count;
  const d4  = await prisma.kpiEvaluation.deleteMany({     where: { employeeId: { notIn: realEmployeeIds } } });
  childTotal += d4.count;
  const d5  = await prisma.kpiRecord.deleteMany({         where: { employeeId: { notIn: realEmployeeIds } } });
  childTotal += d5.count;
  const d6  = await prisma.rewardFinancialAid.deleteMany({ where: { employeeId: { notIn: realEmployeeIds } } });
  childTotal += d6.count;
  const d7  = await prisma.disciplinaryAction.deleteMany({ where: { employeeId: { notIn: realEmployeeIds } } });
  childTotal += d7.count;
  const d8  = await prisma.leaveAttendance.deleteMany({   where: { employeeId: { notIn: realEmployeeIds } } });
  childTotal += d8.count;
  const d9  = await prisma.departmentTransfer.deleteMany({ where: { employeeId: { notIn: realEmployeeIds } } });
  childTotal += d9.count;
  const d10 = await prisma.permitLicense.deleteMany({     where: { employeeId: { notIn: realEmployeeIds } } });
  childTotal += d10.count;
  const d11 = await prisma.education.deleteMany({         where: { employeeId: { notIn: realEmployeeIds } } });
  childTotal += d11.count;
  const d12 = await prisma.medicalCheckup.deleteMany({    where: { employeeId: { notIn: realEmployeeIds } } });
  childTotal += d12.count;
  const d13 = await prisma.safetyBriefing.deleteMany({    where: { employeeId: { notIn: realEmployeeIds } } });
  childTotal += d13.count;
  console.log(`   ✓ Deleted ${childTotal} child records of fake employees.`);

  // ── STEP 3: Delete all fake (seeded) employees ────────────────────────────
  console.log('\n👥 Deleting fake seeded employees...');
  const { count: deletedEmps } = await prisma.employee.deleteMany({
    where: { id: { notIn: realEmployeeIds } },
  });
  console.log(`   ✓ Deleted ${deletedEmps} fake employee records.`);

  // ── STEP 4: Delete KPI templates and criteria from fake departments ────────
  console.log('\n📋 Deleting KPI templates from fake departments...');
  const { count: deletedCriteria } = await prisma.kpiCriterion.deleteMany({
    where: { template: { departmentId: { notIn: realDepartmentIds } } },
  });
  const { count: deletedTemplates } = await prisma.kpiTemplate.deleteMany({
    where: { departmentId: { notIn: realDepartmentIds } },
  });
  console.log(`   ✓ Deleted ${deletedCriteria} KPI criteria and ${deletedTemplates} KPI templates.`);

  // ── STEP 5: Delete orphaned (0-employee) departments ─────────────────────
  console.log('\n🏢 Deleting orphaned fake departments...');
  const { count: deletedDepts } = await prisma.department.deleteMany({
    where: {
      id: { notIn: realDepartmentIds },
      employees: { none: {} },
    },
  });
  console.log(`   ✓ Deleted ${deletedDepts} orphaned departments.`);

  // ── STEP 6: Delete all non-admin users ───────────────────────────────────
  console.log('\n👤 Removing any non-admin User records...');
  const usersToDelete = await prisma.user.findMany({
    where: { username: { not: 'admin' } },
    select: { id: true, username: true },
  });

  if (usersToDelete.length > 0) {
    const ids = usersToDelete.map(u => u.id);
    await prisma.userModuleAccess.deleteMany({ where: { userId: { in: ids } } });
    await prisma.userDepartmentAccess.deleteMany({ where: { userId: { in: ids } } });
    await prisma.auditLog.deleteMany({ where: { hrUserId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    console.log(`   ✓ Deleted ${usersToDelete.length} non-admin users: ${usersToDelete.map(u => u.username).join(', ')}`);
  } else {
    console.log('   ✓ No non-admin users to delete.');
  }

  // Also clean legacy HrUser table (keep only admin)
  const { count: deletedHrUsers } = await prisma.hrUser.deleteMany({
    where: { username: { not: 'admin' } },
  });
  if (deletedHrUsers > 0) console.log(`   ✓ Deleted ${deletedHrUsers} legacy HrUser records.`);

  // ── STEP 7: Upsert 9 SystemModules ───────────────────────────────────────
  console.log('\n📦 Upserting 9 SystemModules...');
  for (const mod of SYSTEM_MODULES) {
    await prisma.systemModule.upsert({
      where: { key: mod.key },
      update: { title: mod.title, iconName: mod.iconName, sortOrder: mod.sortOrder },
      create: mod,
    });
  }
  console.log('   ✓ 9 SystemModules are in place.');

  // ── STEP 8: Upsert SUPER_ADMIN user ──────────────────────────────────────
  console.log('\n🔑 Upserting SUPER_ADMIN user (admin / admin123)...');
  const passwordHash = await bcrypt.hash('admin123', 10);

  // Find the real department to link admin to
  const realDept = realDepartmentIds.length > 0
    ? await prisma.department.findUnique({ where: { id: realDepartmentIds[0] } })
    : null;

  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });

  let adminUser;
  if (existingAdmin) {
    // Update password hash + tabelNumber + other fields
    adminUser = await prisma.user.update({
      where: { username: 'admin' },
      data: {
        passwordHash,
        fullName: 'Tizim Administratori',
        tabelNumber: 'admin',
        position: 'Bosh Tizim Administratori',
        role: 'SUPER_ADMIN',
        isActive: true,
        userDepartmentId: realDept?.id || null,
        email: 'admin@enterprise.uz',
      },
    });
    console.log(`   ✓ Updated existing admin user (${adminUser.id}).`);
  } else {
    adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@enterprise.uz',
        passwordHash,
        fullName: 'Tizim Administratori',
        tabelNumber: 'admin',
        position: 'Bosh Tizim Administratori',
        role: 'SUPER_ADMIN',
        isActive: true,
        userDepartmentId: realDept?.id || null,
      },
    });
    console.log(`   ✓ Created new admin user (${adminUser.id}).`);
  }

  // Sync module access — replace all
  await prisma.userModuleAccess.deleteMany({ where: { userId: adminUser.id } });
  await prisma.userModuleAccess.createMany({
    data: SYSTEM_MODULES.map(m => ({
      userId: adminUser.id,
      moduleKey: m.key,
      canEdit: true,
    })),
  });
  console.log('   ✓ Full module access (canEdit: true) assigned to all 9 modules.');

  // Sync department access — assign to all real departments
  await prisma.userDepartmentAccess.deleteMany({ where: { userId: adminUser.id } });
  const allDepts = await prisma.department.findMany({ select: { id: true } });
  if (allDepts.length > 0) {
    await prisma.userDepartmentAccess.createMany({
      data: allDepts.map(d => ({ userId: adminUser.id, departmentId: d.id })),
      skipDuplicates: true,
    });
    console.log(`   ✓ Department access assigned to ${allDepts.length} department(s).`);
  }

  // Also upsert in legacy HrUser for backward compat
  const legacyAdmin = await prisma.hrUser.findFirst({ where: { username: 'admin' } });
  if (!legacyAdmin) {
    await prisma.hrUser.create({
      data: {
        username: 'admin',
        passwordHash,
        fullName: 'Tizim Administratori',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    console.log('   ✓ Created legacy HrUser admin record.');
  } else {
    await prisma.hrUser.update({
      where: { id: legacyAdmin.id },
      data: { passwordHash, role: 'SUPER_ADMIN', isActive: true },
    });
    console.log('   ✓ Updated legacy HrUser admin record.');
  }

  // ── FINAL REPORT ─────────────────────────────────────────────────────────
  const [finalUsers, finalDepts, finalEmps] = await Promise.all([
    prisma.user.findMany({ select: { username: true, role: true } }),
    prisma.department.findMany({ select: { name: true, _count: { select: { employees: true } } } }),
    prisma.employee.findMany({ select: { tabelNumber: true, firstName: true, lastName: true } }),
  ]);

  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL DATABASE STATE');
  console.log('='.repeat(60));
  console.log(`\n👤 Users (${finalUsers.length}):`);
  finalUsers.forEach(u => console.log(`   ${u.username} — ${u.role}`));
  console.log(`\n🏢 Departments (${finalDepts.length}):`);
  finalDepts.forEach(d => console.log(`   ${d.name} — ${d._count.employees} employee(s)`));
  console.log(`\n👥 Employees (${finalEmps.length}):`);
  finalEmps.forEach(e => console.log(`   ${e.tabelNumber} — ${e.lastName} ${e.firstName}`));
  console.log('\n' + '='.repeat(60));
  console.log('✅ Cleanup & Setup Complete!');
  console.log('   Login: admin');
  console.log('   Password: admin123');
  console.log('='.repeat(60));
}

main()
  .catch(err => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
