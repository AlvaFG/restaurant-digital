/**
 * Supabase Edge Function: send-push
 * Sends Web Push notifications to subscribed users
 * 
 * Environment variables required:
 * - VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY
 * - VAPID_SUBJECT (email or URL)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: Record<string, unknown>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

interface SendPushRequest {
  tenantId: string
  notificationType: 'new_order' | 'order_status' | 'kitchen_alert' | 'table_alert' | 'payment'
  payload: PushNotificationPayload
  userIds?: string[] // Optional: send to specific users only
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse body
    const { tenantId, notificationType, payload, userIds }: SendPushRequest = await req.json()

    if (!tenantId || !notificationType || !payload) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tenantId, notificationType, payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Configure web-push with VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@restaurant.com'

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys not configured')
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    // Get recipients
    let recipients: Array<{ user_id: string; endpoint: string; keys: any }>

    if (userIds && userIds.length > 0) {
      // Send to specific users
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('user_id, endpoint, keys')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .in('user_id', userIds)

      if (error) throw error
      recipients = data || []
    } else {
      // Use function to get recipients based on preferences
      const { data, error } = await supabase.rpc('get_notification_recipients', {
        p_tenant_id: tenantId,
        p_notification_type: notificationType,
      })

      if (error) throw error
      recipients = data || []
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No recipients found',
          sent: 0,
          failed: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send notifications
    const results = await Promise.allSettled(
      recipients.map(async (recipient) => {
        try {
          const subscription = {
            endpoint: recipient.endpoint,
            keys: recipient.keys,
          }

          await webpush.sendNotification(
            subscription,
            JSON.stringify(payload),
            {
              TTL: 60 * 60 * 24, // 24 hours
            }
          )

          // Update last_used_at
          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('endpoint', recipient.endpoint)

          return { success: true, userId: recipient.user_id }
        } catch (error: any) {
          console.error(`Failed to send to ${recipient.user_id}:`, error)

          // If subscription expired or invalid, mark as inactive
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('endpoint', recipient.endpoint)
          }

          return { success: false, userId: recipient.user_id, error: error.message }
        }
      })
    )

    // Count results
    const sent = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
    const failed = results.filter((r) => r.status === 'rejected' || !r.value.success).length

    console.log(`✅ Push notifications sent: ${sent} successful, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        results: results.map((r) => r.status === 'fulfilled' ? r.value : { success: false }),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in send-push function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
