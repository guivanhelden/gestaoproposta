import React, { useRef, useEffect, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  History,
  Building2,
  FileSpreadsheet,
  Users,
  MessageSquare,
  CalendarClock,
  AlertCircle,
  MessageCircle,
  Loader2
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog as MainDialog, DialogHeader as MainDialogHeader } from "@/components/ui/dialog";
import { DialogContent as BaseDialogContent } from "@/components/ui/dialog";

// DialogContent personalizado para resolver problemas de z-index e overflow com dropdowns
const MainDialogContent = React.forwardRef<
  React.ElementRef<typeof BaseDialogContent>,
  React.ComponentPropsWithoutRef<typeof BaseDialogContent>
>(({ className, ...props }, ref) => (
  <BaseDialogContent
    ref={ref}
    className={cn("overflow-visible", className)}
    style={{ zIndex: 50 }}
    {...props}
  />
));
MainDialogContent.displayName = "MainDialogContent";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate, getStatusBadge } from "@/lib/utils/proposal-utils";
import { cn } from "@/lib/utils";
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

  // Encontrar o sócio responsável (usando useMemo)
  const partnersList = useMemo(() => 
    (proposalDetails?.partners || []).map((p: any) => formatPartnerForUI(p)), 
    [proposalDetails?.partners]
  );
  const responsiblePartner = useMemo(() => 
    partnersList.find(p => p.is_responsavel), 
    [partnersList]
  );

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
                      partners={partnersList}
                      companyId={proposalDetails?.company?.id || null}
                      onOpenAddPartner={openAddPartnerDialog}
                      onOpenEditPartner={openEditPartnerDialog}
                      onDeletePartner={handleDeletePartner}
                      isPartnerActionLoading={false}
                      responsiblePartner={responsiblePartner || null}
                    />

                    <Card className="relative overflow-hidden border-border/50 bg-card/50" 
                          style={{ boxShadow: "0 4px 20px -5px rgba(0, 4, 255, 0.28), 0 2px 10px -5px rgba(45, 8, 255, 0.32)" }}>
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400/30 via-blue-500/60 to-blue-400/30"></div>
                      
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-500/10 text-blue-500">
                              <Users className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-base font-medium text-foreground/90">
                              Beneficiários
                            </CardTitle>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Titulares e Dependentes
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-2">
                          Cadastro de titulares e seus dependentes para o plano
                        </CardDescription>
                        <Separator className="mt-2" />
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

                    <Card className="relative overflow-hidden border-border/50 bg-card/50" 
                          style={{ boxShadow: "0 4px 20px -5px rgba(34, 197, 94, 0.28), 0 2px 10px -5px rgba(74, 222, 128, 0.32)" }}>
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400/30 via-green-500/60 to-green-400/30"></div>
                      
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-green-500/10 text-green-500">
                              <FileText className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-base font-medium text-foreground/90">
                              Observações Gerais
                            </CardTitle>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Anotações
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-2">
                          Anotações gerais e observações sobre o processo da proposta
                        </CardDescription>
                        <Separator className="mt-2" />
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
                                  className="min-h-[120px] resize-none transition-all duration-200 focus-visible:ring-green-500/80 focus-visible:border-green-500/50" 
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
              <div className="relative overflow-hidden rounded-lg border border-border/50 shadow-sm bg-gradient-to-b from-card to-background">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30"></div>
                
                <div className="p-4 pt-5">
                  <h3 className="font-medium text-base mb-4 flex items-center gap-2 text-foreground/90">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary">
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                    </div>
                    <span>{currentStageName}</span>
                    <Badge variant="outline" className="ml-auto text-xs font-normal">
                      Etapa Atual
                    </Badge>
                  </h3>
                  
                  <div>
                    {card.id && card.stage_id ? (
                      <StageDataDisplay cardId={card.id} stageId={card.stage_id} />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-md border border-border/50 text-center space-y-2">
                        {isLoading ? (
                          <>
                            <Skeleton className="h-5 w-3/4 mx-auto mb-2" />
                            <Skeleton className="h-4 w-2/4 mx-auto" />
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">Informações da etapa não disponíveis.</p>
                            <p className="text-xs text-muted-foreground/70">Verifique se o cartão está associado a uma etapa válida.</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção de Comentários */}
              <div className="h-fit">
                {card.id && userId ? (
                  <KanbanComments cardId={card.id} userId={userId} />
                ) : (
                  <Card className="border border-border/50 bg-card/50 overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </div>
                        <h3 className="font-medium text-sm">Comentários</h3>
                      </div>
                    </div>
                    <div className="p-10 flex flex-col items-center justify-center">
                      {isLoading ? (
                        <div className="space-y-3 w-full max-w-sm">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1 flex-1">
                              <Skeleton className="h-4 w-28" />
                              <Skeleton className="h-3 w-14" />
                            </div>
                          </div>
                          <Skeleton className="h-20 w-full" />
                        </div>
                      ) : (
                        <>
                          <Loader2 className="h-8 w-8 text-muted-foreground mb-3 animate-spin opacity-70" />
                          <p className="text-muted-foreground text-sm">Carregando comentários...</p>
                        </>
                      )}
                    </div>
                  </Card>
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