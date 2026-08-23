/**
 * fix-admin-password.js
 * Updates the admin user's passwordHash to the project-native SHA-256 method:
 *   SHA256(password + 'hr_salt_2026')  — matches src/lib/rbac.ts hashPassword()
 */
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function nativeHash(password) {
  // Must match rbac.ts: crypto.subtle.digest('SHA-256', encode(password + 'hr_salt_2026'))
  return crypto.createHash('sha256').update(password + 'hr_salt_2026').digest('hex');
}

async function main() {
  const password     = 'admin123';
  const passwordHash = nativeHash(password);

  console.log('🔑 Native SHA-256 hash (admin123 + hr_salt_2026):');
  console.log('   ' + passwordHash);

  // Update User table
  const updated = await prisma.user.updateMany({
    where: { username: 'admin' },
    data:  { passwordHash, isActive: true },
  });

  // Update legacy HrUser table
  const updatedLegacy = await prisma.hrUser.updateMany({
    where: { username: 'admin' },
    data:  { passwordHash, isActive: true },
  });

  console.log(`\n✅ Updated ${updated.count} User record(s).`);
  console.log(`✅ Updated ${updatedLegacy.count} HrUser (legacy) record(s).`);
  console.log('\n🎉 Login credentials:');
  console.log('   Username : admin');
  console.log('   Password : admin123');
}

main()
  .catch(err => { console.error('❌ Failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
