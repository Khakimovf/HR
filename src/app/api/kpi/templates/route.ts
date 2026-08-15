import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId') || '';

    const where: any = {};
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const templates = await (prisma as any).kpiTemplate.findMany({
      where,
      include: {
        department: true,
        criteria: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { departmentId, position, title, criteria } = body;

    if (!departmentId) {
      return NextResponse.json({ success: false, error: "Bo'lim ID tanlanishi shart" }, { status: 400 });
    }

    if (!Array.isArray(criteria) || criteria.length === 0) {
      return NextResponse.json({ success: false, error: "Kamida bitta KPI mezoni bo'lishi shart" }, { status: 400 });
    }

    // Validate that weight sum equals 100%
    const totalWeight = criteria.reduce((sum: number, c: any) => sum + (Number(c.weight) || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return NextResponse.json(
        { success: false, error: `Mezonlar og'irligi yig'indisi 100% bo'lishi shart (Hozirgi yig'indi: ${totalWeight}%)` },
        { status: 400 }
      );
    }

    // Find existing template for department or create new one
    const existing = await (prisma as any).kpiTemplate.findFirst({
      where: { departmentId },
    });

    let template;
    if (existing) {
      // Delete existing criteria and recreate
      await (prisma as any).kpiCriterion.deleteMany({
        where: { templateId: existing.id },
      });

      template = await (prisma as any).kpiTemplate.update({
        where: { id: existing.id },
        data: {
          title: title || existing.title,
          position: position || existing.position,
          criteria: {
            create: criteria.map((c: any) => ({
              name: c.name,
              weight: Number(c.weight) || 0,
              target: c.target || '100%',
            })),
          },
        },
        include: { criteria: true },
      });
    } else {
      template = await (prisma as any).kpiTemplate.create({
        data: {
          departmentId,
          position: position || null,
          title: title || "Bo'lim Standart KPI Shablon",
          criteria: {
            create: criteria.map((c: any) => ({
              name: c.name,
              weight: Number(c.weight) || 0,
              target: c.target || '100%',
            })),
          },
        },
        include: { criteria: true },
      });
    }

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
