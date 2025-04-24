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
export const equipeFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido").optional().nullable(),
  telefone: z.string().optional().nullable(),
  foto_url: z.string().optional().nullable(),
  status: z.boolean().default(true)
});

export type EquipeFormValues = z.infer<typeof equipeFormSchema>;

// Tipo para representar uma equipe conforme vem do banco
export interface Equipe {
  id: number;
  name: string | null;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
  status: boolean | null;
  created_at: string;
  updated_at: string | null;
}

interface EquipeFormProps {
  editingEquipe: Equipe | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function EquipeForm({ editingEquipe, onClose, onSubmitSuccess }: EquipeFormProps) {
  const { toast } = useToast();
  
  // Formulário com validação
  const form = useForm<EquipeFormValues>({
    resolver: zodResolver(equipeFormSchema),
    defaultValues: {
      name: "",
      email: null,
      telefone: null,
      foto_url: null,
      status: true
    }
  });

  // Atualizar o formulário quando a equipe a ser editada mudar
  useEffect(() => {
    if (editingEquipe) {
      form.reset({
        name: editingEquipe.name || "",
        email: editingEquipe.email,
        telefone: editingEquipe.telefone,
        foto_url: editingEquipe.foto_url,
        status: editingEquipe.status ?? true
      });
    } else {
      form.reset({
        name: "",
        email: null,
        telefone: null,
        foto_url: null,
        status: true
      });
    }
  }, [editingEquipe, form]);

  // Mutação para criar equipe
  const createEquipeMutation = useMutation({
    mutationFn: async (data: EquipeFormValues) => {
      // Utilizando any para contornar as limitações de tipagem do Supabase
      const { error, data: newEquipe } = await (supabase as any)
        .from('equipe')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return newEquipe;
    },
    onSuccess: () => {
      toast({
        title: "Equipe criada",
        description: "A equipe foi criada com sucesso!",
      });
      onSubmitSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao criar equipe:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a equipe. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar equipe
  const updateEquipeMutation = useMutation({
    mutationFn: async (data: EquipeFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      // Utilizando any para contornar as limitações de tipagem do Supabase
      const { error, data: updatedEquipe } = await (supabase as any)
        .from('equipe')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedEquipe;
    },
    onSuccess: () => {
      toast({
        title: "Equipe atualizada",
        description: "A equipe foi atualizada com sucesso!",
      });
      onSubmitSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao atualizar equipe:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a equipe. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Função de submit
  const onSubmit = (values: EquipeFormValues) => {
    if (editingEquipe) {
      updateEquipeMutation.mutate({
        ...values,
        id: editingEquipe.id
      });
    } else {
      createEquipeMutation.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Equipe</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da equipe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de Contato</FormLabel>
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
              name="telefone"
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
            
            <FormField
              control={form.control}
              name="foto_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Foto/Logo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://exemplo.com/foto.jpg"
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Equipe Ativa</FormLabel>
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
            disabled={createEquipeMutation.isPending || updateEquipeMutation.isPending}
          >
            {createEquipeMutation.isPending || updateEquipeMutation.isPending 
              ? "Salvando..." 
              : "Salvar Equipe"
            }
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
