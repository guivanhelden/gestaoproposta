import { useState, useEffect, useRef } from "react";
import { Control, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox, Transition } from "@headlessui/react";
import React from "react";
import { OperatorInfo } from "@/lib/api";
import { Info, Check, ChevronsUpDown, Building, BadgePercent, FileSpreadsheet, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const modalityOptions = [
  { id: "Saúde", name: "Saúde" },
  { id: "Odonto", name: "Odonto" },
  { id: "Saúde e Odonto", name: "Saúde e Odonto" }
];

interface ProposalGeneralInfoProps {
  control: Control<any>; // Receber o controle do formulário pai
  operatorsList: OperatorInfo[]; // Receber a lista de operadoras
}

export default function ProposalGeneralInfo({ control, operatorsList = [] }: ProposalGeneralInfoProps) {
  // Estados para filtragem de Combobox
  const [operatorQuery, setOperatorQuery] = useState('');
  const [modalityQuery, setModalityQuery] = useState('');
  
  // Estado para controlar o Collapsible
  const [isOpen, setIsOpen] = useState(false); // Começa fechado por padrão
  
  // Referências para os elementos do Combobox
  const operatorInputRef = useRef<HTMLButtonElement>(null);
  const modalityInputRef = useRef<HTMLButtonElement>(null);

  // Observa os valores de Operadora e Modalidade do formulário
  const operatorValue = useWatch({ control, name: 'operator_id' });
  const modalityValue = useWatch({ control, name: 'modality' });

  // Lógica de filtragem para Comboboxes
  const filteredOperators =
    operatorQuery === ''
      ? operatorsList
      : operatorsList.filter((operator) =>
          operator.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(operatorQuery.toLowerCase().replace(/\s+/g, ''))
        );

  const filteredModalities =
    modalityQuery === ''
      ? modalityOptions
      : modalityOptions.filter((modality) =>
          modality.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(modalityQuery.toLowerCase().replace(/\s+/g, ''))
        );

  // Encontrar operadora selecionada para exibir informações
  const selectedOperator = operatorValue ? operatorsList.find(op => op.id === operatorValue) : null;

  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/50" style={{ boxShadow: "0 4px 20px -5px rgba(98, 0, 255, 0.28), 0 2px 10px -5px rgba(247, 8, 255, 0.32)" }}>
      {/* Linha de gradiente decorativa no topo */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30"></div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-medium text-foreground/90">
              Informações Gerais
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Dados da Proposta
          </Badge>
        </div>
        <CardDescription className="text-xs mt-2">
          Selecione a operadora e a modalidade da proposta
        </CardDescription>
        <Separator className="mt-2" />
      </CardHeader>

      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full border-t border-border/30"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium hover:underline [&[data-state=open]>svg]:rotate-180">
          <div className="flex flex-1 items-center justify-between mr-2">
            <div className="flex items-center">
              <span>Detalhes da Proposta</span>
            </div>
            
            {/* Informação resumida quando fechado */}
            {!isOpen && (
              <div className="flex flex-wrap items-center gap-2 ml-4 max-w-[65%] overflow-hidden">
                {/* Operadora selecionada - apenas logo */}
                {selectedOperator && selectedOperator.logo_url && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors flex items-center justify-center rounded-md h-10 px-4">
                          <img 
                            src={selectedOperator.logo_url || undefined} 
                            alt={selectedOperator.name} 
                            className="h-16 w-16 object-contain rounded-sm"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Operadora: {selectedOperator.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Operadora sem logo - mantém nome */}
                {selectedOperator && !selectedOperator.logo_url && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="px-2 py-1 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-colors">
                          <Building className="h-3 w-3 mr-1.5 text-primary" />
                          <span className="text-xs truncate max-w-[150px]">{selectedOperator.name}</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Operadora selecionada: {selectedOperator.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Modalidade selecionada */}
                {modalityValue && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="px-2 py-1 bg-purple-50/70 border-purple-200/70 text-purple-700 hover:bg-purple-100/70 transition-colors">
                          <BadgePercent className="h-3 w-3 mr-1.5 text-purple-500" />
                          <span className="text-xs truncate max-w-[120px]">
                            {modalityOptions.find(m => m.id === modalityValue)?.name}
                          </span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Modalidade: {modalityOptions.find(m => m.id === modalityValue)?.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Caso não tenha seleções ainda */}
                {!selectedOperator && !modalityValue && (
                  <Badge variant="outline" className="px-2 py-1 bg-slate-50/70 border-slate-200/70 text-slate-600">
                    <Info className="h-3 w-3 mr-1.5 text-slate-500" />
                    <span className="text-xs italic">Informações não preenchidas</span>
                  </Badge>
                )}
              </div>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-4 pt-2">
            <AnimatePresence initial={false}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
                <FormField
                  control={control}
                  name="operator_id"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground">
                          <Building className="h-3.5 w-3.5" />
                        </span>
                        Operadora <span className="text-destructive">*</span>
                      </FormLabel>
                      <Combobox 
                        value={field.value ?? null} 
                        onChange={(value) => field.onChange(value)}
                      >
                        <div className="relative mt-1"> 
                          <div className="relative">
                            <Combobox.Input
                              className={cn(
                                "flex h-10 w-full rounded-md border border-input bg-background py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
                                "pl-10 pr-10",
                                {
                                  "focus-visible:ring-primary/80 focus-visible:border-primary/50": true,
                                  "border-red-500/50 focus-visible:ring-red-500/30": fieldState.error
                                }
                              )}
                              displayValue={(operatorId: number | null) =>
                                operatorId ? operatorsList.find((op) => op.id === operatorId)?.name || '' : ''
                              }
                              onChange={(event) => setOperatorQuery(event.target.value)}
                              placeholder="Selecione ou digite..."
                              autoComplete="off"
                            />
                            {/* Fix para o erro de lint: usar || undefined ao invés de ? para garantir que null nunca seja passado */}
                            {field.value && operatorsList.find(op => op.id === field.value) && (
                              <img 
                                src={operatorsList.find(op => op.id === field.value)?.logo_url || undefined}
                                alt="Logo"
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-7 w-7 object-contain rounded-sm"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            )}
                            {!field.value && (
                              <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            )}
                            <Combobox.Button ref={operatorInputRef} className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                              <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </Combobox.Button>
                          </div>

                          <Transition
                            as={React.Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                            afterLeave={() => setOperatorQuery('')}
                          >
                            <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {filteredOperators.length === 0 && operatorQuery !== '' ? (
                                <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                                  Nenhuma operadora encontrada.
                                </div>
                              ) : (
                                filteredOperators.map((operator) => (
                                  <Combobox.Option
                                    key={operator.id}
                                    className={({ active }) =>
                                      cn(
                                        'relative cursor-default select-none py-2 pl-10 pr-4 flex items-center gap-3',
                                        active ? 'bg-accent text-accent-foreground' : 'text-popover-foreground'
                                      )
                                    }
                                    value={operator.id}
                                  >
                                    {({ selected, active }) => (
                                      <>
                                        {/* Fix para o erro de lint: usar || undefined ao invés de ? para garantir que null nunca seja passado */}
                                        <img 
                                          src={operator.logo_url || undefined}
                                          alt={`${operator.name} logo`}
                                          className="h-12 w-6 object-contain flex-shrink-0 rounded-sm"
                                          onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                        <span
                                          className={cn(
                                            'block truncate',
                                            selected ? 'font-medium' : 'font-normal'
                                          )}
                                        >
                                          {operator.name}
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

                <FormField
                  control={control}
                  name="modality"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground">
                          <BadgePercent className="h-3.5 w-3.5" />
                        </span>
                        Modalidade <span className="text-destructive">*</span>
                      </FormLabel>
                      <Combobox value={field.value ?? null} onChange={field.onChange}>
                        <div className="relative mt-1"> 
                          <Combobox.Input
                            className={cn(
                              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
                              {
                                "focus-visible:ring-primary/80 focus-visible:border-primary/50": true,
                                "border-red-500/50 focus-visible:ring-red-500/30": fieldState.error
                              }
                            )}
                            displayValue={(modalityId: string | null) =>
                              modalityId ? modalityOptions.find((m) => m.id === modalityId)?.name || '' : ''
                            }
                            onChange={(event) => setModalityQuery(event.target.value)}
                            placeholder="Selecione ou digite..."
                            autoComplete="off"
                          />
                          <Combobox.Button ref={modalityInputRef} className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                            <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </Combobox.Button>

                          <Transition
                            as={React.Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                            afterLeave={() => setModalityQuery('')}
                          >
                            <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {filteredModalities.length === 0 && modalityQuery !== '' ? (
                                <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                                  Nenhuma modalidade encontrada.
                                </div>
                              ) : (
                                filteredModalities.map((modality) => (
                                  <Combobox.Option
                                    key={modality.id}
                                    className={({ active }) =>
                                      cn(
                                        'relative cursor-default select-none py-2 pl-10 pr-4',
                                        active ? 'bg-accent text-accent-foreground' : 'text-popover-foreground'
                                      )
                                    }
                                    value={modality.id}
                                  >
                                    {({ selected, active }) => (
                                      <>
                                        <span
                                          className={cn(
                                            'block truncate',
                                            selected ? 'font-medium' : 'font-normal'
                                          )}
                                        >
                                          {modality.name}
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
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <CardFooter className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="text-destructive font-medium">*</span> 
          Campos obrigatórios
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs text-muted-foreground flex items-center">
                <Info className="h-3.5 w-3.5 mr-1" />
                <span>Dados Gerais</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Informações básicas para identificar a proposta.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
} 