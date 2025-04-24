import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ProposalHistory } from "@shared/schema";
import { StatusBadge } from "@/components/ui/status-badge";

export default function RecentActions() {
  // Buscar histórico de propostas
  const { data: history, isLoading } = useQuery({
    queryKey: ["/api/proposals/history"],
    select: (data: any[]) => {
      // Ordenar por data mais recente
      return [...data].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5);
    }
  });

  // Função para traduzir ações
  const getActionText = (action: string, stage?: string) => {
    switch (action) {
      case "create":
        return "Nova Proposta Criada";
      case "update_stage":
        return `Movido para ${translateStage(stage || "")}`;
      case "send_email":
        return "E-mail enviado";
      default:
        return "Ação realizada";
    }
  };

  // Função para traduzir estágios
  const translateStage = (stage: string) => {
    const stages: {[key: string]: string} = {
      "entrada-proposta": "Entrada de Proposta",
      "verificacao-documentos": "Verificação de Documentos",
      "pendencias-iniciais": "Pendências Iniciais",
      "insercao-dados": "Inserção de Dados na Operadora",
      "avaliacao-tecnica": "Avaliação Técnica",
      "pendencia-operadora": "Pendência pela Operadora",
      "assinatura-pendente": "Assinatura Pendente",
      "pagamento-pendente": "Pagamento Pendente",
      "contrato-ativo": "Contrato Ativo Vigente"
    };
    
    return stages[stage] || stage;
  };

  // Função para colorir status
  const getStatusVariant = (action: string, stage?: string) => {
    if (action === "create") return "primary";
    if (action === "send_email") return "info";
    
    switch (stage) {
      case "pendencias-iniciais":
      case "pendencia-operadora":
        return "warning";
      case "contrato-ativo":
        return "success";
      case "assinatura-pendente":
      case "pagamento-pendente":
        return "warning";
      default:
        return "info";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Últimas Ações</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proposta
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Corretor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ação
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary border-r-transparent align-[-0.125em]" />
                  <span className="ml-2">Carregando ações recentes...</span>
                </td>
              </tr>
            ) : history && history.length > 0 ? (
              history.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{item.proposalId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.proposal?.companyName || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.user?.name || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge variant={getStatusVariant(item.action, item.stage)}>
                      {getActionText(item.action, item.stage)}
                    </StatusBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(item.createdAt), "dd/MM/yyyy, HH:mm", { locale: pt })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  Nenhuma ação recente encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
