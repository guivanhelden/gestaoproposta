import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from "../../lib/supabase"; // Ajuste o caminho se necessário
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
import {
  KanbanCommentWithProfile,
  kanbanCommentSchema,
  KanbanCommentFormValues,
} from '@/lib/database.types'; // Corrigindo o caminho do import novamente
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KanbanCommentsProps {
  comments: KanbanCommentWithProfile[] | undefined;
  isLoadingComments: boolean;
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

export function KanbanComments({ comments, isLoadingComments, cardId, userId }: KanbanCommentsProps) {
  const queryClient = useQueryClient();

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

  return (
    <div className="flex flex-col h-full space-y-4 pr-2">
      <h3 className="text-lg font-semibold mb-2">Comentários</h3>

      <ScrollArea className="flex-grow h-[calc(100%-180px)] pr-4"> {/* Ajuste altura conforme necessário */}
        <div className="space-y-4">
          {isLoadingComments ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))
          ) : comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.profiles?.avatar_url ?? undefined} alt={comment.profiles?.name ?? 'Usuário'} />
                  <AvatarFallback>{getInitials(comment.profiles?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {comment.profiles?.name ?? 'Usuário desconhecido'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhum comentário ainda.
            </p>
          )}
        </div>
      </ScrollArea>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-3 pt-2 border-t">
            <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                <FormItem>
                    {/* <FormLabel>Novo Comentário</FormLabel> */}
                    <FormControl>
                    <Textarea
                        placeholder="Adicione um comentário..."
                        className="resize-none"
                        rows={3}
                        {...field}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <Button type="submit" disabled={isAddingComment} className="self-end">
                {isAddingComment ? 'Enviando...' : 'Comentar'}
            </Button>
        </form>
      </Form>
    </div>
  );
} 