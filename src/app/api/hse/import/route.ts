import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveHrUser, writeAuditLog } from '@/lib/rbac';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "HSE ma'lumotlari massiv ko'rinishida yuborilishi shart" },
        { status: 400 }
      );
    }

    // Load existing employees map by tabelNumber
    const existingEmployees = await prisma.employee.findMany({
      select: { id: true, tabelNumber: true, currentDepartment: { select: { name: true } } },
    });
    const empMap = new Map<string, { id: string; deptName: string }>();
    existingEmployees.forEach((e) => {
      empMap.set(e.tabelNumber.trim().toUpperCase(), {
        id: e.id,
        deptName: e.currentDepartment?.name || '',
      });
    });

    let medCreatedCount = 0;
    let safetyCreatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const tabelNumber = row.tabelNumber ? row.tabelNumber.trim().toUpperCase() : '';
      const empData = empMap.get(tabelNumber);

      if (!empData) {
        errorCount++;
        continue; // Employee not found by tabel number
      }

      const type = (row.type || 'MED_CHECKUP').toUpperCase();

      if (type === 'MED_CHECKUP' || type === 'MED') {
        const cDate = row.checkupDate ? new Date(row.checkupDate) : new Date();
        const validityMonths = row.validityMonths ? parseInt(row.validityMonths) : 12;
        const eDate = new Date(cDate);
        eDate.setMonth(eDate.getMonth() + validityMonths);

        await prisma.medicalCheckup.create({
          data: {
            employeeId: empData.id,
            checkupDate: cDate,
            expiryDate: eDate,
            validityMonths,
            status: row.status === "O'TMAGAN" ? "O'TMAGAN" : "O'TGAN",
            clinicName: row.clinicName || "Toshkent Tibbiyot Markazi",
            orderRef: row.orderRef || `MED-${new Date().getFullYear()}-${1000 + i}`,
            notes: row.notes || null,
          },
        });
        medCreatedCount++;
      } else if (type === 'BRIEFING' || type === 'SAFETY') {
        const cDate = row.completionDate ? new Date(row.completionDate) : new Date();
        const validityDays = row.validityDays ? parseInt(row.validityDays) : 90;
        const eDate = new Date(cDate);
        eDate.setDate(eDate.getDate() + validityDays);

        await prisma.safetyBriefing.create({
          data: {
            employeeId: empData.id,
            title: row.title?.trim() || 'Elektr Xavfsizligi Yo\'riqnomasi',
            completionDate: cDate,
            expiryDate: eDate,
            validityDays,
            instructorName: row.instructorName || 'Ergashev J. (HSE Inspektor)',
            protocolNumber: row.protocolNumber || `XAVF-${new Date().getFullYear()}-${1000 + i}`,
            notes: row.notes || null,
          },
        });
        safetyCreatedCount++;
      }
    }

    // Audit log
    const hrUser = await resolveHrUser(req);
    await writeAuditLog({
      hrUserId: hrUser?.id,
      hrName: hrUser?.fullName || 'Tizim Admin',
      action: `Ommaviy Excel orqali HSE yozuvlari yuklandi (${medCreatedCount} ta med-ko'rik, ${safetyCreatedCount} ta yo'riqnoma)`,
      metadata: { medCreatedCount, safetyCreatedCount, errorCount },
    });

    return NextResponse.json({
      success: true,
      medCreatedCount,
      safetyCreatedCount,
      errorCount,
      totalParsed: items.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
