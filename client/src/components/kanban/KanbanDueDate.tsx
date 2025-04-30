import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CalendarClock, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useKanbanCards } from '@/hooks/use-kanban-cards'; 
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
      return 'secondary';
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
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

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
        <div className="text-sm font-medium flex items-center justify-between">
          <span>{dueDateISO ? formatDateTime(dueDateISO) : 'Sem data definida'}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="h-8 w-8 p-0 rounded-full hover:bg-blue-50 transition-colors"
          >
            <CalendarClock className="h-5 w-5 text-blue-500 hover:text-blue-600" />
          </Button>
        </div>
        
        {isCalendarOpen && (
          <div className="relative">
            <div className="flex justify-end mb-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsCalendarOpen(false)}
                className="h-7 w-7 rounded-full absolute -top-2 -right-2 z-10 bg-white shadow-sm border"
              >
                <X className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
            <DateTimePicker 
              value={dueDateISO} 
              onChange={(newDate) => {
                handleDueDateChange(newDate);
                setIsCalendarOpen(false);
              }}
              placeholder="Selecione data e hora"
              disabled={isUpdating} 
            />
          </div>
        )}
        
        {status && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">Status:</div>
            <Badge 
              variant={getDueDateStatusBadgeVariant(status)}
              className={`text-sm py-1 px-3 ${status === 'No prazo' ? 'bg-green-100 text-green-800' : ''}`}
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