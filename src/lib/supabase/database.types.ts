
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "guesses": {
                  Row: {
                    "ball": number,"created_at": string,"guess": string | null,"id": number,"match_id": string,"seat": number,"strike": number,"timed_out": boolean,"turn_no": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ball"?: number,"created_at"?: string,"guess"?: string | null,"id"?: never,"match_id": string,"seat": number,"strike"?: number,"timed_out"?: boolean,"turn_no": number,"user_id": string
                  }
                  Update: {
                    "ball"?: number,"created_at"?: string,"guess"?: string | null,"id"?: never,"match_id"?: string,"seat"?: number,"strike"?: number,"timed_out"?: boolean,"turn_no"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "guesses_match_id_fkey"
      columns: ["match_id"]
isOneToOne: false
      referencedRelation: "matches"
      referencedColumns: ["id"]
    }
                  ]
                },"match_players": {
                  Row: {
                    "consecutive_timeouts": number,"joined_at": string,"match_id": string,"ready": boolean,"seat": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "consecutive_timeouts"?: number,"joined_at"?: string,"match_id": string,"ready"?: boolean,"seat": number,"user_id": string
                  }
                  Update: {
                    "consecutive_timeouts"?: number,"joined_at"?: string,"match_id"?: string,"ready"?: boolean,"seat"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "match_players_match_id_fkey"
      columns: ["match_id"]
isOneToOne: false
      referencedRelation: "matches"
      referencedColumns: ["id"]
    }
                  ]
                },"match_secrets": {
                  Row: {
                    "match_id": string,"seat": number,"secret": string
                  }
                  ComputedFields: never
                  Insert: {
                    "match_id": string,"seat": number,"secret": string
                  }
                  Update: {
                    "match_id"?: string,"seat"?: number,"secret"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "match_secrets_match_id_fkey"
      columns: ["match_id"]
isOneToOne: false
      referencedRelation: "matches"
      referencedColumns: ["id"]
    }
                  ]
                },"matches": {
                  Row: {
                    "created_at": string,"current_seat": number | null,"end_reason": Database["public"]['Enums']["match_end_reason"] | null,"expires_at": string | null,"finished_at": string | null,"first_seat": number | null,"host_id": string | null,"id": string,"invite_code": string | null,"last_chance": boolean,"max_attempts": number,"mode": Database["public"]['Enums']["match_mode"],"setting_deadline": string | null,"started_at": string | null,"status": Database["public"]['Enums']["match_status"],"turn_seconds": number,"turn_started_at": string | null,"winner_seat": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"current_seat"?: number | null,"end_reason"?: Database["public"]['Enums']["match_end_reason"] | null,"expires_at"?: string | null,"finished_at"?: string | null,"first_seat"?: number | null,"host_id"?: string | null,"id"?: string,"invite_code"?: string | null,"last_chance"?: boolean,"max_attempts"?: number,"mode": Database["public"]['Enums']["match_mode"],"setting_deadline"?: string | null,"started_at"?: string | null,"status": Database["public"]['Enums']["match_status"],"turn_seconds"?: number,"turn_started_at"?: string | null,"winner_seat"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"current_seat"?: number | null,"end_reason"?: Database["public"]['Enums']["match_end_reason"] | null,"expires_at"?: string | null,"finished_at"?: string | null,"first_seat"?: number | null,"host_id"?: string | null,"id"?: string,"invite_code"?: string | null,"last_chance"?: boolean,"max_attempts"?: number,"mode"?: Database["public"]['Enums']["match_mode"],"setting_deadline"?: string | null,"started_at"?: string | null,"status"?: Database["public"]['Enums']["match_status"],"turn_seconds"?: number,"turn_started_at"?: string | null,"winner_seat"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"matchmaking_queue": {
                  Row: {
                    "enqueued_at": string,"last_seen_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "enqueued_at"?: string,"last_seen_at"?: string,"user_id": string
                  }
                  Update: {
                    "enqueued_at"?: string,"last_seen_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "avatar": string,"created_at": string,"id": string,"nickname": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar"?: string,"created_at"?: string,"id": string,"nickname": string,"updated_at"?: string
                  }
                  Update: {
                    "avatar"?: string,"created_at"?: string,"id"?: string,"nickname"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"solo_games": {
                  Row: {
                    "attempts": number,"created_at": string,"id": number,"user_id": string,"won": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "attempts": number,"created_at"?: string,"id"?: never,"user_id": string,"won": boolean
                  }
                  Update: {
                    "attempts"?: number,"created_at"?: string,"id"?: never,"user_id"?: string,"won"?: boolean
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "cancel_matchmaking":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"claim_timeout":
{ Args: { "p_match_id": string }; Returns: boolean
                           },
"create_invite_match":
{ Args: Record<PropertyKey, never>; Returns: {
              "invite_code": string,"match_id": string
            }[]
                           },
"enqueue_random_match":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"get_active_match":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"get_player_stats":
{ Args: { "p_user_id"?: string }; Returns: {
              "online_draws": number,"online_losses": number,"online_played": number,"online_wins": number,"solo_best_attempts": number,"solo_played": number,"solo_wins": number
            }[]
                           },
"join_invite_match":
{ Args: { "p_code": string }; Returns: string
                           },
"leave_match":
{ Args: { "p_match_id": string }; Returns: undefined
                           },
"record_solo_game":
{ Args: { "p_attempts": number,"p_won": boolean }; Returns: undefined
                           },
"set_secret":
{ Args: { "p_match_id": string,"p_secret": string }; Returns: undefined
                           },
"submit_guess":
{ Args: { "p_guess": string,"p_match_id": string }; Returns: {
              "ball": number,"strike": number,"timed_out": boolean
            }[]
                           }
          }
          Enums: {
            "match_end_reason": "solved"|"both_solved"|"max_attempts"|"forfeit"|"timeout_forfeit","match_mode": "invite"|"random","match_status": "waiting"|"setting"|"playing"|"finished"|"expired"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "match_end_reason": ["solved", "both_solved", "max_attempts", "forfeit", "timeout_forfeit"],"match_mode": ["invite", "random"],"match_status": ["waiting", "setting", "playing", "finished", "expired"]
          }
        }
} as const
