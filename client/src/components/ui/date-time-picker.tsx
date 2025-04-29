import * as React from "react";
import { format, isValid, parseISO } from "date-fns"; 
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, Check, X } from "lucide-react"; 
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DateTimePickerProps {
  value?: string | null; // ISO string
  onChange: (dateTimeISO: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({ 
  value, 
  onChange, 
  placeholder = "Selecione data e hora", 
  disabled = false, 
  className 
}: DateTimePickerProps) {
  // Estado para controlar a abertura do calendário
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Estados para os valores de data e hora
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [hour, setHour] = React.useState<string>("00");
  const [minute, setMinute] = React.useState<string>("00");
  
  // Referência para o elemento container do datepicker
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Função para converter qualquer string ISO para um objeto Date
  const parseISOSafely = (isoString: string | null | undefined): Date | undefined => {
    if (!isoString) return undefined;
    
    try {
      const parsedDate = parseISO(isoString);
      return isValid(parsedDate) ? parsedDate : undefined;
    } catch (error) {
      console.error("Erro ao converter ISO para Date:", error);
      return undefined;
    }
  };
  
  // Sincronizar com a prop value quando ela mudar
  React.useEffect(() => {
    console.log("[DateTimePicker] Prop value:", value);
    
    const parsedDate = parseISOSafely(value);
    
    if (parsedDate) {
      setSelectedDate(parsedDate);
      setHour(String(parsedDate.getHours()).padStart(2, '0'));
      setMinute(String(parsedDate.getMinutes()).padStart(2, '0'));
      console.log("[DateTimePicker] Data parseada com sucesso:", parsedDate);
    } else {
      setSelectedDate(undefined);
      setHour("00");
      setMinute("00");
    }
  }, [value]);
  
  // Adicionar event listener para fechar o calendário quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);
  
  // Handler para a seleção de data no calendário
  const handleCalendarSelect = (date: Date | undefined) => {
    console.log("[DateTimePicker] Data selecionada:", date);
    setSelectedDate(date);
    
    if (!date) {
      onChange(null);
      setIsOpen(false);
    }
  };
  
  // Handler para alterações nos inputs de hora/minuto
  const handleTimeChange = (type: 'hour' | 'minute', valueStr: string) => {
    const numValue = parseInt(valueStr, 10);
    
    if (isNaN(numValue)) return;
    
    if (type === 'hour') {
      const validHour = Math.max(0, Math.min(23, numValue));
      setHour(String(validHour).padStart(2, '0'));
    } else {
      const validMinute = Math.max(0, Math.min(59, numValue));
      setMinute(String(validMinute).padStart(2, '0'));
    }
  };
  
  // Handler para o clique no botão Aplicar
  const handleApply = () => {
    if (!selectedDate) {
      onChange(null);
      setIsOpen(false);
      return;
    }
    
    // Converter hora e minuto para números
    const hourNum = parseInt(hour, 10) || 0;
    const minuteNum = parseInt(minute, 10) || 0;
    
    // Criar um timestamp UTC (importante para o Supabase)
    const utcTimestamp = Date.UTC(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hourNum,
      minuteNum,
      0,
      0
    );
    
    const dateWithTime = new Date(utcTimestamp);
    const isoString = dateWithTime.toISOString();
    
    console.log("[DateTimePicker] Aplicando data:", isoString);
    onChange(isoString);
    setIsOpen(false);
  };
  
  // Handler para limpar a data
  const handleClear = () => {
    setSelectedDate(undefined);
    setHour("00");
    setMinute("00");
    onChange(null);
    setIsOpen(false);
  };
  
  // Verificar se é possível aplicar (data selecionada e hora/minuto válidos)
  const canApply = !!selectedDate;
  
  // Formatar valor para exibição
  let displayValue = placeholder;
  if (selectedDate && isValid(selectedDate)) {
    displayValue = `${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} ${hour}:${minute}`;
  }
  
  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-start text-left font-normal",
          !selectedDate && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {displayValue}
      </Button>
      
      {isOpen && (
        <Card 
          className="absolute mt-1 z-[9999] bg-white shadow-lg border rounded-md" 
          style={{ minWidth: '280px' }}
        >
          <CardHeader className="py-2 px-3 border-b flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Selecione uma data</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0" 
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarSelect}
                disabled={disabled}
                locale={ptBR}
                className="border-0"
              />
            </div>
            
            <div className="p-3 border-t flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={hour}
                  onChange={(e) => handleTimeChange('hour', e.target.value)}
                  className="w-16 h-8 text-center"
                  disabled={disabled || !selectedDate}
                />
                <span>:</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={minute}
                  onChange={(e) => handleTimeChange('minute', e.target.value)}
                  className="w-16 h-8 text-center"
                  disabled={disabled || !selectedDate}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleClear} 
                  className="flex-1"
                  disabled={disabled}
                >
                  Limpar
                </Button>
                
                <Button 
                  type="button" 
                  onClick={handleApply} 
                  className={cn(
                    "flex-1",
                    canApply && "bg-primary hover:bg-primary/90"
                  )}
                  disabled={disabled || !canApply}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aplicar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DateTimePicker; 