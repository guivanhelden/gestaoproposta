-- Tabela para definir os campos de cada etapa
CREATE TABLE public.kanban_stage_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL,
  field_name text NOT NULL,
  field_type text NOT NULL, -- text, number, date, select, etc.
  is_required boolean NOT NULL DEFAULT false,
  options jsonb NULL, -- para campos do tipo select
  default_value text NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT kanban_stage_fields_pkey PRIMARY KEY (id),
  CONSTRAINT kanban_stage_fields_stage_id_fkey FOREIGN KEY (stage_id)
    REFERENCES kanban_stages (id) ON DELETE CASCADE
);

CREATE INDEX idx_kanban_stage_fields_stage_id ON public.kanban_stage_fields USING btree (stage_id);

-- Tabela para armazenar os dados de cada card em cada etapa
CREATE TABLE public.kanban_stage_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL,
  field_id uuid NOT NULL,
  value text NULL,
  version integer NOT NULL DEFAULT 1,
  created_by uuid NOT NULL,
  updated_by uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT kanban_stage_data_pkey PRIMARY KEY (id),
  CONSTRAINT kanban_stage_data_card_id_fkey FOREIGN KEY (card_id)
    REFERENCES kanban_cards (id) ON DELETE CASCADE,
  CONSTRAINT kanban_stage_data_field_id_fkey FOREIGN KEY (field_id)
    REFERENCES kanban_stage_fields (id) ON DELETE CASCADE,
  CONSTRAINT kanban_stage_data_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES auth.users (id),
  CONSTRAINT kanban_stage_data_updated_by_fkey FOREIGN KEY (updated_by)
    REFERENCES auth.users (id)
);

CREATE INDEX idx_kanban_stage_data_card_id ON public.kanban_stage_data USING btree (card_id);
CREATE INDEX idx_kanban_stage_data_field_id ON public.kanban_stage_data USING btree (field_id);

-- Tabela para armazenar o histórico de dados (versões anteriores)
CREATE TABLE public.kanban_stage_data_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  stage_data_id uuid NOT NULL,
  value text NULL,
  version integer NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT kanban_stage_data_history_pkey PRIMARY KEY (id),
  CONSTRAINT kanban_stage_data_history_stage_data_id_fkey FOREIGN KEY (stage_data_id)
    REFERENCES kanban_stage_data (id) ON DELETE CASCADE,
  CONSTRAINT kanban_stage_data_history_changed_by_fkey FOREIGN KEY (changed_by)
    REFERENCES auth.users (id)
);

CREATE INDEX idx_kanban_stage_data_history_stage_data_id ON public.kanban_stage_data_history USING btree (stage_data_id);

-- Tabela para rastrear o histórico de movimentação dos cards entre etapas
CREATE TABLE public.kanban_card_stage_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL,
  from_stage_id uuid NULL,
  to_stage_id uuid NOT NULL,
  moved_by uuid NOT NULL,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT kanban_card_stage_history_pkey PRIMARY KEY (id),
  CONSTRAINT kanban_card_stage_history_card_id_fkey FOREIGN KEY (card_id)
    REFERENCES kanban_cards (id) ON DELETE CASCADE,
  CONSTRAINT kanban_card_stage_history_from_stage_id_fkey FOREIGN KEY (from_stage_id)
    REFERENCES kanban_stages (id) ON DELETE CASCADE,
  CONSTRAINT kanban_card_stage_history_to_stage_id_fkey FOREIGN KEY (to_stage_id)
    REFERENCES kanban_stages (id) ON DELETE CASCADE,
  CONSTRAINT kanban_card_stage_history_moved_by_fkey FOREIGN KEY (moved_by)
    REFERENCES auth.users (id)
);

CREATE INDEX idx_kanban_card_stage_history_card_id ON public.kanban_card_stage_history USING btree (card_id);

-- Trigger para o versionamento dos dados
CREATE OR REPLACE FUNCTION trigger_stage_data_version()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.value <> NEW.value) THEN
    INSERT INTO kanban_stage_data_history(
      stage_data_id, value, version, changed_by
    ) VALUES (
      OLD.id, OLD.value, OLD.version, NEW.updated_by
    );
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_before_update_stage_data
BEFORE UPDATE ON kanban_stage_data
FOR EACH ROW
WHEN (OLD.value IS DISTINCT FROM NEW.value)
EXECUTE FUNCTION trigger_stage_data_version();

-- Trigger para registrar histórico quando o card muda de etapa
CREATE OR REPLACE FUNCTION trigger_card_stage_history()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.stage_id <> NEW.stage_id) THEN
    INSERT INTO kanban_card_stage_history(
      card_id, from_stage_id, to_stage_id, moved_by
    ) VALUES (
      NEW.id, OLD.stage_id, NEW.stage_id, NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_before_update_card_stage
BEFORE UPDATE ON kanban_cards
FOR EACH ROW
WHEN (OLD.stage_id IS DISTINCT FROM NEW.stage_id)
EXECUTE FUNCTION trigger_card_stage_history();

-- Adicionar RLS e políticas para kanban_stage_fields
ALTER TABLE public.kanban_stage_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso total a kanban_stage_fields" 
ON public.kanban_stage_fields 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Todos os usuários autenticados podem ver campos de etapas" 
ON public.kanban_stage_fields 
FOR SELECT 
TO public 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Todos podem visualizar campos de etapas" 
ON public.kanban_stage_fields 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Usuários podem gerenciar campos de etapas de seus boards" 
ON public.kanban_stage_fields 
FOR ALL 
TO public 
USING (EXISTS (
  SELECT 1 
  FROM kanban_stages 
  JOIN kanban_boards ON kanban_stages.board_id = kanban_boards.id 
  WHERE kanban_stages.id = kanban_stage_fields.stage_id AND kanban_boards.owner_id = auth.uid()
));

-- Adicionar RLS e políticas para kanban_stage_data
ALTER TABLE public.kanban_stage_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso total a kanban_stage_data" 
ON public.kanban_stage_data 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Todos os usuários autenticados podem ver dados de etapas" 
ON public.kanban_stage_data 
FOR SELECT 
TO public 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Todos podem visualizar dados de etapas" 
ON public.kanban_stage_data 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Todos os usuários autenticados podem criar dados de etapas" 
ON public.kanban_stage_data 
FOR INSERT 
TO public 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Criadores, admins e gestores podem atualizar dados de etapas" 
ON public.kanban_stage_data 
FOR UPDATE 
TO public 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'gestor'::user_role));

CREATE POLICY "Apenas admins e gestores podem excluir dados de etapas" 
ON public.kanban_stage_data 
FOR DELETE 
TO public 
USING ((has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'gestor'::user_role)));

CREATE POLICY "Usuários podem gerenciar dados de etapas de seus cards" 
ON public.kanban_stage_data 
FOR ALL 
TO public 
USING (EXISTS (
  SELECT 1 
  FROM kanban_cards 
  JOIN kanban_boards ON kanban_cards.board_id = kanban_boards.id 
  WHERE kanban_cards.id = kanban_stage_data.card_id AND kanban_boards.owner_id = auth.uid()
));

-- Adicionar RLS e políticas para kanban_stage_data_history
ALTER TABLE public.kanban_stage_data_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso total a kanban_stage_data_history" 
ON public.kanban_stage_data_history 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Todos os usuários autenticados podem ver histórico de dados" 
ON public.kanban_stage_data_history 
FOR SELECT 
TO public 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Todos podem visualizar histórico de dados" 
ON public.kanban_stage_data_history 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Usuários podem gerenciar histórico de dados de seus cards" 
ON public.kanban_stage_data_history 
FOR ALL 
TO public 
USING (EXISTS (
  SELECT 1 
  FROM kanban_stage_data 
  JOIN kanban_cards ON kanban_stage_data.card_id = kanban_cards.id 
  JOIN kanban_boards ON kanban_cards.board_id = kanban_boards.id 
  WHERE kanban_stage_data.id = kanban_stage_data_history.stage_data_id 
  AND kanban_boards.owner_id = auth.uid()
));

-- Adicionar RLS e políticas para kanban_card_stage_history
ALTER TABLE public.kanban_card_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso total a kanban_card_stage_history" 
ON public.kanban_card_stage_history 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Todos os usuários autenticados podem ver histórico de etapas" 
ON public.kanban_card_stage_history 
FOR SELECT 
TO public 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Todos podem visualizar histórico de etapas" 
ON public.kanban_card_stage_history 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Usuários podem gerenciar histórico de etapas de seus cards" 
ON public.kanban_card_stage_history 
FOR ALL 
TO public 
USING (EXISTS (
  SELECT 1 
  FROM kanban_cards 
  JOIN kanban_boards ON kanban_cards.board_id = kanban_boards.id 
  WHERE kanban_cards.id = kanban_card_stage_history.card_id 
  AND kanban_boards.owner_id = auth.uid()
));

-- Adicionar trigger de timestamp
CREATE TRIGGER set_timestamp_kanban_stage_fields 
BEFORE UPDATE ON kanban_stage_fields 
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_kanban_stage_data 
BEFORE UPDATE ON kanban_stage_data 
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();



RLS (Row Level Security) habilitado em todas as tabelas
Acesso total para usuários autenticados
Visualização permitida para todos os usuários autenticados
Políticas específicas para criação, atualização e exclusão baseadas nas funções dos usuários
Políticas especiais para permitir que os donos dos boards gerenciem seus próprios recursos