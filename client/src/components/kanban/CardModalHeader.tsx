import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trash,
  Users, 
  Phone,
  Mail,
  Clock,
  Check,
  X,
  Search
} from "lucide-react";
import { StatusBadge } from "@/lib/utils/proposal-utils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription as ShadAlertDialogDescription,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { DialogTitle } from "@/components/ui/dialog";

interface CardModalHeaderProps {
  title: string;
  statusBadge: StatusBadge;
  brokerInfo: {
    name: string | null | undefined;
    team_name: string | null | undefined;
    phone: string | null | undefined;
    email: string | null | undefined;
  };
  isSubmitting: boolean;
  isDirty: boolean;
  onSubmit: () => void;
  onDelete: () => void;
}

export function CardModalHeader({
  title,
  statusBadge,
  brokerInfo,
  isSubmitting,
  isDirty,
  onSubmit,
  onDelete
}: CardModalHeaderProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  return (
    <div className="flex justify-between items-start">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <DialogTitle className="text-xl font-bold m-0 p-0">
            {title || "Detalhes da Proposta"}
          </DialogTitle>
          <Badge 
            className={cn(
              "py-1.5 px-3 flex items-center gap-1 text-xs font-medium",
              statusBadge.variant === "success" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
              statusBadge.variant === "warning" && "bg-amber-100 text-amber-700 hover:bg-amber-200",
              statusBadge.variant === "destructive" && "bg-rose-100 text-rose-700 hover:bg-rose-200",
              statusBadge.variant === "secondary" && "bg-slate-100 text-slate-700 hover:bg-slate-200",
              statusBadge.variant === "outline" && "border-dashed"
            )}
          >
            {statusBadge.icon === "check" && <Check className="h-3.5 w-3.5" />}
            {statusBadge.icon === "x" && <X className="h-3.5 w-3.5" />}
            {statusBadge.icon === "clock" && <Clock className="h-3.5 w-3.5" />}
            {statusBadge.icon === "search" && <Search className="h-3.5 w-3.5" />}
            {statusBadge.text || "Indefinido"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-2 bg-muted/40 rounded-md p-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary">
                {brokerInfo.name?.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{brokerInfo.name || "Corretor não informado"}</span>
              <span className="text-xs text-muted-foreground">Corretor</span>
            </div>
          </div>

          <Separator orientation="vertical" className="h-8 hidden sm:block" />
          
          <div className="flex flex-wrap gap-3">
            {brokerInfo.team_name && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs cursor-default">
                      <Users className="h-3 w-3" />
                      {brokerInfo.team_name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Equipe do corretor</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {brokerInfo.phone && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs cursor-default">
                      <Phone className="h-3 w-3" />
                      {brokerInfo.phone}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Telefone do corretor</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {brokerInfo.email && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href={`mailto:${brokerInfo.email}`} className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs truncate max-w-[180px] hover:underline" onClick={(e) => e.stopPropagation()}>
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{brokerInfo.email}</span>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enviar email para: {brokerInfo.email}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 flex-shrink-0 ml-auto">
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" title="Excluir Proposta">
              <Trash className="h-4 w-4" />
              <span className="sr-only">Excluir Proposta</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <ShadAlertDialogDescription>
                Tem certeza que deseja excluir esta proposta? Todas as informações relacionadas (empresa, contrato, beneficiários, sócios) serão perdidas permanentemente. Esta ação não pode ser desfeita.
              </ShadAlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => {e.preventDefault(); setIsDeleteDialogOpen(false);}}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault(); 
                  setIsDeleteDialogOpen(false);
                  onDelete();
                }} 
                className="bg-destructive hover:bg-destructive/90"
              >
                Excluir Permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={isSubmitting || !isDirty}
          className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-dark hover:translate-y-[-1px] transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          title={!isDirty ? "Nenhuma alteração para salvar" : "Salvar alterações"}
        >
          {isSubmitting ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
} 