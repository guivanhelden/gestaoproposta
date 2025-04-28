import { KanbanCard } from "@/hooks/use-kanban-cards";
import CardSupabase from "@/components/kanban/card-supabase";
import { StatusBadge } from "@/components/ui/status-badge";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import StageFieldsConfigModal from './StageFieldsConfigModal';

type KanbanColumnProps = {
  title: string;
  items: KanbanCard[];
  stageId: string;
  stageKey: string;
  onCardClick: (card: KanbanCard) => void;
  onDragStart: (cardId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
};

export default function KanbanColumnSupabase({
  title,
  items,
  stageId,
  stageKey,
  onCardClick,
  onDragStart,
  onDragOver,
  onDrop
}: KanbanColumnProps) {

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const { user, /* hasRole */ } = useAuth();
  
  // Verificar se o array user.roles (que é string[]) contém a role 'admin'
  const isAdmin = user?.roles?.includes('admin') || false;

  return (
    <>
      <div 
        className="kanban-column"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="kanban-column-header">
          <div className="flex justify-between items-center w-full gap-2">
            <h3 className="font-semibold text-purple-700 flex-grow truncate">{title}</h3>
            <div className="flex items-center flex-shrink-0">
               <StatusBadge className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                 {items.length}
               </StatusBadge>
               {isAdmin && (
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsConfigModalOpen(true)}
                 >
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Configurar Campos</span>
                 </Button>
               )}
            </div>
          </div>
        </div>
        
        <div className="kanban-column-body">
          {items.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm italic">
              Nenhum cartão neste estágio
            </div>
          ) : (
            items.map(card => (
              <CardSupabase
                key={card.id}
                card={card}
                onClick={() => onCardClick(card)}
                onDragStart={() => onDragStart(card.id)}
              />
            ))
          )}
        </div>
      </div>
      
      <StageFieldsConfigModal
          stageId={stageId}
          stageTitle={title}
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
      />
    </>
  );
} 