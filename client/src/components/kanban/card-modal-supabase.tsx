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
  Mail
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IMaskInput } from 'react-imask';
import { Skeleton } from "@/components/ui/skeleton";
import PartnersList from "./PartnersList";
import BeneficiariesList from "./BeneficiariesList";
import ProposalGeneralInfo from "./ProposalGeneralInfo";
import ProposalContractDetails from "./ProposalContractDetails";

import { KanbanCard } from "@/hooks/use-kanban-cards";
import { useKanbanCards } from "@/hooks/use-kanban-cards";
import { useToast } from "@/hooks/use-toast";
import { fetchProposalDetails, fetchOperators, OperatorInfo } from "../../lib/api";

// Constante para UFs
const ufOptions = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

// TODO: Definir um novo schema Zod abrangente para toda a Ficha da Proposta
const proposalSchema = z.object({
  // Campos iniciais da kanban_cards
  company_name: z.string().nullable().optional(),
  broker_name: z.string().nullable().optional(),
  broker_phone: z.string().nullable().optional(),
  broker_email: z.string().nullable().optional(),
  broker_team_name: z.string().nullable().optional(),
  operator_id: z.number().nullable().optional(),
  operator: z.string().nullable().optional(),
  plan_name: z.string().nullable().optional(),
  modality: z.string().nullable().optional(),
  lives: z.coerce.number().min(1, "Número de vidas deve ser pelo menos 1"),
  value: z.coerce.number().min(0, "Valor deve ser maior ou igual a zero"),
  due_date: z.string().nullable().optional(),
  // stage_id: z.string().min(1, "Estágio é obrigatório"), // Será gerenciado na coluna direita ou de outra forma
  observacoes: z.string().nullable().optional(),

  // Campos de pme_companies
  cnpj: z.string().nullable().optional(),
  razao_social: z.string().nullable().optional(),
  nome_fantasia: z.string().nullable().optional(),
  data_abertura: z.string().nullable().optional(),
  natureza_juridica: z.string().nullable().optional(),
  situacao_cadastral: z.string().nullable().optional(),
  cnae: z.string().nullable().optional(),
  is_mei: z.boolean().nullable().optional(),
  logradouro: z.string().nullable().optional(),
  numero: z.string().nullable().optional(),
  complemento: z.string().nullable().optional(),
  bairro: z.string().nullable().optional(),
  cep: z.string().nullable().optional(),
  cidade: z.string().nullable().optional(),
  uf: z.string().nullable().optional(),

  // Campos de pme_contracts
  contract_type: z.string().nullable().optional(),
  coparticipation: z.string().nullable().optional(),
  contract_value: z.coerce.number().nullable().optional(),
  validity_date: z.string().nullable().optional(),
  pre_proposta: z.string().nullable().optional(),
  
  // TODO: Adicionar campos para Sócios (partners), Titulares/Dependentes (holders), Carência (grace_period), Arquivos (files)

  // --- Campos de pme_grace_periods ---
  has_grace_period: z.boolean().nullable().optional(),
  previous_operator_id: z.number().nullable().optional(),
  grace_reason: z.string().nullable().optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

type CardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  card: KanbanCard;
  boardId: string; // Manter boardId se necessário para contexto de exclusão/atualização
};

// Função auxiliar para mapear status para variante e texto do Badge
const getStatusBadge = (status: string | null | undefined): { variant: "default" | "secondary" | "destructive" | "outline"; text: string } => {
  switch (status?.toLowerCase()) {
    case 'pending':
    case 'aguardando':
      return { variant: "secondary", text: "Pendente" };
    case 'approved':
    case 'aprovado':
    case 'active': // Considerando active como aprovado/ativo
    case 'ativo':
      return { variant: "default", text: "Aprovado" }; // Default é geralmente azul/primário
    case 'rejected':
    case 'rejeitado':
    case 'cancelado':
      return { variant: "destructive", text: "Rejeitado" };
    // Adicionar outros mapeamentos conforme necessário
    default:
      return { variant: "outline", text: status || "Indefinido" };
  }
};

export default function CardModalSupabase({ isOpen, onClose, card, boardId }: CardModalProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [proposalDetails, setProposalDetails] = useState<any>(null); // Manter como 'any' por enquanto ou criar tipo detalhado
  const [isLoading, setIsLoading] = useState(true);
  const [operatorsList, setOperatorsList] = useState<OperatorInfo[]>([]); // Estado para lista de operadoras
  
  const { updateCard, deleteCard } = useKanbanCards(boardId);

  // Mover a declaração do formulário para ANTES do useEffect
  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { 
        company_name: "",
        broker_name: null,
        broker_phone: null,
        broker_email: null,
        broker_team_name: null,
        operator_id: null,
        operator: card.operator || "",
        plan_name: null,
        modality: null,
        lives: 1,
        value: 0,
        due_date: null,
        observacoes: "",
        cnpj: null,
        razao_social: null,
        nome_fantasia: null,
        data_abertura: null,
        natureza_juridica: null,
        situacao_cadastral: null,
        cnae: null,
        is_mei: false,
        logradouro: null,
        numero: null,
        complemento: null,
        bairro: null,
        cep: null,
        cidade: null,
        uf: null,
        contract_type: null,
        coparticipation: null,
        contract_value: null,
        validity_date: null,
        pre_proposta: null,
        has_grace_period: false,
        previous_operator_id: null,
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
            value: data.contract?.value ?? card.value ?? null,
            due_date: data.contract?.validity_date || card.due_date || null,
            observacoes: card.observacoes || data.grace_period?.reason || "",

            cnpj: data.company?.cnpj || null,
            razao_social: data.company?.razao_social || null,
            nome_fantasia: data.company?.nome_fantasia || card.company_name || null,
            data_abertura: data.company?.data_abertura || null,
            natureza_juridica: data.company?.natureza_juridica_nome || data.company?.natureza_juridica || null,
            situacao_cadastral: data.company?.situacao_cadastral || null,
            cnae: data.company?.cnae_descricao || data.company?.cnae || null,
            is_mei: data.company?.is_mei ?? false,
            logradouro: data.company?.logradouro || null,
            numero: data.company?.numero || null,
            complemento: data.company?.complemento || null,
            bairro: data.company?.bairro || null,
            cep: data.company?.cep || null,
            cidade: data.company?.cidade || null,
            uf: data.company?.uf || null,

            contract_type: data.contract?.type || null,
            coparticipation: data.contract?.coparticipation || null,
            contract_value: data.contract?.value ?? card.value ?? null,
            validity_date: data.contract?.validity_date || card.due_date || null,
            pre_proposta: data.contract?.pre_proposta || null,

            has_grace_period: data.grace_period?.has_grace_period ?? false,
            previous_operator_id: data.grace_period?.previous_operator_id || null,
            grace_reason: data.grace_period?.reason || null,
          });

          console.log("Formulário resetado com os dados:", form.getValues());

        } catch (error: any) {
          console.error("Erro ao buscar detalhes da proposta no useEffect:", error);
          toast({
            title: "Erro ao carregar detalhes",
            description: error.message || "Não foi possível buscar os dados completos da proposta.",
            variant: "destructive"
          });
          form.reset({ 
      company_name: card.company_name || "",
            operator_id: null,
            operator: card.operator || "",
      lives: card.lives,
      value: card.value,
            due_date: card.due_date || null,
            observacoes: card.observacoes || "",
          });
        } finally {
          setIsLoading(false);
        }
      } else if (!isOpen) {
        setProposalDetails(null);
        form.reset();
        setIsLoading(false);
      }
    };

    loadDetails();

  }, [isOpen, card.submission_id, card, form, toast]);

  // TODO: Implementar função para salvar TODAS as alterações da Ficha
  const onSubmit = (data: ProposalFormData) => {
    console.log("Dados do formulário para salvar:", data);
    // Aqui virá a lógica para chamar as funções de update nas tabelas necessárias
    // Ex: updateSubmissionDetails(card.submission_id, { operator_id: data.operator_id, ... });
    // Ex: updateCompanyDetails(card.submission_id, data);
    // Ex: updateContractDetails(card.submission_id, data);
    // ... etc ...
    
    // Exemplo de atualização básica do card (campos que existem na kanban_cards)
    updateCard({
      id: card.id,
      company_name: data.company_name,
      // operator: data.operator, // Poderia atualizar o nome aqui se necessário
      // operator_id: data.operator_id, // REMOVIDO: Este campo não existe em kanban_cards
      lives: data.lives,
      value: data.value,
      due_date: data.due_date || null, 
      observacoes: data.observacoes,
    }, {
      onSuccess: () => {
        toast({
          title: "Alterações salvas (Parcial)", // Avisar que é parcial
          description: "Apenas campos do card foram atualizados."
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Erro ao salvar campos do card",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  // Função para excluir o cartão (mantida)
  const handleDelete = () => {
     setIsDeleteDialogOpen(false); // Fechar diálogo de confirmação primeiro
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Aumentar largura máxima e garantir scroll */}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"> 
        <DialogHeader>
          <div className="flex justify-between items-start">
            {/* Agrupar Título e Info Corretor */} 
            <div className="flex flex-col gap-1">
               {/* Linha Empresa + Status Badge */} 
               <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold m-0 p-0">
                     {form.watch("company_name") || card.company_name || "Detalhes da Proposta"}
            </DialogTitle>
                  <Badge variant={statusBadgeInfo.variant}>{statusBadgeInfo.text}</Badge>
               </div>
              
               {/* Info Corretor com Ícones */} 
               <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                  {/* Corretor */} 
                  <span>
                     <span className="font-semibold">Corretor:</span> {form.watch("broker_name") || "-"}
                  </span>
                  {/* Equipe */} 
                  {form.watch("broker_team_name") && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {form.watch("broker_team_name")}
                    </span>
                  )}
                  {/* Telefone */} 
                  {form.watch("broker_phone") && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {/* TODO: Formatar/mascarar telefone */} 
                      {form.watch("broker_phone")}
                    </span>
                  )}
                  {/* Email */} 
                  {form.watch("broker_email") && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {form.watch("broker_email")}
                    </span>
                  )}
               </div>
            </div>
            
            {/* Botões de Ação */} 
            <div className="flex gap-2 flex-shrink-0">
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
                <Button size="sm" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
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
                  <Card>
                     <CardHeader>
                       <CardTitle>Dados da Empresa</CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-4">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <FormField
                           control={form.control}
                           name="cnpj"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel>CNPJ</FormLabel>
                               <FormControl>
                                 <IMaskInput
                                   mask="00.000.000/0000-00"
                                   unmask={true} // Para salvar apenas os números
                                   value={field.value || ''}
                                   onAccept={(value: any) => field.onChange(value)} // Atualizar form com valor não mascarado
                                   placeholder="00.000.000/0000-00"
                                   // Encaminhar ref e aplicar estilo do Input do Shadcn
                                   inputRef={field.ref as any}
                                   className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                 />
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                              <FormField
                               control={form.control}
                               name="razao_social"
                               render={({ field }) => (
                                 <FormItem>
                                   <FormLabel>Razão Social</FormLabel>
                                   <FormControl>
                                     <Input {...field} placeholder="Razão Social da Empresa" value={field.value || ''} />
                                   </FormControl>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                              <FormField
                               control={form.control}
                               name="nome_fantasia"
                               render={({ field }) => (
                                 <FormItem>
                                   <FormLabel>Nome Fantasia</FormLabel>
                                   <FormControl>
                                     <Input {...field} placeholder="Nome Fantasia da Empresa" value={field.value || ''} />
                                   </FormControl>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                            <FormField
                              control={form.control}
                              name="data_abertura"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Data de Abertura</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="natureza_juridica"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Natureza Jurídica</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Ex: LTDA, SA" value={field.value || ''} readOnly />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={form.control}
                              name="situacao_cadastral"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Situação Cadastral</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Ex: Ativa" value={field.value || ''} readOnly />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="cnae"
                              render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                  <FormLabel>CNAE Principal</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Código e Descrição" value={field.value || ''} readOnly />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                                control={form.control}
                                name="is_mei"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm sm:col-span-2">
                                    <div className="space-y-0.5">
                                      <FormLabel>Empresa é MEI?</FormLabel>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value ?? false}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                       </div>
                       {/* Endereço */}
                       <h4 className="text-md font-semibold pt-4 border-t">Endereço</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <FormField
                           control={form.control}
                           name="cep"
                           render={({ field }) => (
                             <FormItem className="sm:col-span-1">
                               <FormLabel>CEP</FormLabel>
                               <FormControl>
                                 <IMaskInput
                                   mask="00000-000"
                                   unmask={true} // Salvar apenas números?
                                   value={field.value || ''}
                                   onAccept={(value: any) => field.onChange(value)}
                                   placeholder="00000-000"
                                   inputRef={field.ref as any}
                                   // Aplicar estilo do Input
                                   className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                   // TODO: Adicionar onBlur ou onComplete para buscar endereço?
                                 />
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                              <FormField
                               control={form.control}
                               name="logradouro"
                               render={({ field }) => (
                                 <FormItem className="sm:col-span-2">
                                   <FormLabel>Logradouro</FormLabel>
                                   <FormControl>
                                     <Input {...field} placeholder="Rua, Avenida..." value={field.value || ''} />
                                   </FormControl>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                             <FormField
                               control={form.control}
                               name="numero"
                               render={({ field }) => (
                                 <FormItem className="sm:col-span-1">
                                   <FormLabel>Número</FormLabel>
                                   <FormControl>
                                     <Input {...field} placeholder="Nº" value={field.value || ''} />
                                   </FormControl>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                             <FormField
                               control={form.control}
                               name="complemento"
                               render={({ field }) => (
                                 <FormItem className="sm:col-span-2">
                                   <FormLabel>Complemento</FormLabel>
                                   <FormControl>
                                     <Input {...field} placeholder="Apto, Bloco, Sala..." value={field.value || ''} />
                                   </FormControl>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                              <FormField
                               control={form.control}
                               name="bairro"
                               render={({ field }) => (
                                 <FormItem className="sm:col-span-1">
                                   <FormLabel>Bairro</FormLabel>
                                   <FormControl>
                                     <Input {...field} placeholder="Bairro" value={field.value || ''} />
                                   </FormControl>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                             <FormField
                               control={form.control}
                               name="cidade"
                               render={({ field }) => (
                                 <FormItem className="sm:col-span-1">
                                   <FormLabel>Cidade</FormLabel>
                                   <FormControl>
                                     <Input {...field} placeholder="Cidade" value={field.value || ''} />
                                   </FormControl>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                              <FormField
                               control={form.control}
                               name="uf"
                               render={({ field }) => (
                                 <FormItem className="sm:col-span-1">
                                   <FormLabel>UF</FormLabel>
                                   <Select onValueChange={field.onChange} value={field.value || ""}>
                                     <FormControl>
                                       <SelectTrigger>
                                         <SelectValue placeholder="Selecione" />
                                       </SelectTrigger>
                                     </FormControl>
                                     <SelectContent>
                                       {ufOptions.map((option) => (
                                         <SelectItem key={option.value} value={option.value}>
                                           {option.label} ({option.value})
                                         </SelectItem>
                                       ))}
                                     </SelectContent>
                                   </Select>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                       </div>
                     </CardContent>
                  </Card>

                  {/* === Seção Sócios === */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Sócios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PartnersList partners={proposalDetails?.partners} />
                    </CardContent>
                  </Card>

                  {/* === Seção Beneficiários === */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Beneficiários</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BeneficiariesList holders={proposalDetails?.holders} />
                    </CardContent>
                  </Card>

                  {/* === Seção Detalhes do Contrato === */} 
                  <ProposalContractDetails control={form.control} />

                  {/* === Seção Carência === */} 
                  <Card>
                    <CardHeader>
                      <CardTitle>Carência</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <FormField
                         control={form.control}
                         name="has_grace_period"
                         render={({ field }) => (
                           <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                             <div className="space-y-0.5">
                               <FormLabel>Aproveitamento de Carência?</FormLabel>
                             </div>
                             <FormControl>
                               <Switch
                                 checked={field.value ?? false}
                                 onCheckedChange={field.onChange}
                               />
                             </FormControl>
                           </FormItem>
                         )}
                       />
                       {form.watch('has_grace_period') && (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              <FormField
                control={form.control}
                             name="previous_operator_id"
                render={({ field }) => (
                  <FormItem>
                                 <FormLabel>Operadora Anterior</FormLabel>
                    <Select
                                   onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : null)} 
                                   value={String(field.value ?? "")} // Convert number ID to string
                    >
                      <FormControl>
                        <SelectTrigger>
                                       <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                                     {operatorsList.map((op) => (
                                       <SelectItem key={op.id} value={String(op.id)}> {/* Use string ID */}
                                         {op.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
                            <FormField
                              control={form.control}
                              name="grace_reason"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Observações da Carência</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Motivo, documentos enviados..." value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                         </div>
                       )}
                    </CardContent>
                  </Card>

                  {/* === Seção Observações Gerais === */} 
                  <Card>
                    <CardHeader>
                      <CardTitle>Observações Gerais</CardTitle>
                    </CardHeader>
                    <CardContent>
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                              <Textarea rows={4} {...field} placeholder="Anotações gerais sobre a proposta..." value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                    </CardContent>
                  </Card>

                  {/* === Seção Histórico === */} 
                  <Card>
                    <CardHeader>
                      <CardTitle>Histórico</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Criado em: {card.created_at ? formatDate(card.created_at) : 'N/A'}</p>
                        {/* TODO: Buscar nome do usuário a partir de card.created_by */}
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
          <div className="md:col-span-1 p-4 bg-muted rounded-md h-fit sticky top-4">
            <h3 className="font-semibold mb-4">Etapa Atual</h3>
            <p className="text-sm text-muted-foreground"> (Conteúdo da etapa atual será exibido aqui)</p>
                </div>
            
              </div>

      </DialogContent>
    </Dialog>
  );
} 