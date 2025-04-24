import supabase from './supabase'; // Corrigido para importação padrão
import { Database } from './database.types';

// --- Tipos Detalhados para as Sub-estruturas --- 
// (Baseado nas definições de tabela em database.types.ts, ajuste conforme necessário)

type PmeCompany = Database['public']['Tables']['pme_companies']['Row'];
type PmeContract = Database['public']['Tables']['pme_contracts']['Row'];
type PmeGracePeriod = Database['public']['Tables']['pme_grace_periods']['Row'];
type PmePartner = Database['public']['Tables']['pme_company_partners']['Row'];
type PmeHolder = Database['public']['Tables']['pme_holders']['Row'];
type PmeDependent = Database['public']['Tables']['pme_dependents']['Row'];
type PmeFile = Database['public']['Tables']['pme_files']['Row'];
// Tipos para submission, operator, broker (ajuste se os nomes/campos forem diferentes)
type PmeSubmission = Database['public']['Tables']['pme_submissions']['Row'] & {
  operator_name?: string | null;
  broker_name?: string | null;
  broker_phone?: string | null;
  broker_email?: string | null;
  broker_team_name?: string | null;
};

// --- Tipo Detalhado para o Retorno da RPC --- 
// (Espelha a estrutura construída pela função get_proposal_details v3)
export type ProposalDetails = {
  submission_id: string | null; // A função retorna isso no nível superior?
  submission: PmeSubmission | null;
  company: PmeCompany | null;
  contract: PmeContract | null;
  grace_period: PmeGracePeriod | null;
  partners: PmePartner[]; // Deve ser um array
  holders: { 
    holder: PmeHolder; 
    dependents: PmeDependent[] | null; // Dependentes é um array
  }[]; // Holders é um array
  files: PmeFile[]; // Deve ser um array
} | null; // A função pode retornar null ou precisamos garantir um objeto?

// --- Tipo para Operadora (simplificado para a lista) ---
export type OperatorInfo = {
  id: number;
  name: string;
};

/**
 * Busca os detalhes agregados de uma proposta usando a função RPC do Supabase.
 * @param submissionId O UUID da submissão.
 * @returns Um objeto com os detalhes da proposta ou lança um erro.
 */
export async function fetchProposalDetails(submissionId: string): Promise<ProposalDetails> {
  console.log(`Buscando detalhes para submission_id: ${submissionId}`); // Log para debug
  const { data, error } = await supabase.rpc('get_proposal_details', {
    p_submission_id: submissionId
  });

  if (error) {
    console.error('Erro ao chamar RPC get_proposal_details:', error);
    throw new Error(`Erro ao buscar detalhes da proposta: ${error.message}`);
  }

  if (!data) {
    console.warn('Nenhum dado retornado pela RPC para submission_id:', submissionId);
    return null; // Retorna null se o tipo ProposalDetails permitir
  }

  console.log("Dados recebidos da RPC:", data); // Log para debug
  return data as unknown as ProposalDetails;
}

/**
 * Busca a lista de operadoras ativas.
 * @returns Um array com id e nome das operadoras ou lança um erro.
 */
export async function fetchOperators(): Promise<OperatorInfo[]> {
  console.log("Buscando lista de operadoras...");
  const { data, error } = await supabase
    .from('operators')
    .select('id, name')
    .eq('active', true) // Buscar apenas operadoras ativas
    .order('name', { ascending: true }); // Ordenar por nome

  if (error) {
    console.error('Erro ao buscar operadoras:', error);
    throw new Error(`Erro ao buscar operadoras: ${error.message}`);
  }

  console.log("Operadoras recebidas:", data);
  return data || []; // Retorna array vazio se data for null
}

// Você pode adicionar outras funções de API aqui conforme necessário
// Ex: Funções para atualizar company, contract, etc. 