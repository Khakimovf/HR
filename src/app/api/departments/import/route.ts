import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveHrUser, writeAuditLog } from '@/lib/rbac';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { departments } = body;

    if (!departments || !Array.isArray(departments) || departments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Bo'limlar ma'lumotlari massiv ko'rinishida yuborilishi shart" },
        { status: 400 }
      );
    }

    // Fetch existing departments for parent mapping
    const existingDepts = await prisma.department.findMany({
      select: { id: true, name: true, code: true },
    });
    const deptMap = new Map<string, string>();
    existingDepts.forEach((d) => {
      deptMap.set(d.name.trim().toLowerCase(), d.id);
      if (d.code) deptMap.set(d.code.trim().toLowerCase(), d.id);
    });

    let createdCount = 0;
    const createdDepts: any[] = [];

    for (let i = 0; i < departments.length; i++) {
      const item = departments[i];
      if (!item.name || !item.name.trim()) continue;

      const name = item.name.trim();
      const code = item.code?.trim() || `DEPT-IMP-${String(existingDepts.length + createdCount + 1).padStart(2, '0')}`;
      const description = item.description || `Ommaviy yuklangan bo'lim`;
      const staffLimit = item.staffLimit ? parseInt(item.staffLimit) : 25;

      let parentId: string | null = null;
      if (item.parentName && item.parentName.trim()) {
        const parentKey = item.parentName.trim().toLowerCase();
        parentId = deptMap.get(parentKey) || null;
      }

      // Check if department with same name already exists
      const existingId = deptMap.get(name.toLowerCase());
      if (!existingId) {
        const newDept = await prisma.department.create({
          data: {
            name,
            code,
            description,
            staffLimit,
            parentId,
          },
        });
        deptMap.set(name.toLowerCase(), newDept.id);
        createdDepts.push(newDept);
        createdCount++;
      }
    }

    // Audit log
    const hrUser = await resolveHrUser(req);
    await writeAuditLog({
      hrUserId: hrUser?.id,
      hrName: hrUser?.fullName || 'Tizim Admin',
      action: `Ommaviy Excel orqali bo'limlar yuklandi (${createdCount} ta yangi bo'lim)`,
      metadata: { count: createdCount },
    });

    return NextResponse.json({
      success: true,
      createdCount,
      departments: createdDepts,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
