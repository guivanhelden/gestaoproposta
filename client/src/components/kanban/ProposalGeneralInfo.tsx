import { Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OperatorInfo } from "../../lib/api"; // Importar tipo
import { Info } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

// Poderíamos importar ProposalFormData se precisarmos de tipos mais específicos
// import { ProposalFormData } from "./card-modal-supabase"; 

interface ProposalGeneralInfoProps {
  control: Control<any>; // Receber o controle do formulário pai
  operatorsList: OperatorInfo[]; // Receber a lista de operadoras
}

export default function ProposalGeneralInfo({ control, operatorsList }: ProposalGeneralInfoProps) {
  return (
    <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-slate-100 to-slate-200">
      <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
        <Info className="mr-2 h-5 w-5 text-primary/80" />
        Informações Gerais
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
            control={control} // Usar o controle recebido
            name="operator_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex">
                  Operadora <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : null)}
                  value={String(field.value ?? "")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a operadora" />
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
            name="plan_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plano</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} placeholder="Nome do Plano" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="modality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modalidade</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} placeholder="Ex: PME" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vigência</FormLabel>
                <FormControl>
                  <DatePicker 
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione a data de vigência"
                    disabled={field.disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
} 