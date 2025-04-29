import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, Json } from '@/lib/database.types';
import supabase from '@/lib/supabase';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

type DefaultChecklistItem = {
  id: string;
  text: string;
}

type ChecklistItemState = Database['public']['Tables']['kanban_checklist_item_states']['Row'];

type DisplayChecklistItem = DefaultChecklistItem & {
  is_checked: boolean;
}

interface ChecklistFieldProps {
  cardId: string;
  fieldId: string;
}

const ChecklistField: React.FC<ChecklistFieldProps> = ({ cardId, fieldId }) => {
  const queryClient = useQueryClient();

  const stageFieldQueryKey = ['stageField', fieldId];
  const { data: stageField, isLoading: isLoadingField, error: errorField } = useQuery<Database['public']['Tables']['kanban_stage_fields']['Row'] | null, Error>({
    queryKey: stageFieldQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_stage_fields')
        .select('*')
        .eq('id', fieldId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!fieldId,
  });

  const defaultItems = useMemo((): DefaultChecklistItem[] => {
    if (!stageField?.default_checklist_items) return [];
    try {
      if (Array.isArray(stageField.default_checklist_items)) {
        const items = stageField.default_checklist_items as any[];
        
        // Verificar se é um array de strings e converter para objetos
        if (items.length > 0 && typeof items[0] === 'string') {
          console.log('Convertendo strings para objetos em default_checklist_items');
          return items.map((text, index) => ({
            id: `default-${index}-${fieldId}`,
            text: text as string
          }));
        }
        
        // Se já for um array de objetos, filtrar pelo formato esperado
        return items.filter(
          (item): item is DefaultChecklistItem =>
            typeof item === 'object' && item !== null &&
            typeof item.id === 'string' && typeof item.text === 'string'
        );
      }
    } catch (e) {
      console.error("Erro ao processar default_checklist_items:", e);
    }
    return [];
  }, [stageField?.default_checklist_items, fieldId]);

  const itemStatesQueryKey = ['checklistItemStates', cardId, fieldId];
  const { data: itemStates = [], isLoading: isLoadingStates, error: errorStates } = useQuery<ChecklistItemState[], Error>({
    queryKey: itemStatesQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_checklist_item_states')
        .select('*')
        .eq('card_id', cardId)
        .eq('field_id', fieldId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!cardId && !!fieldId,
  });

  const displayItems = useMemo((): DisplayChecklistItem[] => {
    const statesMap = new Map(itemStates.map(state => [state.item_id, state.is_checked]));
    return defaultItems.map(item => ({
      ...item,
      is_checked: statesMap.get(item.id) ?? false
    }));
  }, [defaultItems, itemStates]);

  type MutationContext = { previousStates?: ChecklistItemState[] };

  const updateStateMutation = useMutation<void, Error, { itemId: string; isChecked: boolean }, MutationContext>({
    mutationFn: async ({ itemId, isChecked }) => {
      if (isChecked) {
        const { error } = await supabase
          .from('kanban_checklist_item_states')
          .upsert({
            card_id: cardId,
            field_id: fieldId,
            item_id: itemId,
            is_checked: true
          }, { onConflict: 'card_id, field_id, item_id' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('kanban_checklist_item_states')
          .delete()
          .match({
            card_id: cardId,
            field_id: fieldId,
            item_id: itemId
          });
        if (error && error.code !== 'PGRST204') {
          throw error;
        }
      }
    },
    onMutate: async ({ itemId, isChecked }) => {
      await queryClient.cancelQueries({ queryKey: itemStatesQueryKey });
      const previousStates = queryClient.getQueryData<ChecklistItemState[]>(itemStatesQueryKey);

      queryClient.setQueryData<ChecklistItemState[]>(itemStatesQueryKey, (oldStates = []) => {
        if (isChecked) {
          const existingIndex = oldStates.findIndex(s => s.item_id === itemId);
          const newState: ChecklistItemState = {
            card_id: cardId,
            field_id: fieldId,
            item_id: itemId,
            is_checked: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          if (existingIndex > -1) {
            const updatedStates = [...oldStates];
            updatedStates[existingIndex] = { ...updatedStates[existingIndex], ...newState };
            return updatedStates;
          } else {
            return [...oldStates, newState];
          }
        } else {
          return oldStates.filter(s => s.item_id !== itemId);
        }
      });

      return { previousStates };
    },
    onError: (err, variables, context) => {
      console.error("Erro ao atualizar estado do checklist:", err);
      toast.error(`Erro ao atualizar item.`);
      if (context?.previousStates) {
        queryClient.setQueryData(itemStatesQueryKey, context.previousStates);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: itemStatesQueryKey });
    },
  });

  const handleToggleCheck = (itemId: string, currentChecked: boolean) => {
    updateStateMutation.mutate({ itemId, isChecked: !currentChecked });
  };

  const isLoading = isLoadingField || isLoadingStates;
  const error = errorField || errorStates;

  if (isLoading) return <div>Carregando checklist...</div>;
  if (error) return <div className="text-red-500">Erro ao carregar checklist: {error.message}</div>;
  if (!stageField) return <div className="text-muted-foreground">Campo não encontrado.</div>;
  if (stageField.field_type !== 'checklist') return <div className="text-red-500">Erro: Este campo não é do tipo checklist.</div>;
  if (defaultItems.length === 0) return <div className="text-muted-foreground text-sm">Nenhum item de checklist configurado para este campo.</div>

  const totalItems = displayItems.length;
  const completedItems = displayItems.filter(item => item.is_checked).length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-2 w-full">
      {totalItems > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mb-2">
          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      <div className="space-y-1">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center space-x-2 p-1 rounded"
          >
            <Checkbox
              id={`item-${item.id}`}
              checked={item.is_checked}
              onCheckedChange={() => handleToggleCheck(item.id, item.is_checked)}
              className="flex-shrink-0"
              disabled={updateStateMutation.isPending}
            />
            <label
              htmlFor={`item-${item.id}`}
              className={`flex-grow text-sm ${item.is_checked ? 'line-through text-muted-foreground' : ''} cursor-pointer`}
            >
              {item.text}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChecklistField;
