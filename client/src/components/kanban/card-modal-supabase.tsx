import React, { useRef, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  History,
  Building2,
  FileSpreadsheet,
  Users,
  MessageSquare,
  CalendarClock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog as MainDialog, DialogContent as MainDialogContent, DialogHeader as MainDialogHeader } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate, getStatusBadge } from "@/lib/utils/proposal-utils";
import { formatPartnerForUI, Partner as PartnerUI } from "@/lib/utils/partner-utils";
import { KanbanComments } from "./KanbanComments";
import KanbanDueDate from "./KanbanDueDate";
import { useProposalDetails } from "@/hooks/use-proposal-details";
import { useKanbanCards } from "@/hooks/use-kanban-cards";
import { useToast } from "@/hooks/use-toast";
import { proposalSchema, ProposalFormData } from "@/lib/schemas/proposalSchema";
import { useAuth } from '@/hooks/use-auth';
import supabase from "../../lib/supabase";
import { Database, KanbanCommentWithProfile } from "@/lib/database.types";
import { CardModalHeader } from "./CardModalHeader";
import ProposalGeneralInfo from "./ProposalGeneralInfo";
import ProposalContractDetails from "./ProposalContractDetails";
import CompanyDataForm from "./CompanyDataForm";
import GracePeriodForm from "./GracePeriodForm";
import StageDataDisplay from './StageDataDisplay';
import BeneficiariesList from "./BeneficiariesList";
import { PartnerDialogManager } from './dialogs/PartnerDialogManager';
import { BeneficiaryDialogManager } from './dialogs/BeneficiaryDialogManager';
import { KanbanCard } from "@/hooks/use-kanban-cards";

// Tipos do Supabase
type PmePartner = Database['public']['Tables']['pme_company_partners']['Row'];
type PmeHolder = Database['public']['Tables']['pme_holders']['Row'];
type PmeDependent = Database['public']['Tables']['pme_dependents']['Row'];

type StageInfo = { id: string; title: string }; 

type CardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  card: KanbanCard; 
  boardId: string; 
  stages: StageInfo[]; 
  partnerDialogRefType: { 
    openAddPartner: () => void; 
    openEditPartner: (partner: PartnerUI) => void;
    deletePartner: (partnerId: string) => Promise<void>;
  } | null;
  beneficiaryDialogRefType: {
    openAddHolder: () => void;
    openEditHolder: (holder: PmeHolder) => void;
    deleteHolder: (holderId: string) => Promise<void>;
    openAddDependent: (holderId: string) => void;
    openEditDependent: (dependent: PmeDependent) => void;
    deleteDependent: (dependentId: string, holderId: string) => Promise<void>;
  } | null;
};

export default function CardModalSupabase({ 
  isOpen, 
  onClose, 
  card, 
  boardId, 
  stages 
}: CardModalProps) { 
  const { toast } = useToast();
  const { deleteCard } = useKanbanCards(boardId);
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  
  // Referências para os gerenciadores de diálogo
  const partnerDialogRef = useRef<CardModalProps['partnerDialogRefType']>(null);
  const beneficiaryDialogRef = useRef<CardModalProps['beneficiaryDialogRefType']>(null);

  // Hook personalizado para gerenciar detalhes da proposta
  const {
    proposalDetails,
    isLoading,
    operatorsList,
    isSearchingCnpj,
    handleCnpjSearch,
  } = useProposalDetails(card.submission_id);

  // --- Busca de Comentários --- 
  const { data: comments, isLoading: isLoadingComments } = useQuery<KanbanCommentWithProfile[]>({
    queryKey: ['kanban_comments', card.id],
    queryFn: async () => {
      if (!card.id) return [];
      
      // 1. Busca os comentários primeiro
      const { data: commentsData, error: commentsError } = await supabase
        .from('kanban_comments')
        .select(`*`)
        .eq('card_id', card.id)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Erro ao buscar comentários:', commentsError);
        toast({ title: "Erro ao buscar comentários", description: commentsError.message, variant: "destructive" });
        throw new Error('Não foi possível buscar os comentários.');
      }
      
      if (!commentsData || commentsData.length === 0) {
        return []; // Retorna vazio se não houver comentários
      }
      
      // 2. Extrai os user_ids únicos dos comentários
      const userIds = Array.from(new Set(commentsData.map(comment => comment.user_id)));
      
      // 3. Busca os perfis correspondentes
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds); // Busca perfis cujos IDs estão na lista
        
      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        // Continua mesmo se falhar em buscar perfis, mas loga o erro
        toast({ title: "Erro ao buscar perfis dos autores", description: profilesError.message, variant: "destructive" });
      }
      
      // 4. Mapeia os perfis para um lookup rápido por ID
      const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]));
      
      // 5. Combina comentários com seus respectivos perfis
      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id) || null // Adiciona o perfil ou null
      }));
      
      return commentsWithProfiles as KanbanCommentWithProfile[]; // Assegura o tipo final
    },
    enabled: !!card.id,
    staleTime: 5 * 60 * 1000,
  });
  // --- Fim da Busca de Comentários ---

  // Configuração do formulário
  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { 
      company_name: card.company_name || "",
      broker_name: null,
      broker_phone: null,
      broker_email: null,
      broker_team_name: null,
      operator_id: undefined,
      operator: card.operator || "",
      plan_name: null,
      modality: null,
      lives: undefined,  // Apenas em pme_contracts
      observacoes: card.observacoes || "", 

      cnpj: null,
      razao_social: null,
      nome_fantasia: null,
      data_abertura: null,
      natureza_juridica: null,
      situacao_cadastral: null,
      cnae: null,
      cnae_descricao: null,
      is_mei: false,
      
      tipo_logradouro: null,
      logradouro: null,
      numero: null,
      complemento: null,
      bairro: null,
      cidade: null,
      uf: null,
      cep: null,

      contract_type: null,
      contract_value: undefined,  // Alterado: usando contract_value para o valor do contrato
      coparticipation: null,
      validity_date: null,
      pre_proposta: null,
      has_grace_period: false,
      grace_reason: null
    }
  });

  // Efeito para preencher o formulário com dados da proposta quando eles carregarem
  useEffect(() => {
    if (proposalDetails) {
      // Usar 'as any' para contornar a verificação de tipo até que a definição de tipo seja atualizada
      const contract = proposalDetails.contract as any;
      
      form.reset({
        company_name: card.company_name || proposalDetails.company?.nome_fantasia || "", 
        broker_name: proposalDetails.submission?.broker_name || null,
        broker_phone: proposalDetails.submission?.broker_phone || null,
        broker_email: proposalDetails.submission?.broker_email || null,
        broker_team_name: proposalDetails.submission?.broker_team_name || null,
        operator_id: proposalDetails.submission?.operator_id ?? undefined,
        operator: proposalDetails.submission?.operator_name || card.operator || null, 
        plan_name: proposalDetails.submission?.plan_name || null,
        modality: proposalDetails.submission?.modality || null,
        lives: contract?.lives ?? undefined,  // Campo lives do contrato
        observacoes: card.observacoes || proposalDetails.grace_period?.reason || "", 

        cnpj: proposalDetails.company?.cnpj || null,
        razao_social: proposalDetails.company?.razao_social || null,
        nome_fantasia: proposalDetails.company?.nome_fantasia || card.company_name || null, 
        data_abertura: proposalDetails.company?.data_abertura || null,
        natureza_juridica: proposalDetails.company?.natureza_juridica_nome || proposalDetails.company?.natureza_juridica || null,
        situacao_cadastral: proposalDetails.company?.situacao_cadastral || null,
        cnae: proposalDetails.company?.cnae || null,
        cnae_descricao: proposalDetails.company?.cnae_descricao || null,
        is_mei: proposalDetails.company?.is_mei || false,
        
        tipo_logradouro: proposalDetails.company?.tipo_logradouro || null,
        logradouro: proposalDetails.company?.logradouro || null,
        numero: proposalDetails.company?.numero || null,
        complemento: proposalDetails.company?.complemento || null,
        bairro: proposalDetails.company?.bairro || null,
        cidade: proposalDetails.company?.cidade || null,
        uf: proposalDetails.company?.uf || null,
        cep: proposalDetails.company?.cep || null,

        contract_type: proposalDetails.contract?.type || null,
        contract_value: contract?.value ?? undefined,  // Usar ?? undefined para consistência
        coparticipation: proposalDetails.contract?.coparticipation || null,
        validity_date: proposalDetails.contract?.validity_date || null,  // Mantido (campo do pme_contracts)
        pre_proposta: proposalDetails.contract?.pre_proposta || null,

        has_grace_period: proposalDetails.grace_period?.has_grace_period ?? false,
        grace_reason: proposalDetails.grace_period?.reason || null
      });
    } else if (isLoading === false) {
      // Se não temos detalhes e o carregamento terminou, apenas usar dados básicos do card
      form.reset({ 
        company_name: card.company_name || "",
        operator_id: undefined,
        operator: card.operator || "",
        lives: undefined,  // Alterado para undefined em vez de null
        observacoes: card.observacoes || "",
        contract_value: undefined, // Adicionado para manter consistência
      });
    }
  }, [proposalDetails, isLoading, card, form]);

  // Função onSubmit para salvar os dados da proposta
  const onSubmit: SubmitHandler<ProposalFormData> = async (formData) => {
    console.log("[onSubmit] Handler chamado com dados:", formData);
    
    if (!userId || !card.submission_id) {
      toast({ title: "Erro", description: "Usuário ou ID da Submissão não encontrado.", variant: "destructive" });
      return;
    }

    // Verificar se operator_id está definido
    if (!formData.operator_id) {
      toast({ 
        title: "Erro de validação", 
        description: "Por favor, selecione uma operadora antes de salvar.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      // 1. Salvar dados principais via RPC
      console.log(`[onSubmit] Chamando RPC 'update_proposal_details' para submission_id: ${card.submission_id}`);
      const { error: rpcError } = await supabase.rpc('update_proposal_details', {
        p_submission_id: card.submission_id,
        p_form_data: formData
      });
      if (rpcError) throw new Error(`Erro do servidor: ${rpcError.message}`);
      console.log("[onSubmit] RPC 'update_proposal_details' executada com sucesso.");

      // 2. Atualizar cache local de proposalDetails
      try {
        const cacheKey = `proposal_details_${card.submission_id}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          const parsedCache = JSON.parse(cachedData);
          // Atualizar os dados relevantes no cache
          const updatedCache = {
            ...parsedCache,
            data: {
              ...parsedCache.data,
              // Atualizar apenas os campos que foram alterados
              submission: {
                ...parsedCache.data.submission,
                operator_id: formData.operator_id,
                plan_name: formData.plan_name,
                modality: formData.modality
              },
              company: {
                ...parsedCache.data.company,
                nome_fantasia: formData.nome_fantasia,
                razao_social: formData.razao_social,
                cnpj: formData.cnpj
              },
              contract: {
                ...parsedCache.data.contract,
                value: formData.contract_value,
                lives: formData.lives,
                validity_date: formData.validity_date,
                coparticipation: formData.coparticipation,
                type: formData.contract_type
              },
              grace_period: {
                ...parsedCache.data.grace_period,
                has_grace_period: formData.has_grace_period,
                reason: formData.grace_reason
              }
            },
            timestamp: Date.now()
          };
          
          localStorage.setItem(cacheKey, JSON.stringify(updatedCache));
          console.log("[onSubmit] Cache local atualizado com sucesso");
          
          // Atualizar o estado sem fazer nova requisição
          // setProposalDetails(updatedCache.data);
        }
      } catch (cacheError) {
        console.warn("[onSubmit] Erro ao atualizar cache:", cacheError);
      }

      // 3. Notificação de sucesso 
      toast({ title: "Proposta atualizada com sucesso!" }); 
      console.log("[onSubmit] Toast de sucesso exibido.");

      // INVALIDE A QUERY AQUI TAMBÉM APÓS SUCESSO DO SUBMIT PRINCIPAL
      const queryKey = ['proposalDetails', card.submission_id];
      queryClient.invalidateQueries({ queryKey });

    } catch (error: any) {
      console.error("[onSubmit] Erro ao salvar proposta:", error);
      toast({
        title: "Erro ao Salvar",
        description: `Não foi possível salvar as alterações: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
   console.log("[onSubmit] Finalizado.");
  };

  // Função para excluir o card
  const handleDelete = () => {
    deleteCard(card.id, { 
      onSuccess: () => {
        toast({
          title: "Cartão excluído",
          description: "O cartão foi excluído com sucesso"
        });
        onClose();
      },
      onError: (error: Error) => {
        toast({
          title: "Erro ao excluir cartão",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  // Obter informações para o badge de status
  const currentStatus = proposalDetails?.submission?.status;
  const statusBadgeInfo = getStatusBadge(currentStatus);

  // Função para controlar a abertura/fechamento do Dialog PRINCIPAL
  const handleMainDialogOpenChange = (open: boolean) => {
    console.log(`[CardModal] handleMainDialogOpenChange called with open = ${open}`);
    if (!open) {
      console.log("[CardModal] Main dialog is closing, calling onClose().");
      onClose(); 
    }
  };

  // --- Funções de Callback para Refetch --- 
  const queryKey = ['proposalDetails', card.submission_id];

  const handlePartnerChange = () => {
    console.log("[Callback] Refetching query após mudança de sócio:", queryKey);
    queryClient.refetchQueries({ queryKey, exact: true }); // Usar refetchQueries
  }

  const handlePartnerDeletion = () => {
     console.log("[Callback] Refetching query após exclusão de sócio:", queryKey);
     queryClient.refetchQueries({ queryKey, exact: true }); // Usar refetchQueries
  }

  const handleHolderChange = () => {
    console.log("[Callback] Refetching query após mudança de titular:", queryKey);
    queryClient.refetchQueries({ queryKey, exact: true }); // Usar refetchQueries
  }

  const handleHolderDeletion = () => {
     console.log("[Callback] Exclusão de titular OK, agendando refetch para:", queryKey);
     // Manter o delay por causa da visibilidade da transação, mas usar refetch
     setTimeout(() => {
        console.log("[Callback] Executando refetch de query após delay:", queryKey);
        queryClient.refetchQueries({ queryKey, exact: true }); // Usar refetchQueries
     }, 200); 
  }

  const handleDependentChange = () => {
     console.log("[Callback] Refetching query após mudança de dependente:", queryKey);
     queryClient.refetchQueries({ queryKey, exact: true }); // Usar refetchQueries
  }

  const handleDependentDeletion = () => {
    console.log("[Callback] Exclusão de dependente OK, agendando refetch para:", queryKey);
    // Manter o delay por causa da visibilidade da transação, mas usar refetch
    setTimeout(() => {
        console.log("[Callback] Executando refetch de query após delay:", queryKey);
        queryClient.refetchQueries({ queryKey, exact: true }); // Usar refetchQueries
     }, 200); 
  }

  // --- Fim das Funções de Callback --- 

  // Handlers para abrir diálogos de sócio/beneficiário
  const openAddPartnerDialog = () => {
    partnerDialogRef.current?.openAddPartner();
  };

  const openEditPartnerDialog = (partner: any) => {
    partnerDialogRef.current?.openEditPartner(formatPartnerForUI(partner));
  };

  const handleDeletePartner = (partnerId: string) => {
    partnerDialogRef.current?.deletePartner(partnerId);
  };

  const openAddHolderDialog = () => {
    beneficiaryDialogRef.current?.openAddHolder();
  };

  const openEditHolderDialog = (holder: PmeHolder) => {
    beneficiaryDialogRef.current?.openEditHolder(holder);
  };

  const handleDeleteHolder = (holderId: string) => {
    beneficiaryDialogRef.current?.deleteHolder(holderId);
  };

  const openAddDependentDialog = (holderId: string) => {
    beneficiaryDialogRef.current?.openAddDependent(holderId);
  };

  const openEditDependentDialog = (dependent: PmeDependent) => {
    beneficiaryDialogRef.current?.openEditDependent(dependent);
  };

  const handleDeleteDependent = (dependentId: string, holderId?: string) => {
    if (holderId) {
      beneficiaryDialogRef.current?.deleteDependent(dependentId, holderId);
    } else {
      // Caso de fallback se não tiver holderId
      console.warn('Tentativa de excluir dependente sem holderId');
      toast({ 
        title: "Aviso", 
        description: "ID do titular não especificado para este dependente." 
      });
    }
  };

  // Encontrar o título da etapa atual
  const currentStageName = stages.find(stage => stage.id === card.stage_id)?.title || "Etapa Desconhecida";

  return (
    <>
      <MainDialog open={isOpen} onOpenChange={handleMainDialogOpenChange}>
        <MainDialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto"> 
          <MainDialogHeader>
            <CardModalHeader 
              title={form.watch("razao_social") || form.watch("company_name") || "Detalhes da Proposta"}
              statusBadge={statusBadgeInfo}
              brokerInfo={{
                name: form.watch("broker_name"),
                team_name: form.watch("broker_team_name"),
                phone: form.watch("broker_phone"),
                email: form.watch("broker_email")
              }}
              isSubmitting={form.formState.isSubmitting}
              isDirty={form.formState.isDirty}
              onSubmit={form.handleSubmit(onSubmit)}
              onDelete={handleDelete}
            />
          </MainDialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div className="md:col-span-2">
              {isLoading ? (
                <div className="space-y-6">
                  <div>
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                      <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                      <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                    </div>
                  </div>
                  <div>
                    <Skeleton className="h-6 w-1/3 mt-6 mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                      <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                      <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                    </div>
                    <Skeleton className="h-5 w-1/4 mt-4 mb-2" />
                    <Skeleton className="h-10 w-full mb-2" />
                    <Skeleton className="h-10 w-full mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <ProposalGeneralInfo control={form.control} operatorsList={operatorsList} />

                    <CompanyDataForm 
                      control={form.control} 
                      onCnpjSearch={handleCnpjSearch} 
                      isSearchingCnpj={isSearchingCnpj}
                      partners={(proposalDetails?.partners || []).map((p: any) => formatPartnerForUI(p)) as any}
                      companyId={proposalDetails?.company?.id || null}
                      onOpenAddPartner={openAddPartnerDialog}
                      onOpenEditPartner={openEditPartnerDialog}
                      onDeletePartner={handleDeletePartner}
                      isPartnerActionLoading={false}
                    />

                    <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-slate-100 to-slate-200">
                        <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                          <Users className="mr-2 h-5 w-5 text-primary/80" />
                          Beneficiários
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <BeneficiariesList 
                          holders={proposalDetails?.holders} 
                          onAddHolder={openAddHolderDialog}
                          onEditHolder={openEditHolderDialog}
                          onDeleteHolder={handleDeleteHolder}
                          onAddDependent={openAddDependentDialog}
                          onEditDependent={openEditDependentDialog}
                          onDeleteDependent={handleDeleteDependent}
                          isLoading={false}
                        />
                      </CardContent>
                    </Card>

                    <ProposalContractDetails control={form.control} />

                    <GracePeriodForm control={form.control} operatorsList={operatorsList} />

                    <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-slate-100 to-slate-200">
                        <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                          <FileText className="mr-2 h-5 w-5 text-primary/80" />
                          Observações Gerais
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <FormField
                          control={form.control}
                          name="observacoes"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  rows={4} 
                                  {...field} 
                                  placeholder="Anotações gerais sobre a proposta, negociação, próximos passos..." 
                                  value={field.value || ''}
                                  className="min-h-[120px] resize-none transition-all duration-200 focus-visible:ring-primary/80 focus-visible:border-primary/50" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden">
                      <CardHeader className="border-b bg-muted/30 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <History className="h-4 w-4 text-muted-foreground" />
                          Histórico
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Criado em: {card.created_at ? formatDate(card.created_at) : 'N/A'}</p> 
                          <p>Última Atualização: {proposalDetails?.submission?.updated_at ? formatDate(proposalDetails.submission.updated_at) : (card.updated_at ? formatDate(card.updated_at) : 'N/A')}</p> 
                        </div>
                      </CardContent>
                    </Card>
                  </form>
                </Form>
              )}
            </div>
            
            {/* Coluna da direita (Dados da Etapa e Comentários) */}
            <div className="md:col-span-1 flex flex-col gap-6">
              {/* Card Data de Vencimento (usando o novo componente) */}
              {card && card.id && boardId ? (
                <KanbanDueDate 
                  cardId={card.id} 
                  boardId={boardId} 
                  initialDueDate={card.due_date} 
                  initialStatus={card.due_date_status} 
                />
              ) : (
                // Placeholder ou Skeleton se cardId/boardId não estiverem disponíveis
                <div className="p-4 bg-gradient-to-b from-muted/60 to-muted/30 rounded-md border shadow-sm h-fit">
                   <Skeleton className="h-6 w-1/2 mb-4" />
                   <Skeleton className="h-10 w-full mb-2" />
                   <Skeleton className="h-5 w-1/3" />
                </div>
              )}
              
              {/* Seção Dados da Etapa */}
              <div className="p-4 bg-gradient-to-b from-muted/60 to-muted/30 rounded-md border shadow-sm h-fit">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  {currentStageName} 
                </h3>
                <div className="space-y-3">
                  {card.id && card.stage_id ? (
                    <StageDataDisplay cardId={card.id} stageId={card.stage_id} />
                  ) : (
                    <div className="text-sm text-muted-foreground italic p-3 bg-muted rounded-md text-center">
                      {isLoading ? <Skeleton className="h-5 w-3/4 mx-auto" /> : "Informações da etapa não disponíveis."}
                    </div>
                  )}
                </div>
              </div>

              {/* Seção de Comentários movida para cá */}
              <div className="p-4 bg-gradient-to-b from-muted/60 to-muted/30 rounded-md border shadow-sm h-fit">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Comentários
                </h3>
                {card.id && userId ? (
                   <KanbanComments cardId={card.id} userId={userId} />
                ) : (
                  <div className="text-sm text-muted-foreground italic p-3 bg-muted rounded-md text-center">
                    Carregando comentários...
                  </div>
                )}
              </div>
            </div>
          </div>
        </MainDialogContent>
      </MainDialog>

      {/* Componentes de diálogo encapsulados */}
      <PartnerDialogManager 
        ref={partnerDialogRef} 
        companyId={proposalDetails?.company?.id || null}
        onPartnerUpdated={handlePartnerChange}
        onPartnerDeleted={handlePartnerDeletion}
      />

      <BeneficiaryDialogManager 
        ref={beneficiaryDialogRef} 
        submissionId={card.submission_id}
        onHolderUpdated={handleHolderChange}
        onHolderDeleted={handleHolderDeletion}
        onDependentUpdated={handleDependentChange}
        onDependentDeleted={handleDependentDeletion}
      />
    </>
  );
} 