const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function inspect() {
  const users = await p.user.findMany({ select: { id: true, username: true, role: true } });
  const depts = await p.department.findMany({ select: { id: true, name: true, _count: { select: { employees: true } } } });

  console.log('=== USERS ===');
  users.forEach(u => console.log(` ${u.username} (${u.role})`));
  console.log('\n=== DEPARTMENTS (with employee count) ===');
  depts.forEach(d => console.log(` ${d.name} — employees: ${d._count.employees}`));
  console.log('\nTotal users:', users.length, '| Total depts:', depts.length);
}

inspect().catch(console.error).finally(() => p.$disconnect());
