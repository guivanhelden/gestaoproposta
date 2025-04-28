import * as React from "react"
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ptBR, Locale } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Estilizações personalizadas para o react-datepicker (podem ser ajustadas conforme necessário)
import { createGlobalStyle } from "styled-components"

// Estilos globais para substituir o estilo padrão do datepicker
const DatePickerStyles = createGlobalStyle`
  .react-datepicker {
    font-family: inherit;
    border-radius: 0.5rem;
    border: 1px solid hsl(var(--border));
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  }
  
  .react-datepicker__header {
    background-color: hsl(var(--background));
    border-bottom: 1px solid hsl(var(--border));
  }
  
  .react-datepicker__current-month {
    font-weight: 500;
    font-size: 0.875rem;
    padding: 0.5rem 0;
  }
  
  .react-datepicker__navigation {
    top: 8px;
  }
  
  .react-datepicker__day-name {
    color: hsl(var(--muted-foreground));
    font-size: 0.75rem;
    width: 2rem;
    margin: 0.2rem;
  }
  
  .react-datepicker__day {
    width: 2rem;
    height: 2rem;
    margin: 0.2rem;
    line-height: 2rem;
    border-radius: 0.25rem;
    transition: all 0.15s ease-in-out;
  }
  
  .react-datepicker__day:hover {
    background-color: hsl(var(--accent));
  }
  
  .react-datepicker__day--selected {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
  }
  
  .react-datepicker__day--today {
    background-color: hsl(var(--accent));
    color: hsl(var(--accent-foreground));
    font-weight: normal;
  }
  
  .react-datepicker__day--keyboard-selected {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
  }
  
  .react-datepicker__day--outside-month {
    color: hsl(var(--muted-foreground));
    opacity: 0.5;
  }

  .react-datepicker__triangle {
    display: none;
  }
`

// Definir os tipos para o componente Calendar
export interface CalendarProps {
  /** Data selecionada ou undefined para nenhuma seleção */
  selected?: Date
  /** Callback chamado quando a seleção muda */
  onSelect?: (date: Date | undefined) => void
  /** Classe CSS para o elemento raiz */
  className?: string
  /** Modo de seleção: single = uma data, range = intervalo, multiple = várias datas */
  mode?: "single" | "range" | "multiple"
  /** Locale do calendario (default: pt-BR) */
  locale?: Locale
  /** Mostrar datas de fora do mês atual (não usado, apenas para compatibilidade) */
  showOutsideDays?: boolean
  /** Flag para desabilitar o calendário */
  disabled?: boolean
  /** Referência inicial de foco */
  initialFocus?: boolean
  /** Outros props a serem passados para o DayPicker */
  [key: string]: any
}

function Calendar({
  selected,
  onSelect,
  className,
  mode = "single",
  locale = ptBR,
  showOutsideDays = true,
  disabled = false,
  initialFocus = false,
  ...props
}: CalendarProps) {
  // Handler para tratar a seleção de data
  const handleDateChange = (date: Date | null) => {
    if (onSelect) {
      onSelect(date || undefined)
    }
  }
  
  // Impedir propagação de eventos para evitar fechamento de modais
  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <>
      <DatePickerStyles />
      <div className={cn("p-3", className)} onClick={handleCalendarClick}>
        <ReactDatePicker
          selected={selected}
          onChange={handleDateChange}
          inline
          locale={locale}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          disabled={disabled}
          monthsShown={1}
          autoFocus={initialFocus}
          shouldCloseOnSelect={false} // Nunca fecha automaticamente (importante para modais)
          fixedHeight
          disabledKeyboardNavigation={disabled}
          {...props}
        />
      </div>
    </>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
