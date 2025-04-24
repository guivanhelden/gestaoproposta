import { useState } from 'react';
import { useKanbanBoards, KanbanBoard, KanbanBoardInsert } from '@/hooks/use-kanban-boards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Edit, Plus, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'wouter';

export default function KanbanBoardsManager() {
  const { boards, isLoading, error, createBoard, updateBoard, deleteBoard } = useKanbanBoards();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentBoard, setCurrentBoard] = useState<KanbanBoard | null>(null);
  const [newBoardData, setNewBoardData] = useState({
    title: '',
    description: '',
    type: 'propostas' // Valor padrão para o tipo
  });

  // Manipuladores para criar um novo quadro
  const handleCreateBoard = () => {
    if (!newBoardData.title.trim()) {
      toast({
        title: 'Erro',
        description: 'O título do quadro é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (!newBoardData.type) {
      toast({
        title: 'Erro',
        description: 'O tipo do quadro é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    createBoard(newBoardData, {
      onSuccess: () => {
        toast({
          title: 'Sucesso',
          description: 'Quadro criado com sucesso'
        });
        setIsCreateDialogOpen(false);
        setNewBoardData({
          title: '',
          description: '',
          type: 'propostas'
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Erro ao criar quadro',
          description: error.message,
          variant: 'destructive'
        });
      }
    });
  };

  // Manipuladores para editar um quadro
  const handleEditBoard = () => {
    if (!currentBoard || !currentBoard.title.trim()) {
      toast({
        title: 'Erro',
        description: 'O título do quadro é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    updateBoard(
      {
        id: currentBoard.id,
        title: currentBoard.title,
        description: currentBoard.description,
        type: currentBoard.type
      },
      {
        onSuccess: () => {
          toast({
            title: 'Sucesso',
            description: 'Quadro atualizado com sucesso'
          });
          setIsEditDialogOpen(false);
          setCurrentBoard(null);
        },
        onError: (error: Error) => {
          toast({
            title: 'Erro ao atualizar quadro',
            description: error.message,
            variant: 'destructive'
          });
        }
      }
    );
  };

  // Manipuladores para excluir um quadro
  const handleDeleteBoard = () => {
    if (!currentBoard) return;

    deleteBoard(currentBoard.id, {
      onSuccess: () => {
        toast({
          title: 'Sucesso',
          description: 'Quadro excluído com sucesso'
        });
        setIsDeleteDialogOpen(false);
        setCurrentBoard(null);
      },
      onError: (error: Error) => {
        toast({
          title: 'Erro ao excluir quadro',
          description: error.message,
          variant: 'destructive'
        });
      }
    });
  };

  // Formatador de data
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gerenciador de Quadros Kanban</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-medium">Erro ao carregar os quadros</h3>
            <p className="text-red-600 text-sm">{error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciador de Quadros Kanban</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Quadro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Quadro Kanban</DialogTitle>
              <DialogDescription>
                Preencha as informações para criar um novo quadro.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Digite o título do quadro"
                  value={newBoardData.title}
                  onChange={(e) => setNewBoardData({ ...newBoardData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Digite uma descrição (opcional)"
                  value={newBoardData.description || ''}
                  onChange={(e) => setNewBoardData({ ...newBoardData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select 
                  value={newBoardData.type} 
                  onValueChange={(value) => setNewBoardData({ ...newBoardData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="propostas">Quadro de Propostas</SelectItem>
                    <SelectItem value="projetos">Quadro de Projetos</SelectItem>
                    <SelectItem value="tarefas">Quadro de Tarefas</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateBoard}>Criar Quadro</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {boards && boards.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">Nenhum quadro kanban encontrado</p>
          <Button
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar seu primeiro quadro
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards?.map((board) => (
            <Card key={board.id}>
              <CardHeader>
                <CardTitle>{board.title}</CardTitle>
                <CardDescription>
                  Criado em: {formatDate(board.created_at)}
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {board.type === 'propostas' ? 'Propostas' : 
                     board.type === 'projetos' ? 'Projetos' : 
                     board.type === 'tarefas' ? 'Tarefas' : 'Outro'}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {board.description || 'Sem descrição'}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/quadros/visualizar/${board.id}`}>
                  <Button variant="outline">
                    Abrir Quadro
                  </Button>
                </Link>
                <div className="flex space-x-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setCurrentBoard(board)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Quadro Kanban</DialogTitle>
                        <DialogDescription>
                          Atualize as informações do quadro.
                        </DialogDescription>
                      </DialogHeader>
                      {currentBoard && (
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-title">Título</Label>
                            <Input
                              id="edit-title"
                              value={currentBoard.title}
                              onChange={(e) =>
                                setCurrentBoard({
                                  ...currentBoard,
                                  title: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-description">Descrição</Label>
                            <Textarea
                              id="edit-description"
                              value={currentBoard.description || ''}
                              onChange={(e) =>
                                setCurrentBoard({
                                  ...currentBoard,
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-type">Tipo</Label>
                            <Select 
                              value={currentBoard.type} 
                              onValueChange={(value) => 
                                setCurrentBoard({
                                  ...currentBoard,
                                  type: value,
                                })
                              }
                            >
                              <SelectTrigger id="edit-type">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="propostas">Quadro de Propostas</SelectItem>
                                <SelectItem value="projetos">Quadro de Projetos</SelectItem>
                                <SelectItem value="tarefas">Quadro de Tarefas</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleEditBoard}>Salvar Alterações</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setCurrentBoard(board)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Excluir Quadro</DialogTitle>
                        <DialogDescription>
                          Tem certeza que deseja excluir este quadro? Esta ação não pode ser desfeita.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteBoard}>
                          Excluir
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 