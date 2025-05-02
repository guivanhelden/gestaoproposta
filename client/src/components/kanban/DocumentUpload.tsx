import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import supabase from "@/lib/supabase";

// Mapeamento de categorias para nomes amigáveis
const CATEGORY_LABELS: Record<string, string> = {
  company: "Empresa",
  grace: "Carência",
  beneficiaries: "Beneficiários",
  quotation: "Cotação",
  others: "Outros"
};

interface DocumentUploadProps {
  category: string;
  submissionId: string;
  onSuccess: () => void;
}

export default function DocumentUpload({
  category,
  submissionId,
  onSuccess
}: DocumentUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  // Mutation para realizar o upload do arquivo
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setShowProgress(true);
      setUploadProgress(0);
      
      try {
        // Gerar um nome de arquivo único para evitar colisões
        const fileExtension = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        
        // Definir o caminho do arquivo no storage
        const filePath = `${submissionId}/${category}/${fileName}`;
        
        // Passo 1: Upload para o storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from("pme-attachments")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            // Esta opção não está disponível no cliente JS do Supabase,
            // mas seria ideal ter feedback de progresso aqui
          });
        
        if (storageError) {
          throw new Error(`Erro ao fazer upload: ${storageError.message}`);
        }
        
        // Simular progresso de upload
        // Isso é apenas para feedback visual, já que o método upload não retorna progresso
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          if (progress > 90) {
            clearInterval(progressInterval);
          }
          setUploadProgress(progress);
        }, 200);
        
        // Passo 2: Criar registro no banco de dados
        const { error: dbError } = await supabase
          .from("pme_files")
          .insert({
            submission_id: submissionId,
            category: category,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            uploaded_at: new Date().toISOString()
          });
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        if (dbError) {
          throw new Error(`Erro ao salvar informações do arquivo: ${dbError.message}`);
        }
        
        return { success: true };
      } catch (error: any) {
        console.error("Erro durante o upload:", error);
        throw error;
      } finally {
        // Delay para mostrar 100% por um momento antes de esconder
        setTimeout(() => {
          setIsUploading(false);
          setShowProgress(false);
        }, 1000);
      }
    },
    onSuccess: () => {
      toast({
        title: "Upload concluído",
        description: "O arquivo foi enviado com sucesso."
      });
      onSuccess(); // Notificar o componente pai para atualizar a lista
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Lidar com a seleção de arquivos
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Verificar tamanho máximo (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB em bytes
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 10MB.",
        variant: "destructive"
      });
      return;
    }
    
    // Iniciar o upload
    uploadMutation.mutate(file);
    
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Abrir o seletor de arquivos
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="*/*" // Aceitar qualquer tipo de arquivo
      />
      
      <Button
        onClick={triggerFileInput}
        disabled={isUploading}
        variant="outline"
        className="flex items-center gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Enviando...</span>
          </>
        ) : (
          <>
            <UploadCloud className="h-4 w-4" />
            <span>Adicionar Documento {CATEGORY_LABELS[category]}</span>
          </>
        )}
      </Button>

      {/* Barra de progresso de upload */}
      {showProgress && (
        <div className="mt-2">
          <Progress value={uploadProgress} className="h-1.5" />
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {uploadProgress}%
          </div>
        </div>
      )}
    </div>
  );
} 