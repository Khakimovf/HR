const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const total = await p.employee.count();
  console.log('📊 Total employees in DB:', total);

  const latest = await p.employee.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15,
    select: {
      tabelNumber: true,
      firstName: true,
      lastName: true,
      status: true,
      createdAt: true,
      currentDepartmentId: true,
      currentDepartment: { select: { name: true } },
    },
  });

  console.log('\n🕐 Last 15 added employees:');
  latest.forEach((e, i) => {
    console.log(`  ${i + 1}. ${e.tabelNumber} — ${e.lastName} ${e.firstName} | dept: ${e.currentDepartment?.name || 'N/A'} | status: ${e.status} | createdAt: ${e.createdAt?.toISOString()}`);
  });

  // Check specifically for our 9 Excel employees
  const REAL_TABELS = ['TB-0516','TB-2002','TB-0026','TB-0511','TB-0315','TB-2203','TB-1972','TB-0796','TB-1140'];
  const found = await p.employee.findMany({
    where: { tabelNumber: { in: REAL_TABELS } },
    select: { tabelNumber: true, firstName: true, lastName: true, currentDepartment: { select: { name: true } } },
  });

  console.log(`\n✅ Real Excel employees found in DB: ${found.length}/9`);
  found.forEach(e => console.log(`   ${e.tabelNumber} — ${e.lastName} ${e.firstName} | dept: ${e.currentDepartment?.name}`));

  const missing = REAL_TABELS.filter(t => !found.map(e => e.tabelNumber).includes(t));
  if (missing.length > 0) console.log('\n❌ Missing:', missing.join(', '));

  // Check departments
  const depts = await p.department.findMany({
    select: { id: true, name: true, _count: { select: { employees: true } } },
  });
  console.log(`\n🏢 Departments in DB (${depts.length}):`);
  depts.forEach(d => console.log(`   [${d.id.slice(0,8)}] ${d.name} — ${d._count.employees} employee(s)`));
}

check().catch(console.error).finally(() => p.$disconnect());
