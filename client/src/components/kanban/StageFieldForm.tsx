import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod'; // Remover zodResolver por enquanto
import { z } from 'zod';
import { Database } from '@/lib/database.types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from 'react';
import { Trash2 } from 'lucide-react';

type StageField = Database["public"]["Tables"]["kanban_stage_fields"]["Row"];

// Tipos de campo suportados (pode ser expandido)
const SUPPORTED_FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'select', 'checkbox'] as const;

// Schema Zod atualizado para options
const stageFieldSchema = z.object({
  field_name: z.string().min(1, "Nome do campo é obrigatório."),
  field_type: z.enum(SUPPORTED_FIELD_TYPES, { required_error: "Tipo do campo é obrigatório." }),
  is_required: z.boolean().default(false),
  // Opções agora é um array de objetos
  options: z.array(z.object({
      label: z.string().min(1, { message: "Label não pode ser vazio."}),
      value: z.string().min(1, { message: "Value não pode ser vazio."})
  })).optional(), // O array como um todo é opcional
  default_value: z.string().optional(),
});

type StageFieldFormData = z.infer<typeof stageFieldSchema>;

interface StageFieldFormProps {
  stageId: string;
  initialData?: StageField | null; // Dados para edição, null/undefined para adição
  onSave: (data: StageFieldFormData, fieldId?: string) => Promise<void>; // Passa ID para update
  onCancel: () => void;
  isSaving?: boolean; // Para desabilitar botão enquanto salva
}

export default function StageFieldForm({ stageId, initialData, onSave, onCancel, isSaving }: StageFieldFormProps) {
  
  // Função auxiliar segura para parsear e validar as opções iniciais
  const getInitialOptions = (): Array<{label: string, value: string}> => {
     if (!initialData?.options) return [];
     try {
        // Primeiro, verificar se já é um array de objetos (caso ideal)
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
        // Se não for ou contiver inválidos, tentar parsear como JSON string
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
     return []; // Retorna vazio em caso de erro ou tipo inválido
  };

  const form = useForm<StageFieldFormData>({
    // resolver: zodResolver(stageFieldSchema), // Remover resolver
    defaultValues: {
      field_name: initialData?.field_name ?? '',
      field_type: initialData?.field_type as typeof SUPPORTED_FIELD_TYPES[number] | undefined ?? undefined,
      is_required: initialData?.is_required ?? false,
      options: getInitialOptions(), // Usar a função segura para obter as opções iniciais
      default_value: initialData?.default_value ?? '',
    },
  });

  // Configuração para o array dinâmico de opções
  const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "options"
  });

  const fieldType = form.watch('field_type');

  // Tipar onSubmit explicitamente
  const onSubmit: SubmitHandler<StageFieldFormData> = (data) => {
     // Revalidar com Zod aqui se necessário, antes de chamar onSave
     const validationResult = stageFieldSchema.safeParse(data);
     if (!validationResult.success) {
         console.error("Erro de validação Zod no Submit:", validationResult.error.flatten());
         // Poderia mostrar um toast ou atualizar erros do formulário aqui
         // Ex: validationResult.error.errors.forEach(err => form.setError(err.path[0] as keyof StageFieldFormData, { message: err.message }));
         alert("Erro de validação: " + validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n'));
         return;
     }

     console.log("Salvando campo validado:", validationResult.data);
     onSave(validationResult.data, initialData?.id);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
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
              <FormLabel>Tipo do Campo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SUPPORTED_FIELD_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mostrar gerenciador de Opções apenas se o tipo for 'select' */}
        {fieldType === 'select' && (
          <div className="space-y-3 p-4 border rounded-md bg-muted/20">
             <FormLabel className="text-base font-medium">Opções do Select</FormLabel>
            {fields.map((item, index) => (
              <div key={item.id} className="flex items-start gap-2">
                <FormField
                   control={form.control}
                   name={`options.${index}.label`}
                   render={({ field }) => (
                      <FormItem className="flex-1">
                         {/* Não mostrar label individual, só placeholder */}
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
                    onClick={() => remove(index)}
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
              onClick={() => append({ label: '', value: '' })} // Adiciona um novo par vazio
            >
              + Adicionar Opção
            </Button>
          </div>
        )}

        <FormField
          control={form.control}
          name="default_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Padrão (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Pendente" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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