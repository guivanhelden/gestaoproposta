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
import PartnerDialogForm, { PartnerFormData } from '../PartnerDialogForm';
import { Partner } from "@/lib/utils/partner-utils";
import supabase from "@/lib/supabase";
import { Database } from "@/lib/database.types";

// Tipo para PmePartner do Supabase
type PmePartner = Database['public']['Tables']['pme_company_partners']['Row'];

// Valores padrão para o formulário de sócio
const defaultPartnerFormData: PartnerFormData = {
  nome: '',
  email: '',
  telefone: '',
  is_responsavel: false,
};

interface PartnerDialogManagerProps {
    companyId: string | null;
    onPartnerUpdated: (partner: PmePartner, isNew: boolean) => void;
    onPartnerDeleted: (partnerId: string) => void;
}

// 1. Envolver com forwardRef
export const PartnerDialogManager = forwardRef<any, PartnerDialogManagerProps>(({ companyId, onPartnerUpdated, onPartnerDeleted }, ref) => {
    const { toast } = useToast();
    const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
    const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
    const [partnerFormData, setPartnerFormData] = useState<PartnerFormData>(defaultPartnerFormData);
    const [isSavingPartner, setIsSavingPartner] = useState(false);

    // Abrir Dialog para ADICIONAR sócio
    const openAddPartnerDialog = () => {
        console.log("[PartnerDialogManager] openAddPartnerDialog called");
        setEditingPartnerId(null);
        setPartnerFormData(defaultPartnerFormData);
        setIsPartnerDialogOpen(true);
    };

    // Abrir Dialog para EDITAR sócio
    const openEditPartnerDialog = (partner: Partner) => {
        console.log("[PartnerDialogManager] openEditPartnerDialog called for:", partner);
        setEditingPartnerId(partner.id);
        setPartnerFormData({
            nome: partner.nome || '',
            email: partner.email || '',
            telefone: partner.telefone || '',
            is_responsavel: Boolean(partner.is_responsavel)
        });
        setIsPartnerDialogOpen(true);
    };

    // Fechar Dialog
    const closePartnerDialog = () => {
        console.log("[PartnerDialogManager] closePartnerDialog called");
        setIsPartnerDialogOpen(false);
    };

    // Handler para atualizar o estado do formulário do sócio
    const handlePartnerFormChange = (field: keyof PartnerFormData, value: any) => {
        setPartnerFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Função para SALVAR (criar ou atualizar) sócio
    const handleSavePartner = async () => {
        if (!companyId) {
            toast({ title: "Erro", description: "ID da empresa não encontrado.", variant: "destructive" });
            return;
        }
        if (!partnerFormData.nome || partnerFormData.nome.trim().length < 3) {
            toast({ title: "Erro", description: "Nome do sócio inválido.", variant: "destructive" });
            return;
        }
        
        setIsSavingPartner(true);
        try {
            const dataToSave = {
                // Se estiver editando, incluir o ID no payload do upsert
                ...(editingPartnerId && { id: editingPartnerId }), 
                nome: partnerFormData.nome.trim(),
                email: partnerFormData.email || null,
                telefone: partnerFormData.telefone || null,
                is_responsavel: partnerFormData.is_responsavel,
                // company_id só é necessário se for um INSERT, mas vamos manter por segurança
                // ou podemos omitir se o upsert der erro de coluna inexistente no update.
                company_id: companyId, 
                is_active: true
            };
            
            let savedPartnerData: PmePartner | null = null;
            let rpcError = null;

            console.log(`[PartnerDialogManager] Tentando ${editingPartnerId ? 'UPSERT (via POST)' : 'INSERT (POST)'} para partner ID: ${editingPartnerId || 'novo'}`);
            
            // Usar upsert em vez de insert/update separados
            const { data, error } = await supabase
                .from('pme_company_partners')
                .upsert([dataToSave], { 
                    onConflict: 'id', // Usar o ID como chave de conflito
                 // ignoreDuplicates: false, // O padrão já é false, o que significa update no conflito
                })
                .select()
                .single();

            rpcError = error;
            savedPartnerData = data;

            if (rpcError) throw rpcError;
            
            if (editingPartnerId) {
                toast({ title: "Sucesso", description: "Sócio atualizado." });
            } else {
                toast({ title: "Sucesso", description: "Sócio adicionado." });
            }

            // Notificar o componente pai sobre a atualização/adição
            if (savedPartnerData) {
                onPartnerUpdated(savedPartnerData, !editingPartnerId);
            }

            closePartnerDialog(); // Fecha o dialog após sucesso

        } catch (error: any) {
            console.error('Erro ao salvar sócio (via upsert/insert):', error);
            toast({ title: "Erro", description: `Falha ao salvar sócio: ${error.message}`, variant: "destructive" });
        } finally {
            setIsSavingPartner(false);
        }
    };

    // Função para EXCLUIR sócio
    const handleDeletePartner = async (partnerId: string) => {
        if (!confirm('Tem certeza que deseja excluir este sócio?')) return;
        
        setIsSavingPartner(true);
        try {
            const { error } = await supabase
                .from('pme_company_partners')
                .delete()
                .eq('id', partnerId);
            if (error) throw error;
            
            // Notificar o componente pai sobre a exclusão
            onPartnerDeleted(partnerId);
            
            toast({ title: "Sucesso", description: "Sócio excluído." });
        } catch (error: any) {
            console.error('Erro ao excluir sócio:', error);
            toast({ title: "Erro", description: `Falha ao excluir sócio: ${error.message}`, variant: "destructive" });
        } finally {
            setIsSavingPartner(false);
        }
    };

    // 2. Usar useImperativeHandle para expor as funções
    useImperativeHandle(ref, () => ({
        openAddPartner: openAddPartnerDialog,
        openEditPartner: openEditPartnerDialog,
        deletePartner: handleDeletePartner // Expor a função de delete diretamente
    }));

    // Título do diálogo baseado na ação (adicionar ou editar)
    const dialogTitle = editingPartnerId ? "Editar Sócio" : "Adicionar Sócio";

    return (
        <>
            {/* 3. Remover a div com botões escondidos */}
            {/* <div className="hidden">
                <button data-testid="add-partner-trigger" onClick={openAddPartnerDialog} />
                <button data-testid="edit-partner-trigger" onClick={() => {}} />
                <button data-testid="delete-partner-trigger" onClick={() => {}} />
            </div> */}

            {/* Dialog para Adicionar/Editar Sócio */}
            <MainDialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
                <MainDialogContent className="max-w-md">
                    <MainDialogHeader>
                        <MainDialogTitle>{dialogTitle}</MainDialogTitle>
                        <DialogDescription>
                            {editingPartnerId ? "Modifique os dados do sócio abaixo." : "Preencha os dados para adicionar um novo sócio."}
                        </DialogDescription>
                    </MainDialogHeader>
                    <PartnerDialogForm 
                        formData={partnerFormData} 
                        onFormChange={handlePartnerFormChange} 
                        isLoading={isSavingPartner} 
                        formId="partner-dialog-form"
                    />

                    <MainDialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={closePartnerDialog} 
                            disabled={isSavingPartner}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="button" 
                            onClick={handleSavePartner} 
                            disabled={isSavingPartner || !partnerFormData.nome}
                        >
                            {isSavingPartner ? "Salvando..." : (editingPartnerId ? "Atualizar" : "Adicionar")}
                        </Button>
                    </MainDialogFooter>
                </MainDialogContent>
            </MainDialog>
        </>
    );
}); 