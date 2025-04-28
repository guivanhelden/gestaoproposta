import { useState, useEffect } from "react";
import KanbanBoardsManager from "@/components/kanban/kanban-boards-manager";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import supabase from "@/lib/supabase";

export default function GerenciadorQuadros() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddingAdminRole, setIsAddingAdminRole] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAdmin(user.roles?.includes('admin') || false);
    }
  }, [user]);

  const addAdminRole = async () => {
    if (!user) return;
    
    try {
      setIsAddingAdminRole(true);
      
      // Verificar se o papel já existe
      const { data, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', 'admin');
        
      if (checkError) throw checkError;
      
      // Se o papel já existe, não fazer nada
      if (data && data.length > 0) {
        toast({
          title: "Administrador",
          description: "Você já tem permissões de administrador."
        });
        return;
      }
      
      // Adicionar papel de admin
      const { error } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: user.id,
            role: 'admin'
          }
        ]);
        
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Papel de administrador adicionado. Recarregue a página para ver as mudanças."
      });
      
      // Recarregar a página para atualizar as permissões
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error("Erro ao adicionar papel de admin:", err);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o papel de administrador.",
        variant: "destructive"
      });
    } finally {
      setIsAddingAdminRole(false);
    }
  };

  return (
    <>
      {/* Verificação de Admin para visualizar todos os quadros */}
      {user && !isAdmin && (
        <div className="bg-blue-50 p-4 m-6 rounded-md border border-blue-200">
          <h3 className="text-blue-800 font-medium mb-2">Permissões Limitadas</h3>
          <p className="text-blue-700 mb-4">
            Você está vendo apenas os quadros que você criou. Para ver todos os quadros, você precisa de permissões de administrador.
          </p>
          <Button 
            onClick={addAdminRole}
            disabled={isAddingAdminRole}
          >
            {isAddingAdminRole ? "Adicionando..." : "Adicionar Permissões de Administrador"}
          </Button>
        </div>
      )}
      
      <KanbanBoardsManager />
    </>
  );
} 