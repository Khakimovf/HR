/**
 * Seed script: Populates SystemModules registry and 9 HR Staff Users with 2D Permissions (Modules + Departments)
 * Run: npx tsx src/lib/seed-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import { hashPassword } from './rbac';

const prisma = new PrismaClient();

const SYSTEM_MODULES = [
  { key: 'workforce', title: 'Xodimlar Baza va Profil Kartalari', iconName: 'Users', sortOrder: 1 },
  { key: 'departments', title: "Bo'limlar Ierarxiyasi va Strukturasi", iconName: 'GitFork', sortOrder: 2 },
  { key: 'kpi', title: 'KPI & Mukofot Dvigateli', iconName: 'Calculator', sortOrder: 3 },
  { key: 'svodka', title: 'Ijroiy Svodka & Hisobot', iconName: 'FileBarChart', sortOrder: 4 },
  { key: 'transfers', title: "Bo'limlararo Ko'chish (Rotatsiya)", iconName: 'ArrowLeftRight', sortOrder: 5 },
  { key: 'discipline', title: 'Intizomiy Jazo & Mukofotlar Logi', iconName: 'ShieldAlert', sortOrder: 6 },
  { key: 'davomat', title: "Davomat & Ta'tillar Boshqaruvi", iconName: 'CalendarClock', sortOrder: 7 },
  { key: 'hse', title: "Med-Ko'rik va Xavfsizlik (HSE)", iconName: 'HeartPulse', sortOrder: 8 },
  { key: 'audit', title: 'Tizim Auditi va Loglar (RBAC)', iconName: 'ClipboardList', sortOrder: 9 },
];

async function main() {
  console.log('📦 Seeding SystemModule Registry (9 Sidebar Modules)...');

  for (const mod of SYSTEM_MODULES) {
    await prisma.systemModule.upsert({
      where: { key: mod.key },
      update: { title: mod.title, iconName: mod.iconName, sortOrder: mod.sortOrder },
      create: mod,
    });
  }
  console.log('   ✓ 9 System Modules configured in DB registry.');

  const departments = await prisma.department.findMany({ take: 20 });
  const deptIds = departments.map((d) => d.id);
  const allModuleKeys = SYSTEM_MODULES.map((m) => m.key);

  const defaultPasswordHash = await hashPassword('admin123');

  const SAMPLE_USERS = [
    {
      username: 'admin',
      email: 'admin@enterprise-hr.uz',
      tabelNumber: 'TB-1001',
      fullName: 'Tizim Administratori (Bosh HR)',
      position: 'Bosh Tizim Administratori',
      role: 'SUPER_ADMIN',
      deptIndices: [],
      allowedModules: allModuleKeys,
    },
    {
      username: 'b.nazarov',
      email: 'b.nazarov@enterprise-hr.uz',
      tabelNumber: 'TB-1002',
      fullName: 'Baxrom Nazarov',
      position: 'Bosh Direktor',
      role: 'EXECUTIVE_DIRECTOR',
      deptIndices: [],
      allowedModules: allModuleKeys,
    },
    {
      username: 'j.karimov',
      email: 'j.karimov@enterprise-hr.uz',
      tabelNumber: 'TB-1003',
      fullName: 'Jahongir Karimov',
      position: 'Ishlab Chiqarish Kadrlar Boshlig\'i',
      role: 'HR_OFFICER',
      deptIndices: [0, 1, 2, 3],
      allowedModules: ['workforce', 'transfers', 'davomat', 'discipline', 'hse'],
    },
    {
      username: 's.rahimova',
      email: 's.rahimova@enterprise-hr.uz',
      tabelNumber: 'TB-1004',
      fullName: 'Sevara Rahimova',
      position: 'Moliya Bo\'limi HR Inspektori',
      role: 'HR_OFFICER',
      deptIndices: [4, 5, 6],
      allowedModules: ['workforce', 'kpi', 'svodka', 'davomat'],
    },
    {
      username: 'a.tursunov',
      email: 'a.tursunov@enterprise-hr.uz',
      tabelNumber: 'TB-1005',
      fullName: 'Azizbek Tursunov',
      position: 'Logistika Kadrlar Mutaxassisi',
      role: 'HR_OFFICER',
      deptIndices: [7, 8, 9],
      allowedModules: ['workforce', 'transfers', 'davomat'],
    },
    {
      username: 'm.usmonova',
      email: 'm.usmonova@enterprise-hr.uz',
      tabelNumber: 'TB-1006',
      fullName: 'Malika Usmonova',
      position: 'AT Bo\'limi HR Menejeri',
      role: 'HR_OFFICER',
      deptIndices: [10, 11, 12],
      allowedModules: ['workforce', 'departments', 'davomat'],
    },
    {
      username: 'd.xolmatov',
      email: 'd.xolmatov@enterprise-hr.uz',
      tabelNumber: 'TB-1007',
      fullName: 'Dilshod Xolmatov',
      position: 'HSE va Xavfsizlik Inspektori',
      role: 'HR_OFFICER',
      deptIndices: [13, 14, 15],
      allowedModules: ['workforce', 'hse', 'discipline'],
    },
    {
      username: 'n.aliyeva',
      email: 'n.aliyeva@enterprise-hr.uz',
      tabelNumber: 'TB-1008',
      fullName: 'Nigora Aliyeva',
      position: 'Sotuv va Marketing HR Menejeri',
      role: 'HR_OFFICER',
      deptIndices: [16, 17],
      allowedModules: ['workforce', 'davomat'],
    },
    {
      username: 'k.solihov',
      email: 'k.solihov@enterprise-hr.uz',
      tabelNumber: 'TB-1009',
      fullName: 'Kamron Solihov',
      position: 'Mustaqil Sifat va Muvofiqlik Auditorining Bosh Inspektori',
      role: 'AUDITOR',
      deptIndices: [],
      allowedModules: ['workforce', 'hse', 'discipline', 'audit'],
    },
  ];

  console.log('🌱 Seeding 9 Users with 2D Permissions (Modules + Departments)...');

  for (const sample of SAMPLE_USERS) {
    const existing = await prisma.user.findUnique({ where: { username: sample.username } });
    const assignedDeptIds = sample.deptIndices.map((idx) => deptIds[idx]).filter(Boolean);
    const homeDeptId = assignedDeptIds[0] || deptIds[0] || null;

    let targetUserId = existing?.id;

    if (!existing) {
      const created = await prisma.user.create({
        data: {
          username: sample.username,
          email: sample.email,
          tabelNumber: sample.tabelNumber,
          fullName: sample.fullName,
          position: sample.position,
          userDepartmentId: homeDeptId,
          passwordHash: defaultPasswordHash,
          role: sample.role,
          isActive: true,
          departmentAccess: {
            create: (sample.role === 'SUPER_ADMIN' || sample.role === 'EXECUTIVE_DIRECTOR' || sample.role === 'AUDITOR')
              ? []
              : assignedDeptIds.map((id) => ({ departmentId: id })),
          },
          moduleAccess: {
            create: sample.allowedModules.map((mKey) => ({ moduleKey: mKey, canEdit: true })),
          },
        },
      });
      targetUserId = created.id;
      console.log(`  ✓ Created user: ${sample.tabelNumber} — ${sample.username} (${sample.role})`);
    } else {
      await prisma.user.update({
        where: { username: sample.username },
        data: {
          tabelNumber: sample.tabelNumber,
          position: sample.position,
          userDepartmentId: homeDeptId,
          role: sample.role,
        },
      });

      // Update module access mapping
      await prisma.userModuleAccess.deleteMany({ where: { userId: targetUserId } });
      await prisma.userModuleAccess.createMany({
        data: sample.allowedModules.map((mKey) => ({ userId: targetUserId!, moduleKey: mKey, canEdit: true })),
      });

      console.log(`  • Updated user: ${sample.tabelNumber} — ${sample.username} (${sample.role}) with ${sample.allowedModules.length} module permissions`);
    }
  }

  console.log('\n✅ 9 HR & Executive Users with 2D Permissions configured!');
  console.log('   All users default password: admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
