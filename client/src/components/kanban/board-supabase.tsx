import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useKanbanStages } from "@/hooks/use-kanban-stages";
import { useKanbanCards } from "@/hooks/use-kanban-cards";
import KanbanColumnSupabase from "@/components/kanban/column-supabase";
import { KanbanCard } from "@/hooks/use-kanban-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

type KanbanBoardSupabaseProps = {
  boardId: string;
  onCardClick: (card: KanbanCard) => void;
};

export default function KanbanBoardSupabase({ boardId, onCardClick }: KanbanBoardSupabaseProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Buscar estágios do quadro
  const { 
    stages, 
    isLoading: stagesLoading, 
    error: stagesError 
  } = useKanbanStages(boardId);
  
  // Buscar cartões do quadro
  const { 
    cards, 
    cardsByStage,
    isLoading: cardsLoading, 
    error: cardsError,
    moveCard 
  } = useKanbanCards(boardId);

  const isLoading = stagesLoading || cardsLoading;
  const error = stagesError || cardsError;

  const handleDragStart = (cardId: string) => {
    setDraggingId(cardId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStageId: string) => {
    e.preventDefault();
    
    if (draggingId === null) return;
    
    // Encontrar o cartão sendo arrastado
    let draggedCard: KanbanCard | undefined;
    if (cards) {
      draggedCard = cards.find(card => card.id === draggingId);
    }
    
    if (!draggedCard || draggedCard.stage_id === targetStageId) {
      setDraggingId(null);
      return;
    }
    
    // Calcular nova posição do cartão no estágio de destino
    let newPosition = 0;
    const cardsInTargetStage = cardsByStage[targetStageId] || [];
    if (cardsInTargetStage.length > 0) {
      newPosition = Math.max(...cardsInTargetStage.map(card => card.position)) + 1;
    }
    
    // Mover o cartão para o novo estágio
    moveCard({
      cardId: draggedCard.id,
      targetStageId,
      position: newPosition
    }, {
      onSuccess: () => {
        toast({
          title: "Cartão movido",
          description: "O cartão foi movido com sucesso"
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Erro ao mover cartão",
          description: error.message,
          variant: "destructive"
        });
      }
    });
    
    setDraggingId(null);
  };

  if (isLoading) {
    return (
      <div className="kanban-board">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="kanban-column">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="kanban-cards">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-32 w-full mb-3" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
        <div>
          <h3 className="text-red-800 font-medium">Erro ao carregar o quadro</h3>
          <p className="text-red-600 text-sm">
            {error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'}
          </p>
        </div>
      </div>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Nenhum estágio encontrado para este quadro.</p>
      </div>
    );
  }

  return (
    <div className="kanban-board">
      {stages.map((stage) => (
        <KanbanColumnSupabase
          key={stage.id}
          title={stage.title}
          items={cardsByStage[stage.id] || []}
          stageId={stage.id}
          onCardClick={onCardClick}
          stageKey={stage.id}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, stage.id)}
        />
      ))}
    </div>
  );
} 