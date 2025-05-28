import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, X, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCardEmails, EmailFormValues } from '@/hooks/use-card-emails';

// Schema de validação para o formulário de e-mail
const emailFormSchema = z.object({
  to: z
    .string()
    .min(5, 'Preencha um email válido')
    .email('Formato de email inválido'),
  cc: z
    .string()
    .email('Formato de email inválido')
    .optional()
    .or(z.literal('')),
  subject: z
    .string()
    .min(2, 'O assunto precisa ter pelo menos 2 caracteres')
    .max(100, 'O assunto não pode exceder 100 caracteres'),
  body: z
    .string()
    .min(5, 'O corpo do email precisa ter pelo menos 5 caracteres')
});

interface EmailFormProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  replyTo?: string; // E-mail para responder (opcional)
  replySubject?: string; // Assunto original (opcional para resposta)
  defaultCc?: string; // Email da equipe para ser copiada por padrão
  replyBody?: string; // Corpo do email original para resposta
  allRecipients?: string[]; // Todos os destinatários do email original
}

export default function EmailForm({ 
  isOpen, 
  onClose, 
  cardId,
  replyTo,
  replySubject,
  defaultCc = '',
  replyBody = '',
  allRecipients = []
}: EmailFormProps) {
  const { sendEmail, isSending, brokerInfo } = useCardEmails(cardId);
  
  console.log("EmailForm received props:", { replyTo, replySubject, defaultCc, cardId });
  console.log("BrokerInfo from hook:", brokerInfo);
  
  // Função para criar título padrão
  const createDefaultSubject = () => {
    if (replySubject) {
      return `Re: ${replySubject.startsWith('Re:') ? replySubject.substring(3).trim() : replySubject}`;
    }
    
    // Criar título padrão para novo email
    const parts = [];
    if (brokerInfo?.companyName) parts.push(brokerInfo.companyName);
    if (brokerInfo?.operatorName) parts.push(brokerInfo.operatorName);
    if (brokerInfo?.brokerName) parts.push(brokerInfo.brokerName);
    
    return parts.length > 0 ? `Proposta - ${parts.join(' | ')}` : 'Nova Proposta';
  };

  // Função para criar corpo padrão da resposta
  const createReplyBody = () => {
    if (!replyTo) return '';
    
    let body = '\n\n\n---\n';
    body += `Em resposta ao email de ${replyTo}\n`;
    
    if (replyBody) {
      body += '\nEmail original:\n';
      body += replyBody.split('\n').map(line => `> ${line}`).join('\n');
    }
    
    return body;
  };

  // Define valores padrão, especialmente para respostas
  const defaultValues: Partial<EmailFormValues> = {
    to: replyTo || '',
    cc: replyTo && allRecipients.length > 0 ? allRecipients.filter(email => email !== replyTo).join(', ') : (defaultCc || ''),
    subject: createDefaultSubject(),
    body: replyTo ? createReplyBody() : '',
  };
  
  console.log("EmailForm defaultValues:", defaultValues);
  
  // Configuração do formulário com React Hook Form
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues,
    mode: 'onChange', // Validar em tempo real
  });
  
  // Atualizar os campos quando broker info for carregado do banco
  useEffect(() => {
    // Se não temos um replyTo específico e temos o email do broker, preenchemos o campo "to"
    if (!replyTo && brokerInfo?.brokerEmail && form.getValues('to') === '') {
      form.setValue('to', brokerInfo.brokerEmail);
    }
    
    // Se não temos um cc específico e temos o email da equipe, preenchemos o campo "cc"
    if (defaultCc === '' && brokerInfo?.teamEmail && form.getValues('cc') === '') {
      form.setValue('cc', brokerInfo.teamEmail);
    }
    
    // Atualizar o assunto quando as informações do broker estiverem disponíveis
    if (!replySubject && brokerInfo && form.getValues('subject') === 'Nova Proposta') {
      form.setValue('subject', createDefaultSubject());
    }
  }, [brokerInfo, replyTo, defaultCc, replySubject, form]);
  
  // Função para lidar com o envio do formulário
  const onSubmit = (values: EmailFormValues) => {
    console.log("Tentando enviar email com valores:", values);
    
    try {
      sendEmail(values, {
        onSuccess: () => {
          console.log("Email enviado com sucesso!");
          form.reset(); // Limpa o formulário
          onClose(); // Fecha o diálogo
        },
        onError: (error) => {
          console.error("Erro ao enviar email:", error);
        }
      });
    } catch (error) {
      console.error("Exceção ao tentar enviar email:", error);
    }
  };

  // Manipulador para o botão de envio direto
  const handleSendClick = () => {
    console.log("Botão de envio clicado diretamente");
    
    // Verificar se o formulário é válido manualmente
    const values = form.getValues();
    const errors = form.formState.errors;
    
    console.log("Valores atuais:", values);
    console.log("Erros do formulário:", errors);
    
    // Verificar manualmente sem confiar apenas no isValid
    let hasErrors = false;
    
    if (!values.to || values.to.length < 5 || !values.to.includes('@')) {
      console.log("Erro no campo 'to'");
      hasErrors = true;
    }
    
    if (!values.subject || values.subject.length < 2) {
      console.log("Erro no campo 'subject'");
      hasErrors = true;
    }
    
    if (!values.body || values.body.length < 5) {
      console.log("Erro no campo 'body'");
      hasErrors = true;
    }
    
    // Envio manual mesmo se houver erros, para tentar contornar problemas
    if (hasErrors) {
      console.log("Formulário tem erros, mas tentando enviar mesmo assim para debug");
    }
    
    // Enviar mesmo com erros para debug
    try {
      sendEmail(values, {
        onSuccess: () => {
          console.log("Email enviado com sucesso!");
          form.reset(); // Limpa o formulário
          onClose(); // Fecha o diálogo
        },
        onError: (error) => {
          console.error("Erro ao enviar email:", error);
        }
      });
    } catch (error) {
      console.error("Exceção ao tentar enviar email:", error);
    }
  };

  // Manipulador para evitar que cliques no diálogo se propaguem
  const handleDialogClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Manipulador para o botão cancelar
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };
  
  // Manipulador para o form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    // Evitar que o evento se propague ou acione submissões em elementos pais
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Form submit acionado");
    console.log("Valores do formulário:", form.getValues());
    console.log("Erros do formulário:", form.formState.errors);
    
    // O form.handleSubmit vai gerenciar a submissão
    form.handleSubmit(onSubmit)(e);
  };
  
  // Criar um portal separado para o dialog garantir que ele esteja fora da árvore DOM do formulário principal
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-md md:max-w-xl" 
        onClick={handleDialogClick}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              replyTo ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
            }`}>
              <Send className="h-4 w-4" />
            </div>
            {replyTo ? 'Responder E-mail' : 'Novo E-mail'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {replyTo ? (
              <>
                Resposta ao e-mail recebido
                {allRecipients.length > 0 && (
                  <span className="text-muted-foreground"> • {allRecipients.length} destinatário(s) disponível(is)</span>
                )}
              </>
            ) : (
              <>
                Envie um e-mail relacionado a esta proposta
                {brokerInfo?.companyName && (
                  <span className="text-muted-foreground"> • {brokerInfo.companyName}</span>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Para
                    {replyTo && (
                      <span className="text-xs text-muted-foreground bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        Resposta para: {replyTo}
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={replyTo ? "Edite o destinatário se necessário" : "email@exemplo.com"} 
                      className={replyTo ? "border-blue-200 bg-blue-50/30" : ""}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Cc (opcional)
                    {replyTo && allRecipients.length > 0 && (
                      <span className="text-xs text-muted-foreground bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                        {allRecipients.length} destinatário(s) incluído(s)
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={
                        replyTo && allRecipients.length > 0 
                          ? "Destinatários em cópia (editável)" 
                          : "outroemail@exemplo.com"
                      } 
                      className={replyTo && allRecipients.length > 0 ? "border-purple-200 bg-purple-50/30" : ""}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Assunto
                    {replySubject && (
                      <span className="text-xs text-muted-foreground bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                        Resposta automática
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={replySubject ? "Assunto da resposta (editável)" : "Assunto do e-mail"} 
                      className={replySubject ? "border-green-200 bg-green-50/30" : ""}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Mensagem
                    {replyTo && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Resposta incluída abaixo
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={replyTo ? "Digite sua resposta aqui..." : "Digite sua mensagem aqui..."} 
                      rows={replyTo ? 12 : 8}
                      className="resize-none font-mono text-sm"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Futuramente: Implementar upload de anexos */}
            
            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSending}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                disabled={isSending}
                onClick={handleSendClick}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 