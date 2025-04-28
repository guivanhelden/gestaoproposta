import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Embora os botões fiquem no pai, pode ser útil importar
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

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

  // Handler para mudança de data no Calendar
  const handleDateChange = (date: Date | undefined) => {
    onFormChange('birth_date', date ? format(date, 'yyyy-MM-dd') : null);
  };

  // Parse da data string para o componente Calendar
  let selectedDate: Date | undefined = undefined;
  if (formData.birth_date) {
    try {
      selectedDate = parse(formData.birth_date, 'yyyy-MM-dd', new Date());
      if (isNaN(selectedDate.getTime())) selectedDate = undefined; // Invalid date
    } catch { 
      selectedDate = undefined;
    }
  }

  return (
    // Usamos um div, pois o <form> e submit são gerenciados pelo pai via botão no DialogFooter
    <div className="space-y-4 py-4">
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
           <Popover>
             <PopoverTrigger asChild>
               <Button
                 variant={"outline"}
                 className={cn(
                   "w-full justify-start text-left font-normal",
                   !selectedDate && "text-muted-foreground"
                 )}
                 disabled={isLoading}
               >
                 <CalendarIcon className="mr-2 h-4 w-4" />
                 {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
               </Button>
             </PopoverTrigger>
             <PopoverContent className="w-auto p-0">
               <Calendar
                 mode="single"
                 selected={selectedDate}
                 onSelect={handleDateChange}
                 disabled={isLoading}
                 initialFocus
                 // Definir range de datas se necessário
                 // fromYear={...} toYear={...}
               />
             </PopoverContent>
           </Popover>
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
  );
};

export default BeneficiaryDialogForm; 