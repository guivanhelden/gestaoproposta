import { KanbanCard } from "@/hooks/use-kanban-cards";
import CardSupabase from "@/components/kanban/card-supabase";
import { StatusBadge } from "@/components/ui/status-badge";

type KanbanColumnProps = {
  title: string;
  items: KanbanCard[];
  stageKey: string;
  onCardClick: (card: KanbanCard) => void;
  onDragStart: (cardId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
};

export default function KanbanColumnSupabase({
  title,
  items,
  stageKey,
  onCardClick,
  onDragStart,
  onDragOver,
  onDrop
}: KanbanColumnProps) {
  return (
    <div 
      className="kanban-column"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="kanban-column-header">
        <div className="flex justify-between items-center w-full">
          <h3 className="font-semibold text-purple-700">{title}</h3>
          <StatusBadge className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
            {items.length}
          </StatusBadge>
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
  );
} 