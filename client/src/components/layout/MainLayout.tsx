import React, { useState } from 'react';
// import Header from './header'; // Remover importação do Header
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
    // Removido flex-col, pois não há mais Header empilhando verticalmente
    <div className="min-h-screen w-full flex bg-gray-50"> {/* Adicionado um bg leve ao fundo geral */}
      {/* Remover Header daqui */}
      {/* <Header 
        toggleSidebar={toggleSidebar} 
        isSidebarCollapsed={isSidebarCollapsed} 
      /> */}
      {/* A div wrapper do conteúdo principal agora é só a Sidebar + main */}
      {/* Removido flex-1 e overflow-hidden daqui, pois o controle será interno */} 
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} // Passar toggle para a Sidebar
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"> {/* Adicionado padding ao main */}
        {children}
      </main>
    </div>
  );
} 