import React, { useState } from 'react';
import { 
  Mail, 
  Calendar,
  Copy, 
  ChevronRight, 
  Loader2, 
  Send,
  AlertCircle,
  Download,
  Paperclip,
  RefreshCw,
  ChevronsUpDown,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCardEmails, CardEmail } from '@/hooks/use-card-emails';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
import EmailDetail from './EmailDetail';
import EmailForm from './EmailForm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";

// Interface estendida para email com opção de responder a todos
interface ReplyEmailData extends CardEmail {
  replyAll?: boolean;
}

interface EmailListProps {
  cardId: string;
  onComposeEmail: () => void;
  hideHeader?: boolean;
}

export default function EmailList({ cardId, onComposeEmail, hideHeader = false }: EmailListProps) {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false); // Estado para o Collapsible
  const [replyFormOpen, setReplyFormOpen] = useState(false); // Estado para formulário de resposta
  const [replyToEmail, setReplyToEmail] = useState<ReplyEmailData | null>(null); // Email para responder
  const queryClient = useQueryClient();
  const { 
    emails, 
    isLoading, 
    error, 
    cardEmailAddress, 
    copyEmailAddress 
  } = useCardEmails(cardId);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['kanban_emails', cardId] });
  };

  // Função para prevenir a propagação do evento de clique
  const handleComposeClick = (e: React.MouseEvent) => {
    // Impede qualquer comportamento padrão e propagação de eventos
    e.preventDefault();
    e.stopPropagation();
    
    // Usar setTimeout para garantir que o evento de clique termine completamente
    // antes de chamar onComposeEmail
    setTimeout(() => {
      onComposeEmail();
    }, 10);
    
    // Evitar que o evento acione qualquer outro handler
    return false;
  };
  
  // Função para responder a um email
  const handleReplyEmail = (email: CardEmail, replyAll: boolean = false) => {
    console.log("Respondendo ao email:", email, "Responder a todos:", replyAll);
    setReplyToEmail({
      ...email,
      replyAll // Adicionar flag para indicar resposta a todos
    } as ReplyEmailData);
    setReplyFormOpen(true);
  };
  
  // Função para fechar o formulário de resposta
  const handleCloseReplyForm = () => {
    setReplyFormOpen(false);
    setReplyToEmail(null);
  };

  if (error) {
    return (
      <Card className="border-border/50 bg-card/50 overflow-hidden h-full">
        <CardHeader className="p-4 pb-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-red-500/10 text-red-500">
                <AlertCircle className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-medium text-foreground/90">
                E-mails da Proposta
              </CardTitle>
            </div>
          </div>
          <CardDescription className="text-xs mt-2 text-red-500">
            Erro ao carregar e-mails. Tente novamente mais tarde.
          </CardDescription>
          <Separator className="mt-2" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 flex justify-center">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se um email estiver selecionado, mostrar a visualização detalhada
  if (selectedEmailId && emails) {
    const selectedEmail = emails.find(email => email.id === selectedEmailId);
    if (selectedEmail) {
      return (
        <>
          {/* Formulário de resposta a email */}
          <EmailForm
            isOpen={replyFormOpen}
            onClose={handleCloseReplyForm}
            cardId={cardId}
            replyTo={replyToEmail?.sender || ''}
            replySubject={replyToEmail?.subject || ''}
            defaultCc={replyToEmail?.replyAll && replyToEmail?.recipients?.cc ? 
              replyToEmail.recipients.cc.join(', ') : ''}
            replyBody={replyToEmail?.body_text || ''}
            allRecipients={replyToEmail?.replyAll ? [
              ...(replyToEmail.recipients?.to || []),
              ...(replyToEmail.recipients?.cc || [])
            ] : []}
          />
          
          <EmailDetail 
            email={selectedEmail} 
            onBack={() => setSelectedEmailId(null)}
            onReply={handleReplyEmail}
          />
        </>
      );
    }
  }

  return (
    <>
      <Card className="relative overflow-hidden border-border/50 bg-card/50 h-full" 
            style={{ boxShadow: "0 4px 20px -5px rgba(145, 92, 182, 0.28), 0 2px 10px -5px rgba(120, 79, 164, 0.32)" }}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400/30 via-purple-500/60 to-purple-400/30"></div>
        
        {!hideHeader && (
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-purple-500/10 text-purple-500">
                  <Mail className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-medium text-foreground/90">
                  E-mails da Proposta
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                {isLoading ? '...' : emails?.length || 0} e-mails
              </Badge>
            </div>
            <CardDescription className="text-xs mt-2">
              E-mails enviados e recebidos relacionados a esta proposta
            </CardDescription>
            <Separator className="mt-2" />
          </CardHeader>
        )}
      
        <div className="px-4 py-2 bg-muted/10 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="font-medium mr-2">Endereço:</span>
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
              {cardEmailAddress}
            </code>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={copyEmailAddress}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copiar endereço</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="w-full border-t border-border/30"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted/10 [&[data-state=open]>svg]:rotate-180">
            <div className="flex flex-1 items-center justify-between mr-2">
              <div className="flex items-center">
                <span>E-mails da Proposta</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {isLoading ? '...' : emails?.length || 0} e-mails
                </Badge>
              </div>
              
              {/* Botão para novo email - sempre visível */}
              <Button
                variant="default"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-sm"
                onClick={handleComposeClick}
                type="button"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Novo E-mail
              </Button>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <AnimatePresence initial={false}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="border rounded-md p-3 space-y-2">
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <Skeleton className="h-5 w-60" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : emails && emails.length > 0 ? (
                    <ScrollArea className="h-[320px]">
                      <div className="p-2 space-y-2">
                        {emails.map((email) => (
                          <div 
                            key={email.id}
                            className={cn(
                              "border rounded-lg p-4 transition-all cursor-pointer shadow-sm",
                              "hover:bg-muted/30 hover:border-purple-400/50 hover:shadow-md",
                              "bg-card/50 border-border/40"
                            )}
                            onClick={() => setSelectedEmailId(email.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {email.direction === 'inbound' ? (
                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 bg-green-50 text-green-700 border-green-200 font-medium">
                                      Recebido
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                      Enviado
                                    </Badge>
                                  )}
                                  <span className="text-xs font-medium truncate max-w-[150px] text-foreground/80">
                                    {email.direction === 'inbound' ? email.sender : email.recipients.to.join(', ')}
                                  </span>
                                </div>
                                <h4 className="text-sm font-semibold truncate text-foreground/90 leading-tight">{email.subject || "(Sem assunto)"}</h4>
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {formatDistanceToNow(new Date(email.received_at), { 
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {email.body_text || "Sem conteúdo"}
                              </p>
                            </div>
                            
                            {email.attachments && email.attachments.length > 0 && (
                              <div className="mt-2 flex items-center gap-1">
                                <Paperclip className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {email.attachments.length} {email.attachments.length === 1 ? 'anexo' : 'anexos'}
                                </span>
                              </div>
                            )}
                            
                            <div className="mt-2 flex justify-end">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                        <Mail className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-medium mb-1">Nenhum e-mail encontrado</h3>
                      <p className="text-xs text-muted-foreground mb-4 max-w-[220px]">
                        Ainda não há e-mails associados a esta proposta.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleComposeClick}
                        className="text-xs"
                        type="button"
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Enviar primeiro e-mail
                      </Button>
                    </div>
                  )}
                </CardContent>
              </motion.div>
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>
        
        <CardFooter className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="text-purple-500 font-medium">i</span> 
            Comunicação por e-mail
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-muted-foreground flex items-center">
                  <Info className="h-3.5 w-3.5 mr-1" />
                  <span>Endereço dedicado</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Cada proposta tem um endereço de e-mail exclusivo para comunicação.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>
    </>
  );
} 