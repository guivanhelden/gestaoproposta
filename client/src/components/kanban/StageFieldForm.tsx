import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Database, Json } from '@/lib/database.types';
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, HelpCircle, CheckCircle, Type, Calendar, Hash, AlignLeft, ListChecks, ToggleLeft, ListOrdered } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

type StageField = Database["public"]["Tables"]["kanban_stage_fields"]["Row"];

const SUPPORTED_FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'select', 'boolean', 'checklist'] as const;

const fieldTypeEnum = z.enum(SUPPORTED_FIELD_TYPES);

const stageFieldSchema = z.object({
  field_name: z.string().min(1, "Nome do campo é obrigatório."),
  field_type: fieldTypeEnum,
  is_required: z.boolean().default(false),
  options: z.array(z.object({
      label: z.string().min(1, { message: "Label não pode ser vazio."}),
      value: z.string().min(1, { message: "Value não pode ser vazio."})
  })).optional(),
  default_value: z.string().optional(),
  // Aceita array de objetos internamente para facilitar manipulação com useFieldArray
  default_checklist_items: z.array(z.object({
    id: z.string(), // ID único para react-hook-form
    text: z.string().min(1, "O texto do item não pode ser vazio."),
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.field_type === 'checklist') {
    if (data.default_value && data.default_value.trim() !== '') {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valor Padrão não é aplicável para o tipo checklist.",
        path: ["default_value"],
      });
    }
    if (data.options && data.options.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Opções são obrigatórias para o tipo select.",
        path: ['options'],
      });
    }
  } else if (data.field_type === 'select') {
      if (!data.options || data.options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pelo menos uma opção é necessária para o tipo select.",
          path: ["options"],
        });
      }
      if (data.default_checklist_items && data.default_checklist_items.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Itens de checklist não são permitidos para o tipo select.",
          path: ["default_checklist_items"],
        });
      }
  } else {
    if (data.options && data.options.length > 0) {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Opções não são permitidas para o tipo.",
        path: ["options"],
      });
    }
    if (data.default_checklist_items && data.default_checklist_items.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Itens de checklist não são permitidos para o tipo.",
        path: ["default_checklist_items"],
      });
    }
  }
});

const stageFieldFormSchemaInternal = stageFieldSchema;

type StageFieldFormDataInternal = z.infer<typeof stageFieldSchema>;

type StageFieldFormDataExternal = Omit<StageFieldFormDataInternal, 'default_checklist_items'> & {
  default_checklist_items?: string[];
};

interface StageFieldFormProps {
  stageId: string;
  // initialData pode ter id opcional e outros campos opcionais
  initialData?: (Partial<Omit<StageFieldFormDataExternal, 'id'>> & { id?: string }) | null;
  onSave: (data: StageFieldFormDataExternal, fieldId?: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export default function StageFieldForm({ stageId, initialData, onSave, onCancel, isSaving }: StageFieldFormProps) {
  
  // Mapeamento de ícones e descrições para cada tipo de campo
  const fieldTypeIcons = {
    'text': <Type className="h-4 w-4" />,
    'textarea': <AlignLeft className="h-4 w-4" />,
    'number': <Hash className="h-4 w-4" />,
    'date': <Calendar className="h-4 w-4" />,
    'select': <ListOrdered className="h-4 w-4" />,
    'boolean': <ToggleLeft className="h-4 w-4" />,
    'checklist': <ListChecks className="h-4 w-4" />
  };
  
  const fieldTypeDescriptions = {
    'text': 'Campo de texto simples, ideal para informações curtas',
    'textarea': 'Campo de texto multilinha para informações detalhadas',
    'number': 'Campo para valores numéricos',
    'date': 'Seletor de data',
    'select': 'Lista suspensa de opções pré-definidas',
    'boolean': 'Campo sim/não (verdadeiro/falso)',
    'checklist': 'Lista de tarefas ou itens para marcar como concluídos'
  };

  const getInitialOptions = (): Array<{label: string, value: string}> => {
    if (!initialData?.options) return [];
    try {
      if (Array.isArray(initialData.options)) {
         const validOptions = initialData.options.filter(
            (opt: any): opt is {label: string, value: string} => 
               typeof opt === 'object' && opt !== null && 
               typeof opt.label === 'string' && typeof opt.value === 'string'
         );
         if (validOptions.length === initialData.options.length) {
             console.log("Usando initialData.options diretamente (já é array de objetos válidos)");
             return validOptions;
         }
      }
      if (typeof initialData.options === 'string') {
         const parsed = JSON.parse(initialData.options);
         if (Array.isArray(parsed)) {
            return parsed.filter(
                (opt: any): opt is {label: string, value: string} => 
                    typeof opt === 'object' && opt !== null && 
                    typeof opt.label === 'string' && typeof opt.value === 'string'
             );
         }
      }
    } catch (e) {
       console.error("Erro ao parsear initialData.options:", e);
    }
    return []; 
  };

  let initialChecklistItems: Array<{ id: string; text: string }> = [];
  if (initialData?.field_type === 'checklist' && initialData?.default_checklist_items) {
      try {
          if (Array.isArray(initialData.default_checklist_items)) {
             const validItems = (initialData.default_checklist_items as any[]).filter(
                (item): item is { id: string; text: string } =>
                  typeof item === 'object' && item !== null &&
                  typeof item.id === 'string' && typeof item.text === 'string'
             );
             if (validItems.length === initialData.default_checklist_items.length) {
                initialChecklistItems = validItems;
             } else {
               console.warn("Formato inválido detectado em initialData.default_checklist_items (array)");
             }
          }
          else if (typeof initialData.default_checklist_items === 'string') {
             const parsed = JSON.parse(initialData.default_checklist_items);
             if (Array.isArray(parsed)) {
                const validItems = parsed.filter(
                   (item): item is { id: string; text: string } =>
                     typeof item === 'object' && item !== null &&
                     typeof item.id === 'string' && typeof item.text === 'string'
                );
                if (validItems.length === parsed.length) {
                   initialChecklistItems = validItems;
                } else {
                  console.warn("Formato inválido detectado em initialData.default_checklist_items (parsed string)");
                }
             } else {
               console.warn("initialData.default_checklist_items (string) não é um array JSON válido.");
             }
         } else {
            console.warn("initialData.default_checklist_items não é um array ou string JSON válida.");
         }
      } catch (error) {
         console.error("Erro ao parsear initialData.default_checklist_items:", error);
      }
      initialData.default_value = undefined;
  }

  const form = useForm<StageFieldFormDataInternal>({
    resolver: zodResolver(stageFieldFormSchemaInternal),
    defaultValues: {
      field_name: '',
      field_type: undefined,
      is_required: false,
      default_value: undefined,
      default_checklist_items: [],
      options: [],
    },
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: "options"
  });

  const { fields: checklistItemFields, append: appendChecklistItem, remove: removeChecklistItem } = useFieldArray({
    control: form.control,
    name: "default_checklist_items"
  });

  const fieldType = form.watch('field_type');

  useEffect(() => {
    if (initialData) {
      form.reset({
        field_name: initialData?.field_name ?? '',
        field_type: initialData?.field_type as any, 
        is_required: initialData?.is_required ?? false,
        default_value: initialData?.default_value ?? undefined,
        default_checklist_items: initialData?.default_checklist_items
          ? initialData.default_checklist_items.map((text, index) => ({
              id: `temp-${index}-${Date.now()}`,
              text,
            }))
          : [],
        options: initialData?.field_type === 'select' && Array.isArray(initialData?.options)
          ? (initialData.options as Json[])
              .map((opt: any) => typeof opt === 'string' ? { label: opt, value: opt } : opt)
              .filter(opt => opt && typeof opt === 'object' && 'value' in opt && 'label' in opt)
          : [],
      });
    } else {
      // Opcional: Resetar para os padrões se initialData ficar nulo/undefined depois de ter valor
      // form.reset(form.formState.defaultValues);
    }
  }, [initialData, form.reset]);

  const onSubmit: SubmitHandler<StageFieldFormDataInternal> = async (data) => {
    const dataToSave: StageFieldFormDataExternal = {
      ...data,
      default_checklist_items: data.default_checklist_items?.map(item => item.text),
      options: data.options,
    }; 
    console.log("Data being sent to onSave:", dataToSave);
    await onSave(dataToSave, initialData?.id); 
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="field_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Campo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Nome do Contato" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="field_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium mb-2">Tipo do Campo</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {SUPPORTED_FIELD_TYPES.map((type) => (
                    <div
                      key={type}
                      className={cn(
                        "relative overflow-hidden rounded-lg border-2 p-3 cursor-pointer transition-all duration-200",
                        "hover:border-primary/70 hover:bg-primary/5",
                        field.value === type
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border"
                      )}
                      onClick={() => field.onChange(type)}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div 
                          className={cn(
                            "p-2 rounded-full", 
                            field.value === type 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {fieldTypeIcons[type]}
                        </div>
                        <span className={cn(
                          "font-medium text-center",
                          field.value === type ? "text-primary" : "text-foreground"
                        )}>
                          {type === 'text' && "Texto Curto"}
                          {type === 'textarea' && "Texto Longo"}
                          {type === 'number' && "Número"}
                          {type === 'date' && "Data"}
                          {type === 'select' && "Seleção"}
                          {type === 'boolean' && "Sim/Não"}
                          {type === 'checklist' && "Checklist"}
                        </span>
                      </div>
                      
                      {field.value === type && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </FormControl>
              
              {field.value && (
                <FormDescription className="text-xs mt-2">
                  {fieldTypeDescriptions[field.value]}
                </FormDescription>
              )}
              
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {fieldType === 'select' && (
        <div className="space-y-3 p-4 border rounded-md bg-muted/20">
           <FormLabel className="text-base font-medium">Opções do Select</FormLabel>
          {optionFields.map((item, index) => (
            <div key={item.id} className="flex items-start gap-2">
              <FormField
                 control={form.control}
                 name={`options.${index}.label`}
                 render={({ field }) => (
                    <FormItem className="flex-1">
                       <FormControl>
                         <Input placeholder={`Label da Opção ${index + 1}`} {...field} />
                       </FormControl>
                       <FormMessage className="text-xs" />
                     </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name={`options.${index}.value`}
                 render={({ field }) => (
                    <FormItem className="flex-1">
                       <FormControl>
                         <Input placeholder={`Valor da Opção ${index + 1}`} {...field} />
                       </FormControl>
                       <FormMessage className="text-xs" />
                     </FormItem>
                 )}
               />
               <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-1 text-destructive hover:text-destructive flex-shrink-0 h-8 w-8"
                  onClick={() => removeOption(index)}
                  disabled={isSaving}
               >
                 <Trash2 className="h-4 w-4" />
                 <span className="sr-only">Remover Opção</span>
               </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => appendOption({ label: '', value: '' })} 
          >
            + Adicionar Opção
          </Button>
        </div>
      )}

      {fieldType === 'checklist' && (
         <div className="space-y-3 rounded-md border p-4 shadow-sm">
           <Label className="font-medium">Itens Padrão do Checklist</Label>
           {checklistItemFields.map((item, index) => (
             <div key={item.id} className="flex items-center gap-2">
               <FormField
                 control={form.control}
                 name={`default_checklist_items.${index}.text`}
                 render={({ field }) => (
                   <Input
                     {...field}
                     placeholder={`Texto do item ${index + 1}`}
                     className="flex-grow"
                   />
                 )}
               />
                <input type="hidden" {...form.register(`default_checklist_items.${index}.id`)} />

               <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive flex-shrink-0 h-8 w-8"
                  onClick={() => removeChecklistItem(index)}
                  disabled={isSaving}
               >
                 <Trash2 className="h-4 w-4" />
                 <span className="sr-only">Remover Item</span>
               </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => appendChecklistItem({ id: `new-${checklistItemFields.length}-${Date.now()}`, text: '' })} 
          >
            <PlusCircle className="mr-2 h-4 w-4"/>
            Adicionar Item
          </Button>
           {form.formState.errors.default_checklist_items?.root && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.default_checklist_items.root.message}
              </p>
           )}
        </div>
      )}

      {fieldType !== 'checklist' && fieldType !== 'select' && (
             <FormField
               control={form.control}
               name="default_value"
               render={({ field: controllerField }) => {
                 const renderDefaultValueInput = () => {
                   switch (fieldType) {
                     case 'boolean':
                       return (
                         <Checkbox
                           checked={controllerField.value === 'true'}
                           onCheckedChange={(checked) => {
                             controllerField.onChange(checked ? 'true' : 'false');
                           }}
                         />
                       );
                     case 'date':
                       return (
                         <DatePicker
                           value={controllerField.value ?? undefined} 
                           onChange={(dateString: string | null) => controllerField.onChange(dateString ?? '')} 
                         />
                       );
                     case 'textarea':
                       return <Textarea {...controllerField} value={controllerField.value || ''} />;
                     case 'text':
                     case 'number':
                     default: 
                       return <Input {...controllerField} value={controllerField.value || ''} />;
                   }
                 };

                 return (
                   <FormItem>
                     <FormLabel>Valor Padrão</FormLabel>
                     <FormControl>
                       {renderDefaultValueInput()} 
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 );
               }}
             />
        )}

        <FormField
          control={form.control}
          name="is_required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                 <FormLabel>Campo Obrigatório?</FormLabel>
              </div>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-4">
           <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
             Cancelar
           </Button>
           <Button type="submit" disabled={isSaving}>
             {isSaving ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Criar Campo')}
           </Button>
         </div>

    </form>
    </Form>
  );
}