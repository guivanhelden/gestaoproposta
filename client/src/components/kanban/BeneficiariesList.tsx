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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Importar tipos (ajuste o caminho se necessário)
import { Database } from "@/lib/database.types";
// Assumindo que os tipos de retorno da RPC foram definidos em api.ts ou temos acesso aqui
// Se não, podemos redefinir os tipos relevantes aqui ou importar de api.ts
type PmeHolder = Database['public']['Tables']['pme_holders']['Row'];
type PmeDependent = Database['public']['Tables']['pme_dependents']['Row'];

// Tipo esperado para a prop, vindo de proposalDetails.holders
type HolderWithDependents = {
  holder: PmeHolder;
  dependents: PmeDependent[] | null;
};

interface BeneficiariesListProps {
  holders: HolderWithDependents[] | null | undefined;
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

export default function BeneficiariesList({ holders }: BeneficiariesListProps) {
  if (!holders || holders.length === 0) {
    return (
      <div className="p-4 bg-muted rounded-md text-center">
        <p className="text-sm text-muted-foreground">Nenhum beneficiário (titular/dependente) encontrado.</p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
      {holders.map(({ holder, dependents }, index) => (
        <AccordionItem value={`item-${index}`} key={holder.id}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex justify-between w-full pr-4">
              <span className="font-medium text-left">{holder.name} (Titular)</span>
              <span className="text-sm text-muted-foreground">CPF: {holder.cpf || "-"}</span>
              <span className="text-sm text-muted-foreground">Nasc: {formatDate(holder.birth_date)}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {/* Detalhes adicionais do Titular (opcional) */}
            <div className="text-sm text-muted-foreground px-4 pb-2 grid grid-cols-2 gap-x-4">
              <span>Email: {holder.email || "-"}</span>
              <span>Telefone: {holder.phone || "-"}</span>
            </div>
            
            {/* Tabela de Dependentes */}
            {dependents && dependents.length > 0 ? (
              <Table className="mt-2">
                <TableHeader>
                  <TableRow>
                    <TableHead>Dependente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Nascimento</TableHead>
                    <TableHead>Parentesco</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dependents.map((dep) => (
                    <TableRow key={dep.id}>
                      <TableCell className="font-medium pl-8">{dep.name}</TableCell>
                      <TableCell>{dep.cpf || "-"}</TableCell>
                      <TableCell>{formatDate(dep.birth_date)}</TableCell>
                      <TableCell>{dep.relationship}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground px-4 pt-2 italic">Sem dependentes cadastrados.</p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
} 