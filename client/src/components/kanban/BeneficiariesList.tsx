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
import { UserPlus, Edit, Trash2, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Importar tipos (ajuste o caminho se necessário)
import { Database } from "@/lib/database.types";
// Assumindo que os tipos de retorno da RPC foram definidos em api.ts ou temos acesso aqui
// Se não, podemos redefinir os tipos relevantes aqui ou importar de api.ts
type PmeHolder = Database['public']['Tables']['pme_holders']['Row'];
type PmeDependent = Database['public']['Tables']['pme_dependents']['Row'];

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
  dependents: {
    id: string;
    holder_id: string | null;
    name: string;
    cpf: string | null;
    birth_date: string | null;
    relationship: string | null;
    is_active: boolean | null;
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
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button 
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddHolder}
          disabled={isLoading}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Titular
        </Button>
      </div>

      {(!holders || holders.length === 0) ? (
        <div className="p-4 bg-muted rounded-md text-center border border-dashed">
          <p className="text-sm text-muted-foreground">Nenhum beneficiário titular encontrado.</p>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {holders.map((holderData, index) => {
            // Extrair os dados corretos baseado no formato
            const holder = isLegacyFormat(holderData) ? holderData.holder : holderData;
            const dependents = isLegacyFormat(holderData) ? holderData.dependents : holderData.dependents;
            
            return (
              <AccordionItem value={`item-${index}`} key={holder.id} className="border-b">
                <AccordionTrigger className="hover:no-underline px-4 py-3">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-4 text-left">
                      <span className="font-medium truncate" title={holder.name}>{holder.name} (Titular)</span>
                      <span className="text-xs text-muted-foreground sm:border-l sm:pl-4">CPF: {holder.cpf || "-"}</span>
                      <span className="text-xs text-muted-foreground sm:border-l sm:pl-4">Nasc: {formatDate(holder.birth_date)}</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 px-4">
                  <div className="flex justify-between items-center border-b pb-3 mb-3">
                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-4 flex-1 mr-2">
                      <span>Email: {holder.email || "-"}</span>
                      <span>Telefone: {holder.phone || "-"}</span>
                    </div>
                    <div className="flex-shrink-0">
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => onEditHolder?.(convertToHolder(holderData))}
                        disabled={isLoading}
                        title="Editar Titular"
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDeleteHolder?.(holder.id)}
                        disabled={isLoading}
                        title="Excluir Titular"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Dependentes</h4>
                    <Button 
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => onAddDependent?.(holder.id)}
                      disabled={isLoading}
                    >
                      <PlusCircle className="mr-1 h-3 w-3" />
                      Adicionar
                    </Button>
                  </div>
                  
                  {dependents && dependents.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-4">Nome</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Nascimento</TableHead>
                          <TableHead>Parentesco</TableHead>
                          <TableHead className="text-right pr-4">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dependents.map((dep) => (
                          <TableRow key={dep.id} className="group">
                            <TableCell className="font-medium pl-4">{dep.name}</TableCell>
                            <TableCell>{dep.cpf || "-"}</TableCell>
                            <TableCell>{formatDate(dep.birth_date)}</TableCell>
                            <TableCell>{dep.relationship}</TableCell>
                            <TableCell className="text-right pr-4">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex gap-1">
                                <Button 
                                  type="button"
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => onEditDependent?.(convertToDependent(dep))}
                                  disabled={isLoading}
                                  title="Editar Dependente"
                                >
                                  <Edit className="h-3.5 w-3.5 text-blue-500" />
                                </Button>
                                <Button 
                                  type="button"
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => onDeleteDependent?.(dep.id, holder.id)}
                                  disabled={isLoading}
                                  title="Excluir Dependente"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-xs text-muted-foreground italic px-4 py-2">Sem dependentes cadastrados.</p>
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