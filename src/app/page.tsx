'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { DashboardOverviewView } from '@/components/DashboardOverviewView';
import { EmployeeDirectory } from '@/components/EmployeeDirectory';
import { DepartmentTree } from '@/components/DepartmentTree';
import type { DepartmentNode } from '@/components/DepartmentTree';
import { EmployeeProfileModal } from '@/components/EmployeeProfileModal';
import { BulkOnboardingModal } from '@/components/BulkOnboardingModal';
import { SingleEmployeeModal } from '@/components/SingleEmployeeModal';
import { DepartmentDetailModal } from '@/components/DepartmentDetailModal';
import { TransferModal } from '@/components/TransferModal';
import { KpiEngineDashboard } from '@/components/KpiEngineDashboard';
import { KpiManagementView } from '@/components/KpiManagementView';
import { ExecutiveSvodka } from '@/components/ExecutiveSvodka';
import { ExecutiveAnalyticsView } from '@/components/ExecutiveAnalyticsView';
import { InternalMobilityView } from '@/components/InternalMobilityView';
import { DisciplineRewardsView } from '@/components/DisciplineRewardsView';
import { LeaveWorkflowView } from '@/components/LeaveWorkflowView';
import { DavomatView } from '@/components/DavomatView';
import { HseView } from '@/components/HseView';
import { AuditLogView } from '@/components/AuditLogView';
import { ImportHubView } from '@/components/ImportHubView';
import { BulkImportModal, ImportType } from '@/components/BulkImportModal';
import { LoginModal } from '@/components/LoginModal';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ModuleAccessProvider, useModuleAccess } from '@/contexts/ModuleAccessContext';
import { MaintenanceOverlay } from '@/components/MaintenanceOverlay';
import { MaintenanceGuard } from '@/components/MaintenanceGuard';
import { ArrowLeftRight, ShieldAlert, Award } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

import { MainLayout } from '@/components/MainLayout';

// Inner component that uses AuthContext
function HRDashboardInner() {
  const { currentUser, isLoading } = useAuth();
  const { isModuleAccessible } = useModuleAccess();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDeptName, setSelectedDeptName] = useState<string>('');

  const [departments, setDepartments] = useState<any[]>([]);
  const [deptTree, setDeptTree] = useState<DepartmentNode[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [disciplinaryList, setDisciplinaryList] = useState<any[]>([]);
  const [rewardsList, setRewardsList] = useState<any[]>([]);
  const [activeLeaveCount, setActiveLeaveCount] = useState<number>(0);
  const [hseAlertCount, setHseAlertCount]       = useState<number>(0);

  // Modals / drawers state
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeTransferEmpId, setActiveTransferEmpId] = useState<string | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState<boolean>(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState<boolean>(false);
  const [excelImportType, setExcelImportType]   = useState<ImportType>('EMPLOYEES');

  const handleOpenExcelImport = (type: ImportType) => {
    setExcelImportType(type);
    setIsExcelImportOpen(true);
  };

  // Department drawer
  const [drawerDept, setDrawerDept] = useState<DepartmentNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const fetchDepartments = () => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDepartments(data.departments || []);
          setDeptTree(data.tree || []);
        }
      });
  };

  const fetchTransfers = () => {
    fetch('/api/transfers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTransfers(data.transfers || []);
        }
      });
  };

  const fetchDisciplineAndRewards = () => {
    fetch('/api/discipline-rewards')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDisciplinaryList(data.disciplinaryActions || []);
          setRewardsList(data.rewards || []);
        }
      });
  };

  const fetchActiveLeaves = () => {
    fetch('/api/leaves?status=ACTIVE')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setActiveLeaveCount(data.stats?.active || 0);
        }
      });
  };

  const fetchHseAlerts = () => {
    fetch('/api/hse/medical?alertsOnly=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHseAlertCount((data.stats?.expired || 0) + (data.stats?.failed || 0));
        }
      });
  };

  useEffect(() => {
    fetchDepartments();
    fetchTransfers();
    fetchDisciplineAndRewards();
    fetchActiveLeaves();
    fetchHseAlerts();
  }, []);

  /** Called from DepartmentDrawer CTA: navigate to workforce tab filtered by dept */
  const handleViewDeptEmployees = (deptId: string, deptName: string) => {
    setSelectedDeptId(deptId);
    setSelectedDeptName(deptName);
    setActiveTab('workforce');
  };

  /** Called when clicking a dept node in the tree */
  const handleDeptNodeClick = (dept: DepartmentNode) => {
    setDrawerDept(dept);
    setIsDrawerOpen(true);
  };

  // Show login screen if no session
  if (!isLoading && !currentUser) {
    return <LoginModal isOpen={true} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <MainLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSearchChange={setSearchQuery}
        onOpenSingleModal={() => setIsSingleModalOpen(true)}
        employeeCount={1500}
        activeDisciplineCount={disciplinaryList.length}
        activeLeaveCount={activeLeaveCount}
        hseAlertCount={hseAlertCount}
      >
        <MaintenanceGuard
          moduleKey={activeTab}
          onNavigateHome={() => setActiveTab('dashboard')}
        >
          {/* View 0: Primary Executive Dashboard */}
          {activeTab === 'dashboard' && (
            <DashboardOverviewView
              onSelectEmployee={(id) => setActiveProfileId(id)}
              onNavigateTab={(tabId) => setActiveTab(tabId)}
            />
          )}

          {/* View 1: Workforce Directory & Global Filters */}
          {activeTab === 'workforce' && (
            <EmployeeDirectory
              departments={departments}
              onSelectEmployee={(id) => setActiveProfileId(id)}
              onTransferEmployee={(id) => setActiveTransferEmpId(id)}
              onOpenBulkModal={() => setIsBulkModalOpen(true)}
              selectedDepartmentId={selectedDeptId}
              onSelectDepartmentId={(deptId) => setSelectedDeptId(deptId)}
            />
          )}

          {/* View 2: Department Hierarchy Tree */}
          {activeTab === 'departments' && (
            <DepartmentTree
              departments={deptTree}
              onNodeClick={handleDeptNodeClick}
              selectedDepartmentId={drawerDept?.id}
              onOpenBulkModal={() => handleOpenExcelImport('DEPARTMENTS')}
            />
          )}

          {/* View 2.5: Arizalar & Hujjat Aylanishi */}
          {activeTab === 'arizalar' && (
            <LeaveWorkflowView departments={departments} />
          )}

          {/* View 3: Enterprise KPI & Performance Evaluation Engine */}
          {activeTab === 'kpi' && <KpiManagementView departments={departments} />}

          {/* View 4: Executive Svodka & Reports */}
          {activeTab === 'svodka' && <ExecutiveSvodka />}

          {/* View 4.5: Executive Analytics Dashboard */}
          {activeTab === 'analytics' && <ExecutiveAnalyticsView />}

          {/* View 5: Internal Mobility & Transfer Logs */}
          {activeTab === 'transfers' && <InternalMobilityView />}

          {/* View 6: Discipline & Rewards */}
          {activeTab === 'discipline' && (
            <DisciplineRewardsView departments={departments} />
          )}

          {/* View 7: Davomat & Ta'tillar Boshqaruvi */}
          {activeTab === 'davomat' && (
            <DavomatView departments={departments} />
          )}

          {/* View 8: HSE — Med-Ko'rik va Xavfsizlik */}
          {activeTab === 'hse' && (
            <HseView
              departments={departments}
              onOpenBulkModal={() => handleOpenExcelImport('HSE')}
            />
          )}

          {/* View 8.5: Standalone Ommaviy Fayllarni Yuklash Hub */}
          {activeTab === 'import' && (
            <ImportHubView />
          )}

          {/* View 9: Tizim Auditi va Loglar */}
          {activeTab === 'audit' && (
            <AuditLogView
              departments={departments}
              onOpenAddEmployee={() => setIsSingleModalOpen(true)}
            />
          )}
        </MaintenanceGuard>
      </MainLayout>

      {/* Global Modals */}
      <EmployeeProfileModal
        employeeId={activeProfileId}
        onClose={() => setActiveProfileId(null)}
      />

      <TransferModal
        employeeId={activeTransferEmpId}
        onClose={() => setActiveTransferEmpId(null)}
        departments={departments}
        onSuccess={() => {
          fetchDepartments();
          fetchTransfers();
        }}
      />

      <BulkOnboardingModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        departments={departments}
        onSuccess={() => {
          fetchDepartments();
        }}
      />

      <SingleEmployeeModal
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        departments={departments}
        onSuccess={() => {
          fetchDepartments();
        }}
      />

      <BulkImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        defaultType={excelImportType}
        onSuccess={() => {
          fetchDepartments();
          fetchActiveLeaves();
          fetchHseAlerts();
        }}
      />

      {/* Department Detail Modal (center modal, triggered from tree node click) */}
      <DepartmentDetailModal
        department={drawerDept}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onViewProfile={(empId) => setActiveProfileId(empId)}
        onViewEmployees={handleViewDeptEmployees}
      />
    </>
  );
}

// Wrap with ThemeProvider, LanguageProvider, and AuthProvider for the entire app
export default function HRDashboard() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ModuleAccessProvider>
            <HRDashboardInner />
          </ModuleAccessProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
