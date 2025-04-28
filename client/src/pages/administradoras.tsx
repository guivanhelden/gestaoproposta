import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import supabase from "../lib/supabase";

// Importar o novo componente de formulário
import AdministradoraForm, { Administradora } from "@/components/administradoras/administradora-form";

// Remover imports de Header e Sidebar
// import Header from "@/components/layout/header";
// import Sidebar from "@/components/layout/sidebar";
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

import { Plus, Search, Edit, Trash2 } from "lucide-react";

export default function Administradoras() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdministradora, setEditingAdministradora] = useState<Administradora | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [administradoraToDelete, setAdministradoraToDelete] = useState<Administradora | null>(null);

  // Buscar administradoras do Supabase
  const { data: administradoras, isLoading, error } = useQuery({
    queryKey: ["administradoras"],
    queryFn: async (): Promise<Administradora[]> => {
      console.log('Iniciando consulta de administradoras...');
      try {
        const { data, error } = await (supabase as any)
          .from('administradoras')
          .select('*')
          .order('nome');
        
        if (error) {
          console.error('Erro na consulta Supabase:', error);
          throw error;
        }

        console.log('Dados de administradoras recebidos:', data);
        return data || [];
      } catch (e) {
        console.error('Erro ao buscar administradoras:', e);
        throw e;
      }
    },
    select: (data: Administradora[]) => {
      if (!searchTerm) return data;
      
      return data.filter(administradora => 
        administradora.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  });

  // Formulário removido - agora está no componente AdministradoraForm

  // Mutação removida - agora está no componente AdministradoraForm

  // Mutação removida - agora está no componente AdministradoraForm

  // Mutação para excluir administradora
  const deleteAdministradoraMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('administradoras')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["administradoras"] });
      toast({
        title: "Administradora excluída",
        description: "A administradora foi excluída com sucesso"
      });
      setDeleteDialogOpen(false);
      setAdministradoraToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir administradora",
        description: error.message || "Ocorreu um erro ao excluir a administradora",
        variant: "destructive"
      });
    }
  });

  // Função para abrir o diálogo de criação
  const handleOpenCreateDialog = () => {
    setEditingAdministradora(null);
    setDialogOpen(true);
  };

  // Função para abrir o diálogo de edição
  const handleOpenEditDialog = (administradora: Administradora) => {
    setEditingAdministradora(administradora);
    setDialogOpen(true);
  };

  // Função para confirmar exclusão
  const handleConfirmDelete = (administradora: Administradora) => {
    setAdministradoraToDelete(administradora);
    setDeleteDialogOpen(true);
  };

  // Remover a estrutura externa de div/Header/Sidebar/main
  return (
    <>
      <div className="p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Administradoras</h2>
            <p className="text-gray-600">Gerencie as administradoras de planos disponíveis no sistema</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-2">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar administradora..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="w-full md:w-auto" onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              <span>Nova Administradora</span>
            </Button>
          </div>
        </div>

        {/* Tabela de Administradoras */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="text-center py-10">
              <div className="spinner h-8 w-8 mx-auto border-4 border-primary border-r-transparent rounded-full animate-spin mb-4"></div>
              <p>Carregando administradoras...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Administradora</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {administradoras && administradoras.length > 0 ? (
                  administradoras.map(administradora => (
                    <TableRow key={administradora.id}>
                      <TableCell className="font-medium">{administradora.nome}</TableCell>
                      <TableCell>
                        {administradora.logo_url ? (
                          <img 
                            src={administradora.logo_url} 
                            alt={administradora.nome} 
                            className="h-8 object-contain"
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant={administradora.status ? "success" : "danger"}>
                          {administradora.status ? "Ativa" : "Inativa"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="mr-2"
                          onClick={() => handleOpenEditDialog(administradora)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="text-destructive" 
                          onClick={() => handleConfirmDelete(administradora)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      {searchTerm ? "Nenhuma administradora encontrada para a busca." : "Nenhuma administradora cadastrada."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Diálogo de Criação/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAdministradora ? "Editar Administradora" : "Nova Administradora"}</DialogTitle>
            <DialogDescription>
              {editingAdministradora ? "Edite os dados da administradora" : "Preencha os dados da nova administradora"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Aqui usamos o componente de formulário extraído */}
          <AdministradoraForm 
            editingAdministradora={editingAdministradora} 
            onClose={() => setDialogOpen(false)}
            onSubmitSuccess={() => {
              // Recarregar dados quando o formulário for salvo com sucesso
              queryClient.invalidateQueries({ queryKey: ['administradoras'] });
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
              Você tem certeza que deseja excluir a administradora "{administradoraToDelete?.nome}"?<br />
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
              onClick={() => administradoraToDelete && deleteAdministradoraMutation.mutate(administradoraToDelete.id)}
              disabled={deleteAdministradoraMutation.isPending}
            >
              {deleteAdministradoraMutation.isPending ? "Excluindo..." : "Excluir Administradora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
