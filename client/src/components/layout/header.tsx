import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

import {
  Bell,
  Menu,
  PanelLeft,
  ChevronDown,
  LogOut,
  User,
  Settings,
  HelpCircle
} from "lucide-react";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type HeaderProps = {
  toggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
};

export default function Header({ toggleSidebar, isSidebarCollapsed }: HeaderProps) {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex justify-between items-center px-4 py-2 h-16">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "text-gray-500 hover:text-primary mr-2 transition-all",
              isSidebarCollapsed && "bg-primary/10"
            )}
            title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center">
            <img 
              src="https://doc.vhseguros.com.br/logos_vh/VAN-HELDEN-cor.png" 
              alt="VAN HELDEN" 
              className="h-12 mr-8" 
            />
          </div>
        </div>
        
        <div className="flex items-center">
          {/* Notificações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-primary">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                <div className="p-3 hover:bg-gray-50 cursor-pointer">
                  <div className="font-medium">Nova proposta criada</div>
                  <div className="text-sm text-gray-500">Tech Solutions ME - Amil</div>
                  <div className="text-xs text-gray-400 mt-1">Há 10 minutos</div>
                </div>
                <div className="p-3 hover:bg-gray-50 cursor-pointer">
                  <div className="font-medium">Pendência documentação</div>
                  <div className="text-sm text-gray-500">Consultório Dr. Mendes - Pendência</div>
                  <div className="text-xs text-gray-400 mt-1">Há 2 horas</div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2 text-center text-sm text-primary font-medium cursor-pointer">
                Ver todas notificações
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Perfil do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-3 flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || "Usuário"} />
                  <AvatarFallback>{getInitials(user?.name || "")}</AvatarFallback>
                </Avatar>
                <div className="ml-2 hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-700">{user?.name || "Usuário"}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.roles?.[0] || "Usuário"}</div>
                </div>
                <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer"
                onClick={() => navigate("/ajustes")}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                Ajuda
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500"
                onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
