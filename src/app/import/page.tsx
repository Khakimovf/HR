'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { ImportHubView } from '@/components/ImportHubView';
import { LoginModal } from '@/components/LoginModal';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function ImportPageInner() {
  const { currentUser, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('import');

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
        totalEmployeesCount={1500}
      />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} employeeCount={1500} />
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
