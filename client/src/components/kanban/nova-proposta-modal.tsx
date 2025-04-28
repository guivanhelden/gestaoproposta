import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { fetchBrokers, fetchActiveOperators, BrokerOption, OperatorOption } from '@/lib/api';
import { cn } from "@/lib/utils";
import { Combobox, Transition } from '@headlessui/react';
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// --- Schema Zod para Validação ---
const novaPropostaSchema = z.object({
  broker_id: z.coerce.number().int().positive("Selecione um corretor"),
  operator_id: z.coerce.number().int().positive("Selecione uma operadora"),
  plan_name: z.string().optional(),
  modality: z.enum(['Saúde', 'Odonto', 'Saúde + Odonto', 'Outro'], { // Exemplo de enum
    required_error: "Modalidade é obrigatória",
  }),
  cnpj: z.string().optional(), // Adicionar máscara/validação de CNPJ se necessário
  razao_social: z.string().optional(),
  responsavel_nome: z.string().min(1, "Nome do responsável é obrigatório"),
  responsavel_email: z.string().email({ message: "Email inválido" }).optional().or(z.literal('')), // Permite vazio ou email válido
  responsavel_telefone: z.string().optional(),
  lives: z.coerce.number().int().min(1, "Pelo menos 1 vida"),
  value: z.coerce.number().min(0, "Valor não pode ser negativo"),
  observacoes: z.string().optional(),
}).refine(data => !!data.cnpj || !!data.razao_social, {
  message: "CNPJ ou Razão Social deve ser preenchido",
  path: ["cnpj"], // Aplicar erro a um dos campos
});

type NovaPropostaFormData = z.infer<typeof novaPropostaSchema>;

// --- Props do Componente ---
type NovaPropostaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
};

// --- Componente Principal ---
export default function NovaPropostaModal({ isOpen, onClose, boardId }: NovaPropostaModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Estados para listas (Exemplo - buscar dados reais) ---
  const [brokersList, setBrokersList] = useState<BrokerOption[]>([]);
  const [operatorsList, setOperatorsList] = useState<OperatorOption[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [brokerQuery, setBrokerQuery] = useState('');
  const [operatorQuery, setOperatorQuery] = useState('');

  // --- Formulário ---
  const form = useForm<NovaPropostaFormData>({
    resolver: zodResolver(novaPropostaSchema),
    defaultValues: {
      broker_id: undefined,
      operator_id: undefined,
      plan_name: "",
      modality: undefined,
      cnpj: "",
      razao_social: "",
      responsavel_nome: "",
      responsavel_email: "",
      responsavel_telefone: "",
      lives: 1,
      value: 0,
      observacoes: "",
    },
  });

  // DEBUG: Log form values on change
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Log apenas quando broker_id ou operator_id mudarem
      if (name === 'broker_id' || name === 'operator_id') {
       console.log(`[RHF Watch DEBUG] Campo '${name}' mudou para:`, value[name]);
      }
      // Para ver todos os valores:
      // console.log("[RHF Watch DEBUG] Valores atuais do form:", value);
    });
    return () => subscription.unsubscribe();
  }, [form]); // Depender apenas de 'form' para setup inicial

  // --- Efeito para buscar dados dos seletores ---
  useEffect(() => {
    const fetchLists = async () => {
      if (!isOpen) return;
      setIsLoadingLists(true);
      setBrokersList([]); // Limpa listas antes de buscar
      setOperatorsList([]);
      try {
        console.log("Modal aberto, buscando listas...");
        // Chamar funções reais da API em paralelo
        const [brokers, operators] = await Promise.all([
          fetchBrokers(),
          fetchActiveOperators() 
        ]);
        
        console.log("Listas recebidas:", { brokers, operators });
        setBrokersList(brokers);
        setOperatorsList(operators);

        // Remover mock data
        // await new Promise(resolve => setTimeout(resolve, 500)); 
        // setBrokersList([...]);
        // setOperatorsList([...]);

      } catch (error) {
        console.error("Erro ao buscar listas para modal:", error);
        toast({
          title: "Erro ao Carregar Dados",
          description: "Não foi possível buscar corretores/operadoras.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingLists(false);
        console.log("Busca de listas finalizada.");
      }
    };

    fetchLists();
  }, [isOpen, toast]);

  // --- Lógica de Filtragem para Comboboxes ---
  const filteredBrokers =
    brokerQuery === ''
      ? brokersList
      : brokersList.filter((broker) =>
          broker.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(brokerQuery.toLowerCase().replace(/\s+/g, ''))
        );

  const filteredOperators =
    operatorQuery === ''
      ? operatorsList
      : operatorsList.filter((operator) =>
          operator.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(operatorQuery.toLowerCase().replace(/\s+/g, ''))
        );

  // --- Função de Submissão ---
  const onSubmit = async (data: NovaPropostaFormData) => {
    if (!user?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    if (!boardId) {
        toast({ title: "Erro", description: "ID do quadro não encontrado.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    console.log("Dados do formulário para criar proposta:", data);

    try {
        const { data: newCardId, error: rpcError } = await supabase.rpc('create_minimal_proposal', {
            p_board_id: boardId,
            p_broker_id: data.broker_id,
            p_operator_id: data.operator_id,
            p_plan_name: (data.plan_name ? data.plan_name : '')!,
            p_modality: data.modality,
            p_cnpj: (data.cnpj ? data.cnpj : '')!,
            p_razao_social: (data.razao_social ? data.razao_social : '')!,
            p_responsavel_nome: data.responsavel_nome,
            p_responsavel_email: (data.responsavel_email ? data.responsavel_email : '')!,
            p_responsavel_telefone: (data.responsavel_telefone ? data.responsavel_telefone : '')!,
            p_lives: data.lives,
            p_value: data.value,
            p_observacoes: (data.observacoes ? data.observacoes : '')!
        });

        if (rpcError) {
            console.error("Erro na RPC create_minimal_proposal:", rpcError);
            throw new Error(rpcError.message || "Erro desconhecido ao criar proposta.");
        }

        console.log("Nova proposta criada com sucesso. ID do cartão:", newCardId);

        toast({
            title: "Proposta Criada!",
            description: "A nova proposta foi adicionada ao quadro.",
        });

        // Invalidar query para atualizar a lista de cartões no quadro
        await queryClient.invalidateQueries({ queryKey: ['kanban-cards', boardId] });

        form.reset(); // Limpa o formulário
        onClose(); // Fecha o modal

    } catch (error: any) {
        console.error("Falha ao criar proposta:", error);
        toast({
            title: "Erro ao Criar Proposta",
            description: error.message || "Não foi possível criar a proposta.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Proposta</DialogTitle>
          <DialogDescription>
            Preencha os dados iniciais para criar a proposta. Detalhes adicionais poderão ser preenchidos após a criação.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">

            {/* Linha 1: Corretor e Operadora - USANDO HEADLESS UI COMBOBOX */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="broker_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corretor</FormLabel>
                    <Combobox value={field.value ?? null} onChange={field.onChange} disabled={isLoadingLists}>
                       <div className="relative mt-1"> 
                        <Combobox.Input
                          className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          displayValue={(brokerId: number | null) =>
                             brokerId ? brokersList.find((b) => b.id === brokerId)?.name || '' : ''
                          }
                          onChange={(event) => setBrokerQuery(event.target.value)}
                          placeholder={isLoadingLists ? "Carregando..." : "Digite para buscar..."}
                          autoComplete="off"
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                          <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </Combobox.Button>

                        <Transition
                          as={React.Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                          afterLeave={() => setBrokerQuery('')}
                        >
                          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredBrokers.length === 0 && brokerQuery !== '' ? (
                              <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                                Nenhum corretor encontrado.
                              </div>
                            ) : (
                              filteredBrokers.map((broker) => (
                                <Combobox.Option
                                  key={broker.id}
                                  className={({ active }) =>
                                    cn(
                                      'relative cursor-default select-none py-2 pl-10 pr-4',
                                      active ? 'bg-accent text-accent-foreground' : 'text-popover-foreground'
                                    )
                                  }
                                  value={broker.id}
                                >
                                  {({ selected, active }) => (
                                    <>
                                      <span
                                        className={cn(
                                          'block truncate',
                                          selected ? 'font-medium' : 'font-normal'
                                        )}
                                      >
                                        {broker.name}
                                      </span>
                                      {selected ? (
                                        <span
                                          className={cn(
                                            'absolute inset-y-0 left-0 flex items-center pl-3',
                                            active ? 'text-accent-foreground' : 'text-primary' // Ajuste cor do check
                                          )}
                                        >
                                          <Check className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Combobox.Option>
                              ))
                            )}
                          </Combobox.Options>
                        </Transition>
                      </div>
                    </Combobox>
                    <FormMessage />
                  </FormItem>
                )}
              />

             {/* Combobox para Operadora */}
               <FormField
                control={form.control}
                name="operator_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operadora</FormLabel>
                    <Combobox value={field.value ?? null} onChange={field.onChange} disabled={isLoadingLists}>
                       <div className="relative mt-1"> 
                        <Combobox.Input
                          className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          displayValue={(operatorId: number | null) =>
                            operatorId ? operatorsList.find((op) => op.id === operatorId)?.name || '' : ''
                          }
                          onChange={(event) => setOperatorQuery(event.target.value)}
                           placeholder={isLoadingLists ? "Carregando..." : "Digite para buscar..."}
                           autoComplete="off"
                         />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                          <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </Combobox.Button>

                        <Transition
                          as={React.Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                          afterLeave={() => setOperatorQuery('')}
                        >
                          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredOperators.length === 0 && operatorQuery !== '' ? (
                              <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                                Nenhuma operadora encontrada.
                              </div>
                            ) : (
                              filteredOperators.map((op) => (
                                <Combobox.Option
                                  key={op.id}
                                  className={({ active }) =>
                                    cn(
                                      'relative cursor-default select-none py-2 pl-10 pr-4',
                                      active ? 'bg-accent text-accent-foreground' : 'text-popover-foreground'
                                    )
                                  }
                                  value={op.id}
                                >
                                  {({ selected, active }) => (
                                    <>
                                      <span
                                        className={cn(
                                          'block truncate',
                                          selected ? 'font-medium' : 'font-normal'
                                        )}
                                      >
                                        {op.name}
                                      </span>
                                      {selected ? (
                                        <span
                                          className={cn(
                                            'absolute inset-y-0 left-0 flex items-center pl-3',
                                            active ? 'text-accent-foreground' : 'text-primary'
                                          )}
                                        >
                                          <Check className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Combobox.Option>
                              ))
                            )}
                          </Combobox.Options>
                        </Transition>
                      </div>
                    </Combobox>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 2: Plano e Modalidade */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="plan_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Plano (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Plano PME Top" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                    control={form.control}
                    name="modality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modalidade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a modalidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Saúde">Saúde</SelectItem>
                            <SelectItem value="Odonto">Odonto</SelectItem>
                            <SelectItem value="Saúde + Odonto">Saúde + Odonto</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
             </div>

            {/* Linha 3: CNPJ e Razão Social */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ (Opcional se Razão Social preenchida)</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage /> {/* Mensagem do refine aparecerá aqui */}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="razao_social"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social (Opcional se CNPJ preenchido)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo da empresa LTDA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

             {/* Linha 4: Responsável Nome e Email */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="responsavel_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Responsável</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do contato principal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="responsavel_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email do Responsável (Opcional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contato@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
             </div>

             {/* Linha 5: Responsável Telefone, Vidas e Valor */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <FormField
                    control={form.control}
                    name="responsavel_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone do Responsável (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                  control={form.control}
                  name="lives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº de Vidas</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                 />
                 <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Estimado</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                 />
             </div>

             {/* Linha 6: Observações */}
             <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Alguma informação inicial importante?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingLists}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Criando..." : "Criar Proposta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 