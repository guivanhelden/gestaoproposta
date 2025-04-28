import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { 
    Dialog as MainDialog, 
    DialogContent as MainDialogContent, 
    DialogHeader as MainDialogHeader, 
    DialogTitle as MainDialogTitle, 
    DialogFooter as MainDialogFooter, 
    DialogDescription 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import BeneficiaryDialogForm, { BeneficiaryFormData } from '../BeneficiaryDialogForm';
import supabase from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { format } from "date-fns";

// Tipos do Supabase
type PmeHolder = Database['public']['Tables']['pme_holders']['Row'];
type PmeDependent = Database['public']['Tables']['pme_dependents']['Row'];

// Valores padrão para o formulário de beneficiário
const defaultBeneficiaryFormData: BeneficiaryFormData = {
  name: '',
  cpf: '',
  birth_date: null,
  email: '',
  phone: '',
  relationship: '',
};

// Tipo para controlar o estado de edição
type EditingBeneficiary = {
  type: 'holder' | 'dependent';
  data: PmeHolder | PmeDependent;
  holderId?: string;
};

interface BeneficiaryDialogManagerProps {
    submissionId: string | null;
    onHolderUpdated: (holder: PmeHolder, isNew: boolean) => void;
    onHolderDeleted: (holderId: string) => void;
    onDependentUpdated: (dependent: PmeDependent, holderId: string, isNew: boolean) => void;
    onDependentDeleted: (dependentId: string, holderId: string) => void;
}

// 1. Envolver com forwardRef
export const BeneficiaryDialogManager = forwardRef<any, BeneficiaryDialogManagerProps>(({ 
    submissionId, 
    onHolderUpdated, 
    onHolderDeleted,
    onDependentUpdated,
    onDependentDeleted
}, ref) => {
    const { toast } = useToast();
    const [isBeneficiaryDialogOpen, setIsBeneficiaryDialogOpen] = useState(false);
    const [editingBeneficiary, setEditingBeneficiary] = useState<EditingBeneficiary | null>(null);
    const [beneficiaryFormData, setBeneficiaryFormData] = useState<BeneficiaryFormData>(defaultBeneficiaryFormData);
    const [isSavingBeneficiary, setIsSavingBeneficiary] = useState(false);

    // Função para converter data do Supabase para string formatada (yyyy-MM-dd)
    const formatDateToString = (dateValue: string | Date | null): string | null => {
        if (!dateValue) return null;
        
        try {
            // Se já for string, verifica se está no formato correto
            if (typeof dateValue === 'string') {
                // Verifica se já está no formato YYYY-MM-DD
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
                
                // Tenta converter de outros formatos para YYYY-MM-DD
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) return format(date, 'yyyy-MM-dd');
            } 
            
            // Se for objeto Date
            if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
                return format(dateValue, 'yyyy-MM-dd');
            }
            
            return null;
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return null;
        }
    };

    // Abrir Dialog para ADICIONAR titular
    const openAddHolderDialog = () => {
        setEditingBeneficiary({ type: 'holder', data: {} as PmeHolder });
        setBeneficiaryFormData(defaultBeneficiaryFormData);
        setIsBeneficiaryDialogOpen(true);
    };

    // Abrir Dialog para EDITAR titular
    const openEditHolderDialog = (holder: PmeHolder) => {
        setEditingBeneficiary({ type: 'holder', data: holder });
        setBeneficiaryFormData({
            name: holder.name || '',
            cpf: holder.cpf || '',
            birth_date: formatDateToString(holder.birth_date),
            email: holder.email || '',
            phone: holder.phone || '',
            relationship: '' // Não aplicável
        });
        setIsBeneficiaryDialogOpen(true);
    };

    // Abrir Dialog para ADICIONAR dependente
    const openAddDependentDialog = (holderId: string) => {
        setEditingBeneficiary({ type: 'dependent', data: {} as PmeDependent, holderId });
        setBeneficiaryFormData(defaultBeneficiaryFormData);
        setIsBeneficiaryDialogOpen(true);
    };

    // Abrir Dialog para EDITAR dependente
    const openEditDependentDialog = (dependent: PmeDependent) => {
        setEditingBeneficiary({ type: 'dependent', data: dependent });
        setBeneficiaryFormData({
            name: dependent.name || '',
            cpf: dependent.cpf || '',
            birth_date: formatDateToString(dependent.birth_date),
            email: '', // Não aplicável
            phone: '', // Não aplicável
            relationship: dependent.relationship || ''
        });
        setIsBeneficiaryDialogOpen(true);
    };

    // Fechar Dialog
    const closeBeneficiaryDialog = () => {
        setIsBeneficiaryDialogOpen(false);
    };

    // Handler para atualizar o estado do formulário
    const handleBeneficiaryFormChange = (field: keyof BeneficiaryFormData, value: any) => {
        setBeneficiaryFormData(prev => ({ ...prev, [field]: value }));
    };

    // Função para SALVAR (criar ou atualizar) beneficiário
    const handleSaveBeneficiary = async () => {
        if (!submissionId) {
            toast({ title: "Erro", description: "ID da Submissão não encontrado.", variant: "destructive" });
            return;
        }
        if (!beneficiaryFormData.name || beneficiaryFormData.name.trim().length < 1) {
            toast({ title: "Erro", description: "Nome do beneficiário inválido.", variant: "destructive" });
            return;
        }

        setIsSavingBeneficiary(true);
        try {
            let savedData = null;
            let rpcError = null;
            
            if (editingBeneficiary?.type === 'holder') {
                const holderDataForUpsert = {
                    // Incluir ID se estiver editando
                    ...(editingBeneficiary.data?.id && { id: editingBeneficiary.data.id }), 
                    submission_id: submissionId,
                    name: beneficiaryFormData.name.trim(),
                    cpf: beneficiaryFormData.cpf || null,
                    birth_date: beneficiaryFormData.birth_date,
                    email: beneficiaryFormData.email || null,
                    phone: beneficiaryFormData.phone || null,
                    status: 'active'
                };
                
                console.log(`[BeneficiaryDialogManager] Tentando UPSERT (via POST) para holder ID: ${editingBeneficiary.data?.id || 'novo'}`);
                console.log(`[BeneficiaryDialogManager] Dados de birth_date: ${JSON.stringify(beneficiaryFormData.birth_date)}`);
                
                // Usar upsert para holder
                const { data, error } = await supabase
                    .from('pme_holders')
                    .upsert([holderDataForUpsert], { onConflict: 'id' })
                    .select()
                    .single();

                rpcError = error;
                savedData = data;
                
                if (!rpcError) {
                    if (editingBeneficiary.data?.id) {
                        toast({ title: "Sucesso", description: "Titular atualizado." });
                        onHolderUpdated(savedData as PmeHolder, false);
                    } else {
                        toast({ title: "Sucesso", description: "Titular adicionado." });
                        onHolderUpdated(savedData as PmeHolder, true);
                    }
                }
            } else if (editingBeneficiary?.type === 'dependent') {
                if (!beneficiaryFormData.relationship) throw new Error("Parentesco não fornecido");
                const holderId = editingBeneficiary.holderId || (editingBeneficiary.data as PmeDependent)?.holder_id;
                if (!holderId) throw new Error("Holder ID ausente");
                
                const dependentDataForUpsert = {
                     // Incluir ID se estiver editando
                    ...(editingBeneficiary.data?.id && { id: editingBeneficiary.data.id }), 
                    holder_id: holderId,
                    name: beneficiaryFormData.name.trim(),
                    cpf: beneficiaryFormData.cpf || null,
                    birth_date: beneficiaryFormData.birth_date,
                    relationship: beneficiaryFormData.relationship,
                    is_active: true
                };
                
                console.log(`[BeneficiaryDialogManager] Tentando UPSERT (via POST) para dependent ID: ${editingBeneficiary.data?.id || 'novo'}`);
                console.log(`[BeneficiaryDialogManager] Dados de birth_date: ${JSON.stringify(beneficiaryFormData.birth_date)}`);

                // Usar upsert para dependent
                 const { data, error } = await supabase
                    .from('pme_dependents')
                    .upsert([dependentDataForUpsert], { onConflict: 'id' })
                    .select()
                    .single();

                rpcError = error;
                savedData = data;

                if (!rpcError) {
                     if (editingBeneficiary.data?.id) {
                        toast({ title: "Sucesso", description: "Dependente atualizado." });
                        onDependentUpdated(savedData as PmeDependent, holderId, false);
                    } else {
                        toast({ title: "Sucesso", description: "Dependente adicionado." });
                         onDependentUpdated(savedData as PmeDependent, holderId, true);
                    }
                }
            }

            if (rpcError) throw rpcError; // Lança o erro se houver

            closeBeneficiaryDialog();

        } catch (error: any) {
            console.error('Erro ao salvar beneficiário (via upsert):', error);
            toast({ title: "Erro", description: `Falha ao salvar beneficiário: ${error.message}`, variant: "destructive" });
        } finally {
            setIsSavingBeneficiary(false);
        }
    };

    // Função para EXCLUIR titular
    const handleDeleteHolder = async (holderId: string) => {
        if (!confirm('Tem certeza que deseja excluir este titular e TODOS os seus dependentes?')) return;
        
        setIsSavingBeneficiary(true);
        try {
            const { error } = await supabase
                .from('pme_holders')
                .delete()
                .eq('id', holderId);
            if (error) throw error;
            
            // Notificar o componente pai sobre a exclusão
            onHolderDeleted(holderId);
            
            toast({ title: "Sucesso", description: "Titular excluído." });
        } catch (error: any) {
            console.error('Erro ao excluir titular:', error);
            toast({ title: "Erro", description: `Falha ao excluir titular: ${error.message}`, variant: "destructive" });
        } finally {
            setIsSavingBeneficiary(false);
        }
    };

    // Função para EXCLUIR dependente
    const handleDeleteDependent = async (dependentId: string, holderId: string) => {
        if (!confirm('Tem certeza que deseja excluir este dependente?')) return;
        
        setIsSavingBeneficiary(true);
        try {
            const { error } = await supabase
                .from('pme_dependents')
                .delete()
                .eq('id', dependentId);
            if (error) throw error;
            
            // Notificar o componente pai sobre a exclusão
            onDependentDeleted(dependentId, holderId);
            
            toast({ title: "Sucesso", description: "Dependente excluído." });
        } catch (error: any) {
            console.error('Erro ao excluir dependente:', error);
            toast({ title: "Erro", description: `Falha ao excluir dependente: ${error.message}`, variant: "destructive" });
        } finally {
            setIsSavingBeneficiary(false);
        }
    };

    // 2. Usar useImperativeHandle para expor as funções necessárias
    useImperativeHandle(ref, () => ({
        openAddHolder: openAddHolderDialog,
        openEditHolder: openEditHolderDialog,
        deleteHolder: handleDeleteHolder, // Expor a função real
        openAddDependent: openAddDependentDialog,
        openEditDependent: openEditDependentDialog,
        deleteDependent: handleDeleteDependent // Expor a função real
    }));

    return (
        <>
            {/* Dialog para Adicionar/Editar Beneficiário */}
            <MainDialog 
                open={isBeneficiaryDialogOpen} 
                onOpenChange={(open) => {
                    // Apenas fechar o diálogo quando o valor muda para false
                    if (!open) {
                        // Adicionar um pequeno delay para evitar problemas com eventos simultâneos
                        setTimeout(() => {
                            closeBeneficiaryDialog();
                        }, 10);
                    }
                }}
            >
                <MainDialogContent className="sm:max-w-[550px]">
                    <MainDialogHeader>
                        <MainDialogTitle>
                            {editingBeneficiary?.data?.id 
                                ? `Editar ${editingBeneficiary.type === 'holder' ? 'Titular' : 'Dependente'}` 
                                : `Adicionar Novo ${editingBeneficiary?.type === 'holder' ? 'Titular' : 'Dependente'}`}
                        </MainDialogTitle>
                        <DialogDescription className="sr-only">
                            Formulário para {editingBeneficiary?.data?.id ? 'editar' : 'adicionar'} {editingBeneficiary?.type === 'holder' ? 'titular' : 'dependente'}.
                        </DialogDescription>
                    </MainDialogHeader>
                    
                    <BeneficiaryDialogForm 
                        formData={beneficiaryFormData} 
                        formType={editingBeneficiary?.type ?? 'holder'} 
                        onFormChange={handleBeneficiaryFormChange} 
                        isLoading={isSavingBeneficiary} 
                    />

                    <MainDialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={closeBeneficiaryDialog} 
                            disabled={isSavingBeneficiary}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="button" 
                            onClick={handleSaveBeneficiary} 
                            disabled={isSavingBeneficiary || !beneficiaryFormData.name || (editingBeneficiary?.type === 'dependent' && !beneficiaryFormData.relationship)}
                        >
                            {isSavingBeneficiary ? "Salvando..." : (editingBeneficiary?.data?.id ? "Atualizar" : "Adicionar")}
                        </Button>
                    </MainDialogFooter>
                </MainDialogContent>
            </MainDialog>
        </>
    );
}); 