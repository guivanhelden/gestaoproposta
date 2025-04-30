import { useState } from "react";
import { Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Definir opções aqui, já que são específicas deste contexto
const contractTypeOptions = [
  { value: "Adesão", label: "Adesão" },
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
            <span>Detalhes do Contrato e Valores</span>
          </div>
          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-6"> 
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
                      <FormLabel>Tipo de Contrato</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
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
                      <FormLabel>Coparticipação</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
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
                      <FormLabel>Data de Vigência</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value || ''} 
                          className="transition-all duration-200 focus-visible:ring-primary/80 focus-visible:border-primary/50"
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
                      <FormLabel>Nº Pré-Proposta (Operadora)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Número fornecido pela operadora" value={field.value || ''} />
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
                      <FormLabel>Vidas</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          placeholder="Nº de Vidas" 
                          value={field.value ?? ''} 
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)} 
                          className="transition-all duration-200 focus-visible:ring-primary/80 focus-visible:border-primary/50"
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
                      <FormLabel>Valor do Contrato (Mensal)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          placeholder="0,00" 
                          value={field.value ?? ''} 
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} 
                          className="transition-all duration-200 focus-visible:ring-primary/80 focus-visible:border-primary/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
} 