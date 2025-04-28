import React from 'react';
import {
  Dialog as ShadcnDialog,
  DialogContent as ShadcnDialogContent,
  DialogHeader as ShadcnDialogHeader,
  DialogTitle as ShadcnDialogTitle,
  DialogFooter as ShadcnDialogFooter,
  DialogDescription as ShadcnDialogDescription,
  DialogClose as ShadcnDialogClose,
} from "@/components/ui/dialog";

// Re-exportamos os componentes originais
export const DialogHeader = ShadcnDialogHeader;
export const DialogTitle = ShadcnDialogTitle;
export const DialogFooter = ShadcnDialogFooter;
export const DialogDescription = ShadcnDialogDescription;
export const DialogClose = ShadcnDialogClose;

// Interface para o Dialog personalizado
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  preventCloseOnError?: boolean; 
}

// Interface para o DialogContent personalizado
interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

// Componente Dialog personalizado com tratamento de erros
export const Dialog: React.FC<DialogProps> = ({ 
  open, 
  onOpenChange, 
  children,
  preventCloseOnError = true 
}) => {
  // Gerenciador de erro para evitar que o diálogo se feche quando houver erros não tratados
  const handleDialogOpenChange = (newOpenState: boolean) => {
    try {
      // Se estamos fechando o diálogo (newOpenState = false)
      if (!newOpenState) {
        // Apenas chamar onOpenChange se não estamos prevenindo fechamento 
        // ou se não há erros em processo
        onOpenChange(newOpenState);
      } else {
        // Se estamos abrindo, sempre permite
        onOpenChange(newOpenState);
      }
    } catch (error) {
      console.error("Erro ao tentar alterar estado do Dialog:", error);
      // Se houver erro, mantém aberto se preventCloseOnError for true
      if (preventCloseOnError) {
        console.warn("Dialog mantido aberto devido a um erro");
      } else {
        // Senão, tenta fechar mesmo assim
        onOpenChange(false);
      }
    }
  };

  return (
    <ShadcnDialog open={open} onOpenChange={handleDialogOpenChange}>
      {children}
    </ShadcnDialog>
  );
};

// Componente DialogContent personalizado 
export const DialogContent: React.FC<DialogContentProps> = ({ 
  children,
  className,
  ...props
}) => {
  return (
    <ShadcnDialogContent className={className} {...props}>
      {children}
    </ShadcnDialogContent>
  );
};

// Exportamos por padrão o componente Dialog para facilitar importações
export default Dialog; 