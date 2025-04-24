import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pencil, Plus, Search, RefreshCw } from "lucide-react";
import { Email } from "@shared/schema";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function Emails() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Buscar e-mails
  const { data: emails, isLoading } = useQuery({
    queryKey: ["/api/emails"],
    select: (data: Email[]) => {
      if (!searchTerm) return data;
      
      return data.filter(email => 
        email.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  });

  const handleViewEmail = (email: Email) => {
    setSelectedEmail(email);
    setViewDialogOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">E-mails</h2>
                <p className="text-gray-600">Gerencie os e-mails enviados para clientes e parceiros</p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-2">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Buscar por e-mail ou assunto..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="w-full md:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span>Atualizar</span>
                </Button>
                <Button className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Novo E-mail</span>
                </Button>
              </div>
            </div>

            {/* Tabela de E-mails */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {isLoading ? (
                <div className="text-center py-10">
                  <div className="spinner h-8 w-8 mx-auto border-4 border-primary border-r-transparent rounded-full animate-spin mb-4"></div>
                  <p>Carregando e-mails...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails && emails.length > 0 ? (
                      emails.map((email) => (
                        <TableRow key={email.id}>
                          <TableCell className="font-medium">
                            {format(new Date(email.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}
                          </TableCell>
                          <TableCell>{email.to}</TableCell>
                          <TableCell>{email.subject}</TableCell>
                          <TableCell>
                            <StatusBadge variant={email.status === 'enviado' ? 'success' : 'danger'}>
                              {email.status === 'enviado' ? 'Enviado' : 'Erro'}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewEmail(email)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6">
                          {searchTerm ? 'Nenhum e-mail encontrado para a busca.' : 'Nenhum e-mail registrado.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Dialog para visualizar e-mail */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do E-mail</DialogTitle>
            <DialogDescription>
              Informações completas sobre o e-mail enviado
            </DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Destinatário</p>
                  <p className="text-base font-medium">{selectedEmail.to}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de Envio</p>
                  <p className="text-base font-medium">
                    {format(new Date(selectedEmail.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Assunto</p>
                <p className="text-base font-medium">{selectedEmail.subject}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Conteúdo</p>
                <div className="mt-2 p-4 bg-gray-50 rounded-md max-h-72 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                </div>
              </div>
              
              <div className="flex justify-between">
                <p className="text-sm">
                  <span className="text-gray-500">Status: </span>
                  <StatusBadge variant={selectedEmail.status === 'enviado' ? 'success' : 'danger'}>
                    {selectedEmail.status === 'enviado' ? 'Enviado' : 'Erro'}
                  </StatusBadge>
                </p>
                {selectedEmail.proposalId && (
                  <p className="text-sm">
                    <span className="text-gray-500">Proposta ID: </span>
                    <span className="font-medium">{selectedEmail.proposalId}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fechar
            </Button>
            <Button>Reenviar E-mail</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
