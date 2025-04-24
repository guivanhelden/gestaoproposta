import { useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useKanbanBoards } from "@/hooks/use-kanban-boards";
import { Loader2 } from "lucide-react";

export default function Quadros() {
  const [, navigate] = useLocation();
  const { boards, isLoading, error } = useKanbanBoards();

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Quadros de Propostas</h2>
              <p className="text-gray-600">Visualize e gerencie propostas por estágio e modalidade</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <span>Carregando quadros...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <h3 className="text-red-800 font-medium mb-2">Erro ao carregar quadros</h3>
                <p className="text-red-600">
                  {error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'}
                </p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Tentar novamente
                </Button>
              </div>
            ) : boards?.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <h3 className="text-blue-800 font-medium mb-2">Nenhum quadro encontrado</h3>
                <p className="text-blue-600 mb-6">
                  Você ainda não tem quadros criados. Comece criando seu primeiro quadro.
                </p>
                <Button onClick={() => navigate("/quadros/gerenciador")}>
                  Ir para o Gerenciador de Quadros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boards?.map(board => (
                  <Card key={board.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4 text-primary">{board.title}</h3>
                      <p className="text-gray-600 mb-6">
                        {board.description || `Quadro para gerenciamento de propostas - ${board.type}`}
                      </p>
                      <Button 
                        className="w-full"
                        onClick={() => navigate(`/quadros/visualizar/${board.id}`)}
                      >
                        Acessar Quadro
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                
                <Card className="border-dashed border-2 hover:shadow-md transition-shadow bg-gray-50">
                  <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                    <h3 className="text-xl font-semibold mb-4 text-gray-600">Criar Novo Quadro</h3>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/quadros/gerenciador")}
                      className="w-full"
                    >
                      Gerenciar Quadros
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
