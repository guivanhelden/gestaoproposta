import React, { useState, useEffect, MouseEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, parse, isValid } from 'date-fns';
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
  // Estado local para rastrear erros de validação (pode ser expandido conforme necessário)
  const [dateError, setDateError] = useState<string | null>(null);
  // Estado para controlar a abertura do popover do calendário
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
  );
};

export default BeneficiaryDialogForm; 