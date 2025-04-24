import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useAuth } from '@/hooks/use-auth';

export type KanbanStage = Database['public']['Tables']['kanban_stages']['Row'];
export type KanbanStageInsert = Database['public']['Tables']['kanban_stages']['Insert'];
export type KanbanStageUpdate = Database['public']['Tables']['kanban_stages']['Update'];

export function useKanbanStages(boardId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Consulta para buscar todos os estágios de um quadro
  const {
    data: stages,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['kanban-stages', boardId],
    queryFn: async () => {
      if (!boardId) {
        throw new Error('ID do quadro não fornecido');
      }

      const { data, error } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!boardId
  });

  // Mutação para criar um novo estágio
  const createStage = useMutation({
    mutationFn: async (newStage: Omit<KanbanStageInsert, 'board_id'> & { board_id?: string }) => {
      if (!boardId) {
        throw new Error('ID do quadro não fornecido');
      }

      // Determinar a posição do novo estágio
      let position = 0;
      if (stages && stages.length > 0) {
        position = Math.max(...stages.map(stage => stage.position)) + 1;
      }

      const stageWithBoard = {
        ...newStage,
        board_id: boardId,
        position
      };

      const { data, error } = await supabase
        .from('kanban_stages')
        .insert(stageWithBoard)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-stages', boardId] });
    }
  });

  // Mutação para atualizar um estágio existente
  const updateStage = useMutation({
    mutationFn: async ({ id, ...updateData }: KanbanStageUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('kanban_stages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-stages', boardId] });
    }
  });

  // Mutação para excluir um estágio
  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('kanban_stages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-stages', boardId] });
      // Também invalidar consultas de cartões, pois os cartões associados a este estágio serão excluídos
      queryClient.invalidateQueries({ queryKey: ['kanban-cards', boardId] });
    }
  });

  // Mutação para reordenar estágios
  const reorderStages = useMutation({
    mutationFn: async (stageIds: string[]) => {
      // Criar um array de atualizações em lote
      const updates = stageIds.map((id, index) => ({
        id,
        position: index
      }));

      // Atualizar todos os estágios com suas novas posições
      for (const update of updates) {
        const { error } = await supabase
          .from('kanban_stages')
          .update({ position: update.position })
          .eq('id', update.id);

        if (error) throw error;
      }

      return stageIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-stages', boardId] });
    }
  });

  return {
    stages,
    isLoading,
    error,
    refetch,
    createStage: createStage.mutate,
    updateStage: updateStage.mutate,
    deleteStage: deleteStage.mutate,
    reorderStages: reorderStages.mutate
  };
} 