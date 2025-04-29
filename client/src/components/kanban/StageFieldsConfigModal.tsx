import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchStageFields, createStageField, updateStageField } from '@/lib/api';
import { Database } from '@/lib/database.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, PlusCircle, Trash2, Edit, GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from '@/hooks/use-auth';
import StageFieldForm from './StageFieldForm';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type StageField = Database["public"]["Tables"]["kanban_stage_fields"]["Row"];
// Este tipo agora reflete o que vem do formulário (checklist como string[])
type StageFieldFormData = {
  field_name: string;
  field_type: string;
  is_required: boolean;
  options?: Array<{ label: string; value: string; }> | undefined;
  default_value?: string | undefined;
  default_checklist_items?: string[]; // Espera string[] do formulário
};

type StageFieldsConfigModalProps = {
  stageId: string | null; // Pode ser null se nenhuma etapa for selecionada
  stageTitle?: string;    // Opcional: Título da etapa para exibir no modal
  isOpen: boolean;
  onClose: () => void;
};

export default function StageFieldsConfigModal({ stageId, stageTitle, isOpen, onClose }: StageFieldsConfigModalProps) {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [fieldToEdit, setFieldToEdit] = useState<StageField | null>(null);

  const { data: fields, isLoading, isError, error, refetch } = useQuery<
    StageField[],
    Error
  >({
    queryKey: ['stageFields', stageId],
    queryFn: () => fetchStageFields(stageId),
    enabled: !!stageId && mode === 'list',
    staleTime: 5 * 60 * 1000, 
  });

  const createMutation = useMutation({
    mutationFn: createStageField,
    onSuccess: (newField) => {
      toast({ title: "Sucesso", description: `Campo "${newField.field_name}" criado.` });
      queryClient.invalidateQueries({ queryKey: ['stageFields', stageId] });
      handleReturnToList();
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao Criar", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
     mutationFn: (variables: { fieldId: string; data: any }) => 
       updateStageField(variables.fieldId, variables.data),
    onSuccess: (updatedField) => {
      toast({ title: "Sucesso", description: `Campo "${updatedField.field_name}" atualizado.` });
      queryClient.invalidateQueries({ queryKey: ['stageFields', stageId] });
      handleReturnToList();
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao Atualizar", description: err.message, variant: "destructive" });
    },
  });

  const isAdmin = user?.roles?.includes('admin') || false;

  if (!isAdmin && isOpen) {
    console.warn("Acesso não autorizado ao StageFieldsConfigModal.");
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acesso Negado</DialogTitle>
          </DialogHeader>
          <p>Você não tem permissão para configurar os campos da etapa.</p>
          <DialogFooter>
            <Button onClick={onClose} variant="outline">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleEnterAddMode = () => {
    setFieldToEdit(null);
    setMode('add');
  };

  const handleEnterEditMode = (field: StageField) => {
    setFieldToEdit(field);
    setMode('edit');
  };

  const handleReturnToList = () => {
     setFieldToEdit(null);
     setMode('list');
     // refetch é chamado ao salvar ou fechar, remover daqui para evitar chamada dupla
     // refetch(); 
  };

  const handleDeleteField = (fieldId: string) => {
    console.log("Excluir campo clicado:", fieldId);
    // TODO: Implementar exclusão
  };

  // handleSaveField agora recebe StageFieldFormData (com checklist como string[])
  const handleSaveField = (formData: StageFieldFormData, fieldIdToUpdate?: string) => { 
    // Garantir que stageId existe antes de prosseguir
    if (!stageId) {
      toast({ title: "Erro", description: "ID da Etapa inválido.", variant: "destructive" });
      return;
    }

    // Preparar dados para a API
    // Extrair default_checklist_items especificamente se for do tipo checklist
    const { default_checklist_items, ...restOfData } = formData;

    const apiData: Partial<StageField> = {
      ...restOfData,
      // Garantir que options seja null se não for select
      options: formData.field_type === 'select' ? formData.options : null,
      // Garantir que default_value seja null se não for aplicável (ou não preenchido)
      default_value: formData.default_value || null,
      // Incluir default_checklist_items (já como string[]) apenas se for do tipo checklist
      default_checklist_items: formData.field_type === 'checklist' ? formData.default_checklist_items : null,
      // Certificar que stage_id está presente
      stage_id: stageId, // Agora sabemos que stageId não é null
    };

    // Remover propriedades que não devem ir para o update/create diretamente
    // (Ex: campos que só existem no form, ou que são tratados separadamente)
    // delete apiData.algumCampoExtra;

     if (fieldIdToUpdate) {
       // Atualizar campo existente
       updateMutation.mutate({ fieldId: fieldIdToUpdate, data: apiData });
     } else {
        // Criar novo campo
        // Calcular a próxima posição
        const nextPosition = fields?.length ?? 0;
        const createData = {
          ...apiData,
          position: nextPosition,
        };
        // Garantir que o tipo corresponde a CreateStageFieldData (omitindo id, created_at, updated_at)
        createMutation.mutate(createData as Omit<StageField, 'id' | 'created_at' | 'updated_at'>);
     }
   };

  if (!isOpen) return null;

  const renderContent = () => {
     if (mode === 'add' || mode === 'edit') {
        return (
           <StageFieldForm
              key={fieldToEdit?.id ?? 'add'}
              stageId={stageId!}
              // Passar dados iniciais (checklist já vem como string[] do fetch)
              initialData={fieldToEdit ? {
                 ...fieldToEdit,
                 // Converter array de strings para array de objetos {id, text}
                 default_checklist_items: Array.isArray(fieldToEdit.default_checklist_items)
                   ? (fieldToEdit.default_checklist_items as string[]).map((text, index) => ({
                       id: `temp-${index}-${Date.now()}`,
                       text
                     }))
                   : [],
               } as any : undefined}
              onSave={handleSaveField}
              onCancel={handleReturnToList} 
              isSaving={createMutation.isPending || updateMutation.isPending} // Corrigir nome da prop
           />
        );
     }

     return (
        <div className="space-y-4">
           <div className="flex justify-end">
             <Button size="sm" onClick={handleEnterAddMode}>
               <PlusCircle className="mr-2 h-4 w-4" />
               Adicionar Campo
             </Button>
           </div>

          {isLoading && (
             <div className="space-y-2">
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-full" />
             </div>
           )}

          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro ao Carregar Campos</AlertTitle>
              <AlertDescription>
                {error?.message || "Ocorreu um erro inesperado."}
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !isError && (
             <ScrollArea className="h-[400px] border rounded-md">
               {fields && fields.length > 0 ? (
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead className="w-[40px]"></TableHead>
                       <TableHead>Nome</TableHead>
                       <TableHead>Tipo</TableHead>
                       <TableHead>Obrigatório</TableHead>
                       <TableHead className="text-right">Ações</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {fields.map((field) => (
                       <TableRow key={field.id} className="group">
                          <TableCell className="cursor-grab">
                             <GripVertical className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                          </TableCell>
                         <TableCell className="font-medium">{field.field_name}</TableCell>
                         <TableCell><Badge variant="secondary">{field.field_type}</Badge></TableCell>
                         <TableCell>{field.is_required ? <Badge variant="outline">Sim</Badge> : 'Não'}</TableCell>
                         <TableCell className="text-right">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEnterEditMode(field)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteField(field.id)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Excluir</span>
                              </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               ) : (
                 <p className="text-sm text-muted-foreground text-center py-4">Nenhum campo configurado para esta etapa ainda.</p>
               )}
             </ScrollArea>
          )}
        </div>
      );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
       if (!open) {
          handleReturnToList(); // Garante reset do estado ao fechar
          onClose();
       }
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
           <DialogTitle>
              {mode === 'list' && `Configurar Campos: ${stageTitle || 'Etapa'}`}
              {mode === 'add' && `Adicionar Novo Campo - ${stageTitle || 'Etapa'}`}
              {mode === 'edit' && `Editar Campo - ${stageTitle || 'Etapa'}`}
           </DialogTitle>
           <DialogDescription>
              {mode === 'list' && "Visualize, adicione, edite ou remova campos personalizados para esta etapa do Kanban."}
              {mode === 'add' && "Preencha os detalhes para o novo campo personalizado."}
              {mode === 'edit' && "Modifique os detalhes deste campo personalizado."}
           </DialogDescription>
         </DialogHeader>
        
         <div className="py-4">
            {renderContent()}
         </div>

         {mode === 'list' && (
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Fechar</Button>
               </DialogClose>
             </DialogFooter>
         )}
       </DialogContent>
     </Dialog>
  );
} 