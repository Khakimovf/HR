import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveHrUser, writeAuditLog } from '@/lib/rbac';
import { statsCache } from '@/lib/cache';
import { parseUTCDate, toUTCDateString } from '@/lib/date-utils';

function parseSafeDate(val: any): Date | null {
  return parseUTCDate(val);
}

function parseSafeInt(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = parseInt(String(val), 10);
  return isNaN(num) ? null : num;
}

function parseSafeString(val: any): string | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  return str === '' ? null : str;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Soft-delete aware: only return employees that have not been deleted
    const employee = await prisma.employee.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        currentDepartment: true,
        educations: true,
        permits: {
          orderBy: { issueDate: 'desc' },
        },
        transfers: {
          where: { deletedAt: null },
          include: {
            fromDepartment: true,
            toDepartment: true,
          },
          orderBy: { transferDate: 'desc' },
        },
        leaves: {
          where: { deletedAt: null },
          orderBy: { startDate: 'desc' },
        },
        disciplinaryActions: {
          where: { deletedAt: null },
          orderBy: { startDate: 'desc' },
        },
        rewards: {
          where: { deletedAt: null },
          orderBy: { orderDate: 'desc' },
        },
        kpiRecords: {
          orderBy: { month: 'desc' },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Xodim topilmadi' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    console.error('Employee GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { action, tabSection } = body;

    // Soft-delete aware lookup
    const existingEmployee = await prisma.employee.findFirst({
      where: { id: params.id, deletedAt: null },
      include: { currentDepartment: true },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Xodim topilmadi' },
        { status: 404 }
      );
    }

    // Resolve user session for audit log
    const session = await resolveHrUser(req);

    // ── Special Action: Offboard ──────────────────────────────────────────
    if (action === 'OFFBOARD') {
      // Atomic: status update + audit log in one interactive transaction
      const employee = await prisma.$transaction(async (tx) => {
        const updated = await tx.employee.update({
          where: { id: params.id },
          data: { status: 'OFFBOARDED' },
        });

        await tx.auditLog.create({
          data: {
            hrUserId: session?.id || null,
            hrName: session?.fullName || session?.username || 'HR Operator',
            action: `User ${session?.username || 'HR'} updated Offboard Status for Employee ${updated.lastName} ${updated.firstName} (Tabel #${updated.tabelNumber})`,
            targetEmployeeId: updated.id,
            departmentName: existingEmployee.currentDepartment?.name,
            metadata: JSON.stringify({ action: 'OFFBOARD' }),
          },
        });

        return updated;
      });

      return NextResponse.json({
        success: true,
        message: 'Xodim mehnat shartnomasi bekor qilindi (Offboarded)',
        employee,
      });
    }

    // ── PAYLOAD SANITIZATION BEFORE PRISMA UPDATE ──
    const dataToUpdate: any = {};

    // Personal Details
    if (body.firstName !== undefined && body.firstName !== null) {
      const fn = parseSafeString(body.firstName);
      if (fn) dataToUpdate.firstName = fn;
    }
    if (body.lastName !== undefined && body.lastName !== null) {
      const ln = parseSafeString(body.lastName);
      if (ln) dataToUpdate.lastName = ln;
    }
    if (body.middleName !== undefined) dataToUpdate.middleName = parseSafeString(body.middleName);
    if (body.gender !== undefined) dataToUpdate.gender = parseSafeString(body.gender) || 'MALE';

    if (body.dateOfBirth !== undefined) {
      const dob = parseSafeDate(body.dateOfBirth);
      if (dob) dataToUpdate.dateOfBirth = dob;
    }
    if (body.birthDate !== undefined) {
      const dob = parseSafeDate(body.birthDate);
      if (dob) dataToUpdate.dateOfBirth = dob;
    }

    if (body.phone !== undefined) dataToUpdate.phone = parseSafeString(body.phone);
    if (body.email !== undefined) dataToUpdate.email = parseSafeString(body.email);
    if (body.address !== undefined) dataToUpdate.address = parseSafeString(body.address);
    if (body.pinfl !== undefined) dataToUpdate.pinfl = parseSafeString(body.pinfl);
    if (body.passportNumber !== undefined) dataToUpdate.passportNumber = parseSafeString(body.passportNumber);
    if (body.avatarUrl !== undefined) dataToUpdate.avatarUrl = parseSafeString(body.avatarUrl);

    // Job / Position Details
    if (body.currentDepartmentId !== undefined) {
      const deptId = parseSafeString(body.currentDepartmentId);
      if (deptId) dataToUpdate.currentDepartmentId = deptId;
    }
    if (body.position !== undefined) {
      const pos = parseSafeString(body.position);
      if (pos) dataToUpdate.position = pos;
    }
    if (body.employmentType !== undefined) dataToUpdate.employmentType = parseSafeString(body.employmentType);

    if (body.hireDate !== undefined) {
      const hd = parseSafeDate(body.hireDate);
      if (hd) dataToUpdate.hireDate = hd;
    }

    if (body.orderNumber !== undefined) dataToUpdate.orderNumber = parseSafeString(body.orderNumber);
    if (body.workSchedule !== undefined) dataToUpdate.workSchedule = parseSafeString(body.workSchedule);
    if (body.status !== undefined) dataToUpdate.status = parseSafeString(body.status) || 'ACTIVE';

    // Education & Qualification Fields
    if (body.educationLevel !== undefined) dataToUpdate.educationLevel = parseSafeString(body.educationLevel);
    if (body.institutionName !== undefined) dataToUpdate.institutionName = parseSafeString(body.institutionName);
    if (body.fieldOfStudy !== undefined) dataToUpdate.fieldOfStudy = parseSafeString(body.fieldOfStudy);
    if (body.diplomaNumber !== undefined) dataToUpdate.diplomaNumber = parseSafeString(body.diplomaNumber);
    if (body.foreignLanguages !== undefined) dataToUpdate.foreignLanguages = parseSafeString(body.foreignLanguages);
    if (body.certifications !== undefined) dataToUpdate.certifications = parseSafeString(body.certifications);

    // Family & Social
    if (body.maritalStatus !== undefined) dataToUpdate.maritalStatus = parseSafeString(body.maritalStatus);
    if (body.familyCount !== undefined) dataToUpdate.familyCount = parseSafeInt(body.familyCount);
    if (body.emergencyContactName !== undefined) dataToUpdate.emergencyContactName = parseSafeString(body.emergencyContactName);
    if (body.emergencyContactPhone !== undefined) dataToUpdate.emergencyContactPhone = parseSafeString(body.emergencyContactPhone);
    if (body.militaryCertificate !== undefined) dataToUpdate.militaryCertificate = parseSafeString(body.militaryCertificate);

    // Document File Scans
    if (body.passportScanUrl !== undefined) dataToUpdate.passportScanUrl = parseSafeString(body.passportScanUrl);
    if (body.diplomaScanUrl !== undefined) dataToUpdate.diplomaScanUrl = parseSafeString(body.diplomaScanUrl);
    if (body.contractPdfUrl !== undefined) dataToUpdate.contractPdfUrl = parseSafeString(body.contractPdfUrl);
    if (body.stirInpsPdfUrl !== undefined) dataToUpdate.stirInpsPdfUrl = parseSafeString(body.stirInpsPdfUrl);

    // Update Employee record in database
    const updatedEmployee = await prisma.employee.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        currentDepartment: true,
        educations: true,
        permits: true,
        transfers: {
          where: { deletedAt: null },
          include: { fromDepartment: true, toDepartment: true },
        },
        leaves: { where: { deletedAt: null } },
        disciplinaryActions: { where: { deletedAt: null } },
        rewards: { where: { deletedAt: null } },
      },
    });

    // ── EDUCATION ARRAY SYNC ──
    const eduList = Array.isArray(body.educations)
      ? body.educations
      : Array.isArray(body.educationList)
      ? body.educationList
      : null;

    if (eduList) {
      try {
        await prisma.education.deleteMany({ where: { employeeId: params.id } });
        for (const edu of eduList) {
          const instName = parseSafeString(edu.institutionName || edu.institution);
          if (instName) {
            await prisma.education.create({
              data: {
                employeeId: params.id,
                level: parseSafeString(edu.level || edu.degree) || 'HIGHER',
                institutionName: instName,
                fieldOfStudy: parseSafeString(edu.fieldOfStudy || edu.specialization) || 'Umumiy mutaxassislik',
                graduationYear: parseSafeInt(edu.graduationYear) || new Date().getFullYear(),
              },
            });
          }
        }
      } catch (eduError) {
        console.error('Education relation sync error:', eduError);
      }
    } else if (body.institutionName || body.educationLevel) {
      try {
        const existingEdu = await prisma.education.findFirst({
          where: { employeeId: params.id },
        });

        if (existingEdu) {
          await prisma.education.update({
            where: { id: existingEdu.id },
            data: {
              level: parseSafeString(body.educationLevel) || existingEdu.level,
              institutionName: parseSafeString(body.institutionName) || existingEdu.institutionName,
              fieldOfStudy: parseSafeString(body.fieldOfStudy) || existingEdu.fieldOfStudy,
            },
          });
        } else if (body.institutionName) {
          const instName = parseSafeString(body.institutionName);
          if (instName) {
            await prisma.education.create({
              data: {
                employeeId: params.id,
                level: parseSafeString(body.educationLevel) || 'HIGHER',
                institutionName: instName,
                fieldOfStudy: parseSafeString(body.fieldOfStudy) || 'Umumiy mutaxassislik',
                graduationYear: new Date().getFullYear(),
              },
            });
          }
        }
      } catch (singleEduError) {
        console.error('Single Education sync error:', singleEduError);
      }
    }

    // Fetch refreshed employee with all relations
    const finalEmployee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        currentDepartment: true,
        educations: true,
        permits: true,
        transfers: {
          where: { deletedAt: null },
          include: { fromDepartment: true, toDepartment: true },
        },
        leaves: { where: { deletedAt: null } },
        disciplinaryActions: { where: { deletedAt: null } },
        rewards: { where: { deletedAt: null } },
      },
    });

    // ── AUDIT LOG: Field-Level Changes ──────────────────────────────────────
    const sectionName = tabSection || "Profil ma'lumotlari";
    const empName = `${updatedEmployee.lastName} ${updatedEmployee.firstName}`.trim();
    const username = session?.username || 'HR Operator';

    const changedKeys = Object.keys(dataToUpdate);
    if (changedKeys.length === 0) {
      await writeAuditLog({
        hrUserId: session?.id,
        hrName: session?.fullName || username,
        action: `User ${username} updated ${sectionName} for Employee ${empName} (Tabel #${updatedEmployee.tabelNumber})`,
        targetEmployeeId: updatedEmployee.id,
        departmentName: updatedEmployee.currentDepartment?.name,
        metadata: { sectionName },
      });
    } else {
      for (const key of changedKeys) {
        const oldVal = (existingEmployee as any)[key];
        const newVal = dataToUpdate[key];
        const oldStr = oldVal instanceof Date ? toUTCDateString(oldVal) : String(oldVal ?? '—');
        const newStr = newVal instanceof Date ? toUTCDateString(newVal) : String(newVal ?? '—');

        if (oldStr !== newStr) {
          await writeAuditLog({
            hrUserId: session?.id,
            hrName: session?.fullName || username,
            action: `Xodim [${updatedEmployee.tabelNumber}] ${empName} maydoni '${key}' tahrirlandi`,
            targetEmployeeId: updatedEmployee.id,
            fieldChanged: key,
            oldValue: oldStr,
            newValue: newStr,
            departmentName: updatedEmployee.currentDepartment?.name,
            ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
            metadata: { sectionName, field: key, oldValue: oldStr, newValue: newStr },
          });
        }
      }
    }

    statsCache.invalidate();

    return NextResponse.json(
      {
        success: true,
        message: "Xodim ma'lumotlari muvaffaqiyatli yangilandi!",
        employee: finalEmployee || updatedEmployee,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Employee Update Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Xodim ma'lumotlarini yangilashda xatolik yuz berdi",
      },
      { status: 500 }
    );
  }
}

/**
 * SOFT DELETE — replaces the previous hard delete.
 *
 * Sets `deletedAt = now()` instead of destroying the record.
 * All related records (leaves, transfers, KPI, etc.) are preserved for audit.
 * The employee will be invisible in all list queries that filter `deletedAt: null`.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await resolveHrUser(req);
    const now = new Date();

    // Verify employee exists and is not already deleted
    const existing = await prisma.employee.findFirst({
      where: { id: params.id, deletedAt: null },
      include: { currentDepartment: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Xodim topilmadi yoki allaqachon o'chirilgan" },
        { status: 404 }
      );
    }

    // Atomic soft-delete + audit log
    await prisma.$transaction(async (tx) => {
      // 1. Soft-delete the employee
      await tx.employee.update({
        where: { id: params.id },
        data: {
          deletedAt: now,
          status: 'OFFBOARDED',
        },
      });

      // 2. Write audit log entry
      await tx.auditLog.create({
        data: {
          hrUserId: session?.id || null,
          hrName: session?.fullName || session?.username || 'HR Operator',
          action: `Xodim [${existing.tabelNumber}] ${existing.lastName} ${existing.firstName} tizimdan o'chirildi (Soft Delete)`,
          targetEmployeeId: params.id,
          departmentName: existing.currentDepartment?.name,
          ipAddress:
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            '127.0.0.1',
          metadata: JSON.stringify({
            action: 'SOFT_DELETE',
            tabelNumber: existing.tabelNumber,
            deletedAt: now.toISOString(),
          }),
        },
      });
    });

    statsCache.invalidate();
    return NextResponse.json({
      success: true,
      message: "Xodim tizimdan o'chirildi (ma'lumotlar saqlanib qoldi)",
    });
  } catch (error: any) {
    console.error('Employee DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
