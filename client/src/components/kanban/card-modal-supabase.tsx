import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import PartnersList from "./PartnersList";
import BeneficiariesList from "./BeneficiariesList";
import ProposalGeneralInfo from "./ProposalGeneralInfo";
import ProposalContractDetails from "./ProposalContractDetails";
import CompanyDataForm from "./CompanyDataForm";
import GracePeriodForm from "./GracePeriodForm"; // Importar novo componente

import { KanbanCard } from "@/hooks/use-kanban-cards";
import { useKanbanCards } from "@/hooks/use-kanban-cards";
import { useToast } from "@/hooks/use-toast"; // Ajustado para useToast do shadcn se for o caso
import { fetchProposalDetails, fetchOperators, OperatorInfo } from "../../lib/api";
import { proposalSchema, ProposalFormData } from "@/lib/schemas/proposalSchema"; // <-- Corrigido import e adicionado ProposalFormData

// O tipo agora é importado de proposalSchema.ts
// type ProposalFormData = z.infer<typeof proposalSchema>; 

type CardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  card: KanbanCard; 
  boardId: string; 
};

// Função auxiliar para mapear status para variante e texto do Badge
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

export default function CardModalSupabase({ isOpen, onClose, card, boardId }: CardModalProps) { 
  const { toast } = useToast();
  const { updateCard, deleteCard } = useKanbanCards(boardId);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [proposalDetails, setProposalDetails] = useState<any>(null); // Manter como 'any' por enquanto ou criar tipo detalhado
  const [isLoading, setIsLoading] = useState(true);
  const [operatorsList, setOperatorsList] = useState<OperatorInfo[]>([]); // Estado para lista de operadoras
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false); // <-- Adicionado estado

  // Mover a declaração do formulário para ANTES do useEffect
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
        value: card.value ?? 0, // Garantir fallback 0
        due_date: card.due_date || null, 
        observacoes: card.observacoes || "", 

        // Dados básicos da empresa
        cnpj: null,
        razao_social: null,
        nome_fantasia: null,
        data_abertura: null,
        natureza_juridica: null,
        situacao_cadastral: null,
        cnae: null,
        cnae_descricao: null,
        is_mei: false,
        
        // Dados de endereço
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

  // Formatação de data para exibição (pode ser movida para utils)
  const formatDate = (dateString: string | null | undefined): string | null => {
    if (!dateString) return null;
    try {
      // Tentar tratar como data completa com timezone primeiro
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
      // Se falhar, tentar tratar como YYYY-MM-DD (comum em inputs date)
      try {
        const [year, month, day] = dateString.split('-').map(Number);
        // Nota: Meses em Date são 0-indexados
        return format(new Date(year, month - 1, day), "dd/MM/yyyy", { locale: ptBR });
      } catch (innerE) {
        console.error("Erro ao formatar data:", dateString, innerE);
        return dateString; // Retorna string original em caso de erro
      }
    }
  };

  // Efeito para buscar Operadoras
  useEffect(() => {
    if (isOpen) { // Buscar apenas quando o modal abrir
      const loadOperators = async () => {
        try {
          const operators = await fetchOperators();
          setOperatorsList(operators);
        } catch (error: any) {
          console.error("Erro ao buscar operadoras:", error);
          // Poderia adicionar um toast aqui se a lista for crucial
        }
      };
      loadOperators();
    }
  }, [isOpen]); // Dependência apenas em isOpen

  // Efeito para buscar dados detalhados
  useEffect(() => {
    const loadDetails = async () => {
      if (isOpen && card.submission_id) { 
        setIsLoading(true);
        setProposalDetails(null);
        form.reset();
        try {
          console.log(`Iniciando busca para submission_id: ${card.submission_id}`); 
          const data = await fetchProposalDetails(card.submission_id); 
          console.log("Detalhes recebidos no componente:", data);

          if (!data) {
            console.warn("fetchProposalDetails retornou null, mas não houve erro.");
            setIsLoading(false);
            return;
          }

          setProposalDetails(data);

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
            value: data.contract?.value ?? card.value ?? 0, // Garantir fallback 0
            due_date: data.contract?.validity_date || card.due_date || null, 
            observacoes: card.observacoes || data.grace_period?.reason || "", 

            // Dados básicos da empresa
            cnpj: data.company?.cnpj || null,
            razao_social: data.company?.razao_social || null,
            nome_fantasia: data.company?.nome_fantasia || card.company_name || null, 
            data_abertura: data.company?.data_abertura || null,
            natureza_juridica: data.company?.natureza_juridica_nome || data.company?.natureza_juridica || null,
            situacao_cadastral: data.company?.situacao_cadastral || null,
            cnae: data.company?.cnae || null,
            cnae_descricao: data.company?.cnae_descricao || null,
            is_mei: data.company?.is_mei || false,
            
            // Dados de endereço da empresa
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
          console.error("Erro ao buscar detalhes da proposta:", error);
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
      value: card.value ?? 0, // Garantir fallback 0
            due_date: card.due_date || null,
            observacoes: card.observacoes || "",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadDetails();

  }, [isOpen, card.submission_id, card, form, toast]); 

  // TODO: Implementar função para salvar TODAS as alterações da Ficha
  const onSubmit = (data: ProposalFormData) => {
    console.log("Dados do formulário para submissão:", data);
    
    updateCard({ 
      id: card.id, 
      company_name: data.company_name,
    }, {
      onSuccess: () => {
        toast({ title: "Cartão atualizado com sucesso!" });
      },
      onError: (error) => {
        toast({ title: "Erro ao atualizar cartão", description: error.message, variant: "destructive" });
      }
    });

    onClose();
  };

  // Função para excluir o cartão (mantida)
  const handleDelete = () => {
      setIsDeleteDialogOpen(false); 
    deleteCard(card.id, { 
      onSuccess: () => {
        toast({
          title: "Cartão excluído",
          description: "O cartão foi excluído com sucesso"
        });
        onClose(); // Fechar o modal principal
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

  // Obter o status atual para o Badge
  const currentStatus = proposalDetails?.submission?.status;
  const statusBadgeInfo = getStatusBadge(currentStatus);

  // Placeholder para busca CNPJ
  const handleCnpjSearch = async (cnpj: string) => {
    console.log("Buscando CNPJ:", cnpj);
    setIsSearchingCnpj(true);
    // TODO: Implementar chamada à API para buscar dados do CNPJ
    // Exemplo: const companyData = await fetchCompanyData(cnpj);
    // if (companyData) {
    //   form.setValue('razao_social', companyData.razao_social);
    //   form.setValue('nome_fantasia', companyData.nome_fantasia);
    //   ...
    // }
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simular delay da API
    toast({ title: "Busca CNPJ", description: "Funcionalidade ainda não implementada." });
    setIsSearchingCnpj(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Aumentar largura máxima e garantir scroll */}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"> 
        <DialogHeader>
          <div className="flex justify-between items-start">
            {/* Agrupar Título e Info Corretor */} 
            <div className="flex flex-col gap-1">
               {/* Linha Empresa + Status Badge */}                <div className="flex items-center gap-3">
                   <DialogTitle className="text-xl font-bold m-0 p-0">
                      {form.watch("company_name") || card.company_name || "Detalhes da Proposta"} 
                   </DialogTitle>
                   <Badge 
                     className={cn(
                       "py-1.5 px-3 flex items-center gap-1 text-xs font-medium",
                       statusBadgeInfo.variant === "success" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
                       statusBadgeInfo.variant === "warning" && "bg-amber-100 text-amber-700 hover:bg-amber-200",
                       statusBadgeInfo.variant === "destructive" && "bg-rose-100 text-rose-700 hover:bg-rose-200"
                     )}
                   >
                     {statusBadgeInfo.icon === "check" && <Check className="h-3.5 w-3.5" />}
                     {statusBadgeInfo.icon === "x" && <X className="h-3.5 w-3.5" />}
                     {statusBadgeInfo.icon === "clock" && <Clock className="h-3.5 w-3.5" />}
                     {statusBadgeInfo.icon === "search" && <Search className="h-3.5 w-3.5" />}
                     {statusBadgeInfo.text}
                   </Badge>
                </div>
                             {/* Info Corretor com Ícones */ }
                <div className="flex flex-wrap items-center gap-4 mt-2 bg-muted/40 rounded-md p-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {form.watch("broker_name")?.substring(0, 2) || 'BR'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{form.watch("broker_name") || "-"}</span>
                      <span className="text-xs text-muted-foreground">Corretor</span>
                    </div>
                  </div>

                  <Separator orientation="vertical" className="h-8" />
                  
                  <div className="flex flex-wrap gap-3">
                    {form.watch("broker_team_name") && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs">
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs">
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs truncate max-w-[180px]">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{form.watch("broker_email")}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{form.watch("broker_email")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
            </div>
            
            {/* Botões de Ação */} 
            <div className="flex gap-2 flex-shrink-0 ml-auto">
               {/* Botão Excluir Mantido */}
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                   <Button variant="destructive" size="icon">
                     <Trash className="h-4 w-4" />
                     <span className="sr-only">Excluir Proposta</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                       Tem certeza que deseja excluir esta proposta? Todas as informações relacionadas (empresa, contrato, beneficiários) serão perdidas. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                     <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
                     <AlertDialogAction onClick={handleDelete}>Excluir Permanentemente</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
                {/* Botão Salvar */} 
                <Button size="sm" onClick={form.handleSubmit(onSubmit)} disabled={isLoading} className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-dark hover:translate-y-[-1px] transition-all duration-200 hover:shadow-md">
                   Salvar Alterações
                </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Layout de Duas Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          
          {/* Coluna Esquerda: Ficha da Proposta (Formulário) */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2 sm:col-span-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2 sm:col-span-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                  </div>
                </div>
              </div>
            ) : (
          <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* === Seção Informações Gerais === */}
                  <ProposalGeneralInfo control={form.control} operatorsList={operatorsList} />

                  {/* === Seção Dados da Empresa === */}
                  <CompanyDataForm control={form.control} onCnpjSearch={handleCnpjSearch} isSearchingCnpj={isSearchingCnpj} />

                  {/* === Seção Sócios === */}
                  <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-slate-100 to-slate-200">
                       <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                         <Users className="mr-2 h-5 w-5 text-primary/80" />
                         Sócios
                       </CardTitle>
                     </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <PartnersList partners={proposalDetails?.partners} />
                    </CardContent>
                  </Card>

                  {/* === Seção Beneficiários === */}
                  <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-slate-100 to-slate-200">
                       <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                         <User className="mr-2 h-5 w-5 text-primary/80" />
                         Beneficiários
                       </CardTitle>
                     </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <BeneficiariesList holders={proposalDetails?.holders} />
                    </CardContent>
                  </Card>

                  {/* === Seção Detalhes do Contrato === */} 
                  <ProposalContractDetails control={form.control} />

                  {/* === Seção Carência === */} 
                  <GracePeriodForm control={form.control} operatorsList={operatorsList} />

                  {/* === Seção Observações Gerais === */} 
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
                              placeholder="Anotações gerais sobre a proposta..." 
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

                  {/* === Seção Histórico === */} 
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
                        
                        <p>Criado por: {card.created_by || 'N/A'}</p> 
                        <p>Última Atualização: {card.updated_at ? formatDate(card.updated_at) : 'N/A'}</p> 
                      </div>
                    </CardContent>
                  </Card>

            </form>
          </Form>
                )}
              </div>
              
          {/* Coluna Direita: Etapa Atual do Fluxo (Placeholder) */}
          <div className="md:col-span-1 p-4 bg-gradient-to-b from-muted to-background rounded-md border shadow-sm h-fit sticky top-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Etapa Atual
            </h3>
            <div className="space-y-3">
              <Card className="bg-card/50 border-dashed">
                <CardContent className="p-3 text-sm text-muted-foreground">
                  (Conteúdo da etapa atual será exibido aqui)
                </CardContent>
              </Card>
            </div>
                </div>
            
              </div>

      </DialogContent>
    </Dialog>
  );
} 