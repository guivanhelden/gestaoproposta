import supabase from "./supabase";
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
// (Espelha a estrutura construída pela função get_full_proposal_data)
export type ProposalDetails = {
  submission: {
    id: string;
    status: string | null;
    modality: string | null;
    operator_id: number | null;
    operator_name: string | null;
    plan_name: string | null;
    broker_id: number | null;
    broker_name: string | null;
    broker_email: string | null;
    broker_phone: string | null;
    broker_team_name: string | null;
    created_at: string | null;
    updated_at: string | null;
  } | null;
  company: {
    id: string;
    cnpj: string | null;
    razao_social: string | null;
    nome_fantasia: string | null;
    data_abertura: string | null;
    natureza_juridica: string | null;
    natureza_juridica_nome: string | null;
    situacao_cadastral: string | null;
    cnae: string | null;
    cnae_descricao: string | null;
    is_mei: boolean | null;
    tipo_logradouro: string | null;
    logradouro: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
    cep: string | null;
    responsavel_nome: string | null;
    responsavel_email: string | null;
    responsavel_telefone: string | null;
  } | null;
  contract: {
    id: string;
    type: string | null;
    coparticipation: string | null;
    value: number | null;
    validity_date: string | null;
    pre_proposta: string | null;
  } | null;
  grace_period: {
    id: string | null;
    has_grace_period: boolean | null;
    reason: string | null;
    previous_operator_id: number | null;
  } | null;
  partners: {
    id: string;
    company_id: string | null;
    nome: string | null;
    is_responsavel: boolean | null;
    email: string | null;
    telefone: string | null;
    incluir_como_titular: boolean | null;
    is_active: boolean | null;
    created_at: string | null;
    updated_at: string | null;
  }[];
  holders: {
    id: string;
    name: string;
    cpf: string | null;
    birth_date: string | null;
    email: string | null;
    phone: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
    dependents: {
      id: string;
      holder_id: string | null;
      name: string;
      cpf: string | null;
      birth_date: string | null;
      relationship: string | null;
      is_active: boolean | null;
    }[] | null;
  }[];
} | null;

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
  
  // Verificar se existe cache local para reduzir chamadas ao Supabase
  const cacheKey = `proposal_details_${submissionId}`;
  const cachedData = localStorage.getItem(cacheKey);
  
  // Se tiver cache e for válido (menos de 5 minutos), utilize-o
  if (cachedData) {
    try {
      const parsedCache = JSON.parse(cachedData);
      const cacheTime = parsedCache.timestamp || 0;
      const now = Date.now();
      const cacheAge = now - cacheTime;
      
      // Cache válido por 5 minutos (300000ms)
      if (cacheAge < 300000) {
        console.log("Usando dados em cache para submission_id:", submissionId);
        return parsedCache.data;
      }
      console.log("Cache expirado, buscando dados frescos");
    } catch (e) {
      console.warn("Erro ao parsear cache:", e);
    }
  }
  
  // Se não tiver cache ou estiver expirado, buscar do Supabase
  const { data, error } = await supabase.rpc('get_full_proposal_data', {
    p_submission_id: submissionId
  });

  if (error) {
    console.error('Erro ao chamar RPC get_full_proposal_data:', error);
    throw new Error(`Erro ao buscar detalhes da proposta: ${error.message}`);
  }

  if (!data) {
    console.warn('Nenhum dado retornado pela RPC para submission_id:', submissionId);
    return null; // Retorna null se o tipo ProposalDetails permitir
  }

  console.log("Dados recebidos da RPC:", data); // Log para debug
  
  // Salvar no cache local com timestamp
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      data: data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("Erro ao salvar cache:", e);
  }
  
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

// Tipos para os dados retornados pelas novas tabelas (ajuste se necessário)
type StageField = Database["public"]["Tables"]["kanban_stage_fields"]["Row"];
type StageData = Database["public"]["Tables"]["kanban_stage_data"]["Row"];

export type StageFieldWithValue = {
  field: StageField;
  value: string | null;
};

export const fetchStageFieldsAndData = async (
  cardId: string,
  stageId: string
): Promise<StageFieldWithValue[]> => {
  console.log(`Buscando campos e dados para cardId: ${cardId}, stageId: ${stageId}`);
  try {
    // 1. Buscar os campos da etapa, ordenados pela posição
    const { data: fieldsData, error: fieldsError } = await supabase
      .from("kanban_stage_fields")
      .select("*")
      .eq("stage_id", stageId)
      .order("position", { ascending: true });

    if (fieldsError) {
      console.error("Erro ao buscar campos da etapa:", fieldsError);
      throw new Error(`Erro ao buscar campos da etapa: ${fieldsError.message}`);
    }

    if (!fieldsData || fieldsData.length === 0) {
      console.log(`Nenhum campo encontrado para stageId: ${stageId}`);
      return []; // Retorna array vazio se não houver campos para a etapa
    }

    const fieldIds = fieldsData.map((field: StageField) => field.id);

    // 2. Buscar os dados do card para esses campos
    const { data: stageData, error: dataError } = await supabase
      .from("kanban_stage_data")
      // Seleciona apenas os campos necessários e dá um tipo explícito para a resposta
      .select("field_id, value")
      .eq("card_id", cardId)
      .in("field_id", fieldIds)
      .returns<Pick<StageData, 'field_id' | 'value'>[]>(); // Tipo explícito para a resposta

    if (dataError) {
      console.error("Erro ao buscar dados da etapa para o card:", dataError);
      // Não lançar erro aqui, podemos continuar e usar valores padrão/nulos
      // throw new Error(`Erro ao buscar dados da etapa: ${dataError.message}`);
    }

    // 3. Mapear os dados para fácil acesso (field_id -> value)
    const dataMap = new Map<string, string | null>();
    if (stageData) {
      // Adiciona tipo explícito para 'data'
      stageData.forEach((data: Pick<StageData, 'field_id' | 'value'>) => {
        // Assegura que data.field_id não é null ou undefined antes de usar
        if (data.field_id) {
             dataMap.set(data.field_id, data.value);
        }
      });
    }
    console.log("Mapa de dados:", dataMap);


    // 4. Combinar campos com seus valores (ou valor padrão/null)
    // Adiciona tipo explícito para 'field'
    const combinedData: StageFieldWithValue[] = fieldsData.map((field: StageField) => ({
      field: field,
      value: dataMap.get(field.id) ?? field.default_value ?? null, // Usa valor do card, fallback para padrão do campo, fallback para null
    }));

    console.log("Dados combinados retornados:", combinedData);
    return combinedData;

  } catch (error: any) {
    console.error("Erro inesperado em fetchStageFieldsAndData:", error);
    // Relança o erro para ser tratado pelo chamador (ex: react-query)
    throw error; 
  }
};

// --- Tipo para os dados de Upsert --- 
export type UpsertStageData = {
  card_id: string;       // <- Renomeado para snake_case (padrão Supabase)
  field_id: string;      // <- Renomeado para snake_case
  value: string | null;
  created_by: string;    // <- Renomeado de userId e usado para created_by
  updated_by?: string;   // <- Adicionado updated_by
  // 'version' será tratado pelo trigger no banco
};

/**
 * Insere ou atualiza múltiplos registros na tabela kanban_stage_data.
 * Usa a combinação de card_id e field_id como chave de conflito.
 * @param dataToUpsert Array de objetos UpsertStageData.
 * @returns A resposta do Supabase upsert.
 */
export async function upsertKanbanStageData(dataToUpsert: UpsertStageData[]) {
  if (!dataToUpsert || dataToUpsert.length === 0) {
    console.log("Nenhum dado para fazer upsert.");
    return { data: [], error: null }; // Retorna sucesso vazio se não há nada a fazer
  }

  console.log("Executando upsert em kanban_stage_data com:", dataToUpsert);

  // Ajustar os dados para o upsert: 
  // Se o valor já existe (conflito), queremos atualizar `value` e `updated_by`.
  // Se é novo, `created_by` será usado.
  const upsertPayload = dataToUpsert.map(item => ({
     card_id: item.card_id,
     field_id: item.field_id,
     value: item.value,
     created_by: item.created_by, // Sempre presente
     updated_by: item.created_by, // Usar o mesmo ID para updated_by em caso de update
     // version não é enviado, será gerenciado pelo DB trigger
  }));

  const { data, error } = await supabase
    .from('kanban_stage_data')
    .upsert(upsertPayload, {
      // Ignorar duplicatas não é o ideal, queremos atualizar
      // ignoreDuplicates: false, 
      // Especificar a coluna(s) de conflito para o UPDATE
      onConflict: 'card_id, field_id',
       // defaultToNull: false // Garante que campos omitidos não viram NULL no update?
       // Isso pode ser útil se nem todos os campos (como version) estão no payload
    })
    .select(); // Opcional: selecionar os dados inseridos/atualizados

  if (error) {
    console.error('Erro no upsert em kanban_stage_data:', error);
    throw new Error(`Erro ao salvar dados da etapa: ${error.message}`);
  }

  console.log("Upsert em kanban_stage_data concluído com sucesso:", data);
  return { data, error: null };
}

/**
 * Busca os campos definidos para uma etapa específica do Kanban, ordenados por posição.
 * @param stageId O UUID da etapa.
 * @returns Um array com os dados dos campos da etapa ou lança um erro.
 */
export async function fetchStageFields(stageId: string | null | undefined): Promise<Database["public"]["Tables"]["kanban_stage_fields"]["Row"][]> {
  console.log(`Buscando campos para stageId: ${stageId}`);
  
  // Verificar se stageId é válido antes de prosseguir
  if (!stageId) {
     console.warn("fetchStageFields chamado com stageId inválido.");
     return []; // Retorna array vazio se ID for inválido
  }

  const { data, error } = await supabase
    .from('kanban_stage_fields')
    .select('*')
    .eq('stage_id', stageId) // Agora stageId é garantidamente uma string
    .order('position', { ascending: true });

  if (error) {
    console.error('Erro ao buscar campos da etapa:', error);
    throw new Error(`Erro ao buscar campos da etapa: ${error.message}`);
  }

  console.log("Campos da etapa recebidos:", data);
  return data || []; // Retorna array vazio se data for null
}

// Tipo para os dados do formulário, omitindo o ID que é gerado
type CreateStageFieldData = Omit<Database["public"]["Tables"]["kanban_stage_fields"]["Row"], 'id' | 'created_at' | 'updated_at'>;
type UpdateStageFieldData = Partial<CreateStageFieldData>; // Para update, os campos são opcionais

/**
 * Cria um novo campo para uma etapa específica do Kanban.
 * @param fieldData Dados do campo a ser criado (sem id, created_at, updated_at).
 * @returns O campo criado.
 */
export async function createStageField(fieldData: CreateStageFieldData) {
  console.log("Criando novo campo:", fieldData);
  const { data, error } = await supabase
    .from('kanban_stage_fields')
    .insert(fieldData)
    .select()
    .single(); // Espera retornar o objeto único criado

  if (error) {
    console.error('Erro ao criar campo da etapa:', error);
    throw new Error(`Erro ao criar campo: ${error.message}`);
  }
  console.log("Campo criado com sucesso:", data);
  return data;
}

/**
 * Atualiza um campo existente de uma etapa do Kanban.
 * @param fieldId O UUID do campo a ser atualizado.
 * @param fieldData Dados do campo a serem atualizados.
 * @returns O campo atualizado.
 */
export async function updateStageField(fieldId: string, fieldData: UpdateStageFieldData) {
  console.log(`Atualizando campo ${fieldId} com:`, fieldData);
  const { data, error } = await supabase
    .from('kanban_stage_fields')
    .update(fieldData)
    .eq('id', fieldId)
    .select()
    .single(); // Espera retornar o objeto único atualizado

  if (error) {
    console.error(`Erro ao atualizar campo ${fieldId}:`, error);
    throw new Error(`Erro ao atualizar campo: ${error.message}`);
  }
  console.log("Campo atualizado com sucesso:", data);
  return data;
}

// --- Tipos para Opções de Seletores ---
export type BrokerOption = {
  id: number;
  name: string;
};

export type OperatorOption = {
  id: number;
  name: string;
};


// --- Funções para buscar dados para seletores ---

/**
 * Busca a lista de corretores ativos para preencher seletores.
 * @returns Uma Promise com um array de BrokerOption.
 */
export async function fetchBrokers(): Promise<BrokerOption[]> {
  console.log("Buscando lista de corretores...");
  const { data, error } = await supabase
    .from('brokers')
    .select('id, name') // Seleciona apenas id e nome
    // .eq('is_active', true) // Descomente se houver um campo de status/ativo
    .order('name', { ascending: true }); // Ordena por nome

  if (error) {
    console.error('Erro ao buscar corretores:', error);
    throw new Error(`Erro ao buscar corretores: ${error.message}`);
  }

  if (!data) {
    console.warn('Nenhum corretor encontrado.');
    return [];
  }

  console.log(`Corretores encontrados: ${data.length}`);
  // Garantir que o tipo retornado seja BrokerOption[]
  return data as BrokerOption[];
}

/**
 * Busca a lista de operadoras ativas para preencher seletores.
 * Inclui o ID no nome para facilitar a identificação, se necessário.
 * @returns Uma Promise com um array de OperatorOption.
 */
export async function fetchActiveOperators(): Promise<OperatorOption[]> {
  console.log("Buscando lista de operadoras ativas...");
  const { data, error } = await supabase
    .from('operators')
    .select('id, name') // Seleciona apenas id e nome
    // .eq('status', 'active') // Descomente se houver um campo de status
    .order('name', { ascending: true }); // Ordena por nome

  if (error) {
    console.error('Erro ao buscar operadoras:', error);
    throw new Error(`Erro ao buscar operadoras: ${error.message}`);
  }

  if (!data) {
    console.warn('Nenhuma operadora encontrada.');
    return [];
  }

  console.log(`Operadoras encontradas: ${data.length}`);
  // Opcional: Modificar o nome para incluir o ID se for útil
  // const formattedData = data.map(op => ({ ...op, name: `${op.name} (ID: ${op.id})` }));
  return data as OperatorOption[];
}

// Você pode adicionar outras funções de API aqui conforme necessário
// Ex: Funções para atualizar company, contract, etc. 