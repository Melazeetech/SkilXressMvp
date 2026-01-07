import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // 1. Find unread messages older than 2 days for users who haven't been seen in 2 days
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

        // This query finds unread messages and the associated recipient profile
        const { data: unreadData, error: dbError } = await supabase
            .from('chat_messages')
            .select(`
                id,
                message,
                created_at,
                sender_id,
                booking_id,
                bookings (
                    client_id,
                    provider_id
                )
            `)
            .eq('is_read', false)
            .lt('created_at', twoDaysAgo)

        if (dbError) throw dbError

        // 2. Identify recipients and check their last_seen_at
        const recipientReminders = new Map<string, { email: string, name: string, count: number }>()

        for (const msg of unreadData) {
            const bookings = msg.bookings as any
            const recipientId = msg.sender_id === bookings.client_id ? bookings.provider_id : bookings.client_id

            if (!recipientReminders.has(recipientId)) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email, full_name, last_seen_at')
                    .eq('id', recipientId)
                    .single()

                if (profile && (!profile.last_seen_at || profile.last_seen_at < twoDaysAgo)) {
                    recipientReminders.set(recipientId, {
                        email: profile.email,
                        name: profile.full_name,
                        count: 1
                    })
                }
            } else {
                const data = recipientReminders.get(recipientId)!
                data.count++
            }
        }

        // 3. Send Summary Emails
        const results = []
        for (const [id, data] of recipientReminders.entries()) {
            console.log(`Sending chat reminder to ${data.email} (${data.count} messages)`);

            try {
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: 'SkilXress <updates@skilxpress.com>',
                        to: data.email,
                        subject: `You have ${data.count} unread messages on SkilXress`,
                        html: `
                            <h1>Unread Messages Reminder</h1>
                            <p>Hi ${data.name},</p>
                            <p>You have <strong>${data.count}</strong> unread messages waiting for you on SkilXress.</p>
                            <p>It's been a couple of days since your last visit. Log in now to respond to your clients or providers.</p>
                            <a href="https://skilxpress.com/chat">Go to Chat</a>
                        `
                    }),
                })
                results.push({ email: data.email, status: res.status })
            } catch (err) {
                results.push({ email: data.email, error: err.message })
            }
        }

        return new Response(JSON.stringify({ success: true, processed: results.length, details: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
