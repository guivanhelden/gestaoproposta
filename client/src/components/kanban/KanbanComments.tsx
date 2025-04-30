import React, { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import supabase from "@/lib/supabase";
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Send, MessageCircle, Loader2, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Definições movidas de database.types.ts

// Tipagem para o comentário buscado do Supabase, incluindo informações do perfil do autor
// Usamos a tipagem gerada pelo Supabase e estendemos/modificamos conforme necessário
type ProfileData = {
  name: string | null;
  avatar_url: string | null;
};
export interface KanbanCommentWithProfile {
  id: string;
  content: string;
  created_at: string;
  card_id: string;
  user_id: string;
  updated_at: string;
  profiles: ProfileData | null; // A query junta profiles, então garantimos que ele existe aqui
}

// Schema Zod para validação do formulário de novo comentário
export const kanbanCommentSchema = z.object({
  content: z.string().min(1, { message: 'O comentário não pode estar vazio.' }),
});

// Tipo inferido a partir do schema Zod para os valores do formulário
export type KanbanCommentFormValues = z.infer<typeof kanbanCommentSchema>;

interface KanbanCommentsProps {
  cardId: string;
  userId: string | undefined; // ID do usuário logado
}

// Função auxiliar para obter iniciais
const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length === 1) return names[0][0].toUpperCase();
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

export function KanbanComments({ cardId, userId }: KanbanCommentsProps) {
  const queryClient = useQueryClient();

  const { data: comments, isLoading: isLoadingComments } = useQuery<KanbanCommentWithProfile[]>({
    queryKey: ['kanban_comments', cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_comments')
        .select(`
          id,
          content,
          created_at,
          card_id,
          user_id,
          updated_at,
          profiles (
            name,
            avatar_url
          )
        `)
        .eq('card_id', cardId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar comentários:', error);
        toast.error(`Falha ao buscar comentários: ${error.message}`);
        throw new Error('Não foi possível buscar os comentários.');
      }
      // A FK foi corrigida, a tipagem direta deve funcionar.
      // Supabase deve retornar dados que correspondem a KanbanCommentWithProfile[]
      return (data as KanbanCommentWithProfile[] | null) || [];
    },
    enabled: !!cardId, // Só executa a query se cardId existir
  });

  const form = useForm<KanbanCommentFormValues>({
    resolver: zodResolver(kanbanCommentSchema),
    defaultValues: {
      content: '',
    },
  });

  const { mutate: addComment, isPending: isAddingComment } = useMutation({
    mutationFn: async (newCommentData: { content: string; card_id: string; user_id: string }) => {
        const { error } = await supabase
            .from('kanban_comments')
            .insert([newCommentData]);

        if (error) {
            console.error('Erro ao adicionar comentário:', error);
            toast.error(`Falha ao adicionar comentário: ${error.message}`);
            throw new Error('Não foi possível adicionar o comentário.');
        }
        return null;
    },
    onSuccess: () => {
      toast.success('Comentário adicionado!');
      queryClient.invalidateQueries({ queryKey: ['kanban_comments', cardId] });
      form.reset();
    },
    onError: (error) => {
        // O erro já é logado e mostrado no toast dentro de mutationFn
        console.error('Mutation error:', error);
    },
  });

  const onSubmit = (data: KanbanCommentFormValues) => {
    if (!userId) {
        toast.error('Usuário não autenticado.');
        return;
    }
    addComment({ ...data, card_id: cardId, user_id: userId });
  };

  // Referência para o final da lista de comentários
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
  // Função para rolar para o comentário mais recente
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Rolar para baixo quando novos comentários são carregados
  useEffect(() => {
    if (comments && comments.length > 0 && !isLoadingComments) {
      scrollToBottom();
    }
  }, [comments, isLoadingComments]);

  return (
    <Card className="flex flex-col h-full shadow-sm border-border/50 bg-card/50 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary">
            <MessageCircle className="h-3.5 w-3.5" />
          </div>
          <h3 className="font-medium text-sm">Comentários</h3>
        </div>
        
        {comments && comments.length > 0 && (
          <Badge variant="outline" className="text-xs font-normal">
            {comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-grow h-[calc(100%-140px)] p-3" scrollHideDelay={300}>
        <div className="space-y-4">
          {isLoadingComments ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3 animate-pulse">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-16 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments && comments.length > 0 ? (
            <AnimatePresence initial={false}>
              <div className="space-y-5">
                {comments.map((comment, index) => (
                  <motion.div 
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={cn(
                      "group relative",
                      comment.user_id === userId && "ml-2"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className={cn(
                        "h-9 w-9 border-2 border-background",
                        comment.user_id === userId ? "ring-1 ring-primary" : ""  
                      )}>
                        <AvatarImage 
                          src={comment.profiles?.avatar_url ?? undefined} 
                          alt={comment.profiles?.name ?? 'Usuário'} 
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(comment.profiles?.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={cn(
                        "flex-1 space-y-1.5 p-3 rounded-lg",
                        comment.user_id === userId 
                          ? "bg-primary/5 border border-primary/10" 
                          : "bg-muted/30 border border-border/50"
                      )}>
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-sm font-medium",
                            comment.user_id === userId ? "text-primary" : "text-foreground"  
                          )}>
                            {comment.profiles?.name ?? 'Usuário desconhecido'}
                            {comment.user_id === userId && (
                              <Badge variant="outline" className="ml-2 py-0 h-4 text-[10px]">
                                Você
                              </Badge>
                            )}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                    
                    {index < comments.length - 1 && (
                      <div className="absolute left-4 top-9 w-[1px] h-[calc(100%)]" 
                        style={{
                          background: "linear-gradient(to bottom, transparent, var(--border), transparent)"
                        }}
                      />
                    )}
                  </motion.div>
                ))}
                <div ref={commentsEndRef} /> {/* Elemento para rolar até o fim */}
              </div>
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-muted/50 p-3 mb-3">
                <MessageCircle className="h-10 w-10 text-muted-foreground opacity-50" />
              </div>
              <p className="text-muted-foreground">Nenhum comentário ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Seja o primeiro a comentar</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-card">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Textarea
                        placeholder="Adicione um comentário..."
                        className="resize-none pr-12 min-h-[80px] bg-muted/50 focus-visible:bg-background"
                        {...field}
                      />
                      <Button 
                        type="submit" 
                        size="icon"
                        disabled={isAddingComment || !field.value.trim()} 
                        className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
                      >
                        {isAddingComment ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </Card>
  );
}