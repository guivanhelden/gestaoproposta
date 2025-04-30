import { useState, useEffect, useRef } from "react";
import { Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox, Transition } from "@headlessui/react";
import React from "react";
import { OperatorInfo } from "@/lib/api"; // Usando import path aliases
import { Info, Check, ChevronsUpDown, Building2, FileText, Calendar, BadgePercent, Search, FileSpreadsheet, Building, CalendarRange } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const modalityOptions = [
  { id: "Saúde", name: "Saúde" },
  { id: "Odonto", name: "Odonto" },
  { id: "Saúde e Odonto", name: "Saúde e Odonto" }
];

interface ProposalGeneralInfoProps {
  control: Control<any>; // Receber o controle do formulário pai
  operatorsList: OperatorInfo[]; // Receber a lista de operadoras
}

export default function ProposalGeneralInfo({ control, operatorsList }: ProposalGeneralInfoProps) {
  // Estados para filtragem de Combobox
  const [operatorQuery, setOperatorQuery] = useState('');
  const [modalityQuery, setModalityQuery] = useState('');
  
  // Referências para os elementos do Combobox
  const operatorInputRef = useRef<HTMLButtonElement>(null);
  const modalityInputRef = useRef<HTMLButtonElement>(null);

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
          Preencha os dados básicos da proposta para continuar
        </CardDescription>
        <Separator className="mt-2" />
      </CardHeader>

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
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="flex items-center gap-1 text-sm font-medium">
                  <Building className="h-3.5 w-3.5 text-muted-foreground" />
                  Operadora <span className="text-destructive">*</span>
                </FormLabel>
                <Combobox value={field.value ?? null} onChange={field.onChange}>
                  <div className="relative mt-1"> 
                    <Combobox.Input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      displayValue={(operatorId: number | null) =>
                        operatorId ? operatorsList.find((op) => op.id === operatorId)?.name || '' : ''
                      }
                      onChange={(event) => setOperatorQuery(event.target.value)}
                      placeholder="Digite para buscar..."
                      autoComplete="off"
                    />
                    <Combobox.Button ref={operatorInputRef} className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                      <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </Combobox.Button>

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
                                  'relative cursor-default select-none py-2 pl-10 pr-4',
                                  active ? 'bg-accent text-accent-foreground' : 'text-popover-foreground'
                                )
                              }
                              value={operator.id}
                            >
                              {({ selected, active }) => (
                                <>
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
            name="plan_name"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="flex items-center gap-1 text-sm font-medium">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Plano
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      {...field} 
                      value={field.value || ''} 
                      placeholder="Nome do Plano" 
                      className="pl-8 focus-visible:pl-8 bg-background/80 focus-visible:bg-background transition-colors"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="modality"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="flex items-center gap-1 text-sm font-medium">
                  <BadgePercent className="h-3.5 w-3.5 text-muted-foreground" />
                  Modalidade <span className="text-destructive">*</span>
                </FormLabel>
                <Combobox value={field.value ?? null} onChange={field.onChange}>
                  <div className="relative mt-1"> 
                    <Combobox.Input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      displayValue={(modalityId: string | null) =>
                        modalityId ? modalityOptions.find((m) => m.id === modalityId)?.name || '' : ''
                      }
                      onChange={(event) => setModalityQuery(event.target.value)}
                      placeholder="Digite para buscar..."
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
                <span>Dados sensíveis</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Estas informações são necessárias para o processamento da proposta</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
} 