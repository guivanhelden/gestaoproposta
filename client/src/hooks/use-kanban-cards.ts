import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useAuth } from '@/hooks/use-auth';

export type KanbanCard = Database['public']['Tables']['kanban_cards']['Row'] & {
  operators: { logo_url: string | null } | null;
  stage: { id: string; title: string } | null;
  cnpj?: string | null;
  due_date_status?: string | null;
  pme_submissions?: {
    broker?: {
      id: number;
      name: string;
    } | null;
    modality?: string | null;
  } | null;
};

export type KanbanCardInsert = Database['public']['Tables']['kanban_cards']['Insert'];
export type KanbanCardUpdate = Database['public']['Tables']['kanban_cards']['Update'];

export function useKanbanCards(boardId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Consulta para buscar todos os cartões de um quadro
  const {
    data: cards,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['kanban-cards', boardId],
    queryFn: async () => {
      if (!boardId) {
        throw new Error('ID do quadro não fornecido');
      }

      const { data, error } = await supabase
        .from('kanban_cards')
        .select(`
          *,
          stage:stage_id(id, title),
          operators ( logo_url ),
          pme_submissions!submission_id(
            broker:broker_id(id, name),
            modality
          )
        `)
        .eq('board_id', boardId)
        .order('position', { ascending: true});

      console.log("Dados brutos do Supabase:", data);

      if (error) throw error;
      return data;
    },
    enabled: !!boardId
  });

  // Mutação para criar um novo cartão
  const createCard = useMutation({
    mutationFn: async (newCard: Omit<KanbanCardInsert, 'created_by' | 'position'>) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Determinar a posição do novo cartão no estágio
      let position = 0;
      if (cards && cards.length > 0) {
        const cardsInSameStage = cards.filter(card => card.stage_id === newCard.stage_id);
        if (cardsInSameStage.length > 0) {
          position = Math.max(...cardsInSameStage.map(card => card.position)) + 1;
        }
      }

      const cardWithUser = {
        ...newCard,
        created_by: user.id,
        position
      };

      const { data, error } = await supabase
        .from('kanban_cards')
        .insert(cardWithUser)
        .select(`
          *,
          stage:stage_id(id, title)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards', boardId] });
    }
  });

  // Mutação para atualizar um cartão existente
  const updateCard = useMutation({
    mutationFn: async ({ id, ...updateData }: KanbanCardUpdate & { id: string }) => {
      console.log("Dados recebidos para atualização (updateData):", updateData);
      const { data, error } = await supabase
        .from('kanban_cards')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          stage:stage_id(id, title),
          operators ( logo_url ) 
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedCardData) => {
      queryClient.setQueryData(
          ['kanban-cards', boardId], 
          (oldData: KanbanCard[] | undefined) => {
             if (!oldData) return oldData;
             return oldData.map(card => 
                card.id === updatedCardData.id ? updatedCardData : card
             );
          }
      );
    }
  });

  // Mutação para excluir um cartão
  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards', boardId] });
    }
  });

  // Mutação para mover um cartão para outro estágio
  const moveCard = useMutation({
    mutationFn: async ({ 
      cardId, 
      targetStageId,
      position = 0
    }: { 
      cardId: string; 
      targetStageId: string;
      position?: number;
    }) => {
      const { data, error } = await supabase
        .from('kanban_cards')
        .update({ 
          stage_id: targetStageId,
          position
        })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards', boardId] });
    }
  });

  // Mutação para reordenar cartões em um estágio
  const reorderCards = useMutation({
    mutationFn: async ({ 
      stageId, 
      cardIds 
    }: { 
      stageId: string; 
      cardIds: string[] 
    }) => {
      // Criar um array de atualizações em lote
      const updates = cardIds.map((id, index) => ({
        id,
        position: index
      }));

      // Atualizar todos os cartões com suas novas posições
      for (const update of updates) {
        const { error } = await supabase
          .from('kanban_cards')
          .update({ position: update.position })
          .eq('id', update.id)
          .eq('stage_id', stageId);

        if (error) throw error;
      }

      return { stageId, cardIds };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-cards', boardId] });
    }
  });

  // Função para agrupar cartões por estágio
  const getCardsByStage = () => {
    if (!cards) return {};
    
    const grouped: Record<string, KanbanCard[]> = {};
    
    cards.forEach(card => {
      if (!grouped[card.stage_id]) {
        grouped[card.stage_id] = [];
      }
      grouped[card.stage_id].push(card);
    });
    
    // Ordenar os cartões em cada estágio por posição
    Object.keys(grouped).forEach(stageId => {
      grouped[stageId].sort((a, b) => a.position - b.position);
    });
    
    return grouped;
  };

  return {
    cards,
    cardsByStage: getCardsByStage(),
    isLoading,
    error,
    refetch,
    createCard: createCard.mutate,
    updateCard: updateCard.mutate,
    deleteCard: deleteCard.mutate,
    moveCard: moveCard.mutate,
    reorderCards: reorderCards.mutate
  };
} 