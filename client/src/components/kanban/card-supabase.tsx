import { KanbanCard } from "@/hooks/use-kanban-cards";
import { Building, UserRoundCheck, Users, Calendar, Tag, FileText, MessageSquare, AlertTriangle, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type CardSupabaseProps = {
  card: KanbanCard;
  onClick: () => void;
  onDragStart: () => void;
};

export default function CardSupabase({ card, onClick, onDragStart }: CardSupabaseProps) {
  console.log("Props recebidas pelo CardSupabase:", card);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };

  // Formatar a data de vencimento, se existir
  const formatDueDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };

  const dueDate = formatDueDate(card.due_date);
  const creationDate = formatDate(card.created_at);
  const operatorLogoUrl = card.operators?.logo_url;

  // Função para definir a cor de fundo do card com base no status da data
  const getCardBorderColor = () => {
    if (card.due_date_status === 'Atrasado') {
      return 'border-l-4 border-l-red-500 border-t border-r border-b border-pink-100';
    } else if (card.due_date_status === 'Entrega em breve') {
      return 'border-l-4 border-l-amber-500 border-t border-r border-b border-pink-100';
    }
    return 'border border-pink-100';
  };

  return (
    <div
      className={`kanban-card bg-white p-3.5 rounded-md ${getCardBorderColor()} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
    >
      {/* Cabeçalho do card com título e operadora */}
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h4 
            className="font-medium text-gray-800 truncate text-sm"
            title={card.company_name || "Sem nome"}
          >
            {card.company_name || "Sem nome"}
          </h4>
          {card.cnpj && (
            <p className="text-xs text-gray-500 truncate" title={card.cnpj}>
              {card.cnpj}
            </p>
          )}
        </div>
        {operatorLogoUrl ? (
          <img 
            src={operatorLogoUrl} 
            alt={`Logo ${card.operator}`}
            className="h-6 w-auto flex-shrink-0 object-contain rounded"
            onError={(e) => { 
              const imgElement = e.target as HTMLImageElement;
              imgElement.style.display = 'none';
            }}
          />
        ) : (
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">
            {card.operator}
          </span>
        )}
      </div>
      
      {/* Informações do card */}
      <div className="space-y-2">
        {card.pme_submissions?.broker?.name && (
          <div className="flex items-center text-xs text-gray-700">
            <UserRoundCheck className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-500" />
            <span className="truncate" title={card.pme_submissions.broker.name}>
              {card.pme_submissions.broker.name}
            </span>
          </div>
        )}
        
        {dueDate && (
          <div className="flex flex-wrap items-center text-xs text-gray-700 gap-1.5">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-500" />
              <span>{dueDate}</span>
            </div>
            {card.due_date_status && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium
                ${card.due_date_status === 'Atrasado' 
                  ? 'bg-red-100 text-red-800' 
                  : card.due_date_status === 'Entrega em breve' 
                    ? 'bg-amber-100 text-amber-800' 
                    : card.due_date_status === 'No prazo'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-slate-100 text-slate-800'}`
              }>
                {card.due_date_status}
              </span>
            )}
          </div>
        )}
        
        {card.pme_submissions?.modality && (
          <div className="flex items-center text-xs text-gray-700">
            <Tag className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-500" />
            <span className="font-medium">{card.pme_submissions.modality}</span>
          </div>
        )}
      </div>
      
      {/* Rodapé do card */}
      <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {creationDate}
        </span>
        
        <div className="flex space-x-1.5">
          {card.has_documents && (
            <span className="h-5 w-5 rounded-full bg-blue-50 flex items-center justify-center" title="Possui documentos">
              <FileText className="h-3 w-3 text-blue-600" />
            </span>
          )}
          
          {card.has_comments && (
            <span className="h-5 w-5 rounded-full bg-green-50 flex items-center justify-center" title="Possui comentários">
              <MessageSquare className="h-3 w-3 text-green-600" />
            </span>
          )}
          
          {card.has_warnings && (
            <span className="h-5 w-5 rounded-full bg-red-50 flex items-center justify-center" title="Possui alertas">
              <AlertTriangle className="h-3 w-3 text-red-600" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 