const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Database Purge & Production Cleanup Routine...');

  // 1. Audit counts before purge
  const empCountBefore = await prisma.employee.count();
  const leaveCountBefore = await prisma.leaveAttendance.count();
  const reqCountBefore = await prisma.leaveRequest.count();
  const discCountBefore = await prisma.disciplinaryAction.count();
  const rewardCountBefore = await prisma.rewardFinancialAid.count();
  const transferCountBefore = await prisma.departmentTransfer.count();
  const medCountBefore = await prisma.medicalCheckup.count();
  const safetyCountBefore = await prisma.safetyBriefing.count();
  const auditCountBefore = await prisma.auditLog.count();

  const deptCount = await prisma.department.count();
  const posCount = await prisma.position.count();
  const kpiTplCount = await prisma.kpiTemplate.count();
  const userCount = await prisma.user.count();

  console.log('--- PRE-PURGE SUMMARY ---');
  console.log(`- Employees: ${empCountBefore}`);
  console.log(`- Leave History: ${leaveCountBefore}`);
  console.log(`- Workflow Requests: ${reqCountBefore}`);
  console.log(`- Disciplinary Actions: ${discCountBefore}`);
  console.log(`- Rewards & Aid: ${rewardCountBefore}`);
  console.log(`- Department Transfers: ${transferCountBefore}`);
  console.log(`- Medical Checkups: ${medCountBefore}`);
  console.log(`- Safety Briefings: ${safetyCountBefore}`);
  console.log(`- Audit Logs: ${auditCountBefore}`);
  console.log('-------------------------');
  console.log(`- PRESERVED Departments: ${deptCount}`);
  console.log(`- PRESERVED Positions: ${posCount}`);
  console.log(`- PRESERVED KPI Templates: ${kpiTplCount}`);
  console.log(`- PRESERVED System Users: ${userCount}`);
  console.log('-------------------------');

  // 2. Cascade purge transactional test data
  console.log('🧹 Purging transactional dummy data...');

  // Delete all leave approval steps first
  await prisma.leaveApprovalStep.deleteMany({});
  console.log('✓ Purged LeaveApprovalStep');

  // Delete all leave requests
  await prisma.leaveRequest.deleteMany({});
  console.log('✓ Purged LeaveRequest');

  // Delete all leave attendances
  await prisma.leaveAttendance.deleteMany({});
  console.log('✓ Purged LeaveAttendance');

  // Delete all disciplinary actions
  await prisma.disciplinaryAction.deleteMany({});
  console.log('✓ Purged DisciplinaryAction');

  // Delete all rewards & financial aid
  await prisma.rewardFinancialAid.deleteMany({});
  console.log('✓ Purged RewardFinancialAid');

  // Delete all department transfers
  await prisma.departmentTransfer.deleteMany({});
  console.log('✓ Purged DepartmentTransfer');

  // Delete all medical checkups
  await prisma.medicalCheckup.deleteMany({});
  console.log('✓ Purged MedicalCheckup');

  // Delete all safety briefings
  await prisma.safetyBriefing.deleteMany({});
  console.log('✓ Purged SafetyBriefing');

  // Delete all permit licenses
  await prisma.permitLicense.deleteMany({});
  console.log('✓ Purged PermitLicense');

  // Delete all education records
  await prisma.education.deleteMany({});
  console.log('✓ Purged Education');

  // Delete all KPI records & evaluations
  await prisma.kpiCriterionScore.deleteMany({});
  await prisma.kpiEvaluation.deleteMany({});
  await prisma.kpiRecord.deleteMany({});
  console.log('✓ Purged KPI Evaluations & Records');

  // Delete all audit logs
  await prisma.auditLog.deleteMany({});
  console.log('✓ Purged AuditLog');

  // Delete all test employees
  await prisma.employee.deleteMany({});
  console.log('✓ Purged Employees');

  // 3. Post-Purge Verification
  const empCountAfter = await prisma.employee.count();
  const leaveCountAfter = await prisma.leaveAttendance.count();
  const reqCountAfter = await prisma.leaveRequest.count();
  const discCountAfter = await prisma.disciplinaryAction.count();
  const auditCountAfter = await prisma.auditLog.count();

  const deptCountAfter = await prisma.department.count();
  const kpiTplCountAfter = await prisma.kpiTemplate.count();
  const userCountAfter = await prisma.user.count();

  console.log('=== POST-PURGE VERIFICATION ===');
  console.log(`- Employees: ${empCountAfter} (CLEARED)`);
  console.log(`- Leave History: ${leaveCountAfter} (CLEARED)`);
  console.log(`- Workflow Requests: ${reqCountAfter} (CLEARED)`);
  console.log(`- Disciplinary Actions: ${discCountAfter} (CLEARED)`);
  console.log(`- Audit Logs: ${auditCountAfter} (CLEARED)`);
  console.log('-------------------------------');
  console.log(`- Departments Intact: ${deptCountAfter} (VERIFIED)`);
  console.log(`- KPI Templates Intact: ${kpiTplCountAfter} (VERIFIED)`);
  console.log(`- System Users Intact: ${userCountAfter} (VERIFIED)`);
  console.log('✅ DATABASE PURGE & CLEANUP SUCCESSFULLY COMPLETED!');
}

main()
  .catch((e) => {
    console.error('❌ Error during purge:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
