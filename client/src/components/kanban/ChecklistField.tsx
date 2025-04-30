import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, Json } from '@/lib/database.types';
import supabase from '@/lib/supabase';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { CheckCircle, Circle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  if (isLoading) return (
    <div className="flex items-center justify-center py-3 text-muted-foreground animate-pulse">
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      <span className="text-sm">Carregando checklist...</span>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center py-2 text-destructive rounded-md bg-destructive/10 px-3">
      <AlertCircle className="h-4 w-4 mr-2" />
      <span className="text-sm">Erro ao carregar checklist: {error.message}</span>
    </div>
  );
  
  if (!stageField) return (
    <div className="flex items-center justify-center py-3 text-muted-foreground">
      <span className="text-sm">Campo não encontrado</span>
    </div>
  );
  
  if (stageField.field_type !== 'checklist') return (
    <div className="flex items-center justify-center py-2 text-destructive rounded-md bg-destructive/10 px-3">
      <AlertCircle className="h-4 w-4 mr-2" />
      <span className="text-sm">Erro: Este campo não é do tipo checklist</span>
    </div>
  );
  
  if (defaultItems.length === 0) return (
    <div className="flex items-center justify-center py-3 text-muted-foreground">
      <span className="text-sm">Nenhum item de checklist configurado</span>
    </div>
  );

  const totalItems = displayItems.length;
  const completedItems = displayItems.filter(item => item.is_checked).length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <Card className="w-full p-3 shadow-sm border border-border/50 bg-card/50">
      <div className="space-y-3 w-full">
        {/* Cabeçalho com progresso e contador */}
        <div className="flex justify-between items-center mb-1">
          <Badge 
            variant={progress === 100 ? "outline" : "secondary"} 
            className={cn(
              "px-2 py-0 h-5", 
              progress === 100 && "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-500/30"
            )}
          >
            <span className="text-xs">{completedItems}/{totalItems}</span>
          </Badge>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="cursor-default">
                <span className="text-xs text-muted-foreground">
                  {progress === 100 ? 'Completo' : `${Math.round(progress)}% concluído`}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Progresso do checklist</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Barra de progresso animada */}
        <div className="w-full bg-muted rounded-full h-1.5">
          <motion.div 
            className="bg-primary h-1.5 rounded-full" 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        {/* Itens do checklist com animações */}
        <div className="space-y-1 pt-1">
          <AnimatePresence initial={false}>
            {displayItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md transition-colors",
                  item.is_checked 
                    ? "bg-muted/50" 
                    : "hover:bg-accent/30"
                )}
              >
                <div className="flex-shrink-0">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={item.is_checked}
                    onCheckedChange={() => handleToggleCheck(item.id, item.is_checked)}
                    className={cn(
                      "transition-all duration-200",
                      item.is_checked && "border-primary",
                      updateStateMutation.isPending && "opacity-50"
                    )}
                    disabled={updateStateMutation.isPending}
                  />
                </div>
                
                <label
                  htmlFor={`item-${item.id}`}
                  className={cn(
                    "flex-grow text-sm transition-all duration-200 cursor-pointer",
                    item.is_checked && "line-through text-muted-foreground"
                  )}
                >
                  {item.text}
                </label>
                
                {updateStateMutation.isPending && updateStateMutation.variables?.itemId === item.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-auto" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
};

export default ChecklistField;
