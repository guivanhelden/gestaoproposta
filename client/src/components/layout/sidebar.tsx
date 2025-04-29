import { useState } from "react";
import { Link, useLocation } from "wouter";
import * as Collapsible from '@radix-ui/react-collapsible';
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
  Loader2,
  LayoutDashboard,
  PanelLeft,
  LogOut,
  User,
  HelpCircle
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  isCollapsed?: boolean;
  className?: string;
};

type NavGroupProps = {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isCollapsed?: boolean;
  defaultOpen?: boolean;
};

type SidebarProps = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
};

const NavItem = ({
  href,
  icon,
  children,
  isActive = false,
  isCollapsed = false,
  className,
}: NavItemProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center text-sm font-medium rounded-md transition-colors duration-150",
        "text-purple-100 hover:bg-purple-600 hover:text-white",
        isActive ? "bg-purple-800 text-white" : "",
        isCollapsed ? "justify-center h-10 w-10" : "px-3 py-2",
        className
      )}
    >
      <span className={cn("flex-shrink-0", isCollapsed ? "" : "mr-3")}>
        {icon}
      </span>
      {!isCollapsed && <span className="truncate">{children}</span>}
    </Link>
  );
};

const SubNavItem = ({
  href,
  children,
  icon,
  isActive = false,
  className,
}: { 
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  isActive?: boolean;
  className?: string; 
}) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center text-xs font-medium rounded-md transition-colors duration-150 py-1.5 pr-3",
        "text-purple-200 hover:bg-purple-600 hover:text-white pl-10",
        isActive ? "bg-purple-800 text-white" : "",
        className
      )}
    >
      {icon && <span className="mr-2 flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </Link>
  );
};

const NavGroup = ({ title, icon, children, isCollapsed = false, defaultOpen = false }: NavGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (isCollapsed) {
    return (
      <div className="flex justify-center h-10 w-10 items-center text-purple-100" title={title}>
         <span className="flex-shrink-0">{icon}</span>
      </div>
    )
  }

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen} className="space-y-1">
      <Collapsible.Trigger asChild>
         <Button
            variant="ghost"
            className={cn(
              "flex items-center justify-between w-full text-sm font-medium rounded-md transition-colors duration-150",
              "text-purple-100 hover:bg-purple-600 hover:text-white focus:bg-purple-600 focus:text-white",
              "px-3 py-2"
            )}
          >
            <div className="flex items-center">
              <span className="mr-3 flex-shrink-0">{icon}</span>
              <span className="truncate">{title}</span>
            </div>
            <span className="ml-auto">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
         </Button>
      </Collapsible.Trigger>
      <Collapsible.Content className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
         <div className="pt-1 space-y-1">
           {children}
         </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

const getInitials = (name: string) => {
  if (!name) return "US";
  return name
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { boards, isLoading: loadingBoards, error } = useKanbanBoards();

  const filteredBoards = boards?.filter(board =>
    !searchQuery || board.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <aside className={cn(
      "bg-purple-700 text-white flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out",
      "h-screen sticky top-0",
      isCollapsed ? 'w-16' : 'w-64',
      "shadow-2xl",
      "z-20",
      "rounded-r-2xl"
    )}>
      <div className={cn(
        "flex items-center border-b border-purple-800 h-16",
        isCollapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {!isCollapsed && (
           <img 
              src="https://doc.vhseguros.com.br/logos_vh/VAN-HELDEN-branco.png"
              alt="VAN HELDEN" 
              className="h-16 object-contain py-1 ml-4"
            />
        )}
        {isCollapsed && (
            <img 
              src="https://doc.vhseguros.com.br/files/public_html/LogoVH%2Fvertical-logo-vh-branco.png"
              alt="VH" 
              className="h-8 object-contain py-1"
            />
        )}
        <Button 
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "text-purple-200 hover:text-white hover:bg-purple-600",
          )}
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex flex-col flex-1 overflow-y-auto p-2 space-y-1">
        {!isCollapsed && (
          <div className="px-1 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-300" />
              <Input
                type="text"
                placeholder="Buscar..."
                className={cn(
                  "pl-9 w-full h-9 text-sm rounded-md border-purple-600",
                  "bg-purple-600 placeholder-purple-300 text-white focus:bg-purple-500 focus:ring-purple-500 focus:border-purple-500"
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex-1 space-y-1">
          <NavItem
            href="/dashboard"
            icon={<LayoutDashboard size={20} />}
            isActive={location === "/dashboard"}
            isCollapsed={isCollapsed}
          >
            Dashboard
          </NavItem>

          <NavGroup
            title="Quadros"
            icon={<Kanban size={20} />}
            isCollapsed={isCollapsed}
            defaultOpen={true}
          >
             <SubNavItem
              href="/quadros/gerenciador"
              icon={<SlidersHorizontal size={14} />}
              isActive={location === "/quadros/gerenciador"}
            >
              Gerenciador
             </SubNavItem>

            {!isCollapsed && <hr className="border-t border-purple-600 my-1 mx-3" />}

            {loadingBoards && !isCollapsed && (
              <div className="flex justify-center items-center py-2 px-3 text-purple-200">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-xs">Carregando...</span>
              </div>
            )}
            {error && !isCollapsed && (
              <div className="px-3 py-1 text-xs text-red-300">
                Erro ao carregar quadros
              </div>
            )}
            {filteredBoards?.map(board => (
              <SubNavItem
                key={board.id}
                href={`/quadros/visualizar/${board.id}`}
                isActive={location === `/quadros/visualizar/${board.id}`}
              >
                {board.title}
              </SubNavItem>
            ))}
            {filteredBoards?.length === 0 && !loadingBoards && !error && !isCollapsed && (
              <div className="px-3 py-1 text-xs text-purple-300">
                Nenhum quadro.
              </div>
            )}
           </NavGroup>

          <NavItem
            href="/emails"
            icon={<Mail size={20} />}
            isActive={location === "/emails"}
            isCollapsed={isCollapsed}
          >
            E-mails
          </NavItem>

          <NavItem
            href="/operadoras"
            icon={<Building size={20} />}
            isActive={location === "/operadoras"}
            isCollapsed={isCollapsed}
          >
            Operadoras
          </NavItem>

          <NavItem
            href="/administradoras"
            icon={<Briefcase size={20} />}
            isActive={location === "/administradoras"}
            isCollapsed={isCollapsed}
          >
            Admin.
          </NavItem>

           <NavItem
            href="/equipes"
            icon={<Users size={20} />}
            isActive={location === "/equipes"}
            isCollapsed={isCollapsed}
          >
            Equipes
          </NavItem>

          <NavItem
            href="/corretores"
            icon={<UserRoundCheck size={20} />}
            isActive={location === "/corretores"}
            isCollapsed={isCollapsed}
          >
            Corretores
          </NavItem>
        </div>

        <div className="mt-auto space-y-1 pt-2 border-t border-purple-800">
           <NavItem
            href="/ajustes"
            icon={<Settings size={20} />}
            isActive={location === "/ajustes"}
            isCollapsed={isCollapsed}
          >
            Ajustes
          </NavItem>

          {!isCollapsed && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-3 py-2 mt-1 text-purple-100 hover:bg-purple-600 hover:text-white">
                  <Avatar className="h-7 w-7 mr-2"> 
                    <AvatarImage src={user.avatar_url || undefined} alt={user.name || "Usuário"} />
                    <AvatarFallback className="bg-purple-500 text-xs">{getInitials(user.name || "")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left truncate">
                    <div className="text-sm font-medium leading-tight">{user.name || "Usuário"}</div>
                    <div className="text-xs text-purple-300 capitalize truncate">{user.roles?.[0] || "Usuário"}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="mb-2 ml-2 w-56 bg-white text-gray-800">
                 <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/perfil')}>
                   <User className="mr-2 h-4 w-4" />
                   Perfil
                 </DropdownMenuItem>
                 <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/ajustes')}>
                   <Settings className="mr-2 h-4 w-4" />
                   Configurações
                 </DropdownMenuItem>
                 <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/ajuda')}>
                   <HelpCircle className="mr-2 h-4 w-4" />
                   Ajuda
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem 
                   className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50"
                   onClick={handleLogout}
                 >
                   <LogOut className="mr-2 h-4 w-4" />
                   Sair
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
           {isCollapsed && user && (
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-purple-100 hover:bg-purple-600">
                   <Avatar className="h-7 w-7"> 
                     <AvatarImage src={user.avatar_url || undefined} alt={user.name || "Usuário"} />
                     <AvatarFallback className="bg-purple-500 text-xs">{getInitials(user.name || "")}</AvatarFallback>
                   </Avatar>
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent side="right" align="start" className="ml-2 w-56 bg-white text-gray-800">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/perfil')}>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/ajustes')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/ajuda')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Ajuda
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           )}
        </div>
      </nav>
    </aside>
  );
}
