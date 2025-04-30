import React, { useState, useEffect, MouseEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, ChevronDown, User, UserCircle, CalendarDays, Mail, Phone, FileText, ChevronsUpDown, Heart, UserPlus, AlertCircle } from "lucide-react";
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";

// Import Card components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import Collapsible components
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Tipos de dados para o formulário (pode ser movido/importado)
export interface BeneficiaryFormData {
  name: string;
  cpf: string;
  birth_date: string | null; // Armazenar como YYYY-MM-DD string
  email: string; // Específico do titular
  phone: string; // Específico do titular
  relationship: string; // Específico do dependente
  mother_name: string; // Novo campo para nome da mãe (para ambos)
  // Não incluímos IDs aqui, eles são gerenciados pelo pai
}

// Props esperadas pelo formulário
interface BeneficiaryDialogFormProps {
  formData: BeneficiaryFormData;
  formType: 'holder' | 'dependent'; // Para saber quais campos mostrar/validar
  onFormChange: (field: keyof BeneficiaryFormData, value: any) => void;
  isLoading: boolean;
}

const BeneficiaryDialogForm: React.FC<BeneficiaryDialogFormProps> = ({
  formData,
  formType,
  onFormChange,
  isLoading
}) => {
  // Estado para controlar o Collapsible
  const [isOpen, setIsOpen] = useState(true); // Começa aberto por padrão

  // Parse da data string para exibição no UI quando colapsado
  let selectedDate: Date | undefined = undefined;
  if (formData.birth_date) {
    try {
      selectedDate = parse(formData.birth_date, 'yyyy-MM-dd', new Date());
      if (!isValid(selectedDate)) {
        console.warn(`[BeneficiaryDialogForm] Data inválida: ${formData.birth_date}`);
        selectedDate = undefined;
      }
    } catch (error) { 
      console.error(`[BeneficiaryDialogForm] Erro ao analisar data: ${formData.birth_date}`, error);
      selectedDate = undefined;
    }
  }

  return (
    <Card className="relative border-border/50 bg-card/50 shadow-sm" 
          style={{ boxShadow: "0 4px 20px -5px rgba(0, 4, 255, 0.28), 0 2px 10px -5px rgba(45, 8, 255, 0.32)" }}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400/30 via-blue-500/60 to-blue-400/30"></div>
      
      <CardHeader className="p-3 pb-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500/10 text-blue-500">
              {formType === 'holder' ? (
                <UserCircle className="h-3.5 w-3.5" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
            </div>
            <CardTitle className="text-sm font-medium text-foreground/90">
              {formType === 'holder' ? 'Dados do Titular' : 'Dados do Dependente'}
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
            {formType === 'holder' ? 'Titular' : 'Dependente'}
          </Badge>
        </div>
        <CardDescription className="text-xs mt-1.5">
          {formType === 'holder' ? 'Informações do responsável pelo plano' : 'Informações do dependente vinculado ao titular'}
        </CardDescription>
        <Separator className="mt-1.5" />
      </CardHeader>
      
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full border-t border-border/30"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-1.5 text-sm font-medium hover:bg-muted/30 transition-colors [&[data-state=open]>svg]:rotate-180">
          <div className="flex flex-1 items-center justify-between mr-2">
            <span className="text-xs">{formType === 'holder' ? 'Detalhes do Titular' : 'Detalhes do Dependente'}</span>
            
            {/* Info quando colapsado */}
            {!isOpen && formData.name && (
              <div className="flex items-center gap-1.5 ml-3">
                <Badge variant="outline" className="px-1.5 py-0.5 bg-blue-50/70 border-blue-200/70 text-blue-700 text-xs">
                  <User className="h-3 w-3 mr-1.5 text-blue-500" />
                  <span className="truncate max-w-[200px]">{formData.name}</span>
                </Badge>
                
                {formType === 'dependent' && formData.relationship && (
                  <Badge variant="outline" className="px-1.5 py-0.5 bg-amber-50/70 border-amber-200/70 text-amber-700 text-xs hidden sm:flex">
                    <Heart className="h-3 w-3 mr-1.5 text-amber-500" />
                    <span className="truncate max-w-[120px]">{formData.relationship}</span>
                  </Badge>
                )}
                
                {formData.birth_date && selectedDate && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="px-1.5 py-0.5 bg-green-50/70 border-green-200/70 text-green-700 text-xs hidden md:flex">
                          <CalendarDays className="h-3 w-3 mr-1.5 text-green-500" />
                          <span>{format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Data de Nascimento</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
            {!isOpen && !formData.name && (
              <Badge variant="outline" className="ml-3 px-1.5 py-0.5 bg-red-50/70 border-red-200/70 text-red-700 text-xs">
                <AlertCircle className="h-3 w-3 mr-1.5 text-red-500" />
                <span>Dados não preenchidos</span>
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-3 pt-2 space-y-3">
            {/* Campo Nome (Comum) */}
            <div className="space-y-1">
              <Label htmlFor="beneficiary-name" className="text-xs flex items-center">
                <div className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground mr-1.5">
                  <User className="h-3 w-3" />
                </div>
                Nome Completo *
              </Label>
              <Input
                id="beneficiary-name"
                value={formData.name}
                onChange={(e) => onFormChange('name', e.target.value)}
                placeholder="Nome completo"
                disabled={isLoading}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Campo CPF (Comum) */}
              <div className="space-y-1">
                <Label htmlFor="beneficiary-cpf" className="text-xs flex items-center">
                  <div className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground mr-1.5">
                    <FileText className="h-3 w-3" />
                  </div>
                  CPF
                </Label>
                <Input
                  id="beneficiary-cpf"
                  value={formData.cpf}
                  onChange={(e) => onFormChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  disabled={isLoading}
                  className="h-8 text-sm"
                />
              </div>

              {/* Campo Data de Nascimento (Comum) */}
              <div className="space-y-1">
                <Label className="text-xs flex items-center">
                  <div className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground mr-1.5">
                    <CalendarDays className="h-3 w-3" />
                  </div>
                  Data de Nascimento
                </Label>
                <DatePicker
                  value={formData.birth_date}
                  onChange={(date) => onFormChange('birth_date', date)}
                  placeholder="Selecione a data"
                  disabled={isLoading}
                  className="h-8"
                />
              </div>
            </div>

            {/* Campo Nome da Mãe (Comum para titular e dependente) */}
            <div className="space-y-1">
              <Label htmlFor="beneficiary-mother-name" className="text-xs flex items-center">
                <div className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground mr-1.5">
                  <User className="h-3 w-3" />
                </div>
                Nome da Mãe
              </Label>
              <Input
                id="beneficiary-mother-name"
                value={formData.mother_name || ''}
                onChange={(e) => onFormChange('mother_name', e.target.value)}
                placeholder="Nome completo da mãe"
                disabled={isLoading}
                className="h-8 text-sm"
              />
            </div>

            {/* Campos Específicos do Titular */}
            {formType === 'holder' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="beneficiary-email" className="text-xs flex items-center">
                    <div className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground mr-1.5">
                      <Mail className="h-3 w-3" />
                    </div>
                    Email
                  </Label>
                  <Input
                    id="beneficiary-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => onFormChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    disabled={isLoading}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="beneficiary-phone" className="text-xs flex items-center">
                    <div className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground mr-1.5">
                      <Phone className="h-3 w-3" />
                    </div>
                    Telefone
                  </Label>
                  <Input
                    id="beneficiary-phone"
                    value={formData.phone}
                    onChange={(e) => onFormChange('phone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    disabled={isLoading}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Campo Específico do Dependente */}
            {formType === 'dependent' && (
              <div className="space-y-1">
                <Label htmlFor="beneficiary-relationship" className="text-xs flex items-center">
                  <div className="flex items-center justify-center h-5 w-5 rounded-sm bg-muted text-muted-foreground mr-1.5">
                    <Heart className="h-3 w-3" />
                  </div>
                  Parentesco *
                </Label>
                <Select 
                  value={formData.relationship || ""} 
                  onValueChange={(value) => onFormChange('relationship', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Selecione o parentesco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Conjuge">Cônjuge</SelectItem>
                    <SelectItem value="Filho">Filho(a)</SelectItem>
                    <SelectItem value="Neto">Neto(a)</SelectItem>
                    <SelectItem value="Irmao">Irmão/Irmã</SelectItem>
                    <SelectItem value="MaePai">Mãe/Pai</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {formType === 'holder' && (
        <CardFooter className="p-2 flex justify-center border-t border-border/30">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs bg-blue-50/50 border-blue-200/50 text-blue-600 hover:bg-blue-100/50 hover:text-blue-700"
                  disabled={isLoading}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Adicionar Titular
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Adicionar novo titular ao plano</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      )}
    </Card>
  );
};

export default BeneficiaryDialogForm;