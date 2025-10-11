/**
 * Supabase Database Types
 * 
 * Types generados automáticamente desde el schema de Supabase.
 * Para regenerar: npx supabase gen types typescript --local > lib/supabase/types.ts
 * 
 * @module supabase/types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          password_hash: string
          name: string
          role: 'admin' | 'staff' | 'manager'
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          password_hash: string
          name: string
          role: 'admin' | 'staff' | 'manager'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          password_hash?: string
          name?: string
          role?: 'admin' | 'staff' | 'manager'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tables: {
        Row: {
          id: string
          tenant_id: string
          number: number
          zone: string | null
          capacity: number
          status: 'libre' | 'ocupada' | 'reservada' | 'pedido-en-curso' | 'cuenta-pedida' | 'en-limpieza'
          position: Json | null
          qrcode_url: string | null
          qr_token: string | null
          qr_expires_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          number: number
          zone?: string | null
          capacity?: number
          status?: 'libre' | 'ocupada' | 'reservada' | 'pedido-en-curso' | 'cuenta-pedida' | 'en-limpieza'
          position?: Json | null
          qrcode_url?: string | null
          qr_token?: string | null
          qr_expires_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          number?: number
          zone?: string | null
          capacity?: number
          status?: 'libre' | 'ocupada' | 'reservada' | 'pedido-en-curso' | 'cuenta-pedida' | 'en-limpieza'
          position?: Json | null
          qrcode_url?: string | null
          qr_token?: string | null
          qr_expires_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      menu_categories: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          sort_order: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          sort_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          sort_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          tenant_id: string
          category_id: string
          name: string
          description: string
          price_cents: number
          available: boolean
          image_url: string | null
          tags: string[]
          allergens: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          category_id: string
          name: string
          description: string
          price_cents: number
          available?: boolean
          image_url?: string | null
          tags?: string[]
          allergens?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          category_id?: string
          name?: string
          description?: string
          price_cents?: number
          available?: boolean
          image_url?: string | null
          tags?: string[]
          allergens?: Json
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          tenant_id: string
          table_id: string | null
          order_number: string
          status: 'abierto' | 'en-preparacion' | 'listo' | 'servido' | 'pagado' | 'cancelado'
          payment_status: 'pendiente' | 'parcial' | 'pagado' | 'reembolsado'
          source: 'staff' | 'qr' | 'kiosk'
          subtotal_cents: number
          discount_total_cents: number
          tax_total_cents: number
          tip_cents: number
          service_charge_cents: number
          total_cents: number
          notes: string | null
          customer_data: Json | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          table_id?: string | null
          order_number: string
          status?: 'abierto' | 'en-preparacion' | 'listo' | 'servido' | 'pagado' | 'cancelado'
          payment_status?: 'pendiente' | 'parcial' | 'pagado' | 'reembolsado'
          source?: 'staff' | 'qr' | 'kiosk'
          subtotal_cents: number
          discount_total_cents?: number
          tax_total_cents: number
          tip_cents?: number
          service_charge_cents?: number
          total_cents: number
          notes?: string | null
          customer_data?: Json | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          table_id?: string | null
          order_number?: string
          status?: 'abierto' | 'en-preparacion' | 'listo' | 'servido' | 'pagado' | 'cancelado'
          payment_status?: 'pendiente' | 'parcial' | 'pagado' | 'reembolsado'
          source?: 'staff' | 'qr' | 'kiosk'
          subtotal_cents?: number
          discount_total_cents?: number
          tax_total_cents?: number
          tip_cents?: number
          service_charge_cents?: number
          total_cents?: number
          notes?: string | null
          customer_data?: Json | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          tenant_id: string
          order_id: string
          table_id: string | null
          payment_number: string
          provider: 'mercadopago' | 'stripe' | 'cash'
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'expired'
          method: string | null
          amount_cents: number
          currency: string
          external_id: string | null
          checkout_url: string | null
          expires_at: string | null
          completed_at: string | null
          failure_reason: string | null
          failure_code: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          order_id: string
          table_id?: string | null
          payment_number: string
          provider: 'mercadopago' | 'stripe' | 'cash'
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'expired'
          method?: string | null
          amount_cents: number
          currency?: string
          external_id?: string | null
          checkout_url?: string | null
          expires_at?: string | null
          completed_at?: string | null
          failure_reason?: string | null
          failure_code?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          order_id?: string
          table_id?: string | null
          payment_number?: string
          provider?: 'mercadopago' | 'stripe' | 'cash'
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'expired'
          method?: string | null
          amount_cents?: number
          currency?: string
          external_id?: string | null
          checkout_url?: string | null
          expires_at?: string | null
          completed_at?: string | null
          failure_reason?: string | null
          failure_code?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      qr_sessions: {
        Row: {
          id: string
          tenant_id: string
          table_id: string
          token: string
          status: 'active' | 'completed' | 'expired' | 'error'
          ip_address: string | null
          user_agent: string | null
          scanned_at: string
          last_activity_at: string
          expires_at: string
          completed_at: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          table_id: string
          token: string
          status?: 'active' | 'completed' | 'expired' | 'error'
          ip_address?: string | null
          user_agent?: string | null
          scanned_at?: string
          last_activity_at?: string
          expires_at: string
          completed_at?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          table_id?: string
          token?: string
          status?: 'active' | 'completed' | 'expired' | 'error'
          ip_address?: string | null
          user_agent?: string | null
          scanned_at?: string
          last_activity_at?: string
          expires_at?: string
          completed_at?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
