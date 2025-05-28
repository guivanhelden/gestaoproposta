import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// Tipo para os e-mails do card
export type CardEmail = {
  id: string;
  card_id: string;
  message_id: string;
  sender: string;
  recipients: {
    to: string[];
    cc?: string[];
    bcc?: string[];
  };
  subject: string;
  body_text: string;
  body_html?: string;
  attachments?: Array<{
    filename: string;
    storage_path: string;
    content_type: string;
    size: number;
  }>;
  received_at: string;
  created_at: string;
  direction: 'inbound' | 'outbound';
}

export type EmailFormValues = {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}

// Tipo para guardar as informações do broker (corretora)
export type BrokerContactInfo = {
  brokerEmail: string | null;
  teamEmail: string | null;
  brokerName: string | null;
  companyName: string | null;
  operatorName: string | null;
}

export function useCardEmails(cardId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Buscar e-mails
  const {
    data: emails,
    isLoading,
    error
  } = useQuery({
    queryKey: ['kanban_emails', cardId],
    queryFn: async () => {
      if (!cardId) return [];
      
      const { data, error } = await supabase
        .from('kanban_emails')
        .select('*')
        .eq('card_id', cardId)
        .order('received_at', { ascending: false });
        
      if (error) throw error;
      return data as CardEmail[] || [];
    },
    enabled: !!cardId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Buscar informações de contato do broker associado ao card
  const {
    data: brokerInfo
  } = useQuery<BrokerContactInfo>({
    queryKey: ['broker_contact_info', cardId],
    queryFn: async () => {
      if (!cardId) return { 
        brokerEmail: null, 
        teamEmail: null, 
        brokerName: null, 
        companyName: null, 
        operatorName: null 
      };
      
      // Buscar submission_id relacionado ao card
      const { data: cardData, error: cardError } = await supabase
        .from('kanban_cards')
        .select('submission_id, company_name')
        .eq('id', cardId)
        .single();
      
      if (cardError || !cardData?.submission_id) {
        console.warn("Não foi possível encontrar submission_id para o card:", cardError);
        return { 
          brokerEmail: null, 
          teamEmail: null, 
          brokerName: null, 
          companyName: cardData?.company_name || null, 
          operatorName: null 
        };
      }
      
      // Buscar dados completos da submission incluindo broker e operadora
      const { data: submissionData, error: submissionError } = await supabase
        .from('pme_submissions')
        .select(`
          broker_id,
          operator_id,
          brokers:broker_id (
            name,
            email_corretor,
            equipe_id,
            equipe:equipe_id (
              email
            )
          ),
          operators:operator_id (
            name
          )
        `)
        .eq('id', cardData.submission_id)
        .single();
      
      if (submissionError) {
        console.warn("Erro ao buscar dados da submission:", submissionError);
        return { 
          brokerEmail: null, 
          teamEmail: null, 
          brokerName: null, 
          companyName: cardData?.company_name || null, 
          operatorName: null 
        };
      }
      
      // Extrair dados do broker e operadora
      const brokerData = submissionData.brokers as any;
      const operatorData = submissionData.operators as any;
      const teamEmail = brokerData?.equipe?.email || null;
      
      console.log("Dados completos obtidos:", { 
        brokerEmail: brokerData?.email_corretor, 
        teamEmail,
        brokerName: brokerData?.name,
        companyName: cardData?.company_name,
        operatorName: operatorData?.name,
        submissionData
      });
      
      return {
        brokerEmail: brokerData?.email_corretor || null,
        teamEmail,
        brokerName: brokerData?.name || null,
        companyName: cardData?.company_name || null,
        operatorName: operatorData?.name || null
      };
    },
    enabled: !!cardId,
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
  
  // Enviar e-mail
  const sendEmailMutation = useMutation({
    mutationFn: async (values: EmailFormValues) => {
      if (!cardId) throw new Error("ID do cartão não definido");
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: JSON.stringify({
          cardId,
          to: values.to,
          cc: values.cc,
          subject: values.subject,
          body: values.body
        })
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "E-mail enviado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['kanban_emails', cardId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao enviar e-mail", 
        description: error?.message || "Ocorreu um erro ao enviar o e-mail", 
        variant: "destructive" 
      });
    }
  });
  
  // Copiar endereço de e-mail para a área de transferência
  const copyEmailAddress = () => {
    if (!cardId) return;
    
    const emailAddress = `${cardId}@mail.vhseguros.com.br`;
    navigator.clipboard.writeText(emailAddress)
      .then(() => {
        toast({ title: "Endereço de e-mail copiado!" });
      })
      .catch(() => {
        toast({ 
          title: "Erro ao copiar", 
          description: "Não foi possível copiar o endereço para a área de transferência", 
          variant: "destructive" 
        });
      });
  };
  
  // Gerar endereço de e-mail do card
  const cardEmailAddress = cardId ? `${cardId}@mail.vhseguros.com.br` : "";
  
  return {
    emails,
    isLoading,
    error,
    sendEmail: sendEmailMutation.mutate,
    isSending: sendEmailMutation.isPending,
    cardEmailAddress,
    copyEmailAddress,
    brokerInfo // Retornar as informações do broker
  };
} 