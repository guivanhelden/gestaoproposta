import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import supabase from "../lib/supabase";

// Importar o novo componente de formulário
import EquipeForm, { Equipe } from "@/components/equipes/equipe-form";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Plus, Search, Edit, Trash2, Users } from "lucide-react";

export default function Equipes() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState<Equipe | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipeToDelete, setEquipeToDelete] = useState<Equipe | null>(null);
  const [manageUsersDialogOpen, setManageUsersDialogOpen] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState<Equipe | null>(null);

  // Buscar equipes do Supabase
  const { data: equipes, isLoading, error } = useQuery({
    queryKey: ["equipes"],
    queryFn: async (): Promise<Equipe[]> => {
      console.log('Iniciando consulta de equipes...');
      try {
        const { data, error } = await (supabase as any)
          .from('equipe')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Erro na consulta Supabase:', error);
          throw error;
        }

        console.log('Dados de equipes recebidos:', data);
        return data || [];
      } catch (e) {
        console.error('Erro ao buscar equipes:', e);
        throw e;
      }
    },
    select: (data: Equipe[]) => {
      if (!searchTerm) return data;
      
      return data.filter(equipe => 
        equipe.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  });

  // Buscar corretores do Supabase
  const { data: corretores } = useQuery({
    queryKey: ["corretores"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('brokers')
          .select('*');
        
        if (error) {
          console.error('Erro na consulta de corretores:', error);
          throw error;
        }

        return data || [];
      } catch (e) {
        console.error('Erro ao buscar corretores:', e);
        return [];
      }
    }
  });

  // Contar corretores por equipe
  const getCorretoCountByEquipe = (equipeId: number) => {
    if (!corretores) return 0;
    return corretores.filter((corretor: any) => corretor.equipe_id === equipeId).length;
  };

  // Esta função não é mais necessária pois não temos supervisores na tabela equipe
  // Se for necessário implementar esta funcionalidade no futuro, pode-se criar uma relação adequada

  // Formulário removido - agora está no componente EquipeForm

  // Mutação removida - agora está no componente EquipeForm

  // Mutação removida - agora está no componente EquipeForm

  // Mutação para excluir equipe
  const deleteEquipeMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await (supabase as any)
        .from('equipe')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipes"] });
      toast({
        title: "Equipe excluída",
        description: "A equipe foi excluída com sucesso"
      });
      setDeleteDialogOpen(false);
      setEquipeToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir equipe",
        description: error.message || "Ocorreu um erro ao excluir a equipe",
        variant: "destructive"
      });
    }
  });

  // Função para abrir o diálogo de criação
  const handleOpenCreateDialog = () => {
    setEditingEquipe(null);
    setDialogOpen(true);
  };

  // Função para abrir o diálogo de edição
  const handleOpenEditDialog = (equipe: Equipe) => {
    setEditingEquipe(equipe);
    setDialogOpen(true);
  };

  // Função para confirmar exclusão
  const handleConfirmDelete = (equipe: Equipe) => {
    setEquipeToDelete(equipe);
    setDeleteDialogOpen(true);
  };

  // Função para gerenciar corretores de uma equipe
  const handleManageUsers = (equipe: Equipe) => {
    setSelectedEquipe(equipe);
    setManageUsersDialogOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Equipes</h2>
                <p className="text-gray-600">Gerencie as equipes de corretores no sistema</p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-2">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Buscar equipe..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button className="w-full md:w-auto" onClick={handleOpenCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Nova Equipe</span>
                </Button>
              </div>
            </div>

            {/* Tabela de Equipes */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {isLoading ? (
                <div className="text-center py-10">
                  <div className="spinner h-8 w-8 mx-auto border-4 border-primary border-r-transparent rounded-full animate-spin mb-4"></div>
                  <p>Carregando equipes...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Equipe</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Corretores</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipes && equipes.length > 0 ? (
                      equipes.map(equipe => (
                        <TableRow key={equipe.id}>
                          <TableCell className="font-medium">{equipe.name}</TableCell>
                          <TableCell>{equipe.email || "-"}</TableCell>
                          <TableCell>{getCorretoCountByEquipe(equipe.id)}</TableCell>
                          <TableCell>
                            <StatusBadge variant={equipe.status ? "success" : "danger"}>
                              {equipe.status ? "Ativa" : "Inativa"}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="mr-2"
                              onClick={() => handleManageUsers(equipe)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="mr-2"
                              onClick={() => handleOpenEditDialog(equipe)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive" 
                              onClick={() => handleConfirmDelete(equipe)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6">
                          {searchTerm ? "Nenhuma equipe encontrada para a busca." : "Nenhuma equipe cadastrada."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Diálogo de Criação/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEquipe ? "Editar Equipe" : "Nova Equipe"}</DialogTitle>
            <DialogDescription>
              {editingEquipe ? "Edite os dados da equipe" : "Preencha os dados da nova equipe"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Aqui usamos o componente de formulário extraído */}
          <EquipeForm 
            editingEquipe={editingEquipe} 
            onClose={() => setDialogOpen(false)}
            onSubmitSuccess={() => {
              // Recarregar dados quando o formulário for salvo com sucesso
              queryClient.invalidateQueries({ queryKey: ['equipes'] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir a equipe "{equipeToDelete?.name}"?<br />
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => equipeToDelete && deleteEquipeMutation.mutate(equipeToDelete.id)}
              disabled={deleteEquipeMutation.isPending}
            >
              {deleteEquipeMutation.isPending ? "Excluindo..." : "Excluir Equipe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Gerenciar Corretores */}
      <Dialog open={manageUsersDialogOpen} onOpenChange={setManageUsersDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Corretores - {selectedEquipe?.name}</DialogTitle>
            <DialogDescription>
              Gerencie os corretores desta equipe
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {corretores && corretores.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Atribuição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {corretores
                    .map((corretor: any) => (
                      <TableRow key={corretor.id}>
                        <TableCell>{corretor.name}</TableCell>
                        <TableCell>{corretor.email_corretor || "-"}</TableCell>
                        <TableCell>
                          <Switch 
                            checked={corretor.equipe_id === selectedEquipe?.id}
                            onCheckedChange={(checked) => {
                              // Implementar a mutação para atualizar o corretor
                              (async () => {
                                try {
                                  const { error } = await (supabase as any)
                                    .from('brokers')
                                    .update({ 
                                      equipe_id: checked ? selectedEquipe?.id : null,
                                      equipe: checked ? selectedEquipe?.name : null 
                                    })
                                    .eq('id', corretor.id);
                                  
                                  if (error) throw error;
                                  
                                  queryClient.invalidateQueries({ queryKey: ['corretores'] });
                                  queryClient.invalidateQueries({ queryKey: ['equipes'] });
                                  
                                  toast({
                                    title: checked ? "Corretor adicionado" : "Corretor removido",
                                    description: `${corretor.name} foi ${checked ? "adicionado à" : "removido da"} equipe ${selectedEquipe?.name}`,
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: "Erro",
                                    description: `Erro ao atualizar o corretor: ${error.message}`,
                                    variant: "destructive"
                                  });
                                }
                              })();
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6">
                <p>Nenhum corretor cadastrado no sistema.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setManageUsersDialogOpen(false)}>
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
