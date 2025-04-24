import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import supabase from "../lib/supabase";

// Importar o novo componente de formulário
import CorretorForm, { Corretor } from "@/components/corretores/corretor-form";

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


import { Plus, Search, Edit, Trash2, Mail, Phone } from "lucide-react";

// Note: O esquema do formulário foi movido para corretor-form.tsx

export default function Corretores() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCorretor, setEditingCorretor] = useState<Corretor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [corretorToDelete, setCorretorToDelete] = useState<Corretor | null>(null);

  // Buscar corretores
  const { data: corretores, isLoading, error } = useQuery({
    queryKey: ["corretores"],
    queryFn: async (): Promise<Corretor[]> => {
      console.log('Iniciando consulta de corretores...');
      try {
        const { data, error } = await (supabase as any)
          .from('brokers') 
          .select('*');
        
        if (error) {
          console.error('Erro na consulta Supabase:', error);
          throw error;
        }

        console.log('Dados de corretores recebidos:', data);
        
        // Verificando o tipo dos dados de equipe_id
        if (data && data.length > 0) {
          console.log('Exemplo de dados de corretor:');
          console.log(`ID: ${data[0].id}, Nome: ${data[0].name}`);
          console.log(`equipe_id: ${data[0].equipe_id} (${typeof data[0].equipe_id})`);
        }
        
        return data || []; 
      } catch (e) {
        console.error('Erro ao buscar corretores:', e);
        throw e;
      }
    },
    select: (data: Corretor[]) => {
      if (!searchTerm) return data;
      
      // Aplicar filtro de busca
      return data.filter(corretor => 
        corretor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (corretor.email_corretor && corretor.email_corretor.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  });

  // Buscar equipes da tabela equipe
  const { data: equipes } = useQuery({
    queryKey: ["equipes"],
    queryFn: async () => {
      // Buscar equipes reais da tabela 'equipe'
      console.log('Iniciando consulta de equipes...');
      try {
        const { data, error } = await (supabase as any)
          .from('equipe')
          .select('id, name')  // Usando name em vez de nome conforme esquema real
          .eq('status', true)  // Apenas equipes ativas
          .order('name');
        
        if (error) {
          console.error('Erro na consulta de equipes:', error);
          throw error;
        }

        console.log('Equipes recebidas do banco:', data);
        // Transformando dados para manter compatibilidade com a interface
        const equipesFormatadas = data.map((equipe: any) => ({
          id: equipe.id,
          nome: equipe.name  // Mapeando name para nome para compatibilidade
        }));

        console.log('Equipes formatadas:', equipesFormatadas);
        return equipesFormatadas || [];
      } catch (e) {
        console.error('Erro ao buscar equipes:', e);
        // Fallback com dados simulados em caso de erro
        return [
          { id: 1, nome: "Equipe A" },
          { id: 2, nome: "Equipe B" },
          { id: 3, nome: "Equipe C" }
        ];
      }
    }
  });

  // Função para obter o nome da equipe pelo ID
  const getNomeEquipe = (equipeId?: number | null) => {
    console.log(`Buscando equipe com ID: ${equipeId}, equipes disponíveis:`, equipes);
    if (!equipeId || !equipes) return "-";
    
    const equipe = equipes.find((eq: { id: number; nome: string }) => {
      console.log(`Comparando ${eq.id} (${typeof eq.id}) com ${equipeId} (${typeof equipeId})`);
      return eq.id === equipeId;
    });
    
    console.log(`Equipe encontrada:`, equipe);
    return equipe ? equipe.nome : "-";
  };

  // Mutação para excluir corretor
  const deleteCorretorMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await (supabase as any)
        .from('brokers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corretores"] });
      toast({
        title: "Corretor excluído",
        description: "O corretor foi excluído com sucesso"
      });
      setDeleteDialogOpen(false);
      setCorretorToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir corretor",
        description: error.message || "Ocorreu um erro ao excluir o corretor",
        variant: "destructive"
      });
    }
  });

  // Função para abrir o diálogo de criação
  const handleOpenCreateDialog = () => {
    setEditingCorretor(null);
    setDialogOpen(true);
  };

  // Função para abrir o diálogo de edição
  const handleOpenEditDialog = (corretor: Corretor) => {
    setEditingCorretor(corretor);
    setDialogOpen(true);
  };

  // Função para confirmar exclusão
  const handleConfirmDelete = (corretor: Corretor) => {
    setCorretorToDelete(corretor);
    setDeleteDialogOpen(true);
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
                <h2 className="text-2xl font-bold text-gray-800">Corretores</h2>
                <p className="text-gray-600">Gerencie os corretores do sistema</p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-2">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Buscar corretor..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button className="w-full md:w-auto" onClick={handleOpenCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Novo Corretor</span>
                </Button>
              </div>
            </div>

            {/* Tabela de Corretores */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {isLoading ? (
                <div className="p-10 text-center">Carregando corretores...</div>
              ) : error ? (
                <div className="p-10 text-center text-red-500">
                  Erro ao carregar corretores: {(error as Error).message}
                </div>
              ) : !corretores || corretores.length === 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Equipe</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        {searchTerm ? "Nenhum corretor encontrado para a busca." : "Nenhum corretor cadastrado."}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Equipe</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {corretores && corretores.length > 0 ? (
                      corretores.map((corretor) => (
                        <TableRow key={corretor.id}>
                          <TableCell className="font-medium">{corretor.name}</TableCell>
                          <TableCell>{corretor.email_corretor || "-"}</TableCell>
                          <TableCell>
                            {/* Debug equipe_id */}
                            <div className="text-xs text-gray-500 mb-1">ID: {corretor.equipe_id || 'Nenhum'}</div>
                            {getNomeEquipe(corretor.equipe_id)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge variant={corretor.ativo ? "success" : "danger"}>
                              {corretor.ativo ? "Ativo" : "Inativo"}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="mr-2"
                              onClick={() => handleOpenEditDialog(corretor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="text-destructive" 
                              onClick={() => handleConfirmDelete(corretor)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6">
                          Nenhum corretor encontrado.
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
            <DialogTitle>{editingCorretor ? "Editar Corretor" : "Novo Corretor"}</DialogTitle>
            <DialogDescription>
              {editingCorretor ? "Edite os dados do corretor" : "Preencha os dados para cadastrar um novo corretor"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Aqui usamos o componente de formulário extraído */}
          <CorretorForm 
            editingCorretor={editingCorretor} 
            onClose={() => setDialogOpen(false)}
            onSubmitSuccess={() => {
              // Recarregar dados quando o formulário for salvo com sucesso
              queryClient.invalidateQueries({ queryKey: ['corretores'] });
            }}
            equipes={equipes}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o corretor "{corretorToDelete?.name}"?<br />
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
              onClick={() => corretorToDelete && deleteCorretorMutation.mutate(corretorToDelete.id)}
              disabled={deleteCorretorMutation.isPending}
            >
              {deleteCorretorMutation.isPending ? "Excluindo..." : "Excluir Corretor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
