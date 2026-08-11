'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
  allowedModuleKeys: string[];     // Module-level permission keys
  assignedDepartmentIds: string[]; // Department-level scoping IDs
}

interface AuthContextValue {
  currentUser: UserSession | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  /** Checks 2D permissions: Module Access + Department Scoping */
  canUserEdit: (moduleKey: string, deptId?: string | null | undefined) => boolean;
  /** Checks if user has permission to open/view a Sidebar module */
  hasModuleAccess: (moduleKey: string) => boolean;
  canEditEmployee: (deptId: string | null | undefined) => boolean;
  canEditDept: (deptId: string | null | undefined) => boolean;
  isSuperAdmin: boolean;
  isExecutiveDirector: boolean;
  isAuditor: boolean;
  isReadOnly: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: () => {},
  canUserEdit: () => false,
  hasModuleAccess: () => false,
  canEditEmployee: () => false,
  canEditDept: () => false,
  isSuperAdmin: false,
  isExecutiveDirector: false,
  isAuditor: false,
  isReadOnly: false,
});

const SESSION_KEY = 'hr_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading]     = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserSession;
        if (!parsed.assignedDepartmentIds && (parsed as any).assignedDepartments) {
          parsed.assignedDepartmentIds = (parsed as any).assignedDepartments || [];
        }
        if (!parsed.assignedDepartmentIds) parsed.assignedDepartmentIds = [];
        if (!parsed.allowedModuleKeys) parsed.allowedModuleKeys = ['workforce', 'departments', 'kpi', 'svodka', 'transfers', 'discipline', 'davomat', 'hse', 'audit'];
        setCurrentUser(parsed);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        const user = data.user as UserSession;
        if (!user.assignedDepartmentIds) user.assignedDepartmentIds = [];
        if (!user.allowedModuleKeys) user.allowedModuleKeys = ['workforce', 'departments', 'kpi', 'svodka', 'transfers', 'discipline', 'davomat', 'hse', 'audit'];
        setCurrentUser(user);
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return { success: true };
      }
      return { success: false, error: data.error || 'Kirish amalga oshmadi' };
    } catch {
      return { success: false, error: 'Tarmoq xatoligi' };
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const hasModuleAccess = useCallback((moduleKey: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'EXECUTIVE_DIRECTOR') return true;
    return currentUser.allowedModuleKeys.includes(moduleKey);
  }, [currentUser]);

  const canUserEdit = useCallback((moduleKey: string, deptId?: string | null | undefined): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (currentUser.role === 'EXECUTIVE_DIRECTOR' || currentUser.role === 'AUDITOR') return false;

    // 1. Check Module Access
    if (!currentUser.allowedModuleKeys.includes(moduleKey)) return false;

    // 2. Check Department Scoping
    if (deptId) {
      return currentUser.assignedDepartmentIds.includes(deptId);
    }

    return true;
  }, [currentUser]);

  const canEditEmployee = useCallback((deptId: string | null | undefined): boolean => {
    return canUserEdit('workforce', deptId);
  }, [canUserEdit]);

  const canEditDept = useCallback((deptId: string | null | undefined): boolean => {
    return canUserEdit('departments', deptId);
  }, [canUserEdit]);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isExecutiveDirector = currentUser?.role === 'EXECUTIVE_DIRECTOR';
  const isAuditor = currentUser?.role === 'AUDITOR';
  const isReadOnly = isExecutiveDirector || isAuditor;

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoading,
      login,
      logout,
      canUserEdit,
      hasModuleAccess,
      canEditEmployee,
      canEditDept,
      isSuperAdmin,
      isExecutiveDirector,
      isAuditor,
      isReadOnly,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
