import React, { createContext, useContext, useState } from "react";

// Interface para o contexto
interface DndContextType {
  draggedItem: any;
  setDraggedItem: React.Dispatch<React.SetStateAction<any>>;
}

// Criar o contexto
const DndContext = createContext<DndContextType | undefined>(undefined);

// Hook para usar o contexto
export function useDnd() {
  const context = useContext(DndContext);
  if (context === undefined) {
    throw new Error("useDnd must be used within a DndProvider");
  }
  return context;
}

// Provider component
export function DndProvider({ children }: { children: React.ReactNode }) {
  const [draggedItem, setDraggedItem] = useState<any>(null);

  // Valor do contexto
  const value = {
    draggedItem,
    setDraggedItem
  };

  return (
    <DndContext.Provider value={value}>
      {children}
    </DndContext.Provider>
  );
}
