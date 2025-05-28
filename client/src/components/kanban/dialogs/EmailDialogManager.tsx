import React, { forwardRef, useImperativeHandle, useState } from 'react';
import EmailForm from '../../email/EmailForm';

export interface EmailDialogRef {
  openComposeEmail: (replyToEmail?: string, replySubject?: string) => void;
}

interface EmailDialogManagerProps {
  cardId: string;
}

const EmailDialogManager = forwardRef<EmailDialogRef, EmailDialogManagerProps>(
  ({ cardId }, ref) => {
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [replyToEmail, setReplyToEmail] = useState<string | undefined>(undefined);
    const [replySubject, setReplySubject] = useState<string | undefined>(undefined);

    console.log("EmailDialogManager props:", { 
      cardId, 
      isComposeOpen
    });

    // Expõe métodos para o componente pai
    useImperativeHandle(ref, () => ({
      openComposeEmail: (replyTo?: string, subject?: string) => {
        // Usar timeout para evitar race conditions com outros eventos
        // Isso garante que todos os outros eventos foram processados
        setTimeout(() => {
          console.log("openComposeEmail called with:", { replyTo, subject });
          setReplyToEmail(replyTo);
          setReplySubject(subject);
          setIsComposeOpen(true);
        }, 50);
      },
    }));

    const handleCloseCompose = (e?: React.MouseEvent) => {
      // Se houver um evento, impedir propagação
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setIsComposeOpen(false);
      setReplyToEmail(undefined);
      setReplySubject(undefined);
    };

    return (
      <>
        {/* Diálogo para compor novo email - renderizado fora de qualquer contexto de formulário */}
        <EmailForm
          isOpen={isComposeOpen}
          onClose={handleCloseCompose}
          cardId={cardId}
          replyTo={replyToEmail}
          replySubject={replySubject}
        />
      </>
    );
  }
);

EmailDialogManager.displayName = 'EmailDialogManager';

export default EmailDialogManager; 