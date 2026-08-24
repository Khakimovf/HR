const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password + 'hr_salt_2026')
    .digest('hex');
}

async function main() {
  console.log('🔍 Checking Admin user existence...');

  const username = 'admin';
  const password = 'admin123';
  const passwordHash = hashPassword(password);

  // Check if Admin user exists in User table
  let existingUser = await prisma.user.findFirst({
    where: {
      username: {
        equals: username
      }
    }
  });

  if (existingUser) {
    console.log(`✅ Admin user "${username}" already exists in User table.`);
  } else {
    console.log(`👤 Admin user "${username}" not found. Creating new Admin user...`);

    // Fetch first available department if any
    const firstDept = await prisma.department.findFirst();

    // Create User record
    existingUser = await prisma.user.create({
      data: {
        username,
        email: 'admin@enterprise.uz',
        passwordHash,
        fullName: 'System Administrator',
        role: 'SUPER_ADMIN',
        position: 'Bosh Administrator',
        tabelNumber: 'TB-ADMIN-01',
        userDepartmentId: firstDept ? firstDept.id : null,
        isActive: true,
      }
    });

    console.log(`✨ Created User record: "${existingUser.username}" (${existingUser.id})`);

    // Assign Department access across all existing departments
    const departments = await prisma.department.findMany({ select: { id: true } });
    if (departments.length > 0) {
      for (const dept of departments) {
        await prisma.userDepartmentAccess.upsert({
          where: {
            userId_departmentId: {
              userId: existingUser.id,
              departmentId: dept.id
            }
          },
          update: {},
          create: {
            userId: existingUser.id,
            departmentId: dept.id
          }
        }).catch(() => {});
      }
      console.log(`🔑 Assigned access to ${departments.length} departments.`);
    }

    // Assign System Module access across all existing modules
    const modules = await prisma.systemModule.findMany({ select: { key: true } });
    if (modules.length > 0) {
      for (const mod of modules) {
        await prisma.userModuleAccess.upsert({
          where: {
            userId_moduleKey: {
              userId: existingUser.id,
              moduleKey: mod.key
            }
          },
          update: { canEdit: true },
          create: {
            userId: existingUser.id,
            moduleKey: mod.key,
            canEdit: true
          }
        }).catch(() => {});
      }
      console.log(`📦 Assigned access to ${modules.length} system modules.`);
    }
  }

  // Also check and create in legacy HrUser table for backwards compatibility
  const existingHrUser = await prisma.hrUser.findFirst({
    where: { username: { equals: username } }
  });

  if (!existingHrUser) {
    await prisma.hrUser.create({
      data: {
        username,
        passwordHash,
        fullName: 'System Administrator',
        role: 'SUPER_ADMIN',
        isActive: true,
      }
    });
    console.log(`✨ Created legacy HrUser record: "${username}".`);
  }

  console.log('\n🎉 Admin User Verification Complete!');
  console.log(`Login: ${username}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((err) => {
    console.error('❌ Failed to check/create Admin user:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
