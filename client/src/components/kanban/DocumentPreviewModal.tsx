import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ExternalLink, FileText, Image, FileSpreadsheet, File } from "lucide-react";
import { Loader2 } from "lucide-react";
import supabase from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type PmeFile = Database["public"]["Tables"]["pme_files"]["Row"];

interface DocumentPreviewModalProps {
  file: PmeFile | null;
  isOpen: boolean;
  onClose: () => void;
}

// Componente para visualização de vários tipos de documentos
export function DocumentPreviewModal({ file, isOpen, onClose }: DocumentPreviewModalProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Obter URL de visualização quando o modal abrir
  useEffect(() => {
    if (isOpen && file) {
      setIsLoading(true);
      setError(null);
      
      const getFileUrl = async () => {
        try {
          const { data, error } = await supabase.storage
            .from("pme-attachments")
            .createSignedUrl(file.file_path, 300); // 5 minutos
            
          if (error) throw new Error(error.message);
          setFileUrl(data?.signedUrl || null);
        } catch (err: any) {
          console.error("Erro ao obter URL:", err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      
      getFileUrl();
    } else {
      // Limpar estado quando o modal for fechado
      setFileUrl(null);
      setError(null);
    }
  }, [isOpen, file]);
  
  // Handler para download
  const handleDownload = () => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

  // Determinar o tipo de arquivo
  const getFileType = () => {
    if (!file?.file_name) return "unknown";
    
    const extension = file.file_name.split('.').pop()?.toLowerCase() || "";
    
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)) {
      return "image";
    } else if (extension === "pdf") {
      return "pdf";
    } else if (["doc", "docx"].includes(extension)) {
      return "word";
    } else if (["xls", "xlsx", "csv"].includes(extension)) {
      return "spreadsheet";
    } else if (["mp4", "webm", "ogg", "mov"].includes(extension)) {
      return "video";
    } else {
      return "other";
    }
  };

  // Verificar se estamos lidando com uma imagem
  const fileType = getFileType();
  const isImage = fileType === "image";
  const isPdf = fileType === "pdf";
  const isVideo = fileType === "video";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-medium">{file?.file_name || "Visualizar Documento"}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleDownload} title="Baixar">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onClose} title="Fechar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="relative overflow-auto max-h-[70vh] mt-4">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          
          {error && (
            <div className="p-6 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Baixar Arquivo</span>
              </Button>
            </div>
          )}
          
          {fileUrl && !isLoading && !error && (
            <>
              {/* Visualização específica baseada no tipo de arquivo */}
              {isImage && (
                <div className="flex justify-center">
                  <img 
                    src={fileUrl} 
                    alt={file?.file_name || "Imagem"} 
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </div>
              )}
              
              {isPdf && (
                <div className="flex justify-center h-[70vh]">
                  <iframe 
                    src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                    title={file?.file_name || "PDF"} 
                    className="w-full h-full"
                  />
                </div>
              )}
              
              {isVideo && (
                <div className="flex justify-center">
                  <video 
                    src={fileUrl} 
                    controls 
                    className="max-w-full max-h-[70vh]"
                  >
                    Seu navegador não suporta a reprodução de vídeos.
                  </video>
                </div>
              )}
              
              {/* Fallback para outros tipos de arquivo */}
              {!isImage && !isPdf && !isVideo && (
                <div className="p-6 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center">
                    {fileType === "spreadsheet" ? (
                      <FileSpreadsheet className="h-8 w-8 text-green-500" />
                    ) : fileType === "word" ? (
                      <FileText className="h-8 w-8 text-blue-500" />
                    ) : (
                      <File className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  
                  <div>
                    <p className="mb-2 text-lg font-medium">{file?.file_name}</p>
                    <p className="text-muted-foreground">Este tipo de arquivo não possui visualização integrada.</p>
                  </div>
                  
                  <Button onClick={handleDownload} className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <span>Abrir em Nova Aba</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 