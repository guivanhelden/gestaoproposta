import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FolderIcon, FileText, FileQuestion, FileArchive, FileImage, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import supabase from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import DocumentCategoryContent from "./DocumentCategoryContent";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

// Tipo para os arquivos da tabela pme_files
type PmeFile = Database["public"]["Tables"]["pme_files"]["Row"];

// Mapeamento de categorias para nomes amigáveis em português
const CATEGORY_LABELS: Record<string, string> = {
  company: "Empresa",
  grace: "Carência",
  beneficiaries: "Beneficiários",
  quotation: "Cotação",
  others: "Outros"
};

// Mapeamento de categorias para ícones
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  company: <FolderIcon className="h-4 w-4" />,
  grace: <FileText className="h-4 w-4" />,
  beneficiaries: <FileArchive className="h-4 w-4" />,
  quotation: <FileImage className="h-4 w-4" />,
  others: <FileQuestion className="h-4 w-4" />
};

interface ProposalDocumentsProps {
  submissionId: string;
}

export default function ProposalDocuments({ submissionId }: ProposalDocumentsProps) {
  // Estado para a categoria/aba atual
  const [activeCategory, setActiveCategory] = useState<string>("company");
  
  // Estado para controle do arquivo selecionado para visualização
  const [previewFile, setPreviewFile] = useState<PmeFile | null>(null);
  
  // Estado para controlar se o collapsible está aberto
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  // Hook para manipular cache de consultas
  const queryClient = useQueryClient();

  // Buscar todos os arquivos desta submissão
  const { data: files, isLoading, isError, error } = useQuery<PmeFile[]>({
    queryKey: ['pme_files', submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pme_files')
        .select('*')
        .eq('submission_id', submissionId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Erro ao buscar arquivos:", error);
        throw new Error(`Erro ao buscar arquivos: ${error.message}`);
      }
      
      return data || [];
    },
    enabled: !!submissionId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Agrupar arquivos por categoria
  const filesByCategory: Record<string, PmeFile[]> = React.useMemo(() => {
    const categories = ['company', 'grace', 'beneficiaries', 'quotation', 'others'];
    const result: Record<string, PmeFile[]> = {};
    
    // Inicializar arrays vazios para cada categoria
    categories.forEach(category => {
      result[category] = [];
    });
    
    // Adicionar arquivos às suas categorias
    if (files && files.length > 0) {
      files.forEach(file => {
        if (file.category in result) {
          result[file.category].push(file);
        } else {
          // Se por algum motivo a categoria não estiver no mapping, adicionamos em "others"
          result.others.push(file);
        }
      });
    }
    
    return result;
  }, [files]);

  // Contador total de arquivos
  const totalFilesCount = files?.length || 0;

  // Função para atualizar a lista de arquivos após uma operação de upload ou exclusão
  const refreshFiles = () => {
    queryClient.invalidateQueries({ queryKey: ['pme_files', submissionId] });
  };

  // Função para abrir o preview de um arquivo
  const handlePreviewFile = (file: PmeFile) => {
    setPreviewFile(file);
  };

  // Função para fechar o preview
  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  // Renderizar o componente principal
  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <Card className="relative overflow-hidden border-border/50 bg-card/50 mt-6"
              style={{ boxShadow: "0 4px 20px -5px rgba(252, 211, 77, 0.28), 0 2px 10px -5px rgba(245, 158, 11, 0.32)" }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400/30 via-amber-500/60 to-amber-400/30"></div>
          
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-amber-500/10 text-amber-500">
                  <FileText className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-medium text-foreground/90">
                  Documentos
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {totalFilesCount} {totalFilesCount === 1 ? 'Arquivo' : 'Arquivos'}
                </Badge>
                <CollapsibleTrigger asChild>
                  <button className="h-6 w-6 rounded-md p-1 text-muted-foreground hover:bg-muted">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </CollapsibleTrigger>
              </div>
            </div>
            <CardDescription className="text-xs mt-2">
              Documentos relacionados à proposta, separados por categorias
            </CardDescription>
            <Separator className="mt-2" />
          </CardHeader>
          
          <CardContent className="p-4">
            <Tabs defaultValue="company" value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="mb-4 bg-muted/60 p-1">
                {Object.keys(CATEGORY_LABELS).map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className={cn(
                      "flex items-center gap-1.5",
                      activeCategory === category && "bg-background shadow-sm"
                    )}
                  >
                    {CATEGORY_ICONS[category]}
                    <span>{CATEGORY_LABELS[category]}</span>
                    {filesByCategory[category]?.length > 0 && (
                      <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                        {filesByCategory[category].length}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              <CollapsibleContent>
                {/* Conteúdo das abas */}
                {Object.keys(CATEGORY_LABELS).map((category) => (
                  <TabsContent key={category} value={category} className="mt-0">
                    <DocumentCategoryContent
                      files={filesByCategory[category] || []}
                      category={category}
                      submissionId={submissionId}
                      isLoading={isLoading}
                      onFileChange={refreshFiles}
                      onPreviewFile={handlePreviewFile}
                    />
                  </TabsContent>
                ))}
              </CollapsibleContent>
            </Tabs>
          </CardContent>
        </Card>
      </Collapsible>

      {/* Modal de visualização do arquivo */}
      <DocumentPreviewModal 
        file={previewFile}
        isOpen={!!previewFile}
        onClose={handleClosePreview}
      />
    </>
  );
} 