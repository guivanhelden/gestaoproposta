import React, { useState, useEffect } from 'react';
import { Control, Controller, FieldValues } from "react-hook-form";
import { Building2, ChevronDown, Users, Check, X, Edit, Trash2, PlusCircle } from "lucide-react";
import { IMaskInput } from 'react-imask';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Database } from "@/lib/database.types";

// Manter a interface Partner aqui ou movê-la para um local compartilhado (ex: types.ts)
export interface Partner {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  is_responsavel: boolean;
  company_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  is_active?: boolean | null;
  incluir_como_titular?: boolean | null;
}

// Definir PmePartner aqui se não for usado em outro lugar
type PmePartner = Database['public']['Tables']['pme_company_partners']['Row'];

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
  partners?: Partner[] | null | undefined; // Renomear de volta para partners ou manter initialPartners, mas agora é apenas para exibição
  companyId?: string | null; // ID da empresa, pode ser nulo inicialmente
  // Callbacks para o PAI controlar o Dialog/CRUD
  onOpenAddPartner?: () => void;
  onOpenEditPartner?: (partner: Partner) => void;
  onDeletePartner?: (partnerId: string) => void;
  isPartnerActionLoading?: boolean; // Flag de loading do pai
};

// Interfaces para as props dos componentes auxiliares
interface SimpleFormFieldProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  name: keyof TFieldValues | string; // Aceitar string para nomes dinâmicos se necessário
  label: string;
  placeholder: string;
  type?: string;
  readOnly?: boolean;
  className?: string;
  mask?: string;
}

interface SwitchFieldProps<TFieldValues extends FieldValues = FieldValues> {
   control: Control<TFieldValues>;
   name: keyof TFieldValues | string;
}

interface SelectFieldProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  name: keyof TFieldValues | string;
  label: string;
  options: { value: string; label: string }[];
  className?: string;
}

interface OptionType { // Tipo explícito para option
  value: string;
  label: string;
}

// Componente auxiliar para campo com máscara
const SimpleFormField: React.FC<SimpleFormFieldProps> = ({ control, name, label, placeholder, type = "text", readOnly = false, className = "", mask = "" }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
      {mask ? (
        <div className="relative">
          <Controller
            name={name as any} // Usar 'as any' aqui ou tipar TFieldValues corretamente
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
          name={name as any} // Usar 'as any' aqui ou tipar TFieldValues corretamente
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
const SwitchField: React.FC<SwitchFieldProps> = ({ control, name }) => {
  return (
    <Controller
      name={name as any} // Usar 'as any' aqui ou tipar TFieldValues corretamente
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
const SelectField: React.FC<SelectFieldProps> = ({ control, name, label, options, className = "" }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
      <Controller
        name={name as any} // Usar 'as any' aqui ou tipar TFieldValues corretamente
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: OptionType) => ( // <-- Tipo explícito para option
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
  isSearchingCnpj,
  partners,
  companyId,
  onOpenAddPartner,
  onOpenEditPartner,
  onDeletePartner,
  isPartnerActionLoading
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
      <CardContent className="space-y-4 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SimpleFormField 
            control={control}
            name="cnpj"
            label="CNPJ"
            placeholder="00.000.000/0000-00"
            mask="00.000.000/0000-00"
          />
          <SimpleFormField 
            control={control}
            name="razao_social"
            label="Razão Social"
            placeholder="Razão Social da Empresa"
          />
        </div>

        {/* Acordeão DIY usando useState */}
        <div className="w-full border-t mt-4 pt-4">
          <button 
            type="button"
            onClick={() => setIsExpanded(!isExpanded)} 
            className="flex justify-between w-full text-base font-medium text-gray-600 py-2 hover:text-gray-800 transition-colors"
          >
            Mais Detalhes da Empresa
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {isExpanded && (
            <div className="pt-4 space-y-6 animate-in fade-in duration-200">
              {/* Dados Adicionais da Empresa */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-600">Dados Adicionais</h4>
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
                     placeholder="DD/MM/AAAA" // <-- Adicionado placeholder
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
              </div>
              
              {/* Endereço */}
               <div className="space-y-4 border-t pt-4">
                 <h4 className="text-md font-semibold text-gray-600">Endereço</h4>
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
              
              {/* Seção de Sócios - Apenas Lista e Botões que chamam props */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-md font-semibold text-gray-600 flex items-center">
                    <Users className="mr-2 h-4 w-4 text-primary/70" />
                    Sócios
                  </h4>
                  {companyId && (
                    <Button 
                      type="button"
                      onClick={onOpenAddPartner}
                      size="sm" 
                      variant="outline"
                      disabled={isPartnerActionLoading}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Adicionar Sócio
                    </Button>
                  )}
                </div>

                {/* Renderiza a lista de sócios vinda da prop `partners` */}
                {(!partners || partners.length === 0) ? (
                  <div className="p-4 bg-muted rounded-md text-center border border-dashed">
                    <p className="text-sm text-muted-foreground">
                      {companyId ? "Nenhum sócio cadastrado." : "Salve os dados da empresa para adicionar sócios."} 
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-2 text-left">Nome</th>
                          <th className="px-4 py-2 text-left">Email</th>
                          <th className="px-4 py-2 text-left">Telefone</th>
                          <th className="px-4 py-2 text-center">Responsável</th>
                          <th className="px-4 py-2 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partners.map((partner) => (
                          <tr key={partner.id} className="border-b border-muted">
                            <td className="px-4 py-2 font-medium">{partner.nome}</td>
                            <td className="px-4 py-2">{partner.email || "-"}</td>
                            <td className="px-4 py-2">{partner.telefone || "-"}</td>
                            <td className="px-4 py-2 text-center">
                              {partner.is_responsavel ? (
                                <Check className="h-4 w-4 text-green-600 inline-block" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground inline-block" />
                              )}
                            </td>
                            <td className="px-4 py-2 text-right space-x-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onOpenEditPartner?.(partner)}
                                disabled={isPartnerActionLoading}
                              >
                                <Edit className="h-4 w-4 text-blue-500" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onDeletePartner?.(partner.id)}
                                disabled={isPartnerActionLoading}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Excluir</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyDataForm;
