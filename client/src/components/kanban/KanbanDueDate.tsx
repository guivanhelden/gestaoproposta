import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useKanbanCards } from '@/hooks/use-kanban-cards'; 
import { Badge } from '@/components/ui/badge'; 

interface KanbanDueDateProps {
  cardId: string;
  boardId: string; // Necessário para o hook useKanbanCards
  initialDueDate: string | null; // ISO string ou null
  initialStatus: string | null;
}

// Função auxiliar para obter a classe do badge
// Mapear para variantes existentes do Badge: destructive (Atrasado), warning (Em breve), secondary (No prazo/Sem data)
const getDueDateStatusBadgeVariant = (status: string | null): 'destructive' | 'warning' | 'secondary' => {
  switch (status) {
    case 'Atrasado':
      return 'destructive';
    case 'Entrega em breve':
      return 'warning';
    case 'No prazo':
    case 'Sem data':
    default:
      return 'secondary';
  }
};

// Função auxiliar para formatar a data e hora
const formatDateTime = (dateString: string | null) => {
  if (!dateString) return 'Sem data definida';
  try {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Data inválida";
  }
};

export function KanbanDueDate({ cardId, boardId, initialDueDate, initialStatus }: KanbanDueDateProps) {
  // Estado local
  const [dueDateISO, setDueDateISO] = useState<string | null>(initialDueDate);
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [isUpdating, setIsUpdating] = useState<boolean>(false); 

  const { updateCard } = useKanbanCards(boardId); 

  // Atualizar o estado local quando as props mudam
  useEffect(() => {
    setDueDateISO(initialDueDate);
    setStatus(initialStatus);
  }, [initialDueDate, initialStatus]);

  // Manipulador para as mudanças de data/hora
  const handleDueDateChange = async (newDueDateISO: string | null) => {
    // Evitar atualizações desnecessárias
    if (newDueDateISO === dueDateISO) return;
    
    // Iniciar estado de carregamento
    setIsUpdating(true);
    
    try {
      // Atualização otimista do estado local
      setDueDateISO(newDueDateISO);
      
      // Enviar para o backend
      updateCard(
        { id: cardId, due_date: newDueDateISO }, 
        { 
          onSuccess: (updatedCardData) => {
            setDueDateISO(updatedCardData.due_date);
            setStatus(updatedCardData.due_date_status); 
            toast.success("Data de vencimento atualizada!");
            setIsUpdating(false); 
          },
          onError: (error) => {
            console.error("Erro ao atualizar due_date:", error);
            toast.error(`Erro ao salvar data: ${error.message}`);
            // Reverter ao valor original em caso de erro
            setDueDateISO(initialDueDate); 
            setStatus(initialStatus); 
            setIsUpdating(false); 
          }
        }
      );
    } catch (error: any) {
      console.error("Erro ao processar atualização:", error);
      toast.error(`Erro ao processar data: ${error.message}`);
      setDueDateISO(initialDueDate);
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 bg-gradient-to-b from-muted/60 to-muted/30 rounded-md border shadow-sm h-fit">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-primary" />
        Data de Vencimento
      </h3>
      
      <div className="space-y-4">
        {dueDateISO && (
          <div className="text-sm font-medium">
            {formatDateTime(dueDateISO)}
          </div>
        )}
        
        <DateTimePicker 
          value={dueDateISO} 
          onChange={handleDueDateChange}
          placeholder="Selecione data e hora"
          disabled={isUpdating} 
        />
        
        {status && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">Status:</div>
            <Badge 
              variant={getDueDateStatusBadgeVariant(status)}
              className="text-sm py-1 px-3"
            >
              {status}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

export default KanbanDueDate;