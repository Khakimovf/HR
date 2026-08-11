'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { EmployeeDirectory } from '@/components/EmployeeDirectory';
import { DepartmentTree } from '@/components/DepartmentTree';
import type { DepartmentNode } from '@/components/DepartmentTree';
import { EmployeeProfileModal } from '@/components/EmployeeProfileModal';
import { BulkOnboardingModal } from '@/components/BulkOnboardingModal';
import { SingleEmployeeModal } from '@/components/SingleEmployeeModal';
import { DepartmentDetailModal } from '@/components/DepartmentDetailModal';
import { TransferModal } from '@/components/TransferModal';
import { KpiEngineDashboard } from '@/components/KpiEngineDashboard';
import { ExecutiveSvodka } from '@/components/ExecutiveSvodka';
import { InternalMobilityView } from '@/components/InternalMobilityView';
import { ArrowLeftRight, ShieldAlert, Award } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState<string>('workforce');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDeptName, setSelectedDeptName] = useState<string>('');

  const [departments, setDepartments] = useState<any[]>([]);
  const [deptTree, setDeptTree] = useState<DepartmentNode[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [disciplinaryList, setDisciplinaryList] = useState<any[]>([]);
  const [rewardsList, setRewardsList] = useState<any[]>([]);

  // Modals / drawers state
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeTransferEmpId, setActiveTransferEmpId] = useState<string | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState<boolean>(false);

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

  useEffect(() => {
    fetchDepartments();
    fetchTransfers();
    fetchDisciplineAndRewards();
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

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar
        onSearchChange={setSearchQuery}
        onOpenSingleModal={() => setIsSingleModalOpen(true)}
        activeTab={activeTab}
        totalEmployeesCount={1500}
      />

      <div className="flex flex-1">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          employeeCount={1500}
          activeDisciplineCount={disciplinaryList.length}
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
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
            />
          )}

          {/* View 3: Automated KPI Engine */}
          {activeTab === 'kpi' && <KpiEngineDashboard />}

          {/* View 4: Executive Svodka & Reports */}
          {activeTab === 'svodka' && <ExecutiveSvodka />}

          {/* View 5: Internal Mobility & Transfer Logs */}
          {activeTab === 'transfers' && <InternalMobilityView />}

          {/* View 6: Discipline & Rewards */}
          {activeTab === 'discipline' && (
            <div className="space-y-6">
              {/* Disciplinary Actions */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                  <span>Intizomiy Jazo Choralari va Buyruqlar Logi</span>
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Xodim</th>
                        <th className="px-4 py-3">Jazo Turi</th>
                        <th className="px-4 py-3">Buyruq №</th>
                        <th className="px-4 py-3">Berilgan Sana</th>
                        <th className="px-4 py-3">Amal Qilish Muddati</th>
                        <th className="px-4 py-3">Izoh / Sabab</th>
                        <th className="px-4 py-3 text-right">Holati</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                      {disciplinaryList.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-900/60 transition">
                          <td className="px-4 py-3 font-semibold text-slate-200">
                            <span className="font-mono text-indigo-400 mr-2">[{d.employee?.tabelNumber}]</span>
                            {d.employee?.lastName} {d.employee?.firstName}
                          </td>
                          <td className="px-4 py-3 font-bold text-rose-400">{d.type}</td>
                          <td className="px-4 py-3 font-mono text-slate-300">{d.orderNumber}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{formatDate(d.startDate)}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{formatDate(d.expiryDate)}</td>
                          <td className="px-4 py-3 text-slate-300">{d.notes}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rewards */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-400" />
                  <span>Mukofotlar va Moddiy Yordam Logi</span>
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Xodim</th>
                        <th className="px-4 py-3">Turi</th>
                        <th className="px-4 py-3">Buyruq №</th>
                        <th className="px-4 py-3">Berilgan Sana</th>
                        <th className="px-4 py-3">Sabab</th>
                        <th className="px-4 py-3 text-right">Summa (UZS)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                      {rewardsList.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-900/60 transition">
                          <td className="px-4 py-3 font-sans font-semibold text-slate-200">
                            <span className="font-mono text-indigo-400 mr-2">[{r.employee?.tabelNumber}]</span>
                            {r.employee?.lastName} {r.employee?.firstName}
                          </td>
                          <td className="px-4 py-3 font-sans font-bold text-emerald-400">{r.type}</td>
                          <td className="px-4 py-3 text-slate-300">{r.orderNumber}</td>
                          <td className="px-4 py-3 text-slate-400">{formatDate(r.orderDate)}</td>
                          <td className="px-4 py-3 font-sans text-slate-300">{r.reason}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-400">
                            {formatCurrency(r.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

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

      {/* Department Detail Modal (center modal, triggered from tree node click) */}
      <DepartmentDetailModal
        department={drawerDept}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onViewProfile={(empId) => setActiveProfileId(empId)}
        onViewEmployees={handleViewDeptEmployees}
      />
    </div>
  );
}
