import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useKanbanBoards } from "@/hooks/use-kanban-boards";
import { cn } from "@/lib/utils";

import {
  BarChart3,
  Kanban,
  Mail,
  Building,
  Briefcase,
  Users,
  UserRoundCheck,
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Loader2
} from "lucide-react";

import { Input } from "@/components/ui/input";

type NavItemProps = {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  isSubmenu?: boolean;
  onClick?: () => void;
};

type SidebarProps = {
  isCollapsed?: boolean;
};

const NavItem = ({
  href,
  icon,
  children,
  isActive = false,
  isSubmenu = false,
  onClick
}: NavItemProps) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "navbar-item",
        isActive && "active",
        isSubmenu && "ml-7 text-xs py-1.5"
      )}
    >
      {icon && <span className="w-5 mr-2 text-primary">{icon}</span>}
      <span>{children}</span>
    </Link>
  );
};

export default function Sidebar({ isCollapsed = false }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({
    quadros: true
  });

  // Buscar os quadros do banco de dados
  const { boards, isLoading: loadingBoards, error } = useKanbanBoards();

  // Filtrar os quadros de acordo com a busca
  const filteredBoards = boards?.filter(board => 
    !searchQuery || board.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  return (
    <aside className={`bg-white ${isCollapsed ? 'w-16' : 'w-64'} border-r border-gray-200 flex-shrink-0 transition-all duration-300 z-20 h-[calc(100vh-64px)] overflow-hidden`}>
      <nav className="flex flex-col h-full py-4">
        {!isCollapsed && (
          <div className="px-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar..."
                className="pl-10 bg-neutral rounded-md text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}
        
        <div className="space-y-1 px-2 flex-1 overflow-y-auto">
          {/* Dashboard */}
          <NavItem 
            href="/dashboard" 
            icon={<BarChart3 />} 
            isActive={location === "/dashboard"}
          >
            Dashboard
          </NavItem>
          
          {/* Quadros de Propostas */}
          <div>
            <div 
              className="navbar-item flex items-center justify-between cursor-pointer"
              onClick={() => toggleMenu("quadros")}
            >
              <div className="flex items-center">
                <span className="w-5 mr-2 text-primary"><Kanban /></span>
                {!isCollapsed && <span>Quadros de Propostas</span>}
              </div>
              <span>
                {expandedMenus.quadros ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
            </div>
            
            {expandedMenus.quadros && (
              <div className="space-y-1 mt-1">
                <NavItem 
                  href="/quadros/gerenciador" 
                  isSubmenu 
                  isActive={location === "/quadros/gerenciador"}
                >
                  <span className="flex items-center">
                    <SlidersHorizontal className="h-3 w-3 mr-2" />
                    Gerenciador de Quadros
                  </span>
                </NavItem>
                
                <div className="border-t border-gray-100 my-2"></div>
                
                {/* Estado de carregamento dos quadros */}
                {loadingBoards && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
                
                {/* Erro ao carregar quadros */}
                {error && (
                  <div className="px-2 py-1 text-xs text-red-500">
                    Erro ao carregar quadros
                  </div>
                )}
                
                {/* Lista de quadros dinâmica do banco de dados */}
                {filteredBoards?.map(board => (
                  <NavItem 
                    key={board.id}
                    href={`/quadros/visualizar/${board.id}`} 
                    isSubmenu 
                    isActive={location === `/quadros/visualizar/${board.id}`}
                  >
                    {board.title}
                  </NavItem>
                ))}
                
                {/* Mensagem se não houver quadros */}
                {filteredBoards?.length === 0 && !loadingBoards && !error && (
                  <div className="px-2 py-1 text-xs text-gray-500">
                    Nenhum quadro encontrado
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* E-mails */}
          <NavItem 
            href="/emails" 
            icon={<Mail />} 
            isActive={location === "/emails"}
          >
            {!isCollapsed && 'E-mails'}
          </NavItem>
          
          {/* Operadoras */}
          <NavItem 
            href="/operadoras" 
            icon={<Building />} 
            isActive={location === "/operadoras"}
          >
            {!isCollapsed && 'Operadoras'}
          </NavItem>
          
          {/* Administradoras */}
          <NavItem 
            href="/administradoras" 
            icon={<Briefcase />} 
            isActive={location === "/administradoras"}
          >
            {!isCollapsed && 'Administradoras'}
          </NavItem>
          
          {/* Equipes */}
          <NavItem 
            href="/equipes" 
            icon={<Users />} 
            isActive={location === "/equipes"}
          >
            {!isCollapsed && 'Equipes'}
          </NavItem>
          
          {/* Corretores */}
          <NavItem 
            href="/corretores" 
            icon={<UserRoundCheck />} 
            isActive={location === "/corretores"}
          >
            {!isCollapsed && 'Corretores'}
          </NavItem>
        </div>
        
        <div className="mt-6 px-3">
          {/* Ajustes */}
          <NavItem 
            href="/ajustes" 
            icon={<Settings className="text-gray-500" />} 
            isActive={location === "/ajustes"}
          >
            {!isCollapsed && 'Ajustes'}
          </NavItem>
          
          {/* Informações - mostrar apenas se não estiver recolhido */}
          {!isCollapsed && (
            <div className="px-3 py-4 mt-4 bg-neutral rounded-lg">
              <div className="text-xs font-semibold text-gray-600 mb-2">Informações</div>
              <div className="text-xs text-gray-500">
                <p>VH Saúde 2.0</p>
                <p>Versão 1.0.0</p>
              </div>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
