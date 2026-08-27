import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { statsCache } from '@/lib/cache';
import { parseUTCDate } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const departmentId = searchParams.get('departmentId') || '';
    const permitFilter = searchParams.get('permitFilter') || '';
    const status = searchParams.get('status') || searchParams.get('statusKey') || '';
    const disciplineStatus = searchParams.get('disciplineStatus') || '';
    const educationFilter = searchParams.get('educationFilter') || '';
    const rewardFilter = searchParams.get('rewardFilter') || '';
    const medicalFilter = searchParams.get('medicalFilter') || '';
    const tenureFilter = searchParams.get('tenureFilter') || '';
    const demographicFilter = searchParams.get('demographicFilter') || '';

    const limitParam = searchParams.get('limit') || '25';
    const isAll = limitParam === 'all' || limitParam === '1000' || limitParam === '9999' || limitParam === '10000';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = isAll ? 10000 : Math.max(1, Math.min(100, parseInt(limitParam, 10)));
    const skip = isAll ? 0 : (page - 1) * limit;

    const AND: any[] = [];

    // Always exclude soft-deleted employees
    AND.push({ deletedAt: null });

    const now = new Date();

    // 1. Department filter
    if (departmentId) {
      AND.push({ currentDepartmentId: departmentId });
    }

    // 2. Status filter
    if (status && status !== 'ALL') {
      AND.push({ status });
    }

    // 3. Permit & Certificate filter
    if (permitFilter && permitFilter !== 'ALL') {
      if (permitFilter === 'MILITARY') {
        AND.push({ militaryCertificate: { not: null } });
      } else {
        AND.push({
          permits: {
            some: {
              licenseType: permitFilter,
            },
          },
        });
      }
    }

    // 4. Discipline Status filter
    if (disciplineStatus && disciplineStatus !== 'ALL') {
      if (disciplineStatus === 'ACTIVE_PENALTY') {
        AND.push({
          disciplinaryActions: {
            some: { status: 'ACTIVE', deletedAt: null },
          },
        });
      } else if (disciplineStatus === 'CLEAN') {
        AND.push({
          disciplinaryActions: {
            none: { status: 'ACTIVE', deletedAt: null },
          },
        });
      }
    }

    // 5. Education filter ("Ma'lumoti bo'yicha")
    if (educationFilter && educationFilter !== 'ALL') {
      if (educationFilter === 'HIGHER') {
        AND.push({
          OR: [
            { educationLevel: 'HIGHER' },
            { educations: { some: { level: { in: ['HIGHER', 'OLIY'] } } } },
          ],
        });
      } else if (educationFilter === 'SPECIAL_SECONDARY') {
        AND.push({
          OR: [
            { educationLevel: { in: ['SPECIAL_SECONDARY', 'SECONDARY_SPECIAL'] } },
            { educations: { some: { level: { in: ['SPECIAL_SECONDARY', 'SECONDARY_SPECIAL', "O'RTA_MAXSUS", 'VOCATIONAL'] } } } },
          ],
        });
      } else if (educationFilter === 'SECONDARY') {
        AND.push({
          OR: [
            { educationLevel: 'SECONDARY' },
            { educations: { some: { level: { in: ['SECONDARY', "O'RTA"] } } } },
          ],
        });
      } else if (educationFilter === 'INCOMPLETE_HIGHER') {
        AND.push({
          OR: [
            { educationLevel: 'INCOMPLETE_HIGHER' },
            { educations: { some: { level: { in: ['INCOMPLETE_HIGHER', 'TUGALLANMAGAN_OLIY'] } } } },
          ],
        });
      }
    }

    // 6. Rewards & Financial Aid filter ("Mukofot va Rag'batlantirish")
    if (rewardFilter && rewardFilter !== 'ALL') {
      if (rewardFilter === 'REWARDED') {
        AND.push({ rewards: { some: { type: { in: ['REWARD', 'BONUS'] }, deletedAt: null } } });
      } else if (rewardFilter === 'FINANCIAL_AID') {
        AND.push({ rewards: { some: { type: 'FINANCIAL_AID', deletedAt: null } } });
      } else if (rewardFilter === 'NO_REWARDS') {
        AND.push({ rewards: { none: { deletedAt: null } } });
      }
    }

    // 7. Medical Checkup Status filter ("Tibbiy Ko'rik Holati")
    if (medicalFilter && medicalFilter !== 'ALL') {
      const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      if (medicalFilter === 'VALID') {
        AND.push({ medicalCheckups: { some: { expiryDate: { gte: in15Days } } } });
      } else if (medicalFilter === 'EXPIRING_SOON') {
        AND.push({ medicalCheckups: { some: { expiryDate: { gte: now, lte: in15Days } } } });
      } else if (medicalFilter === 'EXPIRED') {
        AND.push({
          OR: [
            { medicalCheckups: { some: { expiryDate: { lt: now } } } },
            { medicalCheckups: { some: { status: 'MUDDATI_TUGAGAN' } } },
            { medicalCheckups: { none: {} } },
          ],
        });
      }
    }

    // 8. Work Tenure filter ("Korxonadagi Ish Staji")
    if (tenureFilter && tenureFilter !== 'ALL') {
      const yr1Ago  = new Date(now.getFullYear() - 1,  now.getMonth(), now.getDate());
      const yr3Ago  = new Date(now.getFullYear() - 3,  now.getMonth(), now.getDate());
      const yr5Ago  = new Date(now.getFullYear() - 5,  now.getMonth(), now.getDate());
      const yr10Ago = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());

      if (tenureFilter === 'UNDER_1_YEAR') {
        AND.push({ hireDate: { gte: yr1Ago } });
      } else if (tenureFilter === '1_TO_3_YEARS') {
        AND.push({ hireDate: { gte: yr3Ago, lt: yr1Ago } });
      } else if (tenureFilter === '3_TO_5_YEARS') {
        AND.push({ hireDate: { gte: yr5Ago, lt: yr3Ago } });
      } else if (tenureFilter === '5_TO_10_YEARS') {
        AND.push({ hireDate: { gte: yr10Ago, lt: yr5Ago } });
      } else if (tenureFilter === 'OVER_10_YEARS') {
        AND.push({ hireDate: { lt: yr10Ago } });
      }
    }

    // 9. Demographics & Pension filter ("Yoshi / Demografiya")
    if (demographicFilter && demographicFilter !== 'ALL') {
      const yr30Ago = new Date(now.getFullYear() - 30, now.getMonth(), now.getDate());
      const yr55Ago = new Date(now.getFullYear() - 55, now.getMonth(), now.getDate());
      const yr60Ago = new Date(now.getFullYear() - 60, now.getMonth(), now.getDate());

      if (demographicFilter === 'YOUTH_UNDER_30') {
        AND.push({ dateOfBirth: { gte: yr30Ago } });
      } else if (demographicFilter === 'PENSION_AGE') {
        AND.push({
          OR: [
            { gender: 'MALE',   dateOfBirth: { lte: yr60Ago } },
            { gender: 'FEMALE', dateOfBirth: { lte: yr55Ago } },
          ],
        });
      }
    }

    // 10. Global live text search
    if (search) {
      AND.push({
        OR: [
          { tabelNumber:        { contains: search } },
          { firstName:          { contains: search } },
          { lastName:           { contains: search } },
          { middleName:         { contains: search } },
          { position:           { contains: search } },
          { phone:              { contains: search } },
          { currentDepartment:  { name: { contains: search } } },
          {
            permits: {
              some: {
                OR: [
                  { category:     { contains: search } },
                  { certificateNo: { contains: search } },
                ],
              },
            },
          },
        ],
      });
    }

    const where: any = { AND };

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        // ── Slim include for list view ──────────────────────────────────────
        // Full relation data (permits, educations, rewards, etc.) is only
        // loaded in GET /api/employees/[id] to keep this query fast for
        // 1,500+ employee orgs.
        select: {
          id: true,
          tabelNumber: true,
          firstName: true,
          lastName: true,
          middleName: true,
          gender: true,
          dateOfBirth: true,
          hireDate: true,
          status: true,
          phone: true,
          email: true,
          position: true,
          employmentType: true,
          baseSalary: true,
          educationLevel: true,
          maritalStatus: true,
          militaryCertificate: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          // Lightweight relation snapshots
          currentDepartment: {
            select: { id: true, name: true, code: true },
          },
          // Only most recent medical checkup (for expiry badge)
          medicalCheckups: {
            orderBy: { expiryDate: 'desc' },
            take: 1,
            select: { id: true, status: true, expiryDate: true },
          },
          // Active discipline flags only (for badge display)
          disciplinaryActions: {
            where: { status: 'ACTIVE', deletedAt: null },
            select: { id: true, type: true, status: true },
          },
          // Permit types for filter badges (no heavy data)
          permits: {
            select: { id: true, licenseType: true, category: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      data: employees,
      employees,
      totalCount: total,
      totalPages,
      currentPage: page,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
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

    // ── Bulk onboarding (array payload) ────────────────────────────────────
    if (Array.isArray(body.employees)) {
      // Wrap all creates in a single atomic transaction.
      // If any one fails (e.g. duplicate tabelNumber), the entire batch
      // is rolled back — no partial data left in DB.
      const createdList = await prisma.$transaction(
        body.employees.map((emp: any) => {
          const finalTabel =
            emp.tabelNumber || `TB-${8000 + Math.floor(Math.random() * 9000)}`;

          return prisma.employee.create({
            data: {
              tabelNumber: finalTabel,
              firstName: emp.firstName,
              lastName: emp.lastName,
              middleName: emp.middleName || null,
              gender: emp.gender || 'MALE',
              dateOfBirth: emp.dateOfBirth
                ? parseUTCDate(emp.dateOfBirth) ?? new Date('1990-01-01T00:00:00.000Z')
                : new Date('1990-01-01T00:00:00.000Z'),
              hireDate: emp.hireDate
                ? parseUTCDate(emp.hireDate) ?? new Date()
                : new Date(),
              militaryCertificate: emp.militaryCertificate || null,
              currentDepartmentId: emp.currentDepartmentId,
              position: emp.position,
              phone: emp.phone || null,
              email: emp.email || null,
              educations: emp.educationLevel
                ? {
                    create: {
                      level: emp.educationLevel,
                      institutionName: emp.institutionName || "Noma'lum dargoh",
                      fieldOfStudy: emp.fieldOfStudy || 'Mutaxassislik',
                      graduationYear: new Date().getFullYear() - 2,
                    },
                  }
                : undefined,
            },
          });
        })
      );

      statsCache.invalidate();
      return NextResponse.json({
        success: true,
        count: createdList.length,
        employees: createdList,
      });
    }

    // ── Single employee creation ────────────────────────────────────────────
    const {
      tabelNumber,
      firstName,
      lastName,
      middleName,
      gender,
      dateOfBirth,
      hireDate,
      militaryCertificate,
      currentDepartmentId,
      position,
      phone,
      email,
      educationLevel,
      institutionName,
      fieldOfStudy,
    } = body;

    const employee = await prisma.employee.create({
      data: {
        tabelNumber,
        firstName,
        lastName,
        middleName: middleName || null,
        gender: gender || 'MALE',
        // UTC-safe date parsing
        dateOfBirth: parseUTCDate(dateOfBirth) ?? new Date('1990-01-01T00:00:00.000Z'),
        hireDate: parseUTCDate(hireDate) ?? new Date(),
        militaryCertificate: militaryCertificate || null,
        currentDepartmentId,
        position,
        phone: phone || null,
        email: email || null,
        educations: educationLevel
          ? {
              create: {
                level: educationLevel,
                institutionName: institutionName || '',
                fieldOfStudy: fieldOfStudy || '',
                graduationYear: new Date().getFullYear() - 3,
              },
            }
          : undefined,
      },
    });

    statsCache.invalidate();
    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
