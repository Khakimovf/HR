import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveHrUser, writeAuditLog } from '@/lib/rbac';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employees } = body;

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json(
        { success: false, error: "Xodimlar ma'lumotlari massiv ko'rinishida yuborilishi shart" },
        { status: 400 }
      );
    }

    // Load existing departments for name mapping
    const existingDepts = await prisma.department.findMany({
      select: { id: true, name: true, code: true },
    });
    const defaultDeptId = existingDepts[0]?.id || '';
    const deptMap = new Map<string, string>();
    existingDepts.forEach((d) => {
      deptMap.set(d.name.trim().toLowerCase(), d.id);
      if (d.code) deptMap.set(d.code.trim().toLowerCase(), d.id);
    });

    // Load existing tabel numbers to skip duplicates
    const existingEmpTabels = await prisma.employee.findMany({
      select: { tabelNumber: true },
    });
    const existingTabelSet = new Set<string>(existingEmpTabels.map((e) => e.tabelNumber.trim().toUpperCase()));

    let createdCount = 0;
    let skippedCount = 0;
    const batchToInsert: any[] = [];

    for (let i = 0; i < employees.length; i++) {
      const item = employees[i];
      const tabelNumber = item.tabelNumber ? item.tabelNumber.trim().toUpperCase() : `TB-IMP-${10000 + i}`;

      if (existingTabelSet.has(tabelNumber)) {
        skippedCount++;
        continue; // Skip duplicate tabel numbers
      }

      const firstName = item.firstName?.trim() || 'Xodim';
      const lastName  = item.lastName?.trim()  || 'Familiyasi';
      const middleName = item.middleName?.trim() || null;
      const position  = item.position?.trim()  || 'Mutaxassis';
      const gender    = item.gender === 'FEMALE' ? 'FEMALE' : 'MALE';

      // Resolve department ID
      let currentDepartmentId = defaultDeptId;
      if (item.departmentName && item.departmentName.trim()) {
        const dKey = item.departmentName.trim().toLowerCase();
        if (deptMap.has(dKey)) {
          currentDepartmentId = deptMap.get(dKey)!;
        }
      }

      // Parse dates
      const dobDate  = item.dateOfBirth ? new Date(item.dateOfBirth) : new Date(1990, 0, 1);
      const hireDate = item.hireDate ? new Date(item.hireDate) : new Date();

      batchToInsert.push({
        tabelNumber,
        firstName,
        lastName,
        middleName,
        gender,
        dateOfBirth: isNaN(dobDate.getTime()) ? new Date(1990, 0, 1) : dobDate,
        hireDate:    isNaN(hireDate.getTime()) ? new Date() : hireDate,
        currentDepartmentId,
        position,
        status: item.status === 'ON_LEAVE' ? 'ON_LEAVE' : 'ACTIVE',
        phone: item.phone?.trim() || null,
        email: item.email?.trim() || `${tabelNumber.toLowerCase()}@enterprise-hr.uz`,
      });

      existingTabelSet.add(tabelNumber);
    }

    // Insert in batches of 300 for database efficiency
    for (let i = 0; i < batchToInsert.length; i += 300) {
      const chunk = batchToInsert.slice(i, i + 300);
      for (const empData of chunk) {
        await prisma.employee.create({ data: empData });
        createdCount++;
      }
    }

    // Audit log
    const hrUser = await resolveHrUser(req);
    await writeAuditLog({
      hrUserId: hrUser?.id,
      hrName: hrUser?.fullName || 'Tizim Admin',
      action: `Ommaviy Excel orqali xodimlar bazasi yuklandi (${createdCount} ta yangi xodim, ${skippedCount} ta takroriy o'tkazib yuborildi)`,
      metadata: { createdCount, skippedCount },
    });

    return NextResponse.json({
      success: true,
      createdCount,
      skippedCount,
      totalParsed: employees.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
