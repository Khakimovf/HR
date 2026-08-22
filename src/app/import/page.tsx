'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { ImportHubView } from '@/components/ImportHubView';
import { LoginModal } from '@/components/LoginModal';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function ImportPageInner() {
  const { currentUser, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('import');
  const [employeeCount, setEmployeeCount] = useState(0);

  useEffect(() => {
    fetch('/api/employees?limit=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEmployeeCount(data.totalCount ?? data.pagination?.total ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  if (!isLoading && !currentUser) {
    return <LoginModal isOpen={true} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar
        onSearchChange={() => {}}
        onOpenSingleModal={() => {}}
        activeTab={activeTab}
        totalEmployeesCount={employeeCount}
      />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} employeeCount={employeeCount} />
        <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          <ImportHubView />
        </main>
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <AuthProvider>
      <ImportPageInner />
    </AuthProvider>
  );
}
