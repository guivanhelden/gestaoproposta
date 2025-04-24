import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import supabase from "../../lib/supabase";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DialogFooter } from "@/components/ui/dialog";

// Schema para validação do formulário
export const corretorFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  equipe: z.string().optional(),
  equipe_id: z.number().nullable().optional(), // Alterado para number já que é bigint no banco
  ativo: z.boolean().default(true),
  email_corretor: z.string().email("E-mail inválido").optional().nullable(),
  telefone_corretor: z.string().optional().nullable()
});

export type CorretorFormValues = z.infer<typeof corretorFormSchema>;

// Tipo para representar um corretor conforme vem do banco
export interface Corretor {
  id: number;
  name: string;
  equipe?: string | null;
  equipe_id?: number | null; // Alterado para number já que é bigint no banco
  ativo: boolean;
  email_corretor?: string | null;
  telefone_corretor?: string | null;
}

interface CorretorFormProps {
  editingCorretor: Corretor | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
  equipes?: { id: number; nome: string }[];
}

export default function CorretorForm({ editingCorretor, onClose, onSubmitSuccess, equipes = [] }: CorretorFormProps) {
  const { toast } = useToast();
  
  // Formulário com validação
  const form = useForm<CorretorFormValues>({
    resolver: zodResolver(corretorFormSchema),
    defaultValues: {
      name: "",
      equipe: "",
      equipe_id: null,
      ativo: true,
      email_corretor: "",
      telefone_corretor: ""
    }
  });

  // Atualizar o formulário quando o corretor a ser editado mudar
  useEffect(() => {
    if (editingCorretor) {
      form.reset({
        name: editingCorretor.name ?? "",
        equipe: editingCorretor.equipe ?? "",
        equipe_id: editingCorretor.equipe_id ?? null,
        ativo: editingCorretor.ativo ?? true,
        email_corretor: editingCorretor.email_corretor ?? "",
        telefone_corretor: editingCorretor.telefone_corretor ?? ""
      });
    } else {
      form.reset({
        name: "",
        equipe: "",
        equipe_id: null,
        ativo: true,
        email_corretor: "",
        telefone_corretor: ""
      });
    }
  }, [editingCorretor, form]);

  // Mutação para criar corretor
  const createCorretorMutation = useMutation({
    mutationFn: async (data: CorretorFormValues) => {
      // Utilizando any para contornar as limitações de tipagem do Supabase
      const { error, data: newCorretor } = await (supabase as any)
        .from('brokers')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return newCorretor;
    },
    onSuccess: () => {
      toast({
        title: "Corretor criado",
        description: "O corretor foi criado com sucesso!",
      });
      onSubmitSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao criar corretor:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar o corretor. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar corretor
  const updateCorretorMutation = useMutation({
    mutationFn: async (data: CorretorFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      // Utilizando any para contornar as limitações de tipagem do Supabase
      const { error, data: updatedCorretor } = await (supabase as any)
        .from('brokers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedCorretor;
    },
    onSuccess: () => {
      toast({
        title: "Corretor atualizado",
        description: "O corretor foi atualizado com sucesso!",
      });
      onSubmitSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao atualizar corretor:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o corretor. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Função de submit
  const onSubmit = (values: CorretorFormValues) => {
    if (editingCorretor) {
      updateCorretorMutation.mutate({
        ...values,
        id: editingCorretor.id
      });
    } else {
      createCorretorMutation.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Corretor *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email_corretor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="equipe_id"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Equipe</FormLabel>
                    <FormControl>
                      {/* Usando um select HTML nativo */}
                      <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value ? field.value.toString() : ""}
                        onChange={(e) => {
                          // Converter string para number ou null
                          const idValue = e.target.value ? Number(e.target.value) : null;
                          field.onChange(idValue);
                          
                          // Atualizar o nome da equipe também
                          if (idValue !== null) {
                            const equipe = equipes.find(eq => eq.id === idValue);
                            if (equipe) {
                              form.setValue("equipe", equipe.nome);
                            }
                          } else {
                            form.setValue("equipe", "");
                          }
                        }}
                      >
                        <option value="">Nenhuma</option>
                        {equipes.map((equipe) => (
                          <option key={equipe.id} value={equipe.id.toString()}>
                            {equipe.nome}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            
            <FormField
              control={form.control}
              name="telefone_corretor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 00000-0000"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Corretor Ativo</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={createCorretorMutation.isPending || updateCorretorMutation.isPending}
          >
            {createCorretorMutation.isPending || updateCorretorMutation.isPending 
              ? "Salvando..." 
              : "Salvar Corretor"
            }
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
