import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useKanbanBoards } from '@/hooks/use-kanban-boards';

export default function QuadrosPage() {
  const [location, navigate] = useLocation();
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const { boards, isLoading, error } = useKanbanBoards();

  const handleOpenBoardModal = () => setIsBoardModalOpen(true);
  const handleCloseBoardModal = () => setIsBoardModalOpen(false);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Gerenciador de Quadros</h1>
        <Button onClick={handleOpenBoardModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo Quadro
        </Button>
      </div>
      
      {isLoading && <div>Carregando quadros...</div>}
      {error && <div className="text-red-500">Erro ao carregar quadros: {error.message}</div>}
      {boards && boards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(board => (
            <div key={board.id} className="border p-4 rounded shadow hover:shadow-md cursor-pointer" onClick={() => navigate(`/quadros/visualizar/${board.id}`)}>
              <h3 className="font-medium">{board.title}</h3>
            </div>
          ))}
        </div>
      )}
      {boards && boards.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
           Nenhum quadro encontrado. Crie um novo!
        </div>
      )}

      <BoardManagerDialog 
        isOpen={isBoardModalOpen} 
        onClose={handleCloseBoardModal} 
      />
    </div>
  );
}
