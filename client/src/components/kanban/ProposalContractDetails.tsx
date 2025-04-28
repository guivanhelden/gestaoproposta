import { Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet } from "lucide-react"; // Importar ícone

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
  return (
    <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-slate-100 to-slate-200">
        <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
          <FileSpreadsheet className="mr-2 h-5 w-5 text-primary/80" />
          Detalhes do Contrato
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6"> 
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <FormItem className="sm:col-span-2">
                <FormLabel>Nº Pré-Proposta (Operadora)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Número fornecido pela operadora" value={field.value || ''} />
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