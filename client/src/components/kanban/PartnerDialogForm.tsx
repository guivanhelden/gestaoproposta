import React from 'react';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

// Interface para os dados que o formulário manipula (pode ser importada do pai)
export interface PartnerFormData {
  nome: string;
  email: string;
  telefone: string;
  is_responsavel: boolean;
}

// Props esperadas pelo formulário
interface PartnerDialogFormProps {
  formData: PartnerFormData; // Recebe o estado do pai
  onFormChange: (field: keyof PartnerFormData, value: any) => void; // Callback para notificar mudanças
  isLoading: boolean; // Indica se o processo de salvar está em andamento
  formId: string; // ID para o <form> ser referenciado pelo botão externo
}

const PartnerDialogForm: React.FC<PartnerDialogFormProps> = ({
  formData,
  onFormChange,
  isLoading,
  formId
}) => {
  return (
    <div id={formId} className="space-y-4 py-4">
      {/* Campo Nome */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Nome *</label>
        <Input
          value={formData.nome}
          onChange={(e) => onFormChange('nome', e.target.value)}
          placeholder="Nome completo do sócio"
          disabled={isLoading}
        />
      </div>

      {/* Campos Email e Telefone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => onFormChange('email', e.target.value)}
            placeholder="email@exemplo.com"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Telefone</label>
          <Input
            value={formData.telefone}
            onChange={(e) => onFormChange('telefone', e.target.value)}
            placeholder="(00) 00000-0000"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Campo Responsável */}
      <div className="flex items-center justify-between rounded-lg border p-3 bg-background">
        <label className="text-sm font-medium">Sócio Responsável?</label>
        <Switch
          checked={formData.is_responsavel}
          onCheckedChange={(checked) => onFormChange('is_responsavel', checked)}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default PartnerDialogForm; 