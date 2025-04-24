import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

// Usa o tipo PmePartner importado de database.types (assumindo que está correto)
// Se api.ts exportar os tipos, importar de lá, senão importar Database de database.types
import { Database } from "@/lib/database.types"; 
type PmePartner = Database['public']['Tables']['pme_company_partners']['Row'];

interface PartnersListProps {
  partners: PmePartner[] | null | undefined;
}

export default function PartnersList({ partners }: PartnersListProps) {
  if (!partners || partners.length === 0) {
    return (
      <div className="p-4 bg-muted rounded-md text-center">
        <p className="text-sm text-muted-foreground">Nenhum sócio encontrado para esta empresa.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead className="text-center">Responsável?</TableHead>
          {/* <TableHead>Incluir como Titular?</TableHead> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {partners.map((partner) => (
          <TableRow key={partner.id}>
            <TableCell className="font-medium">{partner.nome}</TableCell>
            <TableCell>{partner.email || "-"}</TableCell>
            <TableCell>{partner.telefone || "-"}</TableCell>
            <TableCell className="text-center">
              {partner.is_responsavel ? (
                <Check className="h-4 w-4 text-green-600 inline-block" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground inline-block" />
              )}
            </TableCell>
            {/* <TableCell>{partner.incluir_como_titular ? "Sim" : "Não"}</TableCell> */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 