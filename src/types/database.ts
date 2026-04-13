export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      gift_claim_audit: {
        Row: {
          attempted_at: string
          attempted_by_user_id: string | null
          gift_id: string | null
          id: string
          result: string
        }
        Insert: {
          attempted_at?: string
          attempted_by_user_id?: string | null
          gift_id?: string | null
          id?: string
          result: string
        }
        Update: {
          attempted_at?: string
          attempted_by_user_id?: string | null
          gift_id?: string | null
          id?: string
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: 'gift_claim_audit_gift_id_fkey'
            columns: ['gift_id']
            isOneToOne: false
            referencedRelation: 'gifts'
            referencedColumns: ['id']
          },
        ]
      }
      gifts: {
        Row: {
          amount: number
          cancelled_at: string | null
          claim_attempts: number
          claim_code: string
          claimed_at: string | null
          created_at: string
          expires_at: string
          from_user_id: string
          grail_tx_reference: string | null
          id: string
          message: string | null
          recipient_user_id: string | null
          sender_notified: boolean
          status: string
          template_type: string | null
          to_piggy_id: string
        }
        Insert: {
          amount: number
          cancelled_at?: string | null
          claim_attempts?: number
          claim_code: string
          claimed_at?: string | null
          created_at?: string
          expires_at: string
          from_user_id: string
          grail_tx_reference?: string | null
          id?: string
          message?: string | null
          recipient_user_id?: string | null
          sender_notified?: boolean
          status?: string
          template_type?: string | null
          to_piggy_id: string
        }
        Update: {
          amount?: number
          cancelled_at?: string | null
          claim_attempts?: number
          claim_code?: string
          claimed_at?: string | null
          created_at?: string
          expires_at?: string
          from_user_id?: string
          grail_tx_reference?: string | null
          id?: string
          message?: string | null
          recipient_user_id?: string | null
          sender_notified?: boolean
          status?: string
          template_type?: string | null
          to_piggy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'gifts_to_piggy_id_fkey'
            columns: ['to_piggy_id']
            isOneToOne: false
            referencedRelation: 'piggies'
            referencedColumns: ['id']
          },
        ]
      }
      piggies: {
        Row: {
          avatar_url: string | null
          child_name: string
          created_at: string
          deleted_at: string | null
          id: string
          last_synced_at: string | null
          target_amount: number | null
          target_description: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          child_name: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_synced_at?: string | null
          target_amount?: number | null
          target_description?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          child_name?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_synced_at?: string | null
          target_amount?: number | null
          target_description?: string | null
          user_id?: string
        }
        Relationships: []
      }
      piggy_balances: {
        Row: {
          gold_amount: number
          grail_wallet_id: string | null
          last_updated: string
          piggy_id: string
        }
        Insert: {
          gold_amount?: number
          grail_wallet_id?: string | null
          last_updated?: string
          piggy_id: string
        }
        Update: {
          gold_amount?: number
          grail_wallet_id?: string | null
          last_updated?: string
          piggy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'piggy_balances_piggy_id_fkey'
            columns: ['piggy_id']
            isOneToOne: true
            referencedRelation: 'piggies'
            referencedColumns: ['id']
          },
        ]
      }
      price_cache: {
        Row: {
          cached_at: string
          data: Json
          id: string
        }
        Insert: {
          cached_at?: string
          data: Json
          id: string
        }
        Update: {
          cached_at?: string
          data?: Json
          id?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          id: string
          price_usd: number
          price_vnd: number
          recorded_at: string
        }
        Insert: {
          id?: string
          price_usd: number
          price_vnd: number
          recorded_at?: string
        }
        Update: {
          id?: string
          price_usd?: number
          price_vnd?: number
          recorded_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          error_message: string | null
          fee_amount: number | null
          gold_price_at_time: number | null
          grail_tx_reference: string | null
          id: string
          metadata: Json | null
          piggy_id: string | null
          status: string
          type: string
          usdc_amount: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          error_message?: string | null
          fee_amount?: number | null
          gold_price_at_time?: number | null
          grail_tx_reference?: string | null
          id?: string
          metadata?: Json | null
          piggy_id?: string | null
          status?: string
          type: string
          usdc_amount?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          error_message?: string | null
          fee_amount?: number | null
          gold_price_at_time?: number | null
          grail_tx_reference?: string | null
          id?: string
          metadata?: Json | null
          piggy_id?: string | null
          status?: string
          type?: string
          usdc_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_piggy_id_fkey'
            columns: ['piggy_id']
            isOneToOne: false
            referencedRelation: 'piggies'
            referencedColumns: ['id']
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          gold_balance: number
          grail_deposit_address: string | null
          grail_usdc_balance: number | null
          grail_user_id: string | null
          id: string
          notification_preferences: Json | null
          notification_token: string | null
          onboarding_completed: boolean | null
          solana_wallet_address: string | null
          avatar_url: string | null
          biometrics_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          gold_balance?: number
          grail_deposit_address?: string | null
          grail_usdc_balance?: number | null
          grail_user_id?: string | null
          id: string
          notification_preferences?: Json | null
          notification_token?: string | null
          onboarding_completed?: boolean | null
          solana_wallet_address?: string | null
          avatar_url?: string | null
          biometrics_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          gold_balance?: number
          grail_deposit_address?: string | null
          grail_usdc_balance?: number | null
          grail_user_id?: string | null
          id?: string
          notification_preferences?: Json | null
          notification_token?: string | null
          onboarding_completed?: boolean | null
          solana_wallet_address?: string | null
          avatar_url?: string | null
          biometrics_enabled?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_gold_to_piggy: {
        Args: { p_amount: number; p_piggy_id: string; p_user_id: string }
        Returns: undefined
      }
      increment_piggy_balance: {
        Args: { p_gold_amount: number; p_piggy_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ─── App-level convenience types ─────────────────────────────────────────────
// These extend the generated Supabase types with joins and app-specific shapes.

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Piggy = Database['public']['Tables']['piggies']['Row']
export type PiggyBalance = Database['public']['Tables']['piggy_balances']['Row']
export type Gift = Database['public']['Tables']['gifts']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type PriceCache = Database['public']['Tables']['price_cache']['Row']

/** Piggy with its balance joined (used in piggy list & detail screens) */
export type PiggyWithBalance = Piggy & {
  piggy_balances: PiggyBalance | null
}

/** Template types for gifts */
export type GiftTemplateType = 'tet' | 'sinhnhat' | 'cuoihoi' | 'thoinhoi'
