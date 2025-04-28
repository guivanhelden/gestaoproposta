import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod"; 
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Trash,
  Users, 
  Phone,
  Mail,
  Clock,
  Check,
  X,
  Search,
  CalendarRange,
  FileText,
  User,
  Calendar,
  Shield,
  FileSpreadsheet,
  History,
  Building2,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog as MainDialog, DialogContent as MainDialogContent, DialogHeader as MainDialogHeader, DialogTitle as MainDialogTitle, DialogFooter as MainDialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription as ShadAlertDialogDescription,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import BeneficiariesList from "./BeneficiariesList";
import ProposalGeneralInfo from "./ProposalGeneralInfo";
import ProposalContractDetails from "./ProposalContractDetails";
import CompanyDataForm, { Partner } from "./CompanyDataForm";
import GracePeriodForm from "./GracePeriodForm";
import StageDataDisplay from './StageDataDisplay';
import PartnerDialogForm, { PartnerFormData } from './PartnerDialogForm';
import BeneficiaryDialogForm, { BeneficiaryFormData } from './BeneficiaryDialogForm';

import { KanbanCard, KanbanCardUpdate } from "@/hooks/use-kanban-cards";
import { useKanbanCards } from "@/hooks/use-kanban-cards";
import { useToast } from "@/hooks/use-toast";
import { fetchProposalDetails, fetchOperators, OperatorInfo, ProposalDetails } from "../../lib/api";
import { proposalSchema, ProposalFormData } from "@/lib/schemas/proposalSchema";
import { useAuth } from '@/hooks/use-auth';
import supabase from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Usar o tipo PmePartner da Database
type PmePartner = Database['public']['Tables']['pme_company_partners']['Row'];
type PmeHolder = Database['public']['Tables']['pme_holders']['Row'];
type PmeDependent = Database['public']['Tables']['pme_dependents']['Row'];

type CardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  card: KanbanCard; 
  boardId: string; 
};

const getStatusBadge = (status: string | null | undefined): { variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"; text: string; icon?: any } => {
  if (!status) {
    return { variant: "outline", text: "Pendente", icon: "clock" };
  }

  switch (status.toLowerCase()) {
    case "aprovado":
    case "approved":
      return { variant: "success", text: "Aprovado", icon: "check" };
    case "recusado":
    case "rejected":
    case "declined":  
      return { variant: "destructive", text: "Recusado", icon: "x" };
    case "pendente":
    case "pending":
      return { variant: "warning", text: "Pendente", icon: "clock" };
    case "em análise":
    case "analyzing":
      return { variant: "secondary", text: "Em Análise", icon: "search" };
    default:
      return { variant: "secondary", text: status };
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Valores padrão para o formulário de sócio
const defaultPartnerFormData: PartnerFormData = {
  nome: '',
  email: '',
  telefone: '',
  is_responsavel: false,
};

const defaultBeneficiaryFormData: BeneficiaryFormData = {
  name: '',
  cpf: '',
  birth_date: null,
  email: '',
  phone: '',
  relationship: '',
};

export default function CardModalSupabase({ isOpen, onClose, card, boardId }: CardModalProps) { 
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { deleteCard } = useKanbanCards(boardId);
  const { user } = useAuth();
  const userId = user?.id;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [proposalDetails, setProposalDetails] = useState<ProposalDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [operatorsList, setOperatorsList] = useState<OperatorInfo[]>([]);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);

  // Estados para o Dialog de Sócios (MOVIDOS PARA CÁ)
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null); 
  const [partnerFormData, setPartnerFormData] = useState<PartnerFormData>(defaultPartnerFormData);
  const [isSavingPartner, setIsSavingPartner] = useState(false); // Loading específico para salvar sócio

  // Estados para o Dialog de Beneficiários
  const [isBeneficiaryDialogOpen, setIsBeneficiaryDialogOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<{type: 'holder' | 'dependent', data: PmeHolder | PmeDependent, holderId?: string} | null>(null);
  const [beneficiaryFormData, setBeneficiaryFormData] = useState<BeneficiaryFormData>(defaultBeneficiaryFormData);
  const [isSavingBeneficiary, setIsSavingBeneficiary] = useState(false); // Loading específico

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { 
        company_name: card.company_name || "",
        broker_name: null,
        broker_phone: null,
        broker_email: null,
        broker_team_name: null,
        operator_id: null,
        operator: card.operator || "",
        plan_name: null,
        modality: null,
        lives: card.lives, 
        value: card.value ?? 0,
        due_date: card.due_date || null, 
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
        coparticipation: null,
        validity_date: null,
        pre_proposta: null,
        has_grace_period: false,
        grace_reason: null,
    }
  });

  const formatDate = (dateString: string | null | undefined): string | null => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
      try {
        const [year, month, day] = dateString.split('-').map(Number);
        return format(new Date(year, month - 1, day), "dd/MM/yyyy", { locale: ptBR });
      } catch (innerE) {
        console.error("Erro ao formatar data:", dateString, innerE);
        return dateString;
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      const loadOperators = async () => {
        try {
          const operators = await fetchOperators();
          setOperatorsList(operators);
        } catch (error: any) {
          console.error("Erro ao buscar operadoras:", error);
        }
      };
      loadOperators();
    }
  }, [isOpen]);

  useEffect(() => {
    const loadDetails = async () => {
      console.log(`[CardModal] useEffect loadDetails running. isOpen: ${isOpen}, submission_id: ${card.submission_id}`);
      
      if (isOpen && card.submission_id) { 
        setIsLoading(true);
        setProposalDetails(null);
        try {
          console.log(`[CardModal] Iniciando busca para submission_id: ${card.submission_id}`); 
          const data = await fetchProposalDetails(card.submission_id); 
          console.log("[CardModal] Detalhes recebidos no componente:", data);

          if (!data) {
            console.warn("[CardModal] fetchProposalDetails retornou null, mas não houve erro.");
            form.reset({ 
              company_name: card.company_name || "",
              operator: card.operator || "",
              lives: card.lives,
              value: card.value ?? 0,
              due_date: card.due_date || null,
              observacoes: card.observacoes || "",
            });
            setIsLoading(false);
            return;
          }

          console.log("[CardModal] Detalhes recebidos:", data);
          setProposalDetails(data); // Define o estado principal com os dados da API
          form.reset({
            company_name: card.company_name || data.company?.nome_fantasia || "", 
            broker_name: data.submission?.broker_name || null,
            broker_phone: data.submission?.broker_phone || null,
            broker_email: data.submission?.broker_email || null,
            broker_team_name: data.submission?.broker_team_name || null,
            operator_id: data.submission?.operator_id || null,
            operator: data.submission?.operator_name || card.operator || null, 
            plan_name: data.submission?.plan_name || null,
            modality: data.submission?.modality || null,
            lives: card.lives, 
            value: data.contract?.value ?? card.value ?? 0,
            due_date: data.contract?.validity_date || card.due_date || null, 
            observacoes: card.observacoes || data.grace_period?.reason || "", 

            cnpj: data.company?.cnpj || null,
            razao_social: data.company?.razao_social || null,
            nome_fantasia: data.company?.nome_fantasia || card.company_name || null, 
            data_abertura: data.company?.data_abertura || null,
            natureza_juridica: data.company?.natureza_juridica_nome || data.company?.natureza_juridica || null,
            situacao_cadastral: data.company?.situacao_cadastral || null,
            cnae: data.company?.cnae || null,
            cnae_descricao: data.company?.cnae_descricao || null,
            is_mei: data.company?.is_mei || false,
            
            tipo_logradouro: data.company?.tipo_logradouro || null,
            logradouro: data.company?.logradouro || null,
            numero: data.company?.numero || null,
            complemento: data.company?.complemento || null,
            bairro: data.company?.bairro || null,
            cidade: data.company?.cidade || null,
            uf: data.company?.uf || null,
            cep: data.company?.cep || null,

            contract_type: data.contract?.type || null,
            coparticipation: data.contract?.coparticipation || null,
            validity_date: data.contract?.validity_date || card.due_date || null, 
            pre_proposta: data.contract?.pre_proposta || null,

            has_grace_period: data.grace_period?.has_grace_period ?? false,
            grace_reason: data.grace_period?.reason || null
          });
          
        } catch (error) {
          console.error("[CardModal] Erro ao buscar detalhes da proposta:", error);
          toast({
            title: "Erro ao carregar dados",
            description: "Não foi possível buscar os detalhes da proposta. Tente novamente.",
            variant: "destructive"
          });
          form.reset({ 
            company_name: card.company_name || "",
            operator_id: null,
            operator: card.operator || "",
            lives: card.lives,
            value: card.value ?? 0,
            due_date: card.due_date || null,
            observacoes: card.observacoes || "",
          });
        } finally {
          setIsLoading(false);
          console.log(`[CardModal] useEffect loadDetails finished.`);
        }
      }
    };

    loadDetails();

  }, [isOpen, card.submission_id, toast]);

  // Função onSubmit PRINCIPAL - TESTE: RPC Ativa, Invalidação Comentada
  const onSubmit: SubmitHandler<ProposalFormData> = async (formData) => {
    console.log("[onSubmit] Handler chamado por react-hook-form com dados:", formData);
    
    if (!userId || !card.submission_id) {
      toast({ title: "Erro", description: "Usuário ou ID da Submissão não encontrado.", variant: "destructive" });
      return;
    }

    try {
      // 1. Salvar dados principais via RPC (ATIVADO)
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
                value: formData.value,
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
          setProposalDetails(updatedCache.data);
        }
      } catch (cacheError) {
        console.warn("[onSubmit] Erro ao atualizar cache:", cacheError);
      }

      // 3. Notificação de sucesso 
      toast({ title: "Proposta atualizada com sucesso!" }); 
      console.log("[onSubmit] Toast de sucesso exibido.");

    } catch (error: any) {
      console.error("[onSubmit] Erro ao salvar proposta:", error);
      toast({
        title: "Erro ao Salvar",
        description: `Não foi possível salvar as alterações: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
   console.log("[onSubmit] Finalizado."); // Atualizar log final
  };

  const handleDelete = () => {
      setIsDeleteDialogOpen(false); 
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

  const currentStatus = proposalDetails?.submission?.status;
  const statusBadgeInfo = getStatusBadge(currentStatus);

  const handleCnpjSearch = async (cnpj: string) => {
    console.log("Buscando CNPJ:", cnpj);
    setIsSearchingCnpj(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({ title: "Busca CNPJ", description: "Funcionalidade ainda não implementada." });
    setIsSearchingCnpj(false);
  };

  // --- Funções de Controle do Dialog/CRUD de Sócios (MOVIDAS PARA CÁ) ---

  // Abrir Dialog para ADICIONAR sócio
  const openAddPartnerDialog = () => {
    console.log("[CardModal] openAddPartnerDialog called");
    setEditingPartnerId(null);
    setPartnerFormData(defaultPartnerFormData);
    setIsPartnerDialogOpen(true);
  };

  // Abrir Dialog para EDITAR sócio
  const openEditPartnerDialog = (partner: Partner) => {
    console.log("[CardModal] openEditPartnerDialog called for:", partner);
    setEditingPartnerId(partner.id); 
    setPartnerFormData({ // Preenche o formulário
      nome: partner.nome || '',
      email: partner.email || '',
      telefone: partner.telefone || '',
      is_responsavel: Boolean(partner.is_responsavel)
    });
    setIsPartnerDialogOpen(true); 
  };

  // Fechar Dialog
  const closePartnerDialog = () => {
    console.log("[CardModal] closePartnerDialog called");
    setIsPartnerDialogOpen(false);
    // Não precisa resetar aqui, reseta ao abrir
  };

  // Handler para atualizar o estado do formulário do sócio
  const handlePartnerFormChange = (field: keyof PartnerFormData, value: any) => {
      setPartnerFormData(prev => ({
          ...prev,
          [field]: value
      }));
  };

  // Função para converter PmePartner (do Supabase) para Partner (da UI)
  const formatPartnerForUI = (p: any): Partner => ({
      ...p,
      id: String(p.id),
      company_id: String(p.company_id || ''),
      nome: p.nome || '', // Garantir que nunca é null
      is_responsavel: Boolean(p.is_responsavel),
      // Incluir outros campos da interface Partner, mesmo que sejam null/undefined em PmePartner
      email: p.email,
      telefone: p.telefone,
      created_at: p.created_at,
      updated_at: p.updated_at,
      is_active: p.is_active,
      incluir_como_titular: p.incluir_como_titular
  });

  // Função para SALVAR (criar ou atualizar) sócio
  const handleSavePartner = async () => {
    const companyId = proposalDetails?.company?.id;
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
        nome: partnerFormData.nome.trim(),
        email: partnerFormData.email || null,
        telefone: partnerFormData.telefone || null,
        is_responsavel: partnerFormData.is_responsavel,
        company_id: companyId,
        is_active: true
      };
      
      let savedPartnerData: PmePartner | null = null;

      if (editingPartnerId) {
        // UPDATE
        console.log(`[CardModal] Starting UPDATE for partner ID: ${editingPartnerId}`);
        const { data, error } = await supabase
          .from('pme_company_partners')
          .update(dataToSave)
          .eq('id', editingPartnerId)
          .select()
          .single();
        if (error) throw error;
        savedPartnerData = data;
        toast({ title: "Sucesso", description: "Sócio atualizado." });
      } else {
        // INSERT
         console.log('[CardModal] Starting INSERT for new partner');
        const { data, error } = await supabase
          .from('pme_company_partners')
          .insert([dataToSave])
          .select()
          .single();
        if (error) throw error;
        savedPartnerData = data;
        toast({ title: "Sucesso", description: "Sócio adicionado." });
      }

      // Atualizar o estado proposalDetails LOCALMENTE (IMPORTANTE)
      if (savedPartnerData && proposalDetails) {
          // Converter o parceiro salvo para o formato da UI
          const formattedSavedPartner = formatPartnerForUI(savedPartnerData);

          setProposalDetails(prevDetails => {
              if (!prevDetails) return null;
              // Converter a lista existente para Partner[] e aplicar cast para evitar erros de tipagem
              const currentPartners = (prevDetails.partners || []).map((p: any) => formatPartnerForUI(p as PmePartner));
              
              let updatedPartners: Partner[];
              if (editingPartnerId) { 
                  updatedPartners = currentPartners.map(p => 
                      p.id === formattedSavedPartner.id ? formattedSavedPartner : p
                  );
              } else { 
                  updatedPartners = [formattedSavedPartner, ...currentPartners];
              }
              // Retorna a estrutura da API, mas com a lista `partners` no formato Partner[]
              return { ...prevDetails, partners: updatedPartners as any }; // Usar 'as any' aqui pode ser necessário se TS reclamar da mistura de tipos
          });
      }

      closePartnerDialog(); // Fecha o dialog após sucesso

    } catch (error: any) {
      console.error('Erro ao salvar sócio:', error);
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
       
       // Atualiza o estado proposalDetails LOCALMENTE
       setProposalDetails(prevDetails => {
           if (!prevDetails) return null;
            // Converter a lista existente para Partner[] ANTES de filtrar
           const currentPartners = (prevDetails.partners || []).map((p: any) => formatPartnerForUI(p));
           const updatedPartners = currentPartners.filter(p => p.id !== partnerId);
           // Retorna a estrutura da API, mas com a lista `partners` no formato Partner[]
           return { ...prevDetails, partners: updatedPartners as any }; // Usar 'as any' aqui pode ser necessário
       });

       toast({ title: "Sucesso", description: "Sócio excluído." });
     } catch (error: any) {
       console.error('Erro ao excluir sócio:', error);
       toast({ title: "Erro", description: `Falha ao excluir sócio: ${error.message}`, variant: "destructive" });
     } finally {
       setIsSavingPartner(false);
     }
  };
  // --- Fim das Funções de Controle de Sócios ---

  // Função para controlar a abertura/fechamento do Dialog PRINCIPAL - Simplificada
  const handleMainDialogOpenChange = (open: boolean) => {
    console.log(`[CardModal] handleMainDialogOpenChange called with open = ${open}`);
    // Lógica simplificada: Se for para fechar, chama onClose
    if (!open) {
      console.log("[CardModal] Main dialog is closing, calling onClose().");
      onClose(); 
    }
  };

  // --- Funções de Controle do Dialog/CRUD de Beneficiários --- 

  const openAddHolderDialog = () => {
    setEditingBeneficiary({ type: 'holder', data: {} as PmeHolder }); // Objeto vazio para indicar adição
    setBeneficiaryFormData(defaultBeneficiaryFormData);
    setIsBeneficiaryDialogOpen(true);
  };

  const openEditHolderDialog = (holder: PmeHolder) => {
    setEditingBeneficiary({ type: 'holder', data: holder });
    setBeneficiaryFormData({
      name: holder.name || '',
      cpf: holder.cpf || '',
      birth_date: holder.birth_date, // Assume YYYY-MM-DD
      email: holder.email || '',
      phone: holder.phone || '',
      relationship: '' // Não aplicável
    });
    setIsBeneficiaryDialogOpen(true);
  };

  const openAddDependentDialog = (holderId: string) => {
    setEditingBeneficiary({ type: 'dependent', data: {} as PmeDependent, holderId }); // Passa holderId
    setBeneficiaryFormData(defaultBeneficiaryFormData);
    setIsBeneficiaryDialogOpen(true);
  };

  const openEditDependentDialog = (dependent: PmeDependent) => {
    setEditingBeneficiary({ type: 'dependent', data: dependent });
    setBeneficiaryFormData({
      name: dependent.name || '',
      cpf: dependent.cpf || '',
      birth_date: dependent.birth_date, // Assume YYYY-MM-DD
      email: '', // Não aplicável
      phone: '', // Não aplicável
      relationship: dependent.relationship || ''
    });
    setIsBeneficiaryDialogOpen(true);
  };

  const closeBeneficiaryDialog = () => {
    setIsBeneficiaryDialogOpen(false);
    // Não resetar form aqui, resetar ao abrir
  };

  const handleBeneficiaryFormChange = (field: keyof BeneficiaryFormData, value: any) => {
    setBeneficiaryFormData(prev => ({ ...prev, [field]: value }));
  };

  // Função para SALVAR (criar ou atualizar) beneficiário - Versão Otimizada
  const handleSaveBeneficiary = async () => {
    const submissionId = proposalDetails?.submission?.id;
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
        
        if (editingBeneficiary?.type === 'holder') {
            const holderData = {
                submission_id: submissionId,
                name: beneficiaryFormData.name.trim(),
                cpf: beneficiaryFormData.cpf || null,
                birth_date: beneficiaryFormData.birth_date,
                email: beneficiaryFormData.email || null,
                phone: beneficiaryFormData.phone || null,
                status: 'active'
            };
            
            if (editingBeneficiary.data?.id) { // UPDATE Holder
                const { data, error } = await supabase
                    .from('pme_holders')
                    .update(holderData)
                    .eq('id', editingBeneficiary.data.id)
                    .select();
                    
                if (error) throw error;
                savedData = data?.[0];
                toast({ title: "Sucesso", description: "Titular atualizado." });
            } else { // INSERT Holder
                const { data, error } = await supabase
                    .from('pme_holders')
                    .insert(holderData)
                    .select();
                    
                if (error) throw error;
                savedData = data?.[0];
                toast({ title: "Sucesso", description: "Titular adicionado." });
            }
            
            // Atualizar o estado localmente
            if (savedData && proposalDetails) {
                const updatedHolders = [...(proposalDetails.holders || [])];
                
                if (editingBeneficiary.data?.id) {
                    // Atualizar titular existente
                    const holderIndex = updatedHolders.findIndex(h => h.id === editingBeneficiary.data.id);
                    if (holderIndex >= 0) {
                        updatedHolders[holderIndex] = {
                            ...updatedHolders[holderIndex],
                            ...savedData,
                            // Manter os dependentes existentes
                            dependents: updatedHolders[holderIndex].dependents || []
                        };
                    }
                } else {
                    // Adicionar novo titular
                    updatedHolders.push({
                        ...savedData,
                        dependents: []
                    });
                }
                
                // Atualizar estado
                setProposalDetails({
                    ...proposalDetails,
                    holders: updatedHolders
                });
                
                // Atualizar cache
                try {
                    const cacheKey = `proposal_details_${card.submission_id}`;
                    const cachedData = localStorage.getItem(cacheKey);
                    if (cachedData) {
                        const parsedCache = JSON.parse(cachedData);
                        parsedCache.data.holders = updatedHolders;
                        localStorage.setItem(cacheKey, JSON.stringify({
                            ...parsedCache,
                            timestamp: Date.now()
                        }));
                    }
                } catch (e) {
                    console.warn("Erro ao atualizar cache de holders:", e);
                }
            }
            
        } else if (editingBeneficiary?.type === 'dependent') {
            if (!beneficiaryFormData.relationship) throw new Error("Parentesco não fornecido");
            const holderId = editingBeneficiary.holderId || (editingBeneficiary.data as PmeDependent)?.holder_id;
            if (!holderId) throw new Error("Holder ID ausente");
            
            const dependentData = {
                holder_id: holderId,
                name: beneficiaryFormData.name.trim(),
                cpf: beneficiaryFormData.cpf || null,
                birth_date: beneficiaryFormData.birth_date,
                relationship: beneficiaryFormData.relationship,
                is_active: true
            };
            
            if (editingBeneficiary.data?.id) { // UPDATE Dependent
                const { data, error } = await supabase
                    .from('pme_dependents')
                    .update(dependentData)
                    .eq('id', editingBeneficiary.data.id)
                    .select();
                    
                if (error) throw error;
                savedData = data?.[0];
                toast({ title: "Sucesso", description: "Dependente atualizado." });
            } else { // INSERT Dependent
                const { data, error } = await supabase
                    .from('pme_dependents')
                    .insert(dependentData)
                    .select();
                    
                if (error) throw error;
                savedData = data?.[0];
                toast({ title: "Sucesso", description: "Dependente adicionado." });
            }
            
            // Atualizar o estado localmente
            if (savedData && proposalDetails) {
                const updatedHolders = [...(proposalDetails.holders || [])];
                const holderIndex = updatedHolders.findIndex(h => h.id === holderId);
                
                if (holderIndex >= 0) {
                    const updatedDependents = [...(updatedHolders[holderIndex].dependents || [])];
                    
                    if (editingBeneficiary.data?.id) {
                        // Atualizar dependente existente
                        const depIndex = updatedDependents.findIndex(d => d.id === editingBeneficiary.data.id);
                        if (depIndex >= 0) {
                            updatedDependents[depIndex] = {
                                ...updatedDependents[depIndex],
                                ...savedData
                            };
                        }
                    } else {
                        // Adicionar novo dependente
                        updatedDependents.push(savedData);
                    }
                    
                    // Atualizar os dependentes do titular
                    updatedHolders[holderIndex] = {
                        ...updatedHolders[holderIndex],
                        dependents: updatedDependents
                    };
                    
                    // Atualizar estado
                    setProposalDetails({
                        ...proposalDetails,
                        holders: updatedHolders
                    });
                    
                    // Atualizar cache
                    try {
                        const cacheKey = `proposal_details_${card.submission_id}`;
                        const cachedData = localStorage.getItem(cacheKey);
                        if (cachedData) {
                            const parsedCache = JSON.parse(cachedData);
                            parsedCache.data.holders = updatedHolders;
                            localStorage.setItem(cacheKey, JSON.stringify({
                                ...parsedCache,
                                timestamp: Date.now()
                            }));
                        }
                    } catch (e) {
                        console.warn("Erro ao atualizar cache de dependentes:", e);
                    }
                }
            }
        }

        closeBeneficiaryDialog();

    } catch (error: any) {
        console.error('Erro ao salvar beneficiário:', error);
        toast({ title: "Erro", description: `Falha ao salvar beneficiário: ${error.message}`, variant: "destructive" });
    } finally {
        setIsSavingBeneficiary(false);
    }
  };

  // Função para EXCLUIR titular - Versão com Invalidação
  const handleDeleteHolder = async (holderId: string) => {
      if (!confirm('Tem certeza que deseja excluir este titular e TODOS os seus dependentes?')) return;
      setIsSavingBeneficiary(true);
      try {
          const { error } = await supabase.from('pme_holders').delete().eq('id', holderId);
          if (error) throw error;
          // Invalidar query para atualizar a lista
          await queryClient.invalidateQueries({ queryKey: ['proposalDetails', card.submission_id] });
          toast({ title: "Sucesso", description: "Titular excluído." });
      } catch (error: any) {
          console.error('Erro ao excluir titular:', error);
          toast({ title: "Erro", description: `Falha ao excluir titular: ${error.message}`, variant: "destructive" });
      } finally {
          setIsSavingBeneficiary(false);
      }
  };

  // Função para EXCLUIR dependente - Versão com Invalidação
  const handleDeleteDependent = async (dependentId: string) => {
      if (!confirm('Tem certeza que deseja excluir este dependente?')) return;
       setIsSavingBeneficiary(true);
      try {
          const { error } = await supabase.from('pme_dependents').delete().eq('id', dependentId);
          if (error) throw error;
          // Invalidar query para atualizar a lista
          await queryClient.invalidateQueries({ queryKey: ['proposalDetails', card.submission_id] });
          toast({ title: "Sucesso", description: "Dependente excluído." });
      } catch (error: any) {
          console.error('Erro ao excluir dependente:', error);
          toast({ title: "Erro", description: `Falha ao excluir dependente: ${error.message}`, variant: "destructive" });
      } finally {
          setIsSavingBeneficiary(false);
      }
  };

  // --- Fim das Funções de Controle de Beneficiários ---

  return (
    <>
      <MainDialog open={isOpen} onOpenChange={handleMainDialogOpenChange}>
        <MainDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"> 
          <MainDialogHeader>
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-3">
                     <MainDialogTitle className="text-xl font-bold m-0 p-0">
                        {form.watch("nome_fantasia") || form.watch("razao_social") || card.company_name || "Detalhes da Proposta"} 
                     </MainDialogTitle>
                     <Badge 
                       className={cn(
                         "py-1.5 px-3 flex items-center gap-1 text-xs font-medium",
                         statusBadgeInfo.variant === "success" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
                         statusBadgeInfo.variant === "warning" && "bg-amber-100 text-amber-700 hover:bg-amber-200",
                         statusBadgeInfo.variant === "destructive" && "bg-rose-100 text-rose-700 hover:bg-rose-200",
                         statusBadgeInfo.variant === "secondary" && "bg-slate-100 text-slate-700 hover:bg-slate-200",
                         statusBadgeInfo.variant === "outline" && "border-dashed"
                       )}
                     >
                       {statusBadgeInfo.icon === "check" && <Check className="h-3.5 w-3.5" />}
                       {statusBadgeInfo.icon === "x" && <X className="h-3.5 w-3.5" />}
                       {statusBadgeInfo.icon === "clock" && <Clock className="h-3.5 w-3.5" />}
                       {statusBadgeInfo.icon === "search" && <Search className="h-3.5 w-3.5" />}
                       {statusBadgeInfo.text || "Indefinido"}
                     </Badge>
                  </div>
                               <div className="flex flex-wrap items-center gap-4 mt-2 bg-muted/40 rounded-md p-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {form.watch("broker_name")?.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{form.watch("broker_name") || "Corretor não informado"}</span>
                        <span className="text-xs text-muted-foreground">Corretor</span>
                      </div>
                    </div>

                    <Separator orientation="vertical" className="h-8 hidden sm:block" />
                    
                    <div className="flex flex-wrap gap-3">
                      {form.watch("broker_team_name") && (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs cursor-default">
                                <Users className="h-3 w-3" />
                                {form.watch("broker_team_name")}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Equipe do corretor</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {form.watch("broker_phone") && (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs cursor-default">
                                <Phone className="h-3 w-3" />
                                {form.watch("broker_phone")}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Telefone do corretor</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {form.watch("broker_email") && (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <a href={`mailto:${form.watch("broker_email")}`} className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs truncate max-w-[180px] hover:underline" onClick={(e) => e.stopPropagation()}>
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{form.watch("broker_email")}</span>
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Enviar email para: {form.watch("broker_email")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
              </div>
              
              <div className="flex gap-2 flex-shrink-0 ml-auto">
                 <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                     <Button variant="destructive" size="icon" title="Excluir Proposta">
                       <Trash className="h-4 w-4" />
                       <span className="sr-only">Excluir Proposta</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <ShadAlertDialogDescription>
                         Tem certeza que deseja excluir esta proposta? Todas as informações relacionadas (empresa, contrato, beneficiários, sócios) serão perdidas permanentemente. Esta ação não pode ser desfeita.
                      </ShadAlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                       <AlertDialogCancel onClick={(e) => {e.preventDefault(); setIsDeleteDialogOpen(false);}}>Cancelar</AlertDialogCancel>
                       <AlertDialogAction onClick={(e) => {e.preventDefault(); handleDelete();}} className="bg-destructive hover:bg-destructive/90">Excluir Permanentemente</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                  <Button
                    size="sm"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isLoading || form.formState.isSubmitting || !form.formState.isDirty}
                    className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-dark hover:translate-y-[-1px] transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!form.formState.isDirty ? "Nenhuma alteração para salvar" : "Salvar alterações"}
                  >
                     {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
                  </Button>
              </div>
            </div>
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
                      <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                    </div>
                  </div>
                  <div>
                    <Skeleton className="h-6 w-1/3 mt-6 mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
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
                       partners={(proposalDetails?.partners || []).map((p: any) => formatPartnerForUI(p))}
                       companyId={proposalDetails?.company?.id || null}
                       onOpenAddPartner={openAddPartnerDialog}
                       onOpenEditPartner={openEditPartnerDialog}
                       onDeletePartner={handleDeletePartner}
                       isPartnerActionLoading={isSavingPartner}
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
                            onEditHolder={(holder) => openEditHolderDialog(holder)}
                            onDeleteHolder={handleDeleteHolder}
                            onAddDependent={openAddDependentDialog}
                            onEditDependent={(dependent) => openEditDependentDialog(dependent)}
                            onDeleteDependent={handleDeleteDependent}
                            isLoading={isSavingBeneficiary}
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
                
            <div className="md:col-span-1 p-4 bg-gradient-to-b from-muted to-background rounded-md border shadow-sm h-fit sticky top-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                Etapa Atual
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
              
           </div>

        </MainDialogContent>
      </MainDialog>

      {/* Dialog para Adicionar/Editar Sócio (RENDERIZADO AQUI) */}
      <MainDialog open={isPartnerDialogOpen} onOpenChange={(open) => !open && closePartnerDialog()}> 
          <MainDialogContent className="sm:max-w-[550px]">
              <MainDialogHeader>
                  <MainDialogTitle>{editingPartnerId ? "Editar Sócio" : "Adicionar Sócio"}</MainDialogTitle>
                  <DialogDescription className="sr-only"> {/* Acessibilidade */}
                      Formulário para {editingPartnerId ? "editar dados do sócio" : "adicionar um novo sócio"}.
                  </DialogDescription>
              </MainDialogHeader>
              
              <PartnerDialogForm 
                  formData={partnerFormData} 
                  onFormChange={handlePartnerFormChange} 
                  isLoading={isSavingPartner} 
                  formId="partner-dialog-form" // ID pode não ser mais necessário se o botão chama a função diretamente
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
                    onClick={handleSavePartner} // Chama a função de salvar deste componente
                    disabled={isSavingPartner || !partnerFormData.nome} 
                  >
                    {isSavingPartner ? "Salvando..." : (editingPartnerId ? "Atualizar" : "Adicionar")}
                  </Button>
              </MainDialogFooter>
          </MainDialogContent>
      </MainDialog>

      {/* NOVO Dialog para Adicionar/Editar Beneficiário */}
      <MainDialog open={isBeneficiaryDialogOpen} onOpenChange={(open) => !open && closeBeneficiaryDialog()}> 
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
                  formType={editingBeneficiary?.type ?? 'holder'} // Default para evitar erro, mas type deve estar definido
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
                    disabled={isSavingBeneficiary || !beneficiaryFormData.name}
                  >
                    {isSavingBeneficiary ? "Salvando..." : (editingBeneficiary?.data?.id ? "Atualizar" : "Adicionar")}
                  </Button>
              </MainDialogFooter>
          </MainDialogContent>
      </MainDialog>
    </>
  );
} 