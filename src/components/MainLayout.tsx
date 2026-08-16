'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSearchChange: (query: string) => void;
  onOpenSingleModal?: () => void;
  employeeCount?: number;
  activeDisciplineCount?: number;
  activeLeaveCount?: number;
  hseAlertCount?: number;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  onSearchChange,
  onOpenSingleModal,
  employeeCount = 1500,
  activeDisciplineCount = 6,
  activeLeaveCount = 0,
  hseAlertCount = 0,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        employeeCount={employeeCount}
        activeDisciplineCount={activeDisciplineCount}
        activeLeaveCount={activeLeaveCount}
        hseAlertCount={hseAlertCount}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Right Main Column (Header + Fluid View Content) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Sticky Top Header */}
        <Header
          activeTab={activeTab}
          onSearchChange={onSearchChange}
          onOpenSingleModal={onOpenSingleModal}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Fluid Scrollable Content Area */}
        <main className="flex-1 p-4 sm:p-5 overflow-y-auto bg-gray-50 dark:bg-slate-950 transition-all">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
