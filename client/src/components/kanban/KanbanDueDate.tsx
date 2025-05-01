import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CalendarClock, X, AlarmClock, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useKanbanCards } from '@/hooks/use-kanban-cards'; 
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

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
    <Card className="relative overflow-hidden border-border/50 bg-card/50 h-fit" 
          style={{ boxShadow: "0 4px 20px -5px rgba(162, 0, 243, 0.28), 0 2px 10px -5px rgba(162, 0, 243, 0.32)" }}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400/30 via-pink-500/60 to-pink-400/30"></div>
      
      <CardHeader className="p-3 pb-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-pink-500/10 text-pink-500">
              <AlarmClock className="h-3.5 w-3.5" />
            </div>
            <CardTitle className="text-sm font-medium text-foreground/90">
              Vencimento
            </CardTitle>
          </div>
          
          <Badge 
            variant={getDueDateStatusBadgeVariant(status)}
            className="text-[10px] px-2 py-0.5"
          >
            {status || 'Sem data'}
          </Badge>
        </div>
        <Separator className="mt-2" />
      </CardHeader>
      
      <CardContent className="p-3 pt-2 space-y-2">
        <AnimatePresence mode="wait">
          <motion.div
            key="due-date-content"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-pink-500" />
              <span className="text-xs font-medium">
                {dueDateISO ? formatDateTime(dueDateISO) : 'Sem data definida'}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="h-7 w-7 p-0 rounded-full hover:bg-blue-50 transition-colors"
            >
              <CalendarClock className="h-4 w-4 text-blue-500 hover:text-blue-600" />
            </Button>
          </motion.div>
        </AnimatePresence>
        
        {isCalendarOpen && (
          <motion.div 
            className="relative mt-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-end mb-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsCalendarOpen(false)}
                className="h-6 w-6 rounded-full absolute -top-2 -right-2 z-10 bg-white shadow-sm border p-0"
              >
                <X className="h-3.5 w-3.5 text-gray-600" />
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
          </motion.div>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center justify-center px-3 py-1.5 border-t bg-muted/10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-[10px] text-muted-foreground flex items-center">
                <CalendarClock className="h-3 w-3 mr-1 text-blue-500" />
                <span>Vencimento do cartão</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>Define o prazo para conclusão deste cartão.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}

export default KanbanDueDate;