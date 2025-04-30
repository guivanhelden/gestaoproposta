import React, { useState, useEffect, MouseEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronDown, User, UserCircle } from "lucide-react";
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

// Import Card components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  // Estado local para rastrear erros de validação (pode ser expandido conforme necessário)
  const [dateError, setDateError] = useState<string | null>(null);
  // Estado para controlar a abertura do popover do calendário
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // Estado para controlar o Collapsible
  const [isOpen, setIsOpen] = useState(true); // Começa aberto por padrão

  // Handler para mudança de data no Calendar
  const handleDateChange = (date: Date | undefined) => {
    try {
      if (!date) {
        onFormChange('birth_date', null);
        setDateError(null);
        return;
      }
      
      if (!isValid(date)) {
        setDateError("Data inválida");
        return;
      }
      
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log(`[BeneficiaryDialogForm] Data formatada: ${formattedDate}`);
      onFormChange('birth_date', formattedDate);
      setDateError(null);
      // Fechar o calendário após selecionar a data
      setIsCalendarOpen(false);
    } catch (error) {
      console.error("Erro ao processar data:", error);
      setDateError("Erro ao processar data");
    }
  };

  // Parse da data string para o componente Calendar
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

  // Validar a data quando o formulário é carregado ou atualizado
  useEffect(() => {
    // Limpar erro se birth_date for null
    if (formData.birth_date === null) {
      setDateError(null);
      return;
    }
    
    // Validar formato da data se estiver presente
    if (formData.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.birth_date)) {
      console.warn(`[BeneficiaryDialogForm] Formato de data inválido: ${formData.birth_date}`);
      setDateError("Formato de data inválido");
    } else {
      setDateError(null);
    }
  }, [formData.birth_date]);

  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/50" 
          style={{ boxShadow: "0 4px 20px -5px rgba(0, 4, 255, 0.28), 0 2px 10px -5px rgba(45, 8, 255, 0.32)" }}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400/30 via-blue-500/60 to-blue-400/30"></div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-500/10 text-blue-500">
              {formType === 'holder' ? (
                <UserCircle className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <CardTitle className="text-base font-medium text-foreground/90">
              {formType === 'holder' ? 'Dados do Titular' : 'Dados do Dependente'}
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {formType === 'holder' ? 'Titular' : 'Dependente'}
          </Badge>
        </div>
        <CardDescription className="text-xs mt-2">
          {formType === 'holder' ? 'Informações do responsável pelo plano' : 'Informações do dependente vinculado ao titular'}
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
            <span>{formType === 'holder' ? 'Detalhes do Titular' : 'Detalhes do Dependente'}</span>
          </div>
          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-4">
          {/* Campo Nome (Comum) */}
          <div className="space-y-1">
            <Label htmlFor="beneficiary-name">Nome Completo *</Label>
            <Input
              id="beneficiary-name"
              value={formData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              placeholder="Nome completo"
              disabled={isLoading}
            />
            {/* Adicionar <FormMessage /> se integrar com react-hook-form no futuro */} 
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Campo CPF (Comum) */}
            <div className="space-y-1">
              <Label htmlFor="beneficiary-cpf">CPF</Label>
              <Input
                id="beneficiary-cpf"
                value={formData.cpf}
                onChange={(e) => onFormChange('cpf', e.target.value)}
                placeholder="000.000.000-00" // Adicionar máscara se desejar
                disabled={isLoading}
              />
            </div>

            {/* Campo Data de Nascimento (Comum) */}
            <div className="space-y-1">
              <Label>Data de Nascimento</Label>
              <div className={cn(
                "relative rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring",
                dateError && "border-red-500"
              )}>
                <div 
                  className="p-2 rounded-md flex justify-between items-center cursor-pointer"
                  onClick={() => !isLoading && setIsCalendarOpen(!isCalendarOpen)}
                >
                  <span className={cn(
                    "flex-grow",
                    !selectedDate && "text-muted-foreground"
                  )}>
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </span>
                  <CalendarIcon className="h-4 w-4 opacity-70" />
                </div>
                
                {isCalendarOpen && (
                  <div className="absolute z-50 mt-1 bg-popover rounded-md shadow-md">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      disabled={isLoading}
                      initialFocus
                      locale={ptBR}
                    />
                  </div>
                )}
              </div>
              {dateError && <p className="text-sm text-red-500 mt-1">{dateError}</p>}
            </div>
          </div>

          {/* Campos Específicos do Titular */}
          {formType === 'holder' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="beneficiary-email">Email</Label>
                <Input
                  id="beneficiary-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => onFormChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="beneficiary-phone">Telefone</Label>
                <Input
                  id="beneficiary-phone"
                  value={formData.phone}
                  onChange={(e) => onFormChange('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Campo Específico do Dependente */}
          {formType === 'dependent' && (
            <div className="space-y-1">
              <Label htmlFor="beneficiary-relationship">Parentesco *</Label>
              <Input
                id="beneficiary-relationship"
                value={formData.relationship}
                onChange={(e) => onFormChange('relationship', e.target.value)}
                placeholder="Ex: Filho(a), Cônjuge"
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </CardContent>
    </CollapsibleContent>
  </Collapsible>
</Card>
  );
};

export default BeneficiaryDialogForm;