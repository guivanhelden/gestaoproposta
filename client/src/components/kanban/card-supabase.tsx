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
    return formatDate(dateString);
  };

  const dueDate = formatDueDate(card.due_date);
  const creationDate = formatDate(card.created_at);

  return (
    <div
      className="kanban-card bg-white p-3 rounded-md border border-pink-200 shadow-md hover:shadow-lg hover:border-gray-300 transition-all duration-150 cursor-pointer"
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 
          className="font-medium text-gray-800 truncate max-w-[180px]"
          title={card.company_name || "Sem nome"}
        >
          {card.company_name || "Sem nome"}
        </h4>
        <span className="badge badge-info text-xs flex-shrink-0 ml-2">
          {card.operator}
        </span>
      </div>
      
      {card.lives > 0 && (
        <div className="mt-1 flex items-center text-sm text-gray-600">
          <UserCheck className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{card.lives} vidas</span>
        </div>
      )}
      
      {dueDate && (
        <div className="mt-1 flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Venc: {dueDate}</span>
        </div>
      )}
      
      <div className="mt-1 flex items-center text-sm text-gray-600">
        <Tag className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>R$ {card.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {creationDate}
        </span>
        
        <div className="flex space-x-1">
          {card.has_documents && (
            <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center" title="Possui documentos">
              <FileText className="h-3 w-3 text-blue-600" />
            </span>
          )}
          
          {card.has_comments && (
            <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center" title="Possui comentários">
              <MessageSquare className="h-3 w-3 text-green-600" />
            </span>
          )}
          
          {card.has_warnings && (
            <span className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center" title="Possui alertas">
              <AlertTriangle className="h-3 w-3 text-red-600" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 