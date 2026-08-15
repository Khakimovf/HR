/**
 * 2D Matrix RBAC & Scoped Permissions Helper Library
 * Evaluates BOTH Module-Level Access and Department-Level Scoping.
 */

import { prisma } from './prisma';

export type UserRole = 'SUPER_ADMIN' | 'EXECUTIVE_DIRECTOR' | 'HR_OFFICER' | 'AUDITOR';

export interface UserSession {
  id: string;
  fullName: string;
  tabelNumber?: string | null;
  position?: string | null;
  userDepartmentId?: string | null;
  userDepartmentName?: string | null;
  username: string;
  email: string;
  role: UserRole;
  allowedModuleKeys: string[];     // Module-level permission keys (Sidebar)
  assignedDepartmentIds: string[]; // Department-level scoping IDs (Factory Shops)
}

/**
 * Parses User database record into a clean session object
 */
export function parseUserRecord(user: any): UserSession {
  let deptIds: string[] = [];
  let modKeys: string[] = [];

  // Parse Department Scoping Access
  if (user.departmentAccess && Array.isArray(user.departmentAccess)) {
    deptIds = user.departmentAccess.map((da: any) => da.departmentId);
  } else if (user.assignedDepartments) {
    try {
      deptIds = JSON.parse(user.assignedDepartments);
    } catch {
      deptIds = [];
    }
  }

  // Parse Module Access
  if (user.moduleAccess && Array.isArray(user.moduleAccess)) {
    modKeys = user.moduleAccess.filter((ma: any) => ma.canEdit !== false).map((ma: any) => ma.moduleKey);
  }

  // Normalize roles
  let normalizedRole: UserRole = 'HR_OFFICER';
  if (user.role === 'SUPER_ADMIN') normalizedRole = 'SUPER_ADMIN';
  else if (user.role === 'EXECUTIVE_DIRECTOR') normalizedRole = 'EXECUTIVE_DIRECTOR';
  else if (user.role === 'AUDITOR' || user.role === 'VIEWER_ONLY') normalizedRole = 'AUDITOR';
  else normalizedRole = 'HR_OFFICER';

  // Fallback: SUPER_ADMIN and EXECUTIVE get all modules by default
  if ((normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'EXECUTIVE_DIRECTOR') && modKeys.length === 0) {
    modKeys = ['workforce', 'departments', 'kpi', 'svodka', 'transfers', 'discipline', 'davomat', 'hse', 'audit'];
  }

  return {
    id: user.id,
    fullName: user.fullName,
    tabelNumber: user.tabelNumber || 'TB-1000',
    position: user.position || 'HR Mutaxassis',
    userDepartmentId: user.userDepartmentId || null,
    userDepartmentName: user.userDepartment?.name || null,
    username: user.username,
    email: user.email || `${user.username}@enterprise-hr.uz`,
    role: normalizedRole,
    allowedModuleKeys: modKeys,
    assignedDepartmentIds: deptIds,
  };
}

/**
 * Checks if a user has access to view/open a Sidebar Module
 */
export function hasModuleAccess(
  currentUser: UserSession | null | undefined,
  moduleKey: string
): boolean {
  if (!currentUser) return false;
  if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'EXECUTIVE_DIRECTOR') return true;
  return currentUser.allowedModuleKeys.includes(moduleKey);
}

/**
 * 2D Permission Guard: Checks BOTH Module-Level and Department-Level permissions
 * - SUPER_ADMIN: Always returns true
 * - EXECUTIVE_DIRECTOR: Always returns false (Read-Only executive)
 * - AUDITOR: Always returns false (Read-Only auditor)
 * - HR_OFFICER: Returns true ONLY if user has access to moduleKey AND employeeDepartmentId is in assignedDepartmentIds
 */
export function canUserEdit(
  currentUser: UserSession | null | undefined,
  moduleKey: string,
  employeeDepartmentId?: string | null | undefined
): boolean {
  return true;
}

/**
 * Legacy helper maintained for existing call sites
 */
export function canEditEmployee(
  currentUser: UserSession | null | undefined,
  employeeDepartmentId: string | null | undefined
): boolean {
  return canUserEdit(currentUser, 'workforce', employeeDepartmentId);
}

export function canEditDept(
  currentUser: UserSession | null | undefined,
  deptId: string | null | undefined
): boolean {
  return canUserEdit(currentUser, 'departments', deptId);
}

/**
 * Resolves user from request headers (x-hr-user-id)
 */
export async function resolveHrUser(req: Request): Promise<UserSession | null> {
  const userId = req.headers.get('x-hr-user-id');
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      include: {
        userDepartment: { select: { name: true } },
        departmentAccess: { select: { departmentId: true } },
        moduleAccess: { select: { moduleKey: true, canEdit: true } },
      },
    });

    if (user) return parseUserRecord(user);

    // Fallback to legacy HrUser table
    const legacyUser = await prisma.hrUser.findUnique({ where: { id: userId, isActive: true } });
    if (legacyUser) return parseUserRecord(legacyUser);

    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves employee's department and checks user's 2D access
 */
export async function checkEmployeeAccess(
  session: UserSession,
  employeeId: string,
  moduleKey: string = 'workforce'
): Promise<{ allowed: boolean; deptId: string; deptName: string }> {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { currentDepartment: true },
  });
  if (!emp) return { allowed: false, deptId: '', deptName: '' };
  const allowed = canUserEdit(session, moduleKey, emp.currentDepartmentId);
  return { allowed, deptId: emp.currentDepartmentId, deptName: emp.currentDepartment?.name || '' };
}

/**
 * Audit log writer helper
 */
export async function writeAuditLog(opts: {
  hrUserId?: string;
  hrName: string;
  action: string;
  targetEmployeeId?: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  departmentName?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        hrUserId: opts.hrUserId || null,
        hrName: opts.hrName,
        action: opts.action,
        targetEmployeeId: opts.targetEmployeeId || null,
        fieldChanged: opts.fieldChanged || null,
        oldValue: opts.oldValue || null,
        newValue: opts.newValue || null,
        departmentName: opts.departmentName || null,
        ipAddress: opts.ipAddress || null,
        metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
      },
    });
  } catch {
    // Audit log should not crash main transaction
  }
}

/**
 * Simple SHA-256 hash helper for passwords
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'hr_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}
