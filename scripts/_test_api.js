const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApi() {
  const [total, employees] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.findMany({
      include: {
        currentDepartment: true,
      },
      take: 20
    })
  ]);

  console.log('--- API ROUTE SIMULATION ---');
  console.log('Success: true');
  console.log('Total Count:', total);
  console.log('Employees Returned:', employees.length);
  employees.forEach(e => {
    console.log(`- ${e.tabelNumber}: ${e.lastName} ${e.firstName} (${e.currentDepartment ? e.currentDepartment.name : 'No Dept'})`);
  });
}

testApi().catch(console.error).finally(() => prisma.$disconnect());
