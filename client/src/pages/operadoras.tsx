import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import supabase from "../lib/supabase";

// Importar o novo componente de formulário
import OperadoraForm, { Operator } from "@/components/operadoras/operadora-form";

// Remover imports de Header e Sidebar
// import Header from "@/components/layout/header";
// import Sidebar from "@/components/layout/sidebar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Plus, Search, Edit, Trash2 } from "lucide-react";

export default function Operadoras() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<any>(null);

  // Buscar operadoras
  const { data: operators, isLoading } = useQuery({
    queryKey: ["operators"],
    queryFn: async (): Promise<any[]> => {
      const { data, error } = await supabase
        .from('operators') 
        .select('*');

      if (error) {
        console.error("Erro ao buscar operadoras:", error);
        throw new Error("Erro ao buscar operadoras");
      }
      return data || []; // Ensure we return an array even if data is null
    },
    select: (data: any[]) => {
      if (!searchTerm) return data;
      
      return data.filter(operator => 
        operator.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  });

  // Mutação para excluir operadora
  const deleteOperatorMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/operators/${id}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        throw new Error("Erro ao excluir operadora");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operators"] });
      toast({
        title: "Operadora excluída",
        description: "A operadora foi excluída com sucesso"
      });
      setDeleteDialogOpen(false);
      setOperatorToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir operadora",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleOpenEditDialog = (operator: any) => {
    setEditingOperator(operator);
    setDialogOpen(true);
  };

  const handleOpenCreateDialog = () => {
    setEditingOperator(null);
    setDialogOpen(true);
  };

  const handleConfirmDelete = (operator: any) => {
    setOperatorToDelete(operator);
    setDeleteDialogOpen(true);
  };

  // Remover a estrutura externa de div/Header/Sidebar/main
  return (
    <>
      <div className="p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Operadoras</h2>
            <p className="text-gray-600">Gerencie as operadoras de saúde disponíveis no sistema</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-2">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar operadora..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="w-full md:w-auto" onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              <span>Nova Operadora</span>
            </Button>
          </div>
        </div>

        {/* Tabela de Operadoras */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="text-center py-10">
              <div className="spinner h-8 w-8 mx-auto border-4 border-primary border-r-transparent rounded-full animate-spin mb-4"></div>
              <p>Carregando operadoras...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Operadora</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>ID SIX</TableHead>
                  <TableHead>Gestor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operators && operators.length > 0 ? (
                  operators.map((operator) => (
                    <TableRow key={operator.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {operator.logo_url && (
                            <img 
                              src={operator.logo_url} 
                              alt={operator.name} 
                              className="h-16 w-16 rounded-sm object-contain"
                            />
                          )}
                          {operator.name}
                        </div>
                      </TableCell>
                      <TableCell>{operator.categoria || "-"}</TableCell>
                      <TableCell>{operator.id_six || "-"}</TableCell>
                      <TableCell>{operator.gestor || "-"}</TableCell>
                      <TableCell>
                        <StatusBadge variant={operator.active ? "success" : "danger"}>
                          {operator.active ? "Ativa" : "Inativa"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenEditDialog(operator)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleConfirmDelete(operator)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      {searchTerm ? "Nenhuma operadora encontrada para a busca." : "Nenhuma operadora cadastrada."}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOperator ? "Editar Operadora" : "Criar Nova Operadora"}</DialogTitle>
            <DialogDescription>
              {editingOperator ? "Atualize os detalhes da operadora." : "Preencha os dados para criar uma nova operadora."}
            </DialogDescription>
          </DialogHeader>
          
          {/* Aqui usamos o componente de formulário extraído */}
          <OperadoraForm 
            editingOperator={editingOperator} 
            onClose={() => setDialogOpen(false)}
            onSubmitSuccess={() => {
              // Recarregar dados quando o formulário for salvo com sucesso
              queryClient.invalidateQueries({ queryKey: ['operators'] });
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
              Você tem certeza que deseja excluir a operadora "{operatorToDelete?.name}"?<br />
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
              onClick={() => operatorToDelete && deleteOperatorMutation.mutate(operatorToDelete.id)}
              disabled={deleteOperatorMutation.isPending}
            >
              {deleteOperatorMutation.isPending ? "Excluindo..." : "Excluir Operadora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
