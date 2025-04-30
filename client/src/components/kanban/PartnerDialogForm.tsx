import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Partner } from './CompanyDataForm';
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";

// Interface para os dados que o formulário manipula
export interface PartnerFormData {
  nome: string;
  email: string;
  telefone: string;
  is_responsavel: boolean;
  partners: Partner[];
}

// Props esperadas pelo formulário
interface PartnerDialogFormProps {
  formData: PartnerFormData;
  onFormChange: (field: keyof PartnerFormData, value: any) => void;
  isLoading: boolean;
  formId: string;
  partners: Partner[];
}

const PartnerDialogForm: React.FC<PartnerDialogFormProps> = ({
  formId,
  formData,
  onFormChange,
  isLoading,
  partners
}) => {

  // Estado para controlar o Collapsible
  const [isOpen, setIsOpen] = useState(true);

  // Encontra o sócio responsável usando a propriedade correta
  const responsiblePartner = useMemo(() => partners?.find(p => p.is_responsavel), [partners]);

  return (
    <div id={formId} className="space-y-4 py-4">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full mb-4 border rounded-md"
      >
        {/* Trigger agora renderiza seu próprio botão, aplicamos estilos nele */}
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 bg-muted/50 rounded-t-md text-sm font-medium hover:underline [&[data-state=open]>svg]:rotate-180">
           <div className="flex flex-1 items-center justify-between mr-2"> {/* Div interna para layout */} 
             <span>Detalhes do Sócio</span>
             {/* Informação extra visível apenas quando fechado (!isOpen) */} 
             {!isOpen && responsiblePartner && (
               <span className="text-xs text-muted-foreground truncate ml-4 font-normal">
                 Responsável: <span className="font-medium">{responsiblePartner.nome}</span>
               </span>
             )}
           </div>
            {/* Ícone explícito */}
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>

        <CollapsibleContent className="px-4 pt-2 pb-4 border-t border-border"> 
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                placeholder="Nome do sócio"
                value={formData.nome || ''}
                onChange={(e) => onFormChange('nome', e.target.value)}
                disabled={isLoading}
                className={cn({"opacity-50 cursor-not-allowed": isLoading})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email || ''}
                onChange={(e) => onFormChange('email', e.target.value)}
                disabled={isLoading}
                className={cn({"opacity-50 cursor-not-allowed": isLoading})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={formData.telefone || ''}
                onChange={(e) => onFormChange('telefone', e.target.value)}
                disabled={isLoading}
                className={cn({"opacity-50 cursor-not-allowed": isLoading})}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="is_responsavel">Responsável pela Empresa?</Label>
              <Switch
                id="is_responsavel"
                checked={formData.is_responsavel || false}
                onCheckedChange={(checked) => onFormChange('is_responsavel', checked)}
                disabled={isLoading}
                className={cn({"opacity-50 cursor-not-allowed": isLoading})}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default PartnerDialogForm;