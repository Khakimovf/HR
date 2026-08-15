import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { statsCache } from '@/lib/cache';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const [disciplinaryActions, rewards] = await Promise.all([
      prisma.disciplinaryAction.findMany({
        where,
        include: { employee: true },
        orderBy: { startDate: 'desc' },
      }),
      prisma.rewardFinancialAid.findMany({
        where,
        include: { employee: true },
        orderBy: { orderDate: 'desc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      disciplinaryActions,
      rewards,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category } = body; // "DISCIPLINE" or "REWARD"

    if (category === 'DISCIPLINE') {
      const { employeeId, orderNumber, type, startDate, expiryDate, notes } = body;

      const [record, auditLog] = await prisma.$transaction([
        prisma.disciplinaryAction.create({
          data: {
            employeeId,
            orderNumber,
            type: type || 'WARNING',
            startDate: new Date(startDate),
            expiryDate: new Date(expiryDate),
            status: 'ACTIVE',
            notes,
          },
        }),
        prisma.auditLog.create({
          data: {
            hrName: 'Intizomiy Boshqaruv System',
            action: `Intizomiy chora qo'llanildi (Hayfsan #${orderNumber || '—'})`,
            targetEmployeeId: employeeId,
            departmentName: 'HR / Intizom',
            metadata: JSON.stringify({ type, startDate, expiryDate }),
          },
        }),
      ]);

      // Invalidate analytics caches reactively
      statsCache.invalidate();

      return NextResponse.json({ success: true, record });
    } else if (category === 'REWARD') {
      const { employeeId, orderNumber, type, amount, reason, orderDate } = body;

      const [record] = await prisma.$transaction([
        prisma.rewardFinancialAid.create({
          data: {
            employeeId,
            orderNumber,
            type: type || 'REWARD',
            amount: parseFloat(amount),
            reason,
            orderDate: orderDate ? new Date(orderDate) : new Date(),
          },
        }),
        prisma.auditLog.create({
          data: {
            hrName: 'Mukofotlash System',
            action: `Rag'batlantirish / Mukofot rasmiylashtirildi (Buyruq #${orderNumber || '—'}): ${amount} UZS`,
            targetEmployeeId: employeeId,
            departmentName: 'HR / Mukofot',
            metadata: JSON.stringify({ type, amount, reason }),
          },
        }),
      ]);

      // Invalidate analytics caches reactively
      statsCache.invalidate();

      return NextResponse.json({ success: true, record });
    }

    return NextResponse.json(
      { success: false, error: 'Kategoriya noto\'g\'ri' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
