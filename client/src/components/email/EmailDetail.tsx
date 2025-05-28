import React from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  User, 
  Paperclip, 
  Download,
  ExternalLink,
  Reply,
  ReplyAll
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate } from '@/lib/utils/proposal-utils';
import { cn } from '@/lib/utils';
import supabase from '@/lib/supabase';
import { CardEmail } from '@/hooks/use-card-emails';

// Tipos importados do hook (repetidos aqui para simplificar)
interface EmailAttachment {
  filename: string;
  storage_path: string;
  content_type: string;
  size: number;
}

interface EmailDetailProps {
  email: CardEmail;
  onBack: () => void;
  onReply?: (email: CardEmail, replyAll?: boolean) => void; // Modificado para incluir replyAll
}

// Função auxiliar para obter ícone baseado no tipo de arquivo
function getFileIcon(mimeType: string) {
  // Simplificado para este exemplo
  if (mimeType.startsWith('image/')) {
    return '🖼️';
  } else if (mimeType.startsWith('application/pdf')) {
    return '📄';
  } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return '📊';
  } else if (mimeType.includes('word') || mimeType.includes('document')) {
    return '📝';
  }
  return '📎';
}

// Função para calcular tamanho legível
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

// Função simples para sanitizar HTML
function sanitizeHtml(html: string): string {
  // Uma versão simplificada que remove scripts e eventos inline
  // Em produção, é recomendável usar uma biblioteca como DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '');
}

export default function EmailDetail({ email, onBack, onReply }: EmailDetailProps) {
  // Determinar cor baseada na direção do email
  const colorClass = email.direction === 'inbound' 
    ? "from-green-400/30 via-green-500/60 to-green-400/30" 
    : "from-blue-400/30 via-blue-500/60 to-blue-400/30";
  
  const bgIconClass = email.direction === 'inbound' 
    ? "bg-green-500/10 text-green-500" 
    : "bg-blue-500/10 text-blue-500";
  
  // Verifica se o email tem destinatários em CC
  const hasCc = email.recipients?.cc && email.recipients.cc.length > 0;
  
  // Handler para o botão de responder
  const handleReply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onReply) {
      onReply(email, false);
    }
  };
  
  // Handler para o botão de responder a todos
  const handleReplyAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onReply) {
      onReply(email, true);
    }
  };
  
  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/50 h-full">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colorClass}`}></div>
      
      <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 mr-1"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center h-7 w-7 rounded-full ${bgIconClass}`}>
              <Mail className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-medium text-foreground/90">
              {email.subject || "(Sem assunto)"}
            </CardTitle>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botões de resposta - somente para emails recebidos */}
          {email.direction === 'inbound' && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                onClick={handleReply}
              >
                <Reply className="h-3.5 w-3.5" />
                Responder
              </Button>
              
              {hasCc && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                  onClick={handleReplyAll}
                >
                  <ReplyAll className="h-3.5 w-3.5" />
                  Responder a todos
                </Button>
              )}
            </>
          )}
          
          <Badge 
            variant={email.direction === 'inbound' ? "secondary" : "default"} 
            className={cn(
              "capitalize",
              email.direction === 'inbound' ? "bg-green-500/80 hover:bg-green-600 text-white" : "bg-blue-500/80 hover:bg-blue-600 text-white"
            )}
          >
            {email.direction === 'inbound' ? 'Recebido' : 'Enviado'}
          </Badge>
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="p-0">
        <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 p-4 bg-muted/10 text-sm border-b">
          <span className="text-muted-foreground font-medium">De:</span>
          <span>{email.sender}</span>
          
          <span className="text-muted-foreground font-medium">Para:</span>
          <span>{email.recipients?.to?.join(', ') || '-'}</span>
          
          {email.recipients?.cc && email.recipients.cc.length > 0 && (
            <>
              <span className="text-muted-foreground font-medium">Cc:</span>
              <span>{email.recipients.cc.join(', ')}</span>
            </>
          )}
          
          <span className="text-muted-foreground font-medium">Data:</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {formatDate(email.received_at)}
          </span>
        </div>
        
        <ScrollArea className="h-[300px]">
          <div className="p-4">
            {/* Renderizar HTML se disponível, ou texto plano como fallback */}
            {email.body_html ? (
              <div 
                className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-a:text-primary"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHtml(email.body_html) 
                }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm">
                {email.body_text || "Sem conteúdo"}
              </div>
            )}
            
            {/* Anexos */}
            {email.attachments && email.attachments.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  Anexos ({email.attachments.length})
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {email.attachments.map((attachment, index) => {
                    // Gerar URL para o anexo
                    const { data: urlData } = supabase.storage
                      .from('email-attachments')
                      .getPublicUrl(attachment.storage_path);
                    
                    return (
                      <div 
                        key={index}
                        className="flex items-center gap-2 p-2 border rounded-md bg-muted/5 hover:bg-muted/20 transition-colors"
                      >
                        <div className="text-lg">
                          {getFileIcon(attachment.content_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {attachment.filename}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)}
                          </div>
                        </div>
                        <a 
                          href={urlData?.publicUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-primary hover:text-primary/80"
                          download={attachment.filename}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 