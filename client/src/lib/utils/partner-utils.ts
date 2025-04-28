import { Database } from "@/lib/database.types";

// Tipo para PmePartner do Supabase
type PmePartner = Database['public']['Tables']['pme_company_partners']['Row'];

// Interface Partner para UI
export interface Partner {
  id: string;
  company_id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  is_responsavel: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  is_active?: boolean | null;
  incluir_como_titular?: boolean | null;
}

// Função para converter PmePartner (do Supabase) para Partner (da UI)
export const formatPartnerForUI = (p: any): Partner => ({
  ...p,
  id: String(p.id),
  company_id: String(p.company_id || ''),
  nome: p.nome || '', // Garantir que nunca é null
  is_responsavel: Boolean(p.is_responsavel),
  // Incluir outros campos da interface Partner, mesmo que sejam null/undefined em PmePartner
  email: p.email,
  telefone: p.telefone,
  created_at: p.created_at,
  updated_at: p.updated_at,
  is_active: p.is_active,
  incluir_como_titular: p.incluir_como_titular
}); 