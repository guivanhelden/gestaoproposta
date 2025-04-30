import { useState } from 'react';
import { Control, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { OperatorInfo } from "@/lib/api"; // Importar tipo

interface GracePeriodFormProps {
  control: Control<any>; // Receber o controle do formulário pai
  operatorsList: OperatorInfo[]; // Lista de operadoras para o select
}

export default function GracePeriodForm({ control, operatorsList }: GracePeriodFormProps) {
  // Observar o valor de 'has_grace_period' para renderização condicional
  const hasGracePeriod = useWatch({
    control,
    name: "has_grace_period",
  });
  
  // Estado para controlar o Collapsible
  const [isOpen, setIsOpen] = useState(false); // Começa fechado por padrão

  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/50" 
          style={{ boxShadow: "0 4px 20px -5px rgba(219, 39, 119, 0.28), 0 2px 10px -5px rgba(236, 72, 153, 0.32)" }}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-400/30 via-fuchsia-500/60 to-fuchsia-400/30"></div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-fuchsia-500/10 text-fuchsia-500">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-medium text-foreground/90">
              Carência
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Aproveitamento
          </Badge>
        </div>
        <CardDescription className="text-xs mt-2">
          Configurações de aproveitamento de carência
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
            <span>Detalhes da Carência</span>
            {!isOpen && hasGracePeriod && (
              <span className="text-xs text-fuchsia-500 font-medium ml-2">
                Aproveitamento ativado
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-6 space-y-4">
            <FormField
              control={control}
              name="has_grace_period"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-muted bg-muted/20 p-3 shadow-sm hover:bg-muted/30 transition-colors">
                  <div className="space-y-0.5">
                    <FormLabel>Aproveitamento de Carência?</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {hasGracePeriod && (
              <div className="space-y-4 pt-4 mt-2">
                <h3 className="text-sm font-medium mb-3 text-fuchsia-600/80 flex items-center">
                  <span className="w-1.5 h-4 bg-fuchsia-500/60 rounded-sm mr-2"></span>
                  Informações da Carência Anterior
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-1">
                  <FormField
                    control={control}
                    name="previous_operator_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operadora Anterior</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : null)}
                          value={String(field.value ?? "")}
                          disabled={!operatorsList || operatorsList.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {operatorsList.map((op) => (
                              <SelectItem key={op.id} value={String(op.id)}>
                                {op.name}
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
                    name="grace_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações da Carência</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Motivo, documentos enviados..."
                            value={field.value || ''}
                            className="resize-none transition-all duration-200 focus-visible:ring-fuchsia/80 focus-visible:border-fuchsia/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
