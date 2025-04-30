import React, { useState } from 'react';
import { Control, useWatch, Controller, FieldValues } from 'react-hook-form';
import { z } from 'zod';
import { Building2, ChevronDown, Users, Check, X, Edit, Trash2, PlusCircle, Search, MapPin, AtSign, Phone, User, Building, ChevronsUpDown, UserCheck } from "lucide-react";
import { IMaskInput } from 'react-imask';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Database } from "@/lib/database.types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Partner as PartnerUI } from "@/lib/utils/partner-utils";

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
  control: Control<any>; 
  onCnpjSearch?: (cnpj: string) => void; 
  isSearchingCnpj?: boolean; 
  partners?: PartnerUI[] | null | undefined; 
  companyId?: string | null; 
  onOpenAddPartner?: () => void;
  onOpenEditPartner?: (partner: PartnerUI) => void;
  onDeletePartner?: (partnerId: string) => void;
  isPartnerActionLoading?: boolean; 
  responsiblePartner?: PartnerUI | null;
};

interface SimpleFormFieldProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  name: keyof TFieldValues | string; 
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

interface OptionType { 
  value: string;
  label: string;
}

const SimpleFormField: React.FC<SimpleFormFieldProps> = ({ control, name, label, placeholder, type = "text", readOnly = false, className = "", mask = "" }) => {
  const getIconForField = (fieldName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      cnpj: <Building2 className="h-4 w-4 text-muted-foreground" />,
      razao_social: <Building className="h-4 w-4 text-muted-foreground" />,
      nome_fantasia: <Building2 className="h-4 w-4 text-muted-foreground" />,
      cep: <MapPin className="h-4 w-4 text-muted-foreground" />,
      endereco: <MapPin className="h-4 w-4 text-muted-foreground" />,
      numero: <MapPin className="h-4 w-4 text-muted-foreground" />,
      complemento: <MapPin className="h-4 w-4 text-muted-foreground" />,
      bairro: <MapPin className="h-4 w-4 text-muted-foreground" />,
      cidade: <MapPin className="h-4 w-4 text-muted-foreground" />,
      email: <AtSign className="h-4 w-4 text-muted-foreground" />,
      telefone: <Phone className="h-4 w-4 text-muted-foreground" />,
    };

    return iconMap[String(fieldName)] || <Building2 className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none flex items-center gap-1.5">
          <span className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground">
            {getIconForField(String(name))}
          </span>
          {label}
        </label>
        {readOnly && (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
            Somente leitura
          </Badge>
        )}
      </div>
      {mask ? (
        <div className="relative">
          <Controller
            name={name as any} 
            control={control}
            render={({ field, fieldState }) => (
              <>
                <IMaskInput
                  mask={mask}
                  unmask={false}
                  value={field.value || ''}
                  onAccept={(value) => field.onChange(value)}
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
                    {
                      "focus-visible:ring-primary/80 focus-visible:border-primary/50": true,
                      "border-red-500/50 focus-visible:ring-red-500/30": fieldState.error
                    }
                  )}
                  placeholder={placeholder}
                  readOnly={readOnly}
                />
                {fieldState.error && (
                  <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        </div>
      ) : (
        <Controller
          name={name as any} 
          control={control}
          render={({ field, fieldState }) => (
            <>
              <Input
                type={type}
                placeholder={placeholder}
                {...field}
                value={field.value || ''}
                readOnly={readOnly}
                className={cn(
                  "transition-all duration-200 focus-visible:ring-primary/80 focus-visible:border-primary/50",
                  {
                    "border-red-500/50 focus-visible:ring-red-500/30": fieldState.error
                  }
                )}
              />
              {fieldState.error && (
                <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
              )}
            </>
          )}
        />
      )}
    </div>
  );
};

const SwitchField: React.FC<SwitchFieldProps> = ({ control, name }) => {
  return (
    <Controller
      name={name as any} 
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

const SelectField: React.FC<SelectFieldProps> = ({ control, name, label, options, className = "" }) => {
  const getIconForSelectField = (fieldName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      uf: <MapPin className="h-4 w-4 text-muted-foreground" />,
    };

    return iconMap[String(fieldName)] || <ChevronDown className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none flex items-center gap-1.5">
          <span className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground">
            {getIconForSelectField(String(name))}
          </span>
          {label}
        </label>
      </div>
      <div className="relative">
        <Controller
          name={name as any} 
          control={control}
          render={({ field, fieldState }) => (
            <>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                value={field.value || ''}
              >
                <SelectTrigger className={cn(
                  "w-full transition-all duration-200 focus-visible:ring-primary/80 focus-visible:border-primary/50",
                  {
                    "border-red-500/50 focus-visible:ring-red-500/30": fieldState.error
                  }
                )}>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </motion.div>
                </SelectContent>
              </Select>
              {fieldState.error && (
                <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
              )}
            </>
          )}
        />
      </div>
    </div>
  );
};

const CompanyDataForm: React.FC<CompanyDataFormProps> = ({
  control, 
  partners,
  onCnpjSearch,
  isSearchingCnpj,
  companyId, 
  onOpenAddPartner,
  onOpenEditPartner,
  onDeletePartner,
  isPartnerActionLoading,
  responsiblePartner
}) => {
  // Estado para controlar o Collapsible
  const [isOpen, setIsOpen] = useState(false); // Começa fechado por padrão

  // Observa os valores de CNPJ e Razão Social do formulário
  const cnpjValue = useWatch({ control, name: 'cnpj' });
  const razaoSocialValue = useWatch({ control, name: 'razao_social' });

  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/50" style={{ boxShadow: "0 4px 20px -5px rgba(0, 4, 255, 0.28), 0 2px 10px -5px rgba(45, 8, 255, 0.32)" }}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400/30 via-blue-500/60 to-blue-400/30"></div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-500/10 text-blue-500">
              <Building2 className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-medium text-foreground/90">
              Dados da Empresa
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Cadastro CNPJ
          </Badge>
        </div>
        <CardDescription className="text-xs mt-2">
          Informações principais da empresa contratante
        </CardDescription>
        <Separator className="mt-2" />
      </CardHeader>

      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full border-t border-border/30"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium hover:underline [&[data-state=open]>svg]:rotate-180">
           <div className="flex flex-1 items-center justify-between mr-2"> {/* Div interna para layout */} 
             <div className="flex items-center">
               <span>Detalhes da Empresa e Sócios</span>
               {!isOpen && !responsiblePartner && (
                 <Badge variant="outline" className="ml-2 px-1.5 py-0.5 bg-red-50/80 border-red-200/70 text-red-600 hover:bg-red-100/40 transition-colors cursor-pointer" onClick={() => setIsOpen(true)}>
                   <X className="h-3 w-3 mr-1 text-red-500" />
                   <span className="text-xs">Definir Responsável</span>
                 </Badge>
               )}
             </div>
             
             {/* Informação extra visível apenas quando fechado (!isOpen) */} 
             {!isOpen && (
               <div className="flex flex-wrap items-center gap-2 ml-4 max-w-[65%] overflow-hidden">
                 {/* CNPJ e Razão Social */} 
                 {(cnpjValue || razaoSocialValue) && (
                   <div className="flex items-center gap-1.5">
                     {cnpjValue && (
                       <TooltipProvider>
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Badge variant="outline" className="px-2 py-1 bg-blue-50/70 border-blue-200/70 text-blue-700 hover:bg-blue-100/70 transition-colors">
                               <Building2 className="h-3 w-3 mr-1.5 text-blue-500" />
                               <span className="font-mono text-xs truncate max-w-[120px]">{cnpjValue}</span>
                             </Badge>
                           </TooltipTrigger>
                           <TooltipContent side="top"><p className="text-xs">{cnpjValue}</p></TooltipContent>
                         </Tooltip>
                       </TooltipProvider>
                     )}
                     {razaoSocialValue && (
                       <TooltipProvider>
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Badge variant="outline" className="px-2 py-1 bg-green-50/70 border-green-200/70 text-green-700 hover:bg-green-100/70 transition-colors">
                               <Building className="h-3 w-3 mr-1.5 text-green-500" />
                               <span className="text-xs truncate max-w-[150px]">{razaoSocialValue}</span>
                             </Badge>
                           </TooltipTrigger>
                           <TooltipContent side="top"><p className="text-xs">{razaoSocialValue}</p></TooltipContent>
                         </Tooltip>
                       </TooltipProvider>
                     )}
                   </div>
                 )}

                 {/* Sócio Responsável */} 
                 {responsiblePartner && (
                   <TooltipProvider>
                     <Tooltip delayDuration={300}>
                       <TooltipTrigger asChild>
                         <Badge variant="outline" className="px-2 py-1 bg-amber-50/80 border-amber-200/70 text-amber-700 hover:bg-amber-100/70 transition-colors">
                           <UserCheck className="h-3 w-3 mr-1.5 text-amber-500" />
                           <span className="text-xs font-medium truncate max-w-[150px]">{responsiblePartner.nome}</span>
                           <div className="ml-1.5 flex items-center justify-center h-4 w-4 rounded-full bg-green-500/20 border border-green-200/70 text-green-600">
                             <Check className="h-2.5 w-2.5" />
                           </div>
                         </Badge>
                       </TooltipTrigger>
                       <TooltipContent side="bottom" className="font-normal">
                         <div className="flex flex-col gap-1 text-xs">
                           <p className="font-medium">Sócio Responsável</p>
                           <p>{responsiblePartner.nome}</p>
                           {responsiblePartner.email && <p className="text-green-500 flex items-center"><AtSign className="h-3 w-3 mr-1" />{responsiblePartner.email}</p>}
                           {responsiblePartner.telefone && <p className="text-purple-500 flex items-center"><Phone className="h-3 w-3 mr-1" />{responsiblePartner.telefone}</p>}
                         </div>
                       </TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                 )}
                 
                 {/* Caso não tenha nem CNPJ/Razão nem Responsável */} 
                 {!(cnpjValue || razaoSocialValue) && !responsiblePartner && (
                   <Badge variant="outline" className="px-2 py-1 bg-slate-50/70 border-slate-200/70 text-slate-600">
                     <Search className="h-3 w-3 mr-1.5 text-slate-500" />
                     <span className="text-xs italic">Dados da empresa não preenchidos</span>
                   </Badge>
                 )}
               </div>
             )}
           </div>
            {/* Ícone precisa ser explícito aqui, usando ChevronsUpDown */}
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>

        <CollapsibleContent> {/* Conteúdo que será mostrado/ocultado */} 
          {/* CardContent contém o formulário e a seção de sócios */}
          <CardContent className="p-4 pt-0"> {/* Ajusta padding superior */} 
            <AnimatePresence initial={false}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-1 bg-blue-500/70 rounded-full"></div>
                    <h3 className="text-sm font-medium text-foreground/80">Identificação</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <SimpleFormField 
                        control={control}
                        name="cnpj"
                        label="CNPJ"
                        placeholder="00.000.000/0000-00"
                        mask="00.000.000/0000-00"
                      />
                      
                      {onCnpjSearch && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                type="button" 
                                size="icon" 
                                variant="outline"
                                className="absolute right-1 top-7 h-8 w-8"
                                onClick={() => {
                                  const cnpjValue = (document.querySelector('input[name="cnpj"]') as HTMLInputElement)?.value;
                                  if (cnpjValue && cnpjValue.length >= 14) {
                                    onCnpjSearch(cnpjValue);
                                  }
                                }}
                                disabled={isSearchingCnpj}
                              >
                                {isSearchingCnpj ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  >
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                  </motion.div>
                                ) : (
                                  <Search className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-xs">Buscar dados por CNPJ</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <SimpleFormField 
                      control={control}
                      name="razao_social"
                      label="Razão Social"
                      placeholder="Razão Social da Empresa"
                    />
                  </div>

                  <SimpleFormField 
                    control={control}
                    name="nome_fantasia"
                    label="Nome Fantasia"
                    placeholder="Nome Fantasia da Empresa"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-1 bg-blue-500/70 rounded-full"></div>
                    <h3 className="text-sm font-medium text-foreground/80">Dados Adicionais</h3>
                  </div>
                  
                  <div className="bg-muted/10 p-3 rounded-lg border border-border/50">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      <SimpleFormField 
                        control={control}
                        name="data_abertura"
                        label="Data de Abertura"
                        type="date"
                        placeholder="DD/MM/AAAA"
                      />
                      <SimpleFormField 
                        control={control}
                        name="natureza_juridica"
                        label="Natureza Jurídica"
                        placeholder="Ex: LTDA, SA"
                      />
                      <SimpleFormField 
                        control={control}
                        name="cnae"
                        label="CNAE Principal"
                        placeholder="Código e Descrição"
                      />
                      
                      <div className="h-full rounded-lg border border-muted p-3 bg-background/80 shadow-sm transition-colors">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-500/10 text-green-500">
                                <Check className="h-3 w-3" />
                              </div>
                              <span className="text-sm font-medium">Situação Cadastral</span>
                            </div>
                            <Badge variant="outline" className="text-xs px-1 py-0.5 font-normal bg-green-50 text-green-600 border-green-200">
                              Ativa
                            </Badge>
                          </div>
                          
                          <Separator className="my-2" />
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/10 text-blue-500">
                                <Building className="h-3 w-3" />
                              </div>
                              <span className="text-sm font-medium">Empresa é MEI?</span>
                            </div>
                            <SwitchField control={control} name="is_mei" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-1 bg-blue-500/70 rounded-full"></div>
                    <h3 className="text-sm font-medium text-foreground/80">Endereço</h3>
                  </div>
                  
                  <div className="bg-muted/10 p-3 rounded-lg border border-border/50">
                    <div className="flex mb-4">
                      <div className="w-1/3 mr-2">
                        <SimpleFormField 
                          control={control}
                          name="cep"
                          label="CEP"
                          placeholder="00000-000"
                          mask="00000-000"
                        />
                      </div>
                      <div className="flex items-end mb-2 ml-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-10 transition-all hover:bg-blue-50"
                                onClick={() => {
                                  console.log("Buscar CEP");
                                }}
                              >
                                <MapPin className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
                                <span className="text-xs">Buscar Endereço</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-xs">Buscar endereço pelo CEP</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                      <div className="lg:col-span-2">
                        <SimpleFormField 
                          control={control}
                          name="endereco"
                          label="Logradouro"
                          placeholder="Rua, Avenida, etc."
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <SimpleFormField 
                          control={control}
                          name="numero"
                          label="Número"
                          placeholder="123"
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <SimpleFormField 
                          control={control}
                          name="complemento"
                          label="Complemento"
                          placeholder="Sala, Andar, etc."
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <SimpleFormField 
                        control={control}
                        name="bairro"
                        label="Bairro"
                        placeholder="Bairro"
                      />
                      <SimpleFormField 
                        control={control}
                        name="cidade"
                        label="Cidade"
                        placeholder="Cidade"
                      />
                      <SelectField
                        control={control}
                        name="uf"
                        label="UF"
                        options={ufOptions}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>   
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-1 bg-blue-500/70 rounded-full"></div>
                <h3 className="text-sm font-medium text-foreground/80">Sócios da Empresa</h3>
              </div>
              
              <div className="mb-4 bg-muted/20 rounded-lg p-4 border border-border/50" style={{ boxShadow: "0 8px 20px -5px rgba(0, 0, 0, 0.1), 0 2px 10px -5px rgba(0, 0, 0, 0.05)" }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500/10 text-blue-500 mr-2">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <h4 className="text-sm font-medium">
                      {partners?.length || 0} {partners?.length === 1 ? 'Sócio Cadastrado' : 'Sócios Cadastrados'}
                    </h4>
                  </div>
                  
                  {companyId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            type="button"
                            onClick={onOpenAddPartner}
                            size="sm" 
                            variant="outline"
                            className="h-8 transition-all hover:bg-blue-50"
                            disabled={isPartnerActionLoading}
                          >
                            <PlusCircle className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs">Adicionar</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">Adicionar novo sócio à empresa</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {(!partners || partners.length === 0) ? (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="p-6 rounded-md text-center border border-dashed bg-background/50 flex flex-col items-center justify-center"
                    >
                      <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                        <Users className="h-5 w-5 text-muted-foreground/70" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {companyId ? "Nenhum sócio cadastrado ainda." : "Salve os dados da empresa para adicionar sócios."} 
                      </p>
                      {companyId && (
                        <Button 
                          type="button"
                          onClick={onOpenAddPartner}
                          size="sm" 
                          variant="link"
                          className="mt-2 text-xs h-8 text-blue-500 hover:text-blue-600"
                          disabled={isPartnerActionLoading}
                        >
                          <PlusCircle className="mr-1 h-3 w-3" />
                          Adicionar o primeiro sócio
                        </Button>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="overflow-hidden rounded-md border border-border/50 bg-background"
                    >
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted/30 border-b border-border/50">
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Nome</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Email</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Telefone</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Responsável</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partners.map((partner, index) => (
                            <motion.tr 
                              key={partner.id} 
                              className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <td className="px-4 py-2.5 font-medium text-sm">{partner.nome}</td>
                              <td className="px-4 py-2.5 text-sm">{partner.email || "-"}</td>
                              <td className="px-4 py-2.5 text-sm">{partner.telefone || "-"}</td>
                              <td className="px-4 py-2.5 text-center">
                                {partner.is_responsavel ? (
                                  <Badge variant="outline" className="text-xs px-1 py-0.5 font-normal bg-green-50 text-green-600 border-green-200">
                                    <Check className="h-3 w-3 mr-1" />
                                    Sim
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs px-1 py-0.5 font-normal text-muted-foreground">
                                    <X className="h-3 w-3 mr-1" />
                                    Não
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
                                          onClick={() => onOpenEditPartner?.(partner)}
                                          disabled={isPartnerActionLoading}
                                        >
                                          <Edit className="h-3.5 w-3.5 text-blue-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="left">
                                        <p className="text-xs">Editar sócio</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                                          onClick={() => onDeletePartner?.(partner.id)}
                                          disabled={isPartnerActionLoading}
                                        >
                                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="left">
                                        <p className="text-xs">Excluir sócio</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default CompanyDataForm;
