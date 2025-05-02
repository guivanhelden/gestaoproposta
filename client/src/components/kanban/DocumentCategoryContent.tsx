import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Database } from "@/lib/database.types";

import DocumentUpload from "./DocumentUpload";
import DocumentListItem from "./DocumentListItem";

// Tipo para os arquivos da tabela pme_files
type PmeFile = Database["public"]["Tables"]["pme_files"]["Row"];

interface DocumentCategoryContentProps {
  files: PmeFile[];
  category: string;
  submissionId: string;
  isLoading: boolean;
  onFileChange: () => void;
  onPreviewFile: (file: PmeFile) => void;
}

export default function DocumentCategoryContent({
  files,
  category,
  submissionId,
  isLoading,
  onFileChange,
  onPreviewFile
}: DocumentCategoryContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-9 w-40" />
        </div>
        {[1, 2].map((n) => (
          <Card key={n} className="mb-2 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <DocumentUpload 
          category={category} 
          submissionId={submissionId} 
          onSuccess={onFileChange} 
        />
      </div>

      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => (
            <DocumentListItem 
              key={file.id} 
              file={file} 
              submissionId={submissionId} 
              onDelete={onFileChange}
              onPreview={onPreviewFile} 
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-md border border-border/40 text-center space-y-2">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">Nenhum documento nesta categoria</p>
          <p className="text-xs text-muted-foreground/70">
            Clique em "Adicionar Documento" para fazer upload de arquivos.
          </p>
        </div>
      )}
    </div>
  );
} 