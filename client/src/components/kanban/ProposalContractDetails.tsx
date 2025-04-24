import { Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <Card>
      <CardHeader>
        <CardTitle>Detalhes do Contrato</CardTitle>
      </CardHeader>
      <CardContent>
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