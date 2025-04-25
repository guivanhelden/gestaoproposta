import React, { useState } from 'react';
import { Control, Controller } from "react-hook-form";
import { Building2, ChevronDown } from "lucide-react";
import { IMaskInput } from 'react-imask';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Constante para UFs (movida para cá)
const ufOptions = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

interface CompanyDataFormProps {
  control: Control<any>; // Receber o controle do formulário pai
  onCnpjSearch?: (cnpj: string) => void; // Readicionado
  isSearchingCnpj?: boolean; // Optional: Indicate if search is in progress
};

// Componente auxiliar para campo com máscara
const SimpleFormField = ({ control, name, label, placeholder, type = "text", readOnly = false, className = "", mask = "" }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
      {mask ? (
        <div className="relative">
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <IMaskInput
                mask={mask}
                unmask={false}
                value={field.value || ''}
                onAccept={(value) => field.onChange(value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={placeholder}
                readOnly={readOnly}
              />
            )}
          />
        </div>
      ) : (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
              value={field.value || ''}
              readOnly={readOnly}
              className="transition-all duration-200 focus-visible:ring-primary/80 focus-visible:border-primary/50"
            />
          )}
        />
      )}
    </div>
  );
};

// Componente auxiliar para Switch
const SwitchField = ({ control, name }) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Switch
          checked={field.value ?? false}
          onCheckedChange={field.onChange}
        />
      )}
    />
  );
};

// Componente auxiliar para Select
const SelectField = ({ control, name, label, options, className = "" }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} ({option.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
};

const CompanyDataForm: React.FC<CompanyDataFormProps> = ({ 
  control, 
  onCnpjSearch, 
  isSearchingCnpj 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-slate-100 to-slate-200">
        <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
          <Building2 className="mr-2 h-5 w-5 text-primary/80" />
          Dados da Empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl>
                  <IMaskInput
                    mask="00.000.000/0000-00"
                    unmask={true} // Para salvar apenas os números
                    value={field.value || ''}
                    onAccept={(value: any) => field.onChange(value)} // Atualizar form com valor não mascarado
                    placeholder="00.000.000/0000-00"
                    // Encaminhar ref e aplicar estilo do Input do Shadcn
                    inputRef={field.ref as any}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="razao_social"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razão Social</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Razão Social da Empresa" 
                    value={field.value || ''}
                    className="transition-all duration-200 focus-visible:ring-primary/80 focus-visible:border-primary/50"  
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Acordeão DIY usando useState */}
        <div className="w-full border-t mt-2 pt-2">
          <button 
            type="button"
            onClick={() => setIsExpanded(!isExpanded)} 
            className="flex justify-between w-full text-base font-medium text-gray-600 py-2 hover:text-gray-800 transition-colors"
          >
            Mais Detalhes da Empresa
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {isExpanded && (
            <div className="pt-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SimpleFormField 
                  control={control}
                  name="nome_fantasia"
                  label="Nome Fantasia"
                  placeholder="Nome Fantasia da Empresa"
                />
                
                <SimpleFormField 
                  control={control}
                  name="data_abertura"
                  label="Data de Abertura"
                  type="date"
                />
                
                <SimpleFormField 
                  control={control}
                  name="natureza_juridica"
                  label="Natureza Jurídica"
                  placeholder="Ex: LTDA, SA"
                  readOnly
                />
                
                <SimpleFormField 
                  control={control}
                  name="situacao_cadastral"
                  label="Situação Cadastral"
                  placeholder="Ex: Ativa"
                  readOnly
                />
                
                <SimpleFormField 
                  control={control}
                  name="cnae"
                  label="CNAE Principal"
                  placeholder="Código e Descrição"
                  readOnly
                  className="sm:col-span-2"
                />
                
                <div className="flex items-center justify-between rounded-lg border border-muted bg-muted/20 p-3 shadow-sm hover:bg-muted/30 transition-colors sm:col-span-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Empresa é MEI?</label>
                  <SwitchField control={control} name="is_mei" />
                </div>
              </div>

              {/* Endereço */}
              <h4 className="text-md font-semibold pt-4 border-t">Endereço</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SimpleFormField 
                  control={control}
                  name="cep"
                  label="CEP"
                  placeholder="00000-000"
                  mask="00000-000"
                  className="sm:col-span-1"
                />
                
                <SimpleFormField 
                  control={control}
                  name="tipo_logradouro"
                  label="Tipo"
                  placeholder="Rua, Av."
                  className="sm:col-span-1"
                />
                
                <SimpleFormField 
                  control={control}
                  name="logradouro"
                  label="Logradouro"
                  placeholder="Nome da rua, avenida..."
                  className="sm:col-span-1"
                />
                
                <SimpleFormField 
                  control={control}
                  name="numero"
                  label="Número"
                  placeholder="Nº"
                  className="sm:col-span-1"
                />
                
                <SimpleFormField 
                  control={control}
                  name="complemento"
                  label="Complemento"
                  placeholder="Apto, Bloco, Sala..."
                  className="sm:col-span-2"
                />
                
                <SimpleFormField 
                  control={control}
                  name="bairro"
                  label="Bairro"
                  placeholder="Bairro"
                  className="sm:col-span-1"
                />
                
                <SimpleFormField 
                  control={control}
                  name="cidade"
                  label="Cidade"
                  placeholder="Cidade"
                  className="sm:col-span-1"
                />
                
                <SelectField
                  control={control}
                  name="uf"
                  label="UF"
                  options={ufOptions}
                  className="sm:col-span-1"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyDataForm;
