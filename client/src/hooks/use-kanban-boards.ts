import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useAuth } from '@/hooks/use-auth';

export type KanbanBoard = Database['public']['Tables']['kanban_boards']['Row'];
export type KanbanBoardInsert = Database['public']['Tables']['kanban_boards']['Insert'];
export type KanbanBoardUpdate = Database['public']['Tables']['kanban_boards']['Update'];

export function useKanbanBoards() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Verificar se o usuário é administrador
  const isAdmin = user?.roles?.includes('admin');

  // Consulta para buscar todos os quadros kanban
  const {
    data: boards,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['kanban-boards'],
    queryFn: async () => {
      if (!user || !user.id) {
        throw new Error('Usuário não autenticado');
      }

      let query = supabase
        .from('kanban_boards')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Se não for admin, filtrar apenas pelos quadros do usuário
      if (!isAdmin) {
        query = query.eq('owner_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Mutação para criar um novo quadro
  const createBoard = useMutation({
    mutationFn: async (newBoard: Omit<KanbanBoardInsert, 'owner_id'> & { type: string }) => {
      if (!user || !user.id) {
        throw new Error('Usuário não autenticado');
      }

      const boardWithOwner = {
        ...newBoard,
        owner_id: user.id
      };

      const { data, error } = await supabase
        .from('kanban_boards')
        .insert(boardWithOwner)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar a consulta para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] });
    }
  });

  // Mutação para atualizar um quadro existente
  const updateBoard = useMutation({
    mutationFn: async ({ id, ...updateData }: KanbanBoardUpdate & { id: string }) => {
      if (!user || !user.id) {
        throw new Error('Usuário não autenticado');
      }

      let query = supabase
        .from('kanban_boards')
        .update(updateData)
        .eq('id', id);
      
      // Se não for admin, garantir que o usuário seja dono do quadro
      if (!isAdmin) {
        query = query.eq('owner_id', user.id);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] });
    }
  });

  // Mutação para excluir um quadro
  const deleteBoard = useMutation({
    mutationFn: async (id: string) => {
      if (!user || !user.id) {
        throw new Error('Usuário não autenticado');
      }

      let query = supabase
        .from('kanban_boards')
        .delete()
        .eq('id', id);
      
      // Se não for admin, garantir que o usuário seja dono do quadro
      if (!isAdmin) {
        query = query.eq('owner_id', user.id);
      }

      const { error } = await query;

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] });
    }
  });

  // Buscar um quadro específico por ID
  const getBoard = async (id: string) => {
    if (!user || !user.id) {
      throw new Error('Usuário não autenticado');
    }

    let query = supabase
      .from('kanban_boards')
      .select('*')
      .eq('id', id);
    
    // Se não for admin, garantir que o usuário seja dono do quadro
    if (!isAdmin) {
      query = query.eq('owner_id', user.id);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data;
  };

  return {
    boards,
    isLoading,
    error,
    refetch,
    createBoard: createBoard.mutate,
    updateBoard: updateBoard.mutate,
    deleteBoard: deleteBoard.mutate,
    getBoard
  };
} 