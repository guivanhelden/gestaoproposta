import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import supabase from "@/lib/supabase";
import KanbanBoardSupabase from "@/components/kanban/board-supabase";
import CardModalSupabase from "@/components/kanban/card-modal-supabase";
import NovaPropostaModal from "@/components/kanban/nova-proposta-modal";
import { KanbanCard } from "@/hooks/use-kanban-cards";
import { useKanbanBoards } from "@/hooks/use-kanban-boards";
import { useKanbanStages } from "@/hooks/use-kanban-stages";
import { useKanbanCards } from "@/hooks/use-kanban-cards";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Search, AlertCircle, Plus, Columns, FilePlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Esquema de validação para novo cartão
const newCardSchema = z.object({
  company_name: z.string().min(1, "Nome da empresa é obrigatório"),
  operator: z.string().min(1, "Operadora é obrigatória"),
  lives: z.coerce.number().min(1, "Número de vidas deve ser pelo menos 1"),
  value: z.coerce.number().min(0, "Valor deve ser maior ou igual a zero"),
  board_type: z.string().default("proposta"),
  stage_id: z.string().min(1, "Estágio é obrigatório"),
  observacoes: z.string().optional()
});

// Esquema de validação para novo estágio
const newStageSchema = z.object({
  title: z.string().min(1, "Título do estágio é obrigatório")
});

export default function VisualizarQuadro() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [createCardModalOpen, setCreateCardModalOpen] = useState(false);
  const [createStageModalOpen, setCreateStageModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCardData, setSelectedCardData] = useState<KanbanCard | null>(null);
  const [novaPropostaModalOpen, setNovaPropostaModalOpen] = useState(false);

  // Carregar dados do quadro
  const { 
    data: board, 
    isLoading: boardLoading, 
    error: boardError 
  } = useQuery({
    queryKey: ['kanban-boards', id],
    queryFn: async () => {
      if (!id) throw new Error("ID do quadro não fornecido");
      
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Usar hooks para estágios e cartões
  const {
    stages,
    isLoading: stagesLoading,
    error: stagesError,
    createStage
  } = useKanbanStages(id || "");

  const {
    cards,
    isLoading: cardsLoading,
    error: cardsError,
    createCard
  } = useKanbanCards(id || "");

  const isLoading = boardLoading || stagesLoading || cardsLoading;
  const error = boardError || stagesError || cardsError;

  // Formulário para novo cartão
  const cardForm = useForm<z.infer<typeof newCardSchema>>({
    resolver: zodResolver(newCardSchema),
    defaultValues: {
      company_name: "",
      operator: "",
      lives: 1,
      value: 0,
      board_type: "proposta",
      stage_id: stages && stages.length > 0 ? stages[0].id : "",
      observacoes: ""
    }
  });

  // Atualizar o valor padrão do estágio quando os estágios forem carregados
  useEffect(() => {
    if (stages && stages.length > 0 && !cardForm.getValues('stage_id')) {
      cardForm.setValue("stage_id", stages[0].id);
    }
  }, [stages, cardForm]);

  // Formulário para novo estágio
  const stageForm = useForm<z.infer<typeof newStageSchema>>({
    resolver: zodResolver(newStageSchema),
    defaultValues: {
      title: ""
    }
  });

  // Função para criar novo cartão
  const onCreateCard = (data: z.infer<typeof newCardSchema>) => {
    if (!id || !user?.id) return;

    const newCardData = {
      ...data,
      board_id: id,
      has_documents: false,
      has_comments: false,
      has_warnings: false,
      due_date: null
    };

    createCard(newCardData, {
      onSuccess: () => {
        toast({
          title: "Cartão criado",
          description: "O cartão foi adicionado com sucesso"
        });
        cardForm.reset();
        setCreateCardModalOpen(false);
      },
      onError: (error: Error) => {
        toast({
          title: "Erro ao criar cartão",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  // Função para criar novo estágio
  const onCreateStage = (data: z.infer<typeof newStageSchema>) => {
    if (!id) return;

    createStage({
      title: data.title,
      board_id: id,
      position: (stages?.length || 0) // Adiciona ao final por padrão
    }, {
      onSuccess: () => {
        toast({
          title: "Estágio criado",
          description: "O estágio foi adicionado com sucesso"
        });
        stageForm.reset();
        setCreateStageModalOpen(false);
      },
      onError: (error: Error) => {
        toast({
          title: "Erro ao criar estágio",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  const handleOpenModal = (card: KanbanCard) => {
    setSelectedCardId(card.id);
    setSelectedCardData(card);
  };

  const handleCloseModal = () => {
    setSelectedCardId(null);
    setSelectedCardData(null);
  };

  // Retorna apenas o conteúdo da página, que será renderizado dentro do <main> do MainLayout
  return (
    <>
      <div className="p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            {isLoading && !error ? (
              <Skeleton className="h-8 w-64 mb-2" />
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-800">{board?.title || "Quadro Kanban"}</h2>
                <p className="text-gray-600">{board?.description || "Sem descrição"}</p>
              </>
            )}
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-2 flex-wrap">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar cartão..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button variant="outline" onClick={() => setCreateStageModalOpen(true)} disabled={isLoading}>
              <Columns className="h-4 w-4 mr-2" />
              <span>Novo Estágio</span>
            </Button>
            
            <Button onClick={() => setNovaPropostaModalOpen(true)} disabled={isLoading}>
              <FilePlus className="h-4 w-4 mr-2" />
              <span>Nova Proposta</span>
            </Button>
          </div>
        </div>

        {/* Erro */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start mb-6">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-medium">Erro ao carregar o quadro</h3>
              <p className="text-red-600 text-sm">
                {error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'}
              </p>
            </div>
          </div>
        )}

        {/* Quadro Kanban */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="spinner h-8 w-8 mx-auto border-4 border-primary border-r-transparent rounded-full animate-spin mb-4"></div>
            <p>Carregando quadro...</p>
          </div>
        ) : (
          <KanbanBoardSupabase 
            boardId={id || ""} 
            onCardClick={handleOpenModal}
          />
        )}
      </div>

      {/* Modal de Cartão: Usar selectedCardData para controlar */}
      {selectedCardData && id && (
        <CardModalSupabase 
          isOpen={!!selectedCardData}
          onClose={handleCloseModal}
          card={selectedCardData}
          boardId={id}
        />
      )}

      {/* Modal de Novo Cartão */}
      <Dialog open={createCardModalOpen} onOpenChange={setCreateCardModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Cartão</DialogTitle>
            <DialogDescription>
              Adicione um novo cartão ao seu quadro kanban.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...cardForm}>
            <form onSubmit={cardForm.handleSubmit(onCreateCard)} className="space-y-4">
              <FormField
                control={cardForm.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={cardForm.control}
                  name="operator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operadora</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da operadora" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={cardForm.control}
                  name="lives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Vidas</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={cardForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={cardForm.control}
                  name="stage_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estágio Inicial</FormLabel>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        {!stages || stages.length === 0 ? (
                          <option value="">Carregando estágios...</option>
                        ) : (
                          stages.map(stage => (
                            <option key={stage.id} value={stage.id}>
                              {stage.title}
                            </option>
                          ))
                        )}
                      </select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={cardForm.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Observações sobre este cartão (opcional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateCardModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={cardForm.formState.isSubmitting || isLoading || !stages || stages.length === 0}>
                  {cardForm.formState.isSubmitting ? "Criando..." : "Criar Cartão"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Estágio */}
      <Dialog open={createStageModalOpen} onOpenChange={setCreateStageModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Novo Estágio</DialogTitle>
            <DialogDescription>
              Adicione um novo estágio ao seu quadro kanban.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...stageForm}>
            <form onSubmit={stageForm.handleSubmit(onCreateStage)} className="space-y-4">
              <FormField
                control={stageForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Estágio</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Aguardando Análise" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateStageModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={stageForm.formState.isSubmitting || isLoading}>
                  {stageForm.formState.isSubmitting ? "Criando..." : "Criar Estágio"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 4. Renderizar o Novo Modal de Proposta */}
      {id && (
        <NovaPropostaModal
          isOpen={novaPropostaModalOpen}
          onClose={() => setNovaPropostaModalOpen(false)}
          boardId={id}
        />
      )}
    </>
  );
} 