import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  /** Valor da data em formato 'yyyy-MM-dd' */
  value?: string | null;
  /** Callback chamado quando a data é alterada */
  onChange: (date: string | null) => void;
  /** Placeholder quando não há data selecionada */
  placeholder?: string;
  /** Indica se o componente está desabilitado */
  disabled?: boolean;
  /** Classes adicionais para o container */
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  className
}: DatePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [dateError, setDateError] = React.useState<string | null>(null);
  const [displayDate, setDisplayDate] = React.useState<Date | undefined>(undefined);

  // Atualiza a data de exibição quando o valor muda externamente
  React.useEffect(() => {
    if (value) {
      try {
        const parsedDate = parse(value, 'yyyy-MM-dd', new Date());
        if (isValid(parsedDate)) {
          setDisplayDate(parsedDate);
          setDateError(null);
        } else {
          console.warn(`[DatePicker] Data inválida: ${value}`);
          setDisplayDate(undefined);
          setDateError("Formato de data inválido");
        }
      } catch (error) {
        console.error(`[DatePicker] Erro ao converter data: ${value}`, error);
        setDisplayDate(undefined);
        setDateError("Erro ao processar data");
      }
    } else {
      setDisplayDate(undefined);
      setDateError(null);
    }
  }, [value]);

  // Função chamada quando uma data é selecionada no calendário
  const handleDateSelect = (date: Date | undefined) => {
    try {
      if (!date) {
        onChange(null);
        setDisplayDate(undefined);
        setDateError(null);
      } else if (isValid(date)) {
        const formattedDate = format(date, 'yyyy-MM-dd');
        console.log(`[DatePicker] Data formatada: ${formattedDate}`);
        onChange(formattedDate);
        setDisplayDate(date);
        setDateError(null);
      } else {
        setDateError("Data inválida selecionada");
      }
    } catch (error) {
      console.error("[DatePicker] Erro ao processar data selecionada:", error);
      setDateError("Erro ao processar data");
    }
    
    setIsCalendarOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div 
        className={cn(
          "flex items-center border border-input rounded-md p-2 cursor-pointer",
          !displayDate && "text-muted-foreground",
          dateError && "border-red-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setIsCalendarOpen(!isCalendarOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {displayDate 
          ? format(displayDate, "dd/MM/yyyy", { locale: ptBR }) 
          : <span>{placeholder}</span>
        }
      </div>
      
      {isCalendarOpen && !disabled && (
        <div className="absolute z-50 mt-1 bg-popover rounded-md shadow-md">
          <Calendar
            mode="single"
            selected={displayDate}
            onSelect={handleDateSelect}
            initialFocus
            locale={ptBR}
          />
        </div>
      )}
      
      {dateError && <p className="text-xs text-destructive mt-1">{dateError}</p>}
    </div>
  );
}

export default DatePicker; 