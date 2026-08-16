'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ModuleStatus = 'ACTIVE' | 'MAINTENANCE' | 'COMING_SOON';

export interface ModuleConfig {
  key: string;
  name_uz: string;
  name_kr: string;
  status: ModuleStatus;
  message_uz: string;
  message_kr: string;
  estimated_completion: string;
  allowed_roles: string[];
}

export const DEFAULT_MODULE_CONFIGS: Record<string, ModuleConfig> = {
  dashboard: {
    key: 'dashboard',
    name_uz: 'Asosiy Dashboard',
    name_kr: '메인 대시보드',
    status: 'ACTIVE',
    message_uz: "Ushbu modulda rejali texnik yangilanish va optimallashtirish ishlari olib borilmoqda.",
    message_kr: '본 모듈은 현재 정기 시스템 점검 및 최적화 작업 중입니다.',
    estimated_completion: '18:00 (Bugun)',
    allowed_roles: ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR'],
  },
  workforce: {
    key: 'workforce',
    name_uz: 'Xodimlar Bazasi',
    name_kr: '임직원 데이터베이스',
    status: 'ACTIVE',
    message_uz: "Xodimlar reestri bazasida profilaktika ishlari bajarilmoqda.",
    message_kr: '임직원 데이터베이스 점검 작업 중입니다.',
    estimated_completion: '20:00 (Bugun)',
    allowed_roles: ['SUPER_ADMIN'],
  },
  kpi: {
    key: 'kpi',
    name_uz: 'KPI & Mukofot Dvigateli',
    name_kr: 'KPI 및 성과급 엔진',
    status: 'ACTIVE',
    message_uz: "KPI hisoblash dvigatelida qayta kalibrlash ishlari ketmoqda.",
    message_kr: 'KPI 계산 엔진 재설정 작업 중입니다.',
    estimated_completion: '19:00 (Bugun)',
    allowed_roles: ['SUPER_ADMIN'],
  },
  analytics: {
    key: 'analytics',
    name_uz: 'Rahbariyat Analitikasi',
    name_kr: '경영진 분석 모듈',
    status: 'ACTIVE',
    message_uz: "Rahbariyat tahliliy svodka tizimida profilaktika ketmoqda.",
    message_kr: '경영 분석 시스템 점검 중입니다.',
    estimated_completion: '21:00 (Bugun)',
    allowed_roles: ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR'],
  },
  arizalar: {
    key: 'arizalar',
    name_uz: 'Arizalar & Hujjat Aylanishi',
    name_kr: '전자 결재 및 신청서',
    status: 'ACTIVE',
    message_uz: "Hujjatlar aylanishi va elektron imzo modulida profilaktika ketmoqda.",
    message_kr: '전자 결재 및 서명 모듈 점검 중입니다.',
    estimated_completion: '18:30 (Bugun)',
    allowed_roles: ['SUPER_ADMIN'],
  },
  departments: {
    key: 'departments',
    name_uz: "Bo'limlar Ierarxiyasi",
    name_kr: '조직도 및 부서 구조',
    status: 'ACTIVE',
    message_uz: "Tashkiliy ierarxiya daraxtida yangilanish olib borilmoqda.",
    message_kr: '조직도 업데이트 작업 중입니다.',
    estimated_completion: '17:00 (Bugun)',
    allowed_roles: ['SUPER_ADMIN'],
  },
  svodka: {
    key: 'svodka',
    name_uz: 'Ijroiy Svodka & Hisobot',
    name_kr: '실행 요약 보고서',
    status: 'ACTIVE',
    message_uz: "Hisobotlarni shakllantirish dvigatelida profilaktika ketmoqda.",
    message_kr: '보고서 생성 엔진 점검 중입니다.',
    estimated_completion: '19:30 (Bugun)',
    allowed_roles: ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR'],
  },
  transfers: {
    key: 'transfers',
    name_uz: "Bo'limlararo Ko'chish",
    name_kr: '부서 이동 및 전보 이력',
    status: 'ACTIVE',
    message_uz: "Kadrlar ko'chishi jurnali modulida profilaktika ketmoqda.",
    message_kr: '부서 이동 이력 모듈 점검 중입니다.',
    estimated_completion: '18:00 (Bugun)',
    allowed_roles: ['SUPER_ADMIN'],
  },
  discipline: {
    key: 'discipline',
    name_uz: 'Intizom & Mukofotlar',
    name_kr: '징계 및 포상 관리',
    status: 'ACTIVE',
    message_uz: "Intizomiy choralar va rag'batlantirish modulida texnik yangilanish ketmoqda.",
    message_kr: '징계 및 포상 관리 모듈 점검 중입니다.',
    estimated_completion: '20:00 (Bugun)',
    allowed_roles: ['SUPER_ADMIN'],
  },
  davomat: {
    key: 'davomat',
    name_uz: "Davomat & Ta'tillar",
    name_kr: '근태 및 휴가 관리',
    status: 'ACTIVE',
    message_uz: "Davomat va ta'tillar hisobi modulida texnik profilaktika ketmoqda.",
    message_kr: '근태 및 휴가 관리 시스템 점검 중입니다.',
    estimated_completion: '19:00 (Bugun)',
    allowed_roles: ['SUPER_ADMIN'],
  },
  hse: {
    key: 'hse',
    name_uz: "Med-Ko'rik va Xavfsizlik",
    name_kr: '보건 안전 및 건강검진 (HSE)',
    status: 'ACTIVE',
    message_uz: "Mehnat muhofazasi va HSE modulida texnik yangilanish olib borilmoqda.",
    message_kr: '보건 안전 시스템 업데이트 중입니다.',
    estimated_completion: '18:00 (Bugun)',
    allowed_roles: ['SUPER_ADMIN', 'AUDITOR'],
  },
  import: {
    key: 'import',
    name_uz: 'Ommaviy Fayllarni Yuklash',
    name_kr: '대용량 데이터 업로드 Hub',
    status: 'ACTIVE',
    message_uz: "Excel / CSV fayllarni import qilish xizmatida profilaktika ketmoqda.",
    message_kr: '데이터 업로드 허브 점검 중입니다.',
    estimated_completion: '21:00 (Bugun)',
    allowed_roles: ['SUPER_ADMIN'],
  },
  audit: {
    key: 'audit',
    name_uz: 'Tizim Auditi va Loglar',
    name_kr: '시스템 감사 및 로그',
    status: 'ACTIVE',
    message_uz: "Tizim auditi va foydalanuvchilar boshqaruvi modulida profilaktika ketmoqda.",
    message_kr: '시스템 감사 모듈 점검 중입니다.',
    estimated_completion: '22:00 (Bugun)',
    allowed_roles: ['SUPER_ADMIN'],
  },
};

interface ModuleAccessContextType {
  modules: Record<string, ModuleConfig>;
  getModuleConfig: (key: string) => ModuleConfig;
  updateModuleConfig: (key: string, updates: Partial<ModuleConfig>) => void;
  toggleModuleStatus: (key: string, newStatus?: ModuleStatus) => void;
  isModuleAccessible: (key: string, userRole?: string) => boolean;
  resetAllModules: () => void;
}

const ModuleAccessContext = createContext<ModuleAccessContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'hr_module_access_config_v1';

export const ModuleAccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<Record<string, ModuleConfig>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_MODULE_CONFIGS, ...parsed };
        }
      } catch (e) {
        console.error('Failed to load module access config from localStorage', e);
      }
    }
    return DEFAULT_MODULE_CONFIGS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(modules));
      } catch (e) {
        console.error('Failed to save module access config to localStorage', e);
      }
    }
  }, [modules]);

  const getModuleConfig = (key: string): ModuleConfig => {
    return modules[key] || {
      key,
      name_uz: key,
      name_kr: key,
      status: 'ACTIVE',
      message_uz: "Ushbu modulda texnik yangilanish bajarilmoqda.",
      message_kr: '본 모듈은 현재 점검 중입니다.',
      estimated_completion: '18:00',
      allowed_roles: ['SUPER_ADMIN'],
    };
  };

  const updateModuleConfig = (key: string, updates: Partial<ModuleConfig>) => {
    setModules((prev) => {
      const current = prev[key] || getModuleConfig(key);
      return {
        ...prev,
        [key]: { ...current, ...updates },
      };
    });
  };

  const toggleModuleStatus = (key: string, newStatus?: ModuleStatus) => {
    setModules((prev) => {
      const current = prev[key] || getModuleConfig(key);
      let nextStatus: ModuleStatus;
      if (newStatus) {
        nextStatus = newStatus;
      } else {
        nextStatus = current.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
      }
      return {
        ...prev,
        [key]: { ...current, status: nextStatus },
      };
    });
  };

  const isModuleAccessible = (key: string, userRole?: string): boolean => {
    const config = getModuleConfig(key);
    if (config.status === 'ACTIVE') return true;

    // Super Admin can always access or bypass for testing
    if (userRole === 'SUPER_ADMIN') return true;

    if (userRole && config.allowed_roles.includes(userRole)) {
      return true;
    }

    return false;
  };

  const resetAllModules = () => {
    setModules(DEFAULT_MODULE_CONFIGS);
  };

  return (
    <ModuleAccessContext.Provider
      value={{
        modules,
        getModuleConfig,
        updateModuleConfig,
        toggleModuleStatus,
        isModuleAccessible,
        resetAllModules,
      }}
    >
      {children}
    </ModuleAccessContext.Provider>
  );
};

export const useModuleAccess = () => {
  const context = useContext(ModuleAccessContext);
  if (!context) {
    throw new Error('useModuleAccess must be used within a ModuleAccessProvider');
  }
  return context;
};
