import React from 'react';
import { Control, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Shield } from "lucide-react";
import { OperatorInfo } from "@/lib/api"; // Importar tipo
import { Calendar } from 'lucide-react';

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

  return (
    <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-slate-100 to-slate-200">
        <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-primary/80" />
          Carência
        </CardTitle>
      </CardHeader>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
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
                      className="resize-none transition-all duration-200 focus-visible:ring-primary/80 focus-visible:border-primary/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
