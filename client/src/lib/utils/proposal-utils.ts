import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipagem para informação do badge de status
export type StatusBadge = {
  variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  text: string;
  icon?: string;
};

// Função para determinar o tipo de badge com base no status
export const getStatusBadge = (status: string | null | undefined): StatusBadge => {
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

// Função para formatar datas no padrão brasileiro
export const formatDate = (dateString: string | null | undefined): string | null => {
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

// Função auxiliar para criar delay (para simulações)
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms)); 