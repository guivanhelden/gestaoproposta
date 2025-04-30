import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit, Trash2, PlusCircle, UserCircle, User, CalendarDays, AtSign, Phone, Heart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Importar tipos (ajuste o caminho se necessário)
import { Database } from "@/lib/database.types";
// Assumindo que os tipos de retorno da RPC foram definidos em api.ts ou temos acesso aqui
// Se não, podemos redefinir os tipos relevantes aqui ou importar de api.ts
type PmeHolder = Database['public']['Tables']['pme_holders']['Row'] & {
  mother_name?: string | null;
};
type PmeDependent = Database['public']['Tables']['pme_dependents']['Row'] & {
  mother_name?: string | null;
};

// Tipo esperado para a prop, vindo de proposalDetails.holders
// Atualizado para aceitar também o formato novo { id, name, ... }
type HolderWithDependents = {
  holder: PmeHolder;
  dependents: PmeDependent[] | null;
} | { 
  id: string;
  name: string;
  cpf: string | null;
  birth_date: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  mother_name: string | null;
  dependents: {
    id: string;
    holder_id: string | null;
    name: string;
    cpf: string | null;
    birth_date: string | null;
    relationship: string | null;
    is_active: boolean | null;
    mother_name: string | null;
  }[] | null;
};

interface BeneficiariesListProps {
  holders: HolderWithDependents[] | null | undefined;
  onAddHolder?: () => void;
  onEditHolder?: (holder: PmeHolder) => void;
  onDeleteHolder?: (holderId: string) => void;
  onAddDependent?: (holderId: string) => void;
  onEditDependent?: (dependent: PmeDependent) => void;
  onDeleteDependent?: (dependentId: string, holderId?: string) => void;
  isLoading?: boolean;
}

// Função auxiliar de formatação de data (pode vir de utils)
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  } catch (e) {
    // Tentar formato YYYY-MM-DD
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      return format(new Date(year, month - 1, day), "dd/MM/yyyy", { locale: ptBR });
    } catch (innerE) {
      return dateString; // Retornar original em caso de erro duplo
    }
  }
};

// Função auxiliar para verificar o formato dos dados
const isLegacyFormat = (holder: HolderWithDependents): holder is { holder: PmeHolder; dependents: PmeDependent[] | null } => {
  return 'holder' in holder;
};

// Helper para converter o tipo do novo formato para o formato de PmeHolder
const convertToHolder = (newHolder: HolderWithDependents): PmeHolder => {
  if (isLegacyFormat(newHolder)) {
    return newHolder.holder;
  }
  // Converte o novo formato para o formato esperado pela função onEditHolder
  return {
    id: newHolder.id,
    name: newHolder.name,
    cpf: newHolder.cpf,
    birth_date: newHolder.birth_date,
    email: newHolder.email,
    phone: newHolder.phone,
    status: newHolder.status,
    created_at: newHolder.created_at,
    updated_at: newHolder.updated_at,
    mother_name: newHolder.mother_name,
    submission_id: null // Adicionando campo obrigatório que não está no novo formato
  };
};

// Helper para converter o tipo do dependente do novo formato para PmeDependent
const convertToDependent = (newDependent: any): PmeDependent => {
  return {
    id: newDependent.id,
    holder_id: newDependent.holder_id,
    name: newDependent.name,
    cpf: newDependent.cpf,
    birth_date: newDependent.birth_date,
    relationship: newDependent.relationship || '',
    is_active: newDependent.is_active,
    mother_name: newDependent.mother_name,
    created_at: null, // Adicionando campos obrigatórios que não estão no novo formato
    updated_at: null
  };
};

export default function BeneficiariesList({
  holders,
  onAddHolder,
  onEditHolder,
  onDeleteHolder,
  onAddDependent,
  onEditDependent,
  onDeleteDependent,
  isLoading = false
}: BeneficiariesListProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <div className="flex items-center justify-center h-5 w-5 rounded-sm bg-blue-500/10 text-blue-600 mr-1.5">
            <UserCircle className="h-3 w-3" />
          </div>
          <h3 className="text-sm font-medium">Beneficiários Titulares</h3>
          <Badge className="ml-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-1.5 py-0 text-[10px]">
            {holders?.length || 0}
          </Badge>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddHolder}
                disabled={isLoading}
                className="h-7 text-xs bg-blue-50/50 border-blue-200/50 text-blue-600 hover:bg-blue-100/50 hover:text-blue-700"
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Adicionar Titular
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">Adicionar novo beneficiário titular ao plano</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {(!holders || holders.length === 0) ? (
        <div className="p-4 bg-muted/20 rounded-md text-center border border-dashed flex flex-col items-center justify-center py-8">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center mb-2">
            <UserCircle className="h-5 w-5 text-muted-foreground/70" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum beneficiário titular encontrado.</p>
          <Button 
            type="button"
            variant="link"
            size="sm"
            onClick={onAddHolder}
            disabled={isLoading}
            className="mt-2 text-xs h-7 text-blue-500 hover:text-blue-600"
          >
            <UserPlus className="mr-1 h-3.5 w-3.5" />
            Adicionar o primeiro titular
          </Button>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {holders.map((holderData, index) => {
            // Extrair os dados corretos baseado no formato
            const holder = isLegacyFormat(holderData) ? holderData.holder : holderData;
            const dependents = isLegacyFormat(holderData) ? holderData.dependents : holderData.dependents;
            const dependentsCount = dependents?.length || 0;
            
            return (
              <AccordionItem value={`item-${index}`} key={holder.id} className="border rounded-md mb-2 overflow-hidden shadow-sm">
                <AccordionTrigger className="hover:bg-muted/10 px-3 py-2 [&[data-state=open]>div>div>div>svg]:rotate-180 [&[data-state=open]]:border-b border-border/50">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2 text-left">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500/10 text-blue-600">
                        <UserCircle className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                        <span className="font-medium text-sm truncate max-w-[150px] sm:max-w-[200px]" title={holder.name}>
                          {holder.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {holder.cpf && (
                            <Badge variant="outline" className="px-1.5 py-0 h-4 text-[10px] bg-slate-50/70 border-slate-200/70 text-slate-700 hidden sm:flex">
                              <User className="h-2.5 w-2.5 mr-1 text-slate-500" />
                              {holder.cpf}
                            </Badge>
                          )}
                          
                          {holder.birth_date && (
                            <Badge variant="outline" className="px-1.5 py-0 h-4 text-[10px] bg-green-50/70 border-green-200/70 text-green-700 hidden md:flex">
                              <CalendarDays className="h-2.5 w-2.5 mr-1 text-green-500" />
                              {formatDate(holder.birth_date)}
                            </Badge>
                          )}
                          
                          <Badge className="ml-1 bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0 h-4 text-[10px]">
                            {dependentsCount === 0 ? 'Sem dependentes' : `${dependentsCount} dependente${dependentsCount > 1 ? 's' : ''}`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-3 px-3">
                  <div className="flex justify-between items-center border-b border-border/30 pb-2 mb-2">
                    <div className="text-xs text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 flex-1 mr-2">
                      {holder.email && (
                        <span className="flex items-center">
                          <AtSign className="h-3 w-3 mr-1.5 text-blue-500" />
                          {holder.email}
                        </span>
                      )}
                      {holder.phone && (
                        <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-1.5 text-purple-500" />
                          {holder.phone}
                        </span>
                      )}
                      {holder.mother_name && (
                        <span className="flex items-center col-span-2">
                          <User className="h-3 w-3 mr-1.5 text-green-500" />
                          <span className="text-green-600">Mãe:</span>&nbsp;{holder.mother_name}
                        </span>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 hover:bg-blue-50"
                              onClick={() => onEditHolder?.(convertToHolder(holderData))}
                              disabled={isLoading}
                            >
                              <Edit className="h-3.5 w-3.5 text-blue-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Editar Titular</p>
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
                              className="h-7 w-7 hover:bg-red-50"
                              onClick={() => onDeleteHolder?.(holder.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Excluir Titular</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center h-5 w-5 rounded-sm bg-amber-500/10 text-amber-600 mr-1.5">
                        <User className="h-3 w-3" />
                      </div>
                      <h4 className="text-xs font-medium">Dependentes</h4>
                      <Badge className="ml-2 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 px-1.5 py-0 text-[10px]">
                        {dependentsCount}
                      </Badge>
                    </div>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 hover:bg-amber-50/50 text-amber-600"
                            onClick={() => onAddDependent?.(holder.id)}
                            disabled={isLoading}
                          >
                            <PlusCircle className="mr-1 h-3 w-3" />
                            Adicionar
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">Adicionar dependente para este titular</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {dependents && dependents.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/20">
                          <TableRow className="hover:bg-transparent border-b border-border/50">
                            <TableHead className="pl-3 h-7 text-xs font-medium text-muted-foreground">Nome</TableHead>
                            <TableHead className="h-7 text-xs font-medium text-muted-foreground">CPF</TableHead>
                            <TableHead className="h-7 text-xs font-medium text-muted-foreground hidden sm:table-cell">Nascimento</TableHead>
                            <TableHead className="h-7 text-xs font-medium text-muted-foreground">Parentesco</TableHead>
                            <TableHead className="h-7 text-xs font-medium text-muted-foreground hidden md:table-cell">Mãe</TableHead>
                            <TableHead className="text-right pr-3 h-7 text-xs font-medium text-muted-foreground w-20">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dependents.map((dep) => (
                            <TableRow key={dep.id} className="group hover:bg-muted/5">
                              <TableCell className="py-1.5 pl-3 text-xs font-medium">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help">{dep.name}</div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[300px]">
                                      <div className="text-xs space-y-1">
                                        <p><strong>Nome:</strong> {dep.name}</p>
                                        {dep.mother_name && <p><strong>Mãe:</strong> {dep.mother_name}</p>}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="py-1.5 text-xs">{dep.cpf || "-"}</TableCell>
                              <TableCell className="py-1.5 text-xs hidden sm:table-cell">{formatDate(dep.birth_date)}</TableCell>
                              <TableCell className="py-1.5 text-xs">
                                <Badge variant="outline" className="px-1.5 py-0 h-4 text-[10px] bg-amber-50/70 border-amber-200/70 text-amber-700">
                                  <Heart className="h-2.5 w-2.5 mr-1 text-amber-500" />
                                  {dep.relationship}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-1.5 text-xs truncate max-w-[150px] hidden md:table-cell">{dep.mother_name || "-"}</TableCell>
                              <TableCell className="text-right pr-3 py-1.5">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          type="button"
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 hover:bg-blue-50"
                                          onClick={() => onEditDependent?.(convertToDependent(dep))}
                                          disabled={isLoading}
                                        >
                                          <Edit className="h-3 w-3 text-blue-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="left">
                                        <p className="text-xs">Editar Dependente</p>
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
                                          className="h-6 w-6 hover:bg-red-50"
                                          onClick={() => onDeleteDependent?.(dep.id, holder.id)}
                                          disabled={isLoading}
                                        >
                                          <Trash2 className="h-3 w-3 text-red-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="left">
                                        <p className="text-xs">Excluir Dependente</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic p-3 bg-muted/10 rounded-md border border-dashed flex items-center justify-center">
                      <div className="h-5 w-5 rounded-full bg-muted/50 flex items-center justify-center mr-2">
                        <User className="h-3 w-3 text-muted-foreground/70" />
                      </div>
                      Sem dependentes cadastrados
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
} 