import { z } from "zod";

// TODO: Definir um novo schema Zod abrangente para toda a Ficha da Proposta
// Este schema é um ponto de partida baseado nos campos usados anteriormente
export const proposalSchema = z.object({
  // Campos iniciais da kanban_cards
  company_name: z.string().nullable().optional(),
  broker_name: z.string().nullable().optional(),
  broker_phone: z.string().nullable().optional(),
  broker_email: z.string().nullable().optional(),
  broker_team_name: z.string().nullable().optional(),
  operator_id: z.number().nullable().optional(),
  operator: z.string().nullable().optional(), // Nome da operadora, pode vir de uma junção ou ser digitado
  plan_name: z.string().nullable().optional(),
  modality: z.string().nullable().optional(),
  lives: z.number().min(1, "Número de vidas deve ser pelo menos 1"),
  value: z.number().min(0, "Valor deve ser maior ou igual a zero"),
  due_date: z.string().nullable().optional(), // Pode precisar de validação de data aqui
  observacoes: z.string().nullable().optional(),

  // Campos de pme_companies (usados nos forms)
  cnpj: z.string().nullable().optional(),
  razao_social: z.string().nullable().optional(),
  nome_fantasia: z.string().nullable().optional(),
  data_abertura: z.string().nullable().optional(), // Pode precisar de validação de data
  natureza_juridica: z.string().nullable().optional(),
  situacao_cadastral: z.string().nullable().optional(),
  cnae: z.string().nullable().optional(),
  cnae_descricao: z.string().nullable().optional(),
  is_mei: z.boolean().nullable().optional(),
  // inscricao_estadual, endereco_completo, telefone foram removidos por não existirem no tipo retornado
  cep: z.string().nullable().optional(),

  // Campos de Endereço (pme_companies)
  tipo_logradouro: z.string().nullable().optional(),
  logradouro: z.string().nullable().optional(),
  numero: z.string().nullable().optional(),
  complemento: z.string().nullable().optional(),
  bairro: z.string().nullable().optional(),
  cidade: z.string().nullable().optional(),
  uf: z.string().nullable().optional(),

  // Campos de pme_contracts (usados nos forms)
  contract_type: z.string().nullable().optional(),
  coparticipation: z.string().nullable().optional(),
  validity_date: z.string().nullable().optional(), // Pode precisar de validação de data
  pre_proposta: z.string().nullable().optional(),
  
  // Campos de pme_grace_periods (usados nos forms)
  has_grace_period: z.boolean().nullable().optional(),
  // grace_start_date, grace_end_date foram removidos por não existirem no tipo retornado
  grace_reason: z.string().nullable().optional(),

  // TODO: Adicionar validação para Sócios (partners), Titulares/Dependentes (holders), Arquivos (files)
  // quando esses formulários forem integrados aqui.
});

export type ProposalFormData = z.infer<typeof proposalSchema>;
