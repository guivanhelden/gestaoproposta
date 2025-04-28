export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      administradoras: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          id_six: number | null
          logo_url: string | null
          nome: string
          status: boolean | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          id_six?: number | null
          logo_url?: string | null
          nome: string
          status?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          id_six?: number | null
          logo_url?: string | null
          nome?: string
          status?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string
          table_name: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id: string
          table_name: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      brokers: {
        Row: {
          ativo: boolean | null
          email_corretor: string | null
          equipe: string | null
          equipe_id: number | null
          id: number
          name: string
          telefone_corretor: string | null
        }
        Insert: {
          ativo?: boolean | null
          email_corretor?: string | null
          equipe?: string | null
          equipe_id?: number | null
          id: number
          name: string
          telefone_corretor?: string | null
        }
        Update: {
          ativo?: boolean | null
          email_corretor?: string | null
          equipe?: string | null
          equipe_id?: number | null
          id?: number
          name?: string
          telefone_corretor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brokers_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipe"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          body: string | null
          card_id: string | null
          created_at: string | null
          direction: string
          from_email: string | null
          id: string
          message_id: string | null
          status: string | null
          subject: string | null
          to_email: string | null
        }
        Insert: {
          body?: string | null
          card_id?: string | null
          created_at?: string | null
          direction: string
          from_email?: string | null
          id?: string
          message_id?: string | null
          status?: string | null
          subject?: string | null
          to_email?: string | null
        }
        Update: {
          body?: string | null
          card_id?: string | null
          created_at?: string | null
          direction?: string
          from_email?: string | null
          id?: string
          message_id?: string | null
          status?: string | null
          subject?: string | null
          to_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kanban_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "emails_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_dependents"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "emails_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_holders"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "fk_card"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kanban_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_card"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "fk_card"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_dependents"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "fk_card"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_holders"
            referencedColumns: ["card_id"]
          },
        ]
      }
      equipe: {
        Row: {
          created_at: string
          email: string | null
          foto_url: string | null
          id: number
          name: string | null
          status: boolean | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: number
          name?: string | null
          status?: boolean | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: number
          name?: string | null
          status?: boolean | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kanban_boards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          owner_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          owner_id: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          owner_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      kanban_card_stage_history: {
        Row: {
          card_id: string
          created_at: string
          from_stage_id: string | null
          id: string
          moved_by: string
          notes: string | null
          to_stage_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          from_stage_id?: string | null
          id?: string
          moved_by: string
          notes?: string | null
          to_stage_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          from_stage_id?: string | null
          id?: string
          moved_by?: string
          notes?: string | null
          to_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_card_stage_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kanban_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_card_stage_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "kanban_card_stage_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_dependents"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "kanban_card_stage_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_holders"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "kanban_card_stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "kanban_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_card_stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "kanban_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_cards: {
        Row: {
          board_id: string
          board_type: string
          company_name: string | null
          contact_email: string | null
          created_at: string
          created_by: string
          due_date: string | null
          has_comments: boolean
          has_documents: boolean
          has_warnings: boolean
          id: string
          lives: number
          observacoes: string | null
          operator: string
          operator_id: number | null
          position: number
          stage_id: string
          submission_id: string | null
          updated_at: string
          value: number
        }
        Insert: {
          board_id: string
          board_type: string
          company_name?: string | null
          contact_email?: string | null
          created_at?: string
          created_by: string
          due_date?: string | null
          has_comments?: boolean
          has_documents?: boolean
          has_warnings?: boolean
          id?: string
          lives?: number
          observacoes?: string | null
          operator: string
          operator_id?: number | null
          position?: number
          stage_id: string
          submission_id?: string | null
          updated_at?: string
          value?: number
        }
        Update: {
          board_id?: string
          board_type?: string
          company_name?: string | null
          contact_email?: string | null
          created_at?: string
          created_by?: string
          due_date?: string | null
          has_comments?: boolean
          has_documents?: boolean
          has_warnings?: boolean
          id?: string
          lives?: number
          observacoes?: string | null
          operator?: string
          operator_id?: number | null
          position?: number
          stage_id?: string
          submission_id?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kanban_cards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "kanban_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submission_summary"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "kanban_cards_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_comments: {
        Row: {
          card_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_comments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kanban_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_comments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "kanban_comments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_dependents"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "kanban_comments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_holders"
            referencedColumns: ["card_id"]
          },
        ]
      }
      kanban_documents: {
        Row: {
          card_id: string
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          status: string
          uploaded_by: string
        }
        Insert: {
          card_id: string
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          status?: string
          uploaded_by: string
        }
        Update: {
          card_id?: string
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          status?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_documents_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kanban_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_documents_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "kanban_documents_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_dependents"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "kanban_documents_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_holders"
            referencedColumns: ["card_id"]
          },
        ]
      }
      kanban_stage_data: {
        Row: {
          card_id: string
          created_at: string
          created_by: string
          field_id: string
          id: string
          updated_at: string
          updated_by: string | null
          value: string | null
          version: number
        }
        Insert: {
          card_id: string
          created_at?: string
          created_by: string
          field_id: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
          version?: number
        }
        Update: {
          card_id?: string
          created_at?: string
          created_by?: string
          field_id?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "kanban_stage_data_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kanban_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_stage_data_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "kanban_stage_data_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_dependents"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "kanban_stage_data_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_holders"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "kanban_stage_data_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "kanban_stage_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_stage_data_history: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          stage_data_id: string
          value: string | null
          version: number
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          stage_data_id: string
          value?: string | null
          version: number
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          stage_data_id?: string
          value?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "kanban_stage_data_history_stage_data_id_fkey"
            columns: ["stage_data_id"]
            isOneToOne: false
            referencedRelation: "kanban_stage_data"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_stage_fields: {
        Row: {
          created_at: string
          default_value: string | null
          field_name: string
          field_type: string
          id: string
          is_required: boolean
          options: Json | null
          position: number
          stage_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          field_name: string
          field_type: string
          id?: string
          is_required?: boolean
          options?: Json | null
          position?: number
          stage_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_value?: string | null
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          position?: number
          stage_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_stage_fields_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "kanban_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_stages: {
        Row: {
          board_id: string
          board_title: string | null
          created_at: string
          id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          board_id: string
          board_title?: string | null
          created_at?: string
          id?: string
          position: number
          title: string
          updated_at?: string
        }
        Update: {
          board_id?: string
          board_title?: string | null
          created_at?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_stages_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_user_configs: {
        Row: {
          board_id: string
          column_order: Json | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          visible_columns: Json | null
        }
        Insert: {
          board_id: string
          column_order?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          visible_columns?: Json | null
        }
        Update: {
          board_id?: string
          column_order?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          visible_columns?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_user_configs_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          active: boolean | null
          categoria: string | null
          created_at: string | null
          description: string | null
          gestor: string | null
          gestor_email: string | null
          gestor_phone: string | null
          id: number
          id_six: number | null
          logo_url: string | null
          name: string
          updated_at: string | null
          url_emissao: string | null
          url_passo_passo: string | null
        }
        Insert: {
          active?: boolean | null
          categoria?: string | null
          created_at?: string | null
          description?: string | null
          gestor?: string | null
          gestor_email?: string | null
          gestor_phone?: string | null
          id?: number
          id_six?: number | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
          url_emissao?: string | null
          url_passo_passo?: string | null
        }
        Update: {
          active?: boolean | null
          categoria?: string | null
          created_at?: string | null
          description?: string | null
          gestor?: string | null
          gestor_email?: string | null
          gestor_phone?: string | null
          id?: number
          id_six?: number | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          url_emissao?: string | null
          url_passo_passo?: string | null
        }
        Relationships: []
      }
      pme_companies: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnae: string | null
          cnae_descricao: string | null
          cnpj: string
          complemento: string | null
          created_at: string | null
          data_abertura: string | null
          id: string
          is_mei: boolean | null
          logradouro: string | null
          natureza_juridica: string | null
          natureza_juridica_nome: string | null
          nome_fantasia: string | null
          numero: string | null
          razao_social: string
          responsavel_email: string | null
          responsavel_nome: string
          responsavel_telefone: string | null
          situacao_cadastral: string | null
          status: string | null
          submission_id: string | null
          tipo_logradouro: string | null
          uf: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnae?: string | null
          cnae_descricao?: string | null
          cnpj: string
          complemento?: string | null
          created_at?: string | null
          data_abertura?: string | null
          id?: string
          is_mei?: boolean | null
          logradouro?: string | null
          natureza_juridica?: string | null
          natureza_juridica_nome?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          razao_social: string
          responsavel_email?: string | null
          responsavel_nome: string
          responsavel_telefone?: string | null
          situacao_cadastral?: string | null
          status?: string | null
          submission_id?: string | null
          tipo_logradouro?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnae?: string | null
          cnae_descricao?: string | null
          cnpj?: string
          complemento?: string | null
          created_at?: string | null
          data_abertura?: string | null
          id?: string
          is_mei?: boolean | null
          logradouro?: string | null
          natureza_juridica?: string | null
          natureza_juridica_nome?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          razao_social?: string
          responsavel_email?: string | null
          responsavel_nome?: string
          responsavel_telefone?: string | null
          situacao_cadastral?: string | null
          status?: string | null
          submission_id?: string | null
          tipo_logradouro?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pme_companies_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submission_summary"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "pme_companies_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      pme_company_partners: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string | null
          id: string
          incluir_como_titular: boolean | null
          is_active: boolean | null
          is_responsavel: boolean | null
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          incluir_como_titular?: boolean | null
          is_active?: boolean | null
          is_responsavel?: boolean | null
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          incluir_como_titular?: boolean | null
          is_active?: boolean | null
          is_responsavel?: boolean | null
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pme_company_partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "pme_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pme_contracts: {
        Row: {
          coparticipation: string
          created_at: string | null
          id: string
          pre_proposta: string | null
          status: string | null
          submission_id: string | null
          type: string
          lives: number | null
          updated_at: string | null
          validity_date: string | null
          value: number
        }
        Insert: {
          coparticipation: string
          created_at?: string | null
          id?: string
          pre_proposta?: string | null
          status?: string | null
          submission_id?: string | null
          type: string
          lives?: number | null
          updated_at?: string | null
          validity_date?: string | null
          value: number
        }
        Update: {
          coparticipation?: string
          created_at?: string | null
          id?: string
          pre_proposta?: string | null
          status?: string | null
          submission_id?: string | null
          type?: string
          lives?: number | null
          updated_at?: string | null
          validity_date?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "pme_contracts_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submission_summary"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "pme_contracts_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      pme_dependents: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          holder_id: string | null
          id: string
          is_active: boolean | null
          name: string
          relationship: string
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          holder_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          relationship: string
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          holder_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          relationship?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pme_dependents_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "pme_holders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pme_dependents_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_dependents"
            referencedColumns: ["holder_id"]
          },
          {
            foreignKeyName: "pme_dependents_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "view_kanban_cards_holders"
            referencedColumns: ["holder_id"]
          },
        ]
      }
      pme_files: {
        Row: {
          category: string
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_active: boolean | null
          submission_id: string | null
          updated_at: string | null
          uploaded_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          submission_id?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          submission_id?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pme_files_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submission_summary"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "pme_files_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      pme_grace_periods: {
        Row: {
          created_at: string | null
          has_grace_period: boolean | null
          id: string
          previous_operator_id: number | null
          reason: string | null
          submission_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          has_grace_period?: boolean | null
          id?: string
          previous_operator_id?: number | null
          reason?: string | null
          submission_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          has_grace_period?: boolean | null
          id?: string
          previous_operator_id?: number | null
          reason?: string | null
          submission_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pme_grace_periods_previous_operator_id_fkey"
            columns: ["previous_operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pme_grace_periods_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submission_summary"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "pme_grace_periods_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      pme_holders: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string | null
          submission_id: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string | null
          submission_id?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string | null
          submission_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pme_holders_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submission_summary"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "pme_holders_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      pme_submissions: {
        Row: {
          broker_id: number | null
          created_at: string | null
          id: string
          modality: string
          operator_id: number
          plan_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          broker_id?: number | null
          created_at?: string | null
          id?: string
          modality: string
          operator_id: number
          plan_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          broker_id?: number | null
          created_at?: string | null
          id?: string
          modality?: string
          operator_id?: number
          plan_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pme_submissions_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pme_submissions_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_smtp_credentials: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          email: string
          id: string
          smtp_host: string
          smtp_pass: string
          smtp_port: number
          smtp_user: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          smtp_host?: string
          smtp_pass: string
          smtp_port?: number
          smtp_user: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          smtp_host?: string
          smtp_pass?: string
          smtp_port?: number
          smtp_user?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      brokers_audit_view: {
        Row: {
          audit_id: string | null
          changed_at: string | null
          changed_by_email: string | null
          changed_by_name: string | null
          new_data: Json | null
          old_data: Json | null
          operation: string | null
        }
        Relationships: []
      }
      pme_submission_summary: {
        Row: {
          beneficiaries_files_count: number | null
          cidade: string | null
          cnae_descricao: string | null
          cnpj: string | null
          company_files_count: number | null
          contract_type: string | null
          contract_value: number | null
          coparticipation: string | null
          data_abertura: string | null
          estimated_total_value: number | null
          grace_files_count: number | null
          grace_period_reason: string | null
          has_grace_period: boolean | null
          modality: string | null
          natureza_juridica_nome: string | null
          nome_fantasia: string | null
          plan_name: string | null
          previous_operator_id: number | null
          quotation_files_count: number | null
          razao_social: string | null
          status: string | null
          submission_date: string | null
          submission_id: string | null
          total_dependents: number | null
          total_holders: number | null
          uf: string | null
          validity_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pme_grace_periods_previous_operator_id_fkey"
            columns: ["previous_operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      view_kanban_cards: {
        Row: {
          board_id: string | null
          board_type: string | null
          broker_id: number | null
          card_id: string | null
          company_name: string | null
          created_at: string | null
          due_date: string | null
          has_comments: boolean | null
          has_documents: boolean | null
          has_warnings: boolean | null
          lives: number | null
          modality: string | null
          observacoes: string | null
          operator: string | null
          plan_name: string | null
          position: number | null
          stage_id: string | null
          submission_id: string | null
          submission_status: string | null
          updated_at: string | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_cards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "kanban_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submission_summary"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "kanban_cards_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pme_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pme_submissions_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      view_kanban_cards_dependents: {
        Row: {
          card_id: string | null
          dependent_birth_date: string | null
          dependent_cpf: string | null
          dependent_id: string | null
          dependent_name: string | null
          dependent_relationship: string | null
          holder_id: string | null
        }
        Relationships: []
      }
      view_kanban_cards_holders: {
        Row: {
          card_id: string | null
          holder_birth_date: string | null
          holder_cpf: string | null
          holder_email: string | null
          holder_id: string | null
          holder_name: string | null
          holder_phone: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_minimal_proposal: {
        Args: {
          p_board_id: string
          p_broker_id: number
          p_operator_id: number
          p_plan_name: string
          p_modality: string
          p_cnpj: string
          p_razao_social: string
          p_responsavel_nome: string
          p_responsavel_email: string
          p_responsavel_telefone: string
          p_lives: number
          p_value: number
          p_observacoes: string
        }
        Returns: string
      }
      get_kanban_cards_with_operator_logo: {
        Args: { p_board_id: string }
        Returns: {
          id: string
          created_at: string
          company_name: string
          value: number
          due_date: string
          lives: number
          board_id: string
          stage_id: string
          operator_id: number
          created_by: string
          position: number
          contact_email: string
          board_type: string
          updated_at: string
          has_documents: boolean
          has_comments: boolean
          has_warnings: boolean
          stage_title: string
          operator_name: string
          operator_logo_url: string
        }[]
      }
      get_proposal_details: {
        Args: { p_submission_id: string }
        Returns: Json
      }
      get_full_proposal_data: {
        Args: { p_submission_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      update_proposal_details: {
        Args: { p_submission_id: string; p_form_data: Json }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "admin" | "gestor" | "corretor" | "atendente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "gestor", "corretor", "atendente"],
    },
  },
} as const

// Adicionado para tipagens de Kanban Comments
import { z } from 'zod';

// Tipagem para o comentário buscado do Supabase, incluindo informações do perfil do autor
export interface KanbanCommentWithProfile {
  id: string;
  card_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null; 
}

// Schema Zod para validação do formulário de novo comentário
export const kanbanCommentSchema = z.object({
  content: z.string().min(1, { message: 'O comentário não pode estar vazio.' }),
});

// Tipo inferido a partir do schema Zod para os valores do formulário
export type KanbanCommentFormValues = z.infer<typeof kanbanCommentSchema>;
