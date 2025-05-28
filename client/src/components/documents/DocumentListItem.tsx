import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  FileText, FileImage, FileArchive, FileSpreadsheet, File,
  Trash2, Download, Loader2, AlertCircle, CheckCircle2, Eye
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import supabase from "@/lib/supabase";
import { Database } from "@/lib/database.types";

// Tipo para os arquivos da tabela pme_files
type PmeFile = Database["public"]["Tables"]["pme_files"]["Row"];

// Função auxiliar para formatar o tamanho do arquivo
function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Tamanho desconhecido";
  
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Função para determinar o ícone com base no tipo de arquivo
function getFileIcon(fileType: string | null): React.ReactNode {
  if (!fileType) return <File className="h-6 w-6" />;
  
  const type = fileType.toLowerCase();
  
  if (type.includes("image")) return <FileImage className="h-6 w-6 text-blue-500" />;
  if (type.includes("pdf")) return <FileText className="h-6 w-6 text-red-500" />;
  if (type.includes("excel") || type.includes("spreadsheet") || type.includes("csv")) {
    return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
  }
  if (type.includes("zip") || type.includes("rar") || type.includes("tar") || type.includes("gzip")) {
    return <FileArchive className="h-6 w-6 text-amber-500" />;
  }
  
  return <FileText className="h-6 w-6 text-gray-500" />;
}

interface DocumentListItemProps {
  file: PmeFile;
  submissionId: string;
  onDelete: () => void;
  onPreview: (file: PmeFile) => void;
}

export default function DocumentListItem({
  file,
  submissionId,
  onDelete,
  onPreview
}: DocumentListItemProps) {
  const { toast } = useToast();
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  
  // Estado para o diálogo de confirmação de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Mutation para excluir o arquivo
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Passo 1: Remover o arquivo do Storage
      const { error: storageError } = await supabase.storage
        .from("pme-attachments")
        .remove([file.file_path]);
      
      if (storageError) {
        console.error("Erro ao excluir arquivo do storage:", storageError);
        throw new Error(`Erro ao excluir arquivo do storage: ${storageError.message}`);
      }
      
      // Passo 2: Excluir o registro no banco de dados
      const { error: dbError } = await supabase
        .from("pme_files")
        .delete()
        .eq("id", file.id);
      
      if (dbError) {
        console.error("Erro ao excluir registro do arquivo:", dbError);
        throw new Error(`Erro ao excluir registro do arquivo: ${dbError.message}`);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Arquivo excluído",
        description: "O arquivo foi excluído com sucesso."
      });
      onDelete(); // Notificar o componente pai para atualizar a lista
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir arquivo",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Função para gerar URL de download
  const handleDownload = async () => {
    setIsGeneratingUrl(true);
    
    try {
      const { data, error } = await supabase.storage
        .from("pme-attachments")
        .createSignedUrl(file.file_path, 60); // URL válida por 60 segundos
      
      if (error) {
        throw new Error(`Erro ao gerar URL de download: ${error.message}`);
      }
      
      if (data?.signedUrl) {
        // Abrir a URL em uma nova aba
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao baixar arquivo",
        description: error.message,
        variant: "destructive"
      });
      console.error("Erro ao baixar arquivo:", error);
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  // Lidar com a visualização do arquivo
  const handlePreview = () => {
    onPreview(file);
  };
  
  // Formatação de data relativa (ex: "há 3 dias")
  const formattedDate = file.uploaded_at 
    ? formatDistanceToNow(new Date(file.uploaded_at), { 
        addSuffix: true, 
        locale: ptBR 
      })
    : "Data desconhecida";
  
  return (
    <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-md bg-muted/50">
              {getFileIcon(file.file_type)}
            </div>
            
            <div>
              <h4 className="text-sm font-medium line-clamp-1">{file.file_name}</h4>
              <div className="flex items-center gap-2 mt-1">
                {file.file_size && (
                  <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                    {formatFileSize(file.file_size)}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">{formattedDate}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* Botão Visualizar */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handlePreview}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visualizar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Botão Baixar */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleDownload}
                    disabled={isGeneratingUrl}
                  >
                    {isGeneratingUrl ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Baixar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Botão Excluir */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o arquivo <strong>{file.file_name}</strong>? 
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      deleteMutation.mutate();
                      setShowDeleteDialog(false);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 