create table public.kanban_cards (
  id uuid not null default gen_random_uuid (),
  stage_id uuid not null,
  board_id uuid not null,
  operator text not null,
  value numeric not null default 0,
  has_documents boolean not null default false,
  has_comments boolean not null default false,
  has_warnings boolean not null default false,
  lives integer not null default 1,
  due_date date null,
  board_type text not null,
  created_by uuid not null,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  observacoes text null,
  submission_id uuid null,
  company_name text null,
  contact_email text null,
  constraint kanban_cards_pkey primary key (id),
  constraint kanban_cards_board_id_fkey foreign KEY (board_id) references kanban_boards (id),
  constraint kanban_cards_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint kanban_cards_stage_id_fkey foreign KEY (stage_id) references kanban_stages (id) on delete CASCADE,
  constraint kanban_cards_submission_id_fkey foreign KEY (submission_id) references pme_submissions (id)
) TABLESPACE pg_default;

create index IF not exists idx_kanban_cards_board_id on public.kanban_cards using btree (board_id) TABLESPACE pg_default;

create index IF not exists idx_kanban_cards_stage_id on public.kanban_cards using btree (stage_id) TABLESPACE pg_default;

create index IF not exists idx_kanban_cards_submission_id on public.kanban_cards using btree (submission_id) TABLESPACE pg_default;

create trigger set_timestamp_kanban_cards BEFORE
update on kanban_cards for EACH row
execute FUNCTION trigger_set_timestamp ();

create trigger trigger_before_insert_kanban_cards BEFORE INSERT on kanban_cards for EACH row when (new.submission_id is not null)
execute FUNCTION update_kanban_card_fields ();

create trigger trigger_before_update_kanban_cards BEFORE
update on kanban_cards for EACH row when (
  new.submission_id is not null
  and (
    old.submission_id <> new.submission_id
    or old.submission_id is null
  )
)
execute FUNCTION update_kanban_card_fields ();


create table public.pme_companies (
  id uuid not null default extensions.uuid_generate_v4 (),
  submission_id uuid null,
  cnpj text not null,
  razao_social text not null,
  nome_fantasia text null,
  data_abertura date null,
  natureza_juridica text null,
  natureza_juridica_nome text null,
  situacao_cadastral text null,
  cnae text null,
  cnae_descricao text null,
  is_mei boolean null default false,
  tipo_logradouro text null,
  logradouro text null,
  numero text null,
  complemento text null,
  bairro text null,
  cep text null,
  uf text null,
  cidade text null,
  responsavel_nome text not null,
  responsavel_email text null,
  responsavel_telefone text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  status text null default 'active'::text,
  constraint pme_companies_pkey primary key (id),
  constraint pme_companies_submission_id_fkey foreign KEY (submission_id) references pme_submissions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_pme_companies_cnpj on public.pme_companies using btree (cnpj) TABLESPACE pg_default;

create index IF not exists idx_pme_companies_status on public.pme_companies using btree (status) TABLESPACE pg_default;

create trigger set_timestamp_pme_companies BEFORE
update on pme_companies for EACH row
execute FUNCTION trigger_set_timestamp ();

create trigger trigger_after_change_companies
after INSERT
or
update on pme_companies for EACH row
execute FUNCTION update_related_kanban_cards ();

create table public.pme_company_partners (
  id uuid not null default extensions.uuid_generate_v4 (),
  company_id uuid null,
  nome text not null,
  is_responsavel boolean null default false,
  email text null,
  telefone text null,
  incluir_como_titular boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_active boolean null default true,
  constraint pme_company_partners_pkey primary key (id),
  constraint pme_company_partners_company_id_fkey foreign KEY (company_id) references pme_companies (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_pme_company_partners_is_active on public.pme_company_partners using btree (is_active) TABLESPACE pg_default;

create trigger set_timestamp_pme_company_partners BEFORE
update on pme_company_partners for EACH row
execute FUNCTION trigger_set_timestamp ();

create table public.pme_contracts (
  id uuid not null default extensions.uuid_generate_v4 (),
  submission_id uuid null,
  type text not null,
  coparticipation text not null,
  value numeric(10, 2) not null,
  validity_date date null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  status text null default 'active'::text,
  pre_proposta text null,
  constraint pme_contracts_pkey primary key (id),
  constraint pme_contracts_submission_id_fkey foreign KEY (submission_id) references pme_submissions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_pme_contracts_status on public.pme_contracts using btree (status) TABLESPACE pg_default;

create trigger set_timestamp_pme_contracts BEFORE
update on pme_contracts for EACH row
execute FUNCTION trigger_set_timestamp ();

create trigger trigger_after_change_contracts
after INSERT
or
update on pme_contracts for EACH row
execute FUNCTION update_related_kanban_cards ();

create table public.pme_holders (
  id uuid not null default extensions.uuid_generate_v4 (),
  submission_id uuid null,
  name text not null,
  cpf text null,
  birth_date date null,
  email text null,
  phone text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  status text null default 'active'::text,
  constraint pme_holders_pkey primary key (id),
  constraint pme_holders_submission_id_fkey foreign KEY (submission_id) references pme_submissions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_pme_holders_cpf on public.pme_holders using btree (cpf) TABLESPACE pg_default;

create index IF not exists idx_pme_holders_status on public.pme_holders using btree (status) TABLESPACE pg_default;

create trigger set_timestamp_pme_holders BEFORE
update on pme_holders for EACH row
execute FUNCTION trigger_set_timestamp ();

create trigger trigger_after_change_holders
after INSERT
or DELETE
or
update on pme_holders for EACH row
execute FUNCTION update_related_kanban_cards ();

create table public.pme_dependents (
  id uuid not null default extensions.uuid_generate_v4 (),
  holder_id uuid null,
  name text not null,
  cpf text null,
  birth_date date null,
  relationship text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_active boolean null default true,
  constraint pme_dependents_pkey primary key (id),
  constraint pme_dependents_holder_id_fkey foreign KEY (holder_id) references pme_holders (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_pme_dependents_is_active on public.pme_dependents using btree (is_active) TABLESPACE pg_default;

create trigger set_timestamp_pme_dependents BEFORE
update on pme_dependents for EACH row
execute FUNCTION trigger_set_timestamp ();

create trigger trigger_after_change_dependents
after INSERT
or DELETE
or
update on pme_dependents for EACH row
execute FUNCTION update_related_kanban_cards ();

create table public.pme_grace_periods (
  id uuid not null default extensions.uuid_generate_v4 (),
  submission_id uuid null,
  has_grace_period boolean null default false,
  reason text null,
  previous_operator_id integer null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint pme_grace_periods_pkey primary key (id),
  constraint pme_grace_periods_previous_operator_id_fkey foreign KEY (previous_operator_id) references operators (id),
  constraint pme_grace_periods_submission_id_fkey foreign KEY (submission_id) references pme_submissions (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger set_timestamp_pme_grace_periods BEFORE
update on pme_grace_periods for EACH row
execute FUNCTION trigger_set_timestamp ();

create table public.pme_files (
  id uuid not null default extensions.uuid_generate_v4 (),
  submission_id uuid null,
  category text not null,
  file_name text not null,
  file_path text not null,
  file_size integer null,
  file_type text null,
  uploaded_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_active boolean null default true,
  constraint pme_files_pkey primary key (id),
  constraint pme_files_submission_id_fkey foreign KEY (submission_id) references pme_submissions (id) on delete CASCADE,
  constraint pme_files_category_check check (
    (
      category = any (
        array[
          'company'::text,
          'grace'::text,
          'beneficiaries'::text,
          'quotation'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_pme_files_is_active on public.pme_files using btree (is_active) TABLESPACE pg_default;

create trigger set_timestamp_pme_files BEFORE
update on pme_files for EACH row
execute FUNCTION trigger_set_timestamp ();

