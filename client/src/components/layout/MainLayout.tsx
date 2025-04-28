import React, { useState } from 'react';
import Header from './header';
import Sidebar from './sidebar';

type MainLayoutProps = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header 
        toggleSidebar={toggleSidebar} 
        isSidebarCollapsed={isSidebarCollapsed} 
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 