'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'CEO'
  | 'DEPUTY_CEO'
  | 'HR_DIRECTOR'
  | 'FINANCE'
  | 'CTO'
  | 'DIVISION_HEAD'
  | 'HR_OFFICER'
  | 'DEPT_HEAD'
  | 'WORKER'
  | 'EXECUTIVE_DIRECTOR'
  | 'AUDITOR'
  | string;

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
  allowedModuleKeys: string[];
  assignedDepartmentIds: string[];
}

interface AuthContextValue {
  currentUser: UserSession | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  canUserEdit: (moduleKey: string, deptId?: string | null | undefined) => boolean;
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
  logout: async () => {},
  canUserEdit: () => false,
  hasModuleAccess: () => false,
  canEditEmployee: () => false,
  canEditDept: () => false,
  isSuperAdmin: false,
  isExecutiveDirector: false,
  isAuditor: false,
  isReadOnly: false,
});

function normalizeUser(user: UserSession): UserSession {
  if (!user.assignedDepartmentIds && (user as any).assignedDepartments) {
    user.assignedDepartmentIds = (user as any).assignedDepartments || [];
  }
  if (!user.assignedDepartmentIds) user.assignedDepartmentIds = [];
  if (!user.allowedModuleKeys) {
    user.allowedModuleKeys = [
      'workforce',
      'departments',
      'arizalar',
      'kpi',
      'svodka',
      'transfers',
      'discipline',
      'davomat',
      'hse',
      'audit',
    ];
  }
  return user;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(normalizeUser(data.user as UserSession));
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(normalizeUser(data.user as UserSession));
        return { success: true };
      }
      return { success: false, error: data.error || 'Kirish amalga oshmadi' };
    } catch {
      return { success: false, error: 'Tarmoq xatoligi' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    } finally {
      setCurrentUser(null);
    }
  }, []);

  const hasModuleAccess = useCallback(
    (moduleKey: string): boolean => {
      if (!currentUser) return false;
      if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'EXECUTIVE_DIRECTOR') return true;
      return currentUser.allowedModuleKeys.includes(moduleKey);
    },
    [currentUser]
  );

  const canUserEdit = useCallback((_moduleKey: string, _deptId?: string | null | undefined): boolean => {
    return true;
  }, []);

  const canEditEmployee = useCallback((_deptId: string | null | undefined): boolean => {
    return true;
  }, []);

  const canEditDept = useCallback((_deptId: string | null | undefined): boolean => {
    return true;
  }, []);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isExecutiveDirector = currentUser?.role === 'EXECUTIVE_DIRECTOR';
  const isAuditor = currentUser?.role === 'AUDITOR';
  const isReadOnly = isExecutiveDirector || isAuditor;

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
