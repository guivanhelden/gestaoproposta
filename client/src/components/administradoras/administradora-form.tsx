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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema para validação do formulário
export const administradoraFormSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  logo_url: z.string().optional().nullable(),
  id_six: z.number().optional().nullable(),
  status: z.boolean().default(true)
});

export type AdministradoraFormValues = z.infer<typeof administradoraFormSchema>;

// Tipo para representar uma administradora conforme vem do banco
export interface Administradora {
  id: string;
  nome: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  id_six: number | null;
  status: boolean | null;
}

interface AdministradoraFormProps {
  editingAdministradora: Administradora | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function AdministradoraForm({ editingAdministradora, onClose, onSubmitSuccess }: AdministradoraFormProps) {
  const { toast } = useToast();
  
  // Formulário com validação
  const form = useForm<AdministradoraFormValues>({
    resolver: zodResolver(administradoraFormSchema),
    defaultValues: {
      nome: "",
      logo_url: null,
      id_six: null,
      status: true
    }
  });

  // Atualizar o formulário quando a administradora a ser editada mudar
  useEffect(() => {
    if (editingAdministradora) {
      form.reset({
        nome: editingAdministradora.nome,
        logo_url: editingAdministradora.logo_url,
        id_six: editingAdministradora.id_six,
        status: editingAdministradora.status ?? true
      });
    } else {
      form.reset({
        nome: "",
        logo_url: null,
        id_six: null,
        status: true
      });
    }
  }, [editingAdministradora, form]);

  // Mutação para criar administradora
  const createAdministradoraMutation = useMutation({
    mutationFn: async (data: AdministradoraFormValues) => {
      // Utilizando any para contornar as limitações de tipagem do Supabase
      const { error, data: newAdministradora } = await (supabase as any)
        .from('administradoras')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return newAdministradora;
    },
    onSuccess: () => {
      toast({
        title: "Administradora criada",
        description: "A administradora foi criada com sucesso!",
      });
      onSubmitSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao criar administradora:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a administradora. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar administradora
  const updateAdministradoraMutation = useMutation({
    mutationFn: async (data: AdministradoraFormValues & { id: string }) => {
      const { id, ...updateData } = data;
      // Utilizando any para contornar as limitações de tipagem do Supabase
      const { error, data: updatedAdministradora } = await (supabase as any)
        .from('administradoras')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedAdministradora;
    },
    onSuccess: () => {
      toast({
        title: "Administradora atualizada",
        description: "A administradora foi atualizada com sucesso!",
      });
      onSubmitSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao atualizar administradora:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a administradora. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Função de submit
  const onSubmit = (values: AdministradoraFormValues) => {
    if (editingAdministradora) {
      updateAdministradoraMutation.mutate({
        ...values,
        id: editingAdministradora.id
      });
    } else {
      createAdministradoraMutation.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Administradora</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Qualicorp, Allcare" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Logo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://exemplo.com/logo.png"
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
              name="id_six"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID no Sistema SIX</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="ID numérico no SIX"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : null;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Administradora Ativa</FormLabel>
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
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={createAdministradoraMutation.isPending || updateAdministradoraMutation.isPending}
          >
            {createAdministradoraMutation.isPending || updateAdministradoraMutation.isPending 
              ? "Salvando..." 
              : "Salvar Administradora"
            }
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
