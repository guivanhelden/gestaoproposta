import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Partner } from './CompanyDataForm';
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, User, AtSign, Phone, Check, AlertCircle, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        className="w-full mb-4 border rounded-md shadow-sm"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2.5 bg-muted/50 rounded-t-md text-sm font-medium hover:bg-muted/80 transition-colors [&[data-state=open]>svg]:rotate-180">
           <div className="flex flex-1 items-center justify-between mr-2">
             <div className="flex items-center">
               <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary mr-1.5">
                 <User className="h-3 w-3" />
               </div>
               <span>Detalhes do Sócio</span>
               {!isOpen && responsiblePartner?.is_responsavel && (
                 <Badge variant="outline" className="ml-2 px-1.5 py-0.5 bg-blue-50/80 border-blue-200/70 text-blue-600">
                   <UserCheck className="h-3 w-3 mr-1 text-blue-500" />
                   <span className="text-xs">Responsável</span>
                 </Badge>
               )}
             </div>
             
             {/* Informação extra visível apenas quando fechado (!isOpen) */} 
             {!isOpen && (
               <div className="flex flex-wrap items-center gap-1.5 ml-4 max-w-[60%] overflow-hidden">
                 {responsiblePartner ? (
                   <TooltipProvider>
                     <div className="flex flex-wrap items-center gap-1.5">
                       <Tooltip delayDuration={300}>
                         <TooltipTrigger asChild>
                           <Badge variant="outline" className="px-2 py-1 bg-amber-50/80 border-amber-200/70 text-amber-700 hover:bg-amber-100/70 transition-colors">
                             <User className="h-3 w-3 mr-1.5 text-amber-500" />
                             <span className="text-xs font-medium truncate max-w-[150px]">{responsiblePartner.nome}</span>
                           </Badge>
                         </TooltipTrigger>
                         <TooltipContent side="bottom" className="font-normal">
                           <p className="text-xs">{responsiblePartner.nome}</p>
                         </TooltipContent>
                       </Tooltip>
                       
                       {responsiblePartner.email && (
                         <Tooltip delayDuration={300}>
                           <TooltipTrigger asChild>
                             <Badge variant="outline" className="px-2 py-1 bg-green-50/80 border-green-200/70 text-green-700 hover:bg-green-100/70 transition-colors hidden sm:flex">
                               <AtSign className="h-3 w-3 mr-1.5 text-green-500" />
                               <span className="text-xs truncate max-w-[120px]">{responsiblePartner.email}</span>
                             </Badge>
                           </TooltipTrigger>
                           <TooltipContent side="bottom" className="font-normal">
                             <p className="text-xs">{responsiblePartner.email}</p>
                           </TooltipContent>
                         </Tooltip>
                       )}
                       
                       {responsiblePartner.telefone && (
                         <Tooltip delayDuration={300}>
                           <TooltipTrigger asChild>
                             <Badge variant="outline" className="px-2 py-1 bg-purple-50/80 border-purple-200/70 text-purple-700 hover:bg-purple-100/70 transition-colors hidden md:flex">
                               <Phone className="h-3 w-3 mr-1.5 text-purple-500" />
                               <span className="text-xs">{responsiblePartner.telefone}</span>
                             </Badge>
                           </TooltipTrigger>
                           <TooltipContent side="bottom" className="font-normal">
                             <p className="text-xs">Telefone: {responsiblePartner.telefone}</p>
                           </TooltipContent>
                         </Tooltip>
                       )}
                     </div>
                   </TooltipProvider>
                 ) : (
                   <Badge variant="outline" className="px-2 py-1 bg-red-50/80 border-red-200/70 text-red-700">
                     <AlertCircle className="h-3 w-3 mr-1.5 text-red-500" />
                     <span className="text-xs italic">Sem sócio responsável</span>
                   </Badge>
                 )}
               </div>
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
              <Label htmlFor="is_responsavel" className="flex items-center">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 mr-1.5">
                  <UserCheck className="h-3 w-3" />
                </div>
                Responsável pela Empresa?
              </Label>
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