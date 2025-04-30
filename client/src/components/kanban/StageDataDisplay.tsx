import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';

import { fetchStageFieldsAndData, StageFieldWithValue, upsertKanbanStageData, UpsertStageData } from '@/lib/api';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Calendar as CalendarIcon, Check, Info, Loader2, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAuth } from '@/hooks/use-auth';
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import ChecklistField from './ChecklistField';

type StageDataDisplayProps = {
  cardId: string;
  stageId: string;
};

type FormValues = {
  [key: string]: string | boolean | number | null;
};

// Função auxiliar para formatar data
const formatDateSafe = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    // Tenta detectar se é apenas data YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
       const [year, month, day] = dateString.split('-').map(Number);
      return format(new Date(year, month - 1, day), "dd/MM/yyyy", { locale: ptBR });
    }
    // Tenta formatar como timestamp completo
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", dateString, error);
    return dateString; // Retorna string original em caso de erro
  }
};

// Função para renderizar o campo com base no tipo
const renderField = (item: StageFieldWithValue) => {
  const { field, value } = item;
  const label = field.field_name;
  const id = `stage-field-${field.id}`;

  switch (field.field_type) {
    case 'text':
    case 'number': // Tratar number como text por enquanto
      return (
        <div key={field.id} className="space-y-1">
          <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
             {label}{field.is_required ? <span className="text-destructive"> *</span> : ''}
          </Label>
          <Input id={id} value={value ?? ''} readOnly disabled className="bg-muted/30 cursor-default" />
        </div>
      );
    case 'textarea':
       return (
        <div key={field.id} className="space-y-1">
          <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
            {label}{field.is_required ? <span className="text-destructive"> *</span> : ''}
          </Label>
          <Textarea id={id} value={value ?? ''} readOnly disabled className="bg-muted/30 cursor-default h-20 resize-none" />
        </div>
      );
    case 'date':
      return (
        <div key={field.id} className="space-y-1">
          <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
             {label}{field.is_required ? <span className="text-destructive"> *</span> : ''}
          </Label>
          {/* Poderia usar um DatePicker disabled, mas Input é mais simples para readonly */}
          <Input id={id} value={formatDateSafe(value)} readOnly disabled className="bg-muted/30 cursor-default" />
        </div>
      );
    case 'select':
      // Assume que field.options é um array de strings [{label: string, value: string}] ou similar
      // Precisamos ajustar isso se a estrutura do JSON for diferente
       let options: { label: string, value: string }[] = [];
      try {
        if (field.options && typeof field.options === 'object') {
            // Tenta tratar como array diretamente
             if (Array.isArray(field.options)) {
                 options = field.options.map((opt: any) => 
                     typeof opt === 'string' ? { label: opt, value: opt } : opt
                 );
            } 
            // Adicione outras lógicas se o JSON tiver outra estrutura, ex: { key: value }
        }
      } catch (e) {
          console.error("Erro ao parsear opções do select:", field.options, e);
      }
      return (
        <div key={field.id} className="space-y-1">
          <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
            {label}{field.is_required ? <span className="text-destructive"> *</span> : ''}
          </Label>
          <Select value={value ?? undefined} disabled>
            <SelectTrigger id={id} className="bg-muted/30 cursor-default">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
      case 'boolean':
      case 'checkbox':
           return (
             <div key={field.id} className="flex items-center space-x-2 pt-2">
              {/* O valor vem como string 'true'/'false' ou 1/0? Assumindo string 'true' */}
              <Checkbox 
                id={id} 
                checked={value === 'true' || value === '1'} 
                disabled 
                className="cursor-default data-[state=checked]:bg-muted-foreground" 
              />
              <Label htmlFor={id} className="text-xs font-medium text-muted-foreground cursor-default">
                 {label}{field.is_required ? <span className="text-destructive"> *</span> : ''}
               </Label>
             </div>
           );
    case 'checklist': // Novo case para checklist
      return (
        <ChecklistField 
          cardId={cardId} // Usar a prop cardId diretamente
          fieldId={field.id} 
        />
      );
    default:
      // Campo desconhecido ou não suportado para exibição simples
      return (
        <div key={field.id} className="space-y-1">
          <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
            {label} ({field.field_type}){field.is_required ? <span className="text-destructive"> *</span> : ''}
          </Label>
          <Input id={id} value={value ?? 'N/A'} readOnly disabled className="bg-muted/30 cursor-default" />
        </div>
      );
  }
};

// Função auxiliar para renderizar o valor do campo de forma simples (não editável)
const renderSimpleField = (item: StageFieldWithValue, cardId: string) => {
  const { field, value } = item;

  // Extrair options do JSON se for select
  let options: { label: string, value: string }[] = [];
  try {
    if (field.options && typeof field.options === 'object') {
      // Tenta tratar como array diretamente
      if (Array.isArray(field.options)) {
        options = field.options.map((opt: any) => 
          typeof opt === 'string' ? { label: opt, value: opt } : opt
        );
      } 
      // Adicione outras lógicas se o JSON tiver outra estrutura, ex: { key: value }
    }
  } catch (e) {
    console.error("Erro ao parsear opções do select:", field.options, e);
  }

  switch (field.field_type) {
    case 'text':
    case 'number': // Tratar number como text por enquanto
      return (
        <div key={field.id} className="space-y-1">
          <Label htmlFor={`field-${field.id}`} className="font-medium">
            {field.field_name || `Campo ${field.id}`}
          </Label>
          <div className="mt-1 text-sm text-muted-foreground" id={`field-${field.id}`}>
            {value ?? ''}
          </div>
        </div>
      );
    case 'textarea':
      return (
        <div key={field.id} className="space-y-1">
          <Label htmlFor={`field-${field.id}`} className="font-medium">
            {field.field_name || `Campo ${field.id}`}
          </Label>
          <div className="mt-1 text-sm text-muted-foreground" id={`field-${field.id}`}>
            {value ?? ''}
          </div>
        </div>
      );
    case 'date':
      return (
        <div key={field.id} className="space-y-1">
          <Label htmlFor={`field-${field.id}`} className="font-medium">
            {field.field_name || `Campo ${field.id}`}
          </Label>
          <div className="mt-1 text-sm text-muted-foreground" id={`field-${field.id}`}>
            {formatDateSafe(value)}
          </div>
        </div>
      );
    case 'select':
      return (
        <div key={field.id} className="space-y-1">
          <Label htmlFor={`field-${field.id}`} className="font-medium">
            {field.field_name || `Campo ${field.id}`}
          </Label>
          <div className="mt-1 text-sm text-muted-foreground" id={`field-${field.id}`}>
            {options.find(opt => opt.value === value)?.label ?? 'N/A'}
          </div>
        </div>
      );
    case 'boolean':
    case 'checkbox':
      return (
        <div key={field.id} className="flex items-center space-x-2 pt-2">
          <Checkbox 
            id={`field-${field.id}`} 
            checked={value === 'true' || value === '1'} 
            disabled 
            className="cursor-default data-[state=checked]:bg-muted-foreground" 
          />
          <Label htmlFor={`field-${field.id}`} className="text-xs font-medium text-muted-foreground cursor-default">
            {field.field_name || `Campo ${field.id}`}{field.is_required ? <span className="text-destructive"> *</span> : ''}
          </Label>
        </div>
      );
    case 'checklist': // Novo case para checklist
      return (
        <ChecklistField 
          cardId={cardId} // Usar a prop cardId diretamente
          fieldId={field.id} 
        />
      );
    default:
      // Campo desconhecido ou não suportado para exibição simples
      return (
        <div key={field.id} className="space-y-1">
          <Label htmlFor={`field-${field.id}`} className="font-medium">
            {field.field_name || `Campo ${field.id}`} ({field.field_type})
          </Label>
          <div className="mt-1 text-sm text-muted-foreground" id={`field-${field.id}`}>
            {value ?? 'N/A'}
          </div>
        </div>
      );
  }
};

export default function StageDataDisplay({ cardId, stageId }: StageDataDisplayProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: stageFieldsData, isLoading, isError, error, dataUpdatedAt } = useQuery<
    StageFieldWithValue[],
    Error
  >({
    queryKey: ['stageData', stageId, cardId],
    queryFn: () => fetchStageFieldsAndData(cardId, stageId),
    enabled: !!cardId && !!stageId,
    staleTime: 5 * 60 * 1000, 
  });

  const form = useForm<FormValues>({
    defaultValues: {},
  });

  useEffect(() => {
    if (stageFieldsData) {
      const defaultVals: FormValues = {};
      stageFieldsData.forEach(item => {
        if (item.field.field_type === 'boolean' || item.field.field_type === 'checkbox') {
          defaultVals[item.field.id] = item.value === 'true' || item.value === '1';
        } else {
          defaultVals[item.field.id] = item.value ?? item.field.default_value ?? '';
        }
      });
      form.reset(defaultVals);
      console.log("Formulário resetado com valores:", defaultVals);
    }
  }, [stageFieldsData, form.reset, dataUpdatedAt]);

  const mutation = useMutation({
    mutationFn: upsertKanbanStageData,
    onSuccess: (result) => { 
      // Substituir toast por console.log para teste
      console.log("Toast simulado: Dados da etapa atualizados.");
      // toast({ title: "Sucesso", description: "Dados da etapa atualizados." }); 
      
       // --- Atualização Manual do Cache --- 
       // Supõe que result.data é o array de { field_id, value, ... } retornado pelo upsert
       const updatedItems = result.data;
       if (updatedItems && Array.isArray(updatedItems)) {
          queryClient.setQueryData(
             ['stageData', stageId, cardId], 
             (oldData: StageFieldWithValue[] | undefined) => {
                if (!oldData) return oldData;

                const updatedValuesMap = new Map(
                   updatedItems.map(item => [item.field_id, item.value])
                );

                return oldData.map(item => {
                   if (updatedValuesMap.has(item.field.id)) {
                      console.log(`Atualizando cache para field ${item.field.id} com valor: ${updatedValuesMap.get(item.field.id)}`);
                      // Retorna um NOVO objeto para garantir a imutabilidade
                      return { 
                         ...item, 
                         value: updatedValuesMap.get(item.field.id) ?? null // Usar ?? null para consistência
                      };
                   }
                   return item;
                });
             }
          );
       } else {
          // Se não conseguimos atualizar manualmente, invalidamos como fallback
          console.warn("Resultado da mutação inválido para atualização manual do cache, invalidando query.", result);
          queryClient.invalidateQueries({ queryKey: ['stageData', stageId, cardId] });
       }
       // --- Fim Atualização Manual --- 
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: `Falha ao atualizar dados da etapa: ${err.message}`, variant: "destructive" });
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Dados do formulário submetidos:", data);
    if (!stageFieldsData || !userId) {
      toast({ title: "Erro", description: "Usuário não identificado. Não foi possível salvar.", variant: "destructive" });
      return;
    }

    const changedData: { card_id: string; field_id: string; value: string | null; created_by: string }[] = [];
    const originalValues = new Map<string, string | null>();
    stageFieldsData.forEach(item => {
      originalValues.set(item.field.id, item.value ?? item.field.default_value);
    });

    for (const fieldId in data) {
       let submittedValue = data[fieldId];
       if (typeof submittedValue === 'boolean') {
            submittedValue = submittedValue ? 'true' : 'false';
       }
       const originalValue = originalValues.get(fieldId) ?? null;
      
       const currentValStr = String(submittedValue ?? '');
       const originalValStr = String(originalValue ?? '');

      if (currentValStr !== originalValStr) {
        console.log(`Campo ${fieldId} alterado de '${originalValStr}' para '${currentValStr}'`);
        changedData.push({
          card_id: cardId,
          field_id: fieldId,
          value: typeof submittedValue === 'string' ? submittedValue : String(submittedValue),
          created_by: userId,
        });
      }
    }

    if (changedData.length > 0) {
      console.log("Enviando alterações para mutação:", changedData);
      const payload: UpsertStageData[] = changedData.map(item => ({
           card_id: item.card_id,
           field_id: item.field_id,
           value: item.value,
           created_by: item.created_by,
       }));
      mutation.mutate(payload);
    } else {
      toast({ title: "Nenhuma alteração", description: "Nenhum campo foi modificado." });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-full" />
         <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao Carregar Dados da Etapa</AlertTitle>
        <AlertDescription>
          {error?.message || "Ocorreu um erro inesperado."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!stageFieldsData || stageFieldsData.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Nenhum campo definido para esta etapa.
      </div>
    );
  }

  // Função para renderizar campos usando Controller
  const renderFormField = (item: StageFieldWithValue) => {
    const { field: stageFieldDefinition } = item; // Renomear para evitar conflito
    const fieldName = stageFieldDefinition.id; // Usar ID do campo como nome no form
    const label = stageFieldDefinition.field_name;
    const isRequired = stageFieldDefinition.is_required;
    const fieldType = stageFieldDefinition.field_type;
    // Definição explícita do cardId para uso no escopo interno
    const thisCardId = cardId;

    return (
      <Controller
        key={fieldName}
        name={fieldName}
        control={form.control}
        // Adicionar regras de validação se necessário
        // rules={{ required: isRequired ? 'Este campo é obrigatório' : false }}
        render={({ field, fieldState: { error } }) => {
          const commonProps = {
            id: fieldName,
            name: field.name,
            onBlur: field.onBlur,
            ref: field.ref,
          };

          const renderInput = () => {
            switch (fieldType) {
              case 'text':
                 return <Input {...commonProps} value={String(field.value ?? '')} onChange={field.onChange} />; 
              case 'number':
                return (
                  <Input 
                     type="number" 
                     {...commonProps} 
                     value={field.value === null || field.value === undefined ? '' : Number(field.value)} 
                     onChange={e => {
                        const num = e.target.valueAsNumber;
                        field.onChange(isNaN(num) ? null : num);
                     }}
                  />
                 );
              case 'textarea':
                 return <Textarea {...commonProps} value={String(field.value ?? '')} onChange={field.onChange} className="h-20 resize-none" />;
              case 'date':
                const [isCalendarOpen, setIsCalendarOpen] = useState(false);
                
                return (
                  <div className="space-y-1">
                    <Label>{stageFieldDefinition.field_name}{isRequired ? <span className="text-destructive"> *</span> : ''}</Label>
                    <div>
                      <DatePicker
                        value={field.value as string}
                        onChange={field.onChange}
                        disabled={isLoading} 
                        placeholder="Selecione uma data"
                      />
                    </div>
                    {error && <p className="text-xs text-destructive mt-1">{error.message}</p>}
                  </div>
                );
              case 'select':
                 let options: { label: string, value: string }[] = [];
                 try {
                    if (stageFieldDefinition.options && typeof stageFieldDefinition.options === 'object') {
                       if (Array.isArray(stageFieldDefinition.options)) {
                          options = stageFieldDefinition.options.map((opt: any) => 
                              typeof opt === 'string' ? { label: opt, value: opt } : opt
                          );
                       } 
                    }
                  } catch (e) { console.error("Erro parse select options:", e); }
                 return (
                   <Select 
                       onValueChange={field.onChange} 
                       value={String(field.value ?? '')}
                       name={commonProps.name}
                   > 
                     <SelectTrigger id={fieldName}>
                       <SelectValue placeholder="Selecione..." />
                     </SelectTrigger>
                     <SelectContent>
                       {options.map((option) => (
                         <SelectItem key={option.value} value={option.value}>
                           {option.label}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 );
              case 'boolean':
              case 'checkbox':
                 const isChecked = field.value === true || field.value === 'true' || field.value === 1 || field.value === '1';
                 return (
                    <div className="flex items-center space-x-2 pt-1">
                        <Checkbox 
                           id={fieldName}
                           checked={isChecked}
                           onCheckedChange={field.onChange}
                           name={commonProps.name}
                           ref={commonProps.ref}
                           onBlur={commonProps.onBlur}
                        />
                    </div>
                 );
              case 'checklist':
                // O cardId aqui vem do parâmetro da função StageDataDisplay que é propagado até aqui
                const outerCardId = cardId; // Referenciar o cardId do escopo externo
                return (
                  <div className="w-full pt-1">
                    <ChecklistField 
                      cardId={outerCardId}
                      fieldId={stageFieldDefinition.id} 
                    />
                  </div>
                );
              default:
                return <Input id={fieldName} value={String(field.value ?? 'N/A')} disabled />;
            }
          };

          return (
             <div className="space-y-1">
                <Label htmlFor={fieldName} className="text-xs font-medium">
                  {label}{isRequired ? <span className="text-destructive"> *</span> : ''}
                </Label>
                {renderInput()} 
                {error && <p className="text-xs text-destructive mt-1">{error.message}</p>}
            </div>
          );
        }}
      />
    );
  };

  return (
    <Card className="w-full bg-card/50 shadow-sm border-border/50">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          Dados da Etapa
        </CardTitle>
        <CardDescription className="text-xs">
          Preencha os campos obrigatórios para esta etapa do processo
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Mostrar loading state */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          )}
          
          {/* Mostrar erro se houver */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>
                Não foi possível carregar os dados da etapa. {String(error)}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Lista de campos */}
          <AnimatePresence>
            {stageFieldsData && stageFieldsData.map((field, index) => (
              <motion.div 
                key={field.field.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                {renderFormField(field)}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Indicador de campos obrigatórios */}
          {stageFieldsData && stageFieldsData.some(item => item.field.is_required) && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
              <span className="text-destructive font-medium">*</span> 
              Campos obrigatórios
            </div>
          )}
        
          {/* Botão de salvar */}
          <CardFooter className="px-0 pb-0 pt-2">
            <Button 
              type="submit" 
              disabled={mutation.isPending || !form.formState.isDirty} 
              size="sm"
              className="gap-1.5 w-full sm:w-auto"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Salvar Dados
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
} 