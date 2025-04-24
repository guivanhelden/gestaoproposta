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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DialogFooter } from "@/components/ui/dialog";

// Schema para validação do formulário
export const operatorFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  active: z.boolean().default(true),
  categoria: z.string().optional(),
  logo_url: z.string().optional(),
  id_six: z.number().nullable().optional(),
  gestor: z.string().optional(),
  gestor_phone: z.string().optional(),
  gestor_email: z.string().email("Email inválido").optional(),
  url_emissao: z.string().optional(),
  url_passo_passo: z.string().optional()
});

export type OperatorFormValues = z.infer<typeof operatorFormSchema>;

// Categorias de operadoras disponíveis
export const CATEGORIAS_OPERADORAS = ["PREMIUM", "MASTER", "PLUS", "NAO PONTUA"];

// Tipo para representar uma operadora conforme vem do banco
export interface Operator {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  categoria?: string | null;
  logo_url?: string | null;
  id_six?: number | null;
  gestor?: string | null;
  gestor_phone?: string | null;
  gestor_email?: string | null;
  url_emissao?: string | null;
  url_passo_passo?: string | null;
}

interface OperadoraFormProps {
  editingOperator: Operator | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function OperadoraForm({ editingOperator, onClose, onSubmitSuccess }: OperadoraFormProps) {
  const { toast } = useToast();
  
  // Formulário com validação
  const form = useForm<OperatorFormValues>({
    resolver: zodResolver(operatorFormSchema),
    defaultValues: {
      name: "",
      description: "",
      active: true,
      categoria: "",
      logo_url: "",
      id_six: null,
      gestor: "",
      gestor_phone: "",
      gestor_email: "",
      url_emissao: "",
      url_passo_passo: ""
    }
  });

  // Atualizar o formulário quando o operador a ser editado mudar
  useEffect(() => {
    if (editingOperator) {
      form.reset({
        name: editingOperator.name ?? "",
        description: editingOperator.description ?? "",
        active: editingOperator.active,
        categoria: editingOperator.categoria ?? "",
        logo_url: editingOperator.logo_url ?? "",
        id_six: editingOperator.id_six ?? null,
        gestor: editingOperator.gestor ?? "",
        gestor_phone: editingOperator.gestor_phone ?? "",
        gestor_email: editingOperator.gestor_email ?? "",
        url_emissao: editingOperator.url_emissao ?? "",
        url_passo_passo: editingOperator.url_passo_passo ?? "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        active: true,
        categoria: "",
        logo_url: "",
        id_six: null,
        gestor: "",
        gestor_phone: "",
        gestor_email: "",
        url_emissao: "",
        url_passo_passo: "",
      });
    }
  }, [editingOperator, form]);

  // Mutação para criar operadora
  const createOperatorMutation = useMutation({
    mutationFn: async (data: OperatorFormValues) => {
      // Utilizando any para contornar as limitações de tipagem do Supabase
      const { error, data: newOperator } = await (supabase as any)
        .from('operators')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return newOperator;
    },
    onSuccess: () => {
      toast({
        title: "Operadora criada",
        description: "A operadora foi criada com sucesso!",
      });
      onSubmitSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao criar operadora:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a operadora. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar operadora
  const updateOperatorMutation = useMutation({
    mutationFn: async (data: OperatorFormValues & { id: string }) => {
      const { id, ...updateData } = data;
      // Utilizando any para contornar as limitações de tipagem do Supabase
      const { error, data: updatedOperator } = await (supabase as any)
        .from('operators')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedOperator;
    },
    onSuccess: () => {
      toast({
        title: "Operadora atualizada",
        description: "A operadora foi atualizada com sucesso!",
      });
      onSubmitSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao atualizar operadora:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a operadora. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Função de submit
  const onSubmit = (values: OperatorFormValues) => {
    if (editingOperator) {
      updateOperatorMutation.mutate({
        ...values,
        id: editingOperator.id
      });
    } else {
      createOperatorMutation.mutate(values);
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
                  <FormLabel>Nome da Operadora *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite a descrição..."
                      className="resize-none"
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
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Logo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite a URL do logo..."
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
              name="id_six"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Six</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Digite o ID Six..."
                      {...field}
                      value={field.value === null ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? null : parseInt(value, 10));
                      }}
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
              name="categoria"
              render={({ field }) => {
                // Validar os dados antes de renderizar
                console.log("Categorias disponíveis:", CATEGORIAS_OPERADORAS);
                console.log("Valor atual do campo:", field.value);
                console.log("editingOperator?.categoria:", editingOperator?.categoria);
                
                // Garantir que o valor nunca seja undefined/null
                const safeValue = field.value ?? "";
                
                return (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      {/* Usando um select HTML nativo em vez do componente Radix UI */}
                      <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={safeValue}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        {/* Opção vazia/null */}
                        <option value="">Nenhuma</option>
                        {/* Opções da lista de categorias */}
                        {CATEGORIAS_OPERADORAS
                          .filter(cat => cat && cat.trim() !== "") // Garantir que não há categorias vazias
                          .map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))
                        }
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
        
            <FormField
              control={form.control}
              name="gestor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gestor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do gestor..."
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
              name="gestor_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone do Gestor</FormLabel>
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
              name="gestor_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email do Gestor</FormLabel>
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
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="url_emissao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de Emissão</FormLabel>
                <FormControl>
                  <Input
                    placeholder="URL de emissão..."
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
            name="url_passo_passo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de Passo a Passo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="URL de passo a passo..."
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Operadora Ativa</FormLabel>
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
            disabled={createOperatorMutation.isPending || updateOperatorMutation.isPending}
          >
            {createOperatorMutation.isPending || updateOperatorMutation.isPending 
              ? "Salvando..." 
              : "Salvar Operadora"
            }
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
