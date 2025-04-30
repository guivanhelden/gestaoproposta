import { useState } from "react";
import { Control, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, ChevronDown, ChevronsUpDown, CalendarRange, FileText, DollarSign, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Definir opções aqui, já que são específicas deste contexto
const contractTypeOptions = [
  { value: "Livre Adesão", label: "Livre Adesão" },
  { value: "Compulsório", label: "Compulsório" },
  { value: "Opcional", label: "Opcional" },
];

const coparticipationOptions = [
  { value: "Sim Completa", label: "Sim Completa" },
  { value: "Sim Parcial", label: "Sim Parcial" },
  { value: "Não", label: "Não" },
];

interface ProposalContractDetailsProps {
  control: Control<any>; // Receber o controle do formulário pai
}

export default function ProposalContractDetails({ control }: ProposalContractDetailsProps) {
  // Estado para controlar o Collapsible
  const [isOpen, setIsOpen] = useState(false); // Começa fechado por padrão
  
  // Observar os campos que serão exibidos quando fechado
  const validityDate = useWatch({ control, name: 'validity_date' });
  const planName = useWatch({ control, name: 'plan_name' });
  const contractValue = useWatch({ control, name: 'contract_value' });
  
  // Função auxiliar para formatar valor monetário
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return "";
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2 
    }).format(value);
  };
  
  // Função auxiliar para formatar data
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };
  
  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/50" 
          style={{ boxShadow: "0 4px 20px -5px rgba(0, 4, 255, 0.28), 0 2px 10px -5px rgba(45, 8, 255, 0.32)" }}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400/30 via-blue-500/60 to-blue-400/30"></div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-500/10 text-blue-500">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-medium text-foreground/90">
              Detalhes do Contrato
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Info. Contratuais
          </Badge>
        </div>
        <CardDescription className="text-xs mt-2">
          Informações sobre o contrato e valores do plano
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
              <span>Detalhes do Contrato e Valores</span>
            </div>
            
            {/* Informação resumida quando fechado */}
            {!isOpen && (
              <div className="flex flex-wrap items-center gap-2 ml-4 max-w-[65%] overflow-hidden">
                {/* Data de Vigência */}
                {validityDate && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="px-2 py-1 bg-amber-50/70 border-amber-200/70 text-amber-700 hover:bg-amber-100/70 transition-colors">
                          <CalendarRange className="h-3 w-3 mr-1.5 text-amber-500" />
                          <span className="text-xs truncate max-w-[120px]">
                            {formatDate(validityDate)}
                          </span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Data de Vigência: {formatDate(validityDate)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Plano */}
                {planName && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="px-2 py-1 bg-blue-50/70 border-blue-200/70 text-blue-700 hover:bg-blue-100/70 transition-colors">
                          <FileText className="h-3 w-3 mr-1.5 text-blue-500" />
                          <span className="text-xs truncate max-w-[150px]">{planName}</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Plano: {planName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Valor do Contrato */}
                {contractValue && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="px-2 py-1 bg-green-50/70 border-green-200/70 text-green-700 hover:bg-green-100/70 transition-colors">
                          <DollarSign className="h-3 w-3 mr-1.5 text-green-500" />
                          <span className="text-xs truncate max-w-[120px]">
                            {formatCurrency(contractValue)}
                          </span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Valor Mensal: {formatCurrency(contractValue)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Caso não tenha nenhuma das informações preenchidas */}
                {!validityDate && !planName && !contractValue && (
                  <Badge variant="outline" className="px-2 py-1 bg-slate-50/70 border-slate-200/70 text-slate-600">
                    <Info className="h-3 w-3 mr-1.5 text-slate-500" />
                    <span className="text-xs italic">Dados contratuais não preenchidos</span>
                  </Badge>
                )}
              </div>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-6"> 
            <AnimatePresence initial={false}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {/* Grupo: Informações do Contrato */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3 text-blue-600/80 flex items-center">
                    <span className="w-1.5 h-4 bg-blue-500/60 rounded-sm mr-2"></span>
                    Informações do Contrato
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-1">
                    <FormField
                      control={control}
                      name="contract_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-sm font-medium">
                            <span className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground">
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                            </span>
                            Tipo de Contrato
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="transition-all duration-200 focus-visible:ring-blue-500/80 focus-visible:border-blue-500/50">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contractTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="coparticipation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-sm font-medium">
                            <span className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground">
                              <DollarSign className="h-3.5 w-3.5" />
                            </span>
                            Coparticipação
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="transition-all duration-200 focus-visible:ring-blue-500/80 focus-visible:border-blue-500/50">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {coparticipationOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control} 
                      name="validity_date" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-sm font-medium">
                            <span className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground">
                              <CalendarRange className="h-3.5 w-3.5" />
                            </span>
                            Data de Vigência
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value || ''} 
                              className="transition-all duration-200 focus-visible:ring-blue-500/80 focus-visible:border-blue-500/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="pre_proposta" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-sm font-medium">
                            <span className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground">
                              <FileText className="h-3.5 w-3.5" />
                            </span>
                            Nº Pré-Proposta (Operadora)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Número fornecido pela operadora" 
                              value={field.value || ''} 
                              className="transition-all duration-200 focus-visible:ring-blue-500/80 focus-visible:border-blue-500/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="plan_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-sm font-medium">
                            <span className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground">
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                            </span>
                            Plano
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ''} 
                              placeholder="Nome do Plano" 
                              className="transition-all duration-200 focus-visible:ring-blue-500/80 focus-visible:border-blue-500/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Grupo: Valores e Métricas */}
                <div>
                  <h3 className="text-sm font-medium mb-3 text-blue-600/80 flex items-center">
                    <span className="w-1.5 h-4 bg-blue-500/60 rounded-sm mr-2"></span>
                    Valores e Métricas
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-1">
                    <FormField
                      control={control} 
                      name="lives" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-sm font-medium">
                            <span className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground">
                              <FileText className="h-3.5 w-3.5" />
                            </span>
                            Vidas
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              placeholder="Nº de Vidas" 
                              value={field.value ?? ''} 
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)} 
                              className="transition-all duration-200 focus-visible:ring-blue-500/80 focus-visible:border-blue-500/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control} 
                      name="contract_value" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-sm font-medium">
                            <span className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground">
                              <DollarSign className="h-3.5 w-3.5" />
                            </span>
                            Valor do Contrato (Mensal)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              placeholder="0,00" 
                              value={field.value ?? ''} 
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} 
                              className="transition-all duration-200 focus-visible:ring-blue-500/80 focus-visible:border-blue-500/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
      
      <CardFooter className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="text-blue-500 font-medium">i</span> 
          Dados do contrato
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs text-muted-foreground flex items-center">
                <Info className="h-3.5 w-3.5 mr-1" />
                <span>Informações Contratuais</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Dados necessários para o contrato com a operadora.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
} 