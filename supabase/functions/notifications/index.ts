import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'admin@skilxpress.com'

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
        const payload = await req.json()

        const { type, table, record, old_record } = payload
        console.log(`Notification trigger: ${type} on ${table}`, record.id)

        let notifications: { to: string, subject: string, html: string }[] = []

        if (table === 'bookings') {
            if (type === 'INSERT') {
                // New Booking -> Notify Provider
                const { data: provider } = await supabase
                    .from('profiles')
                    .select('email, full_name')
                    .eq('id', record.provider_id)
                    .single()

                const { data: client } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', record.client_id)
                    .single()

                if (provider && client) {
                    notifications.push({
                        to: provider.email,
                        subject: 'New Booking Request - SkilXress',
                        html: `
                            <h1>New Booking Request</h1>
                            <p>Hi ${provider.full_name},</p>
                            <p>You have a new booking request from <strong>${client.full_name}</strong>.</p>
                            <p><strong>Date:</strong> ${record.preferred_date}</p>
                            <p><strong>Time:</strong> ${record.preferred_time}</p>
                            <p>Log in to your dashboard to confirm or manage this booking.</p>
                            <a href="https://skilxpress.com/dashboard">Go to Dashboard</a>
                        `
                    })
                }
            } else if (type === 'UPDATE' && record.status !== old_record.status) {
                // Status Change -> Notify Client
                const { data: client } = await supabase
                    .from('profiles')
                    .select('email, full_name')
                    .eq('id', record.client_id)
                    .single()

                if (client) {
                    notifications.push({
                        to: client.email,
                        subject: `Booking Status Updated: ${record.status}`,
                        html: `
                            <h1>Booking Update</h1>
                            <p>Hi ${client.full_name},</p>
                            <p>Your booking status has been updated to: <strong>${record.status}</strong>.</p>
                            <p>Log in to see more details.</p>
                            <a href="https://skilxpress.com/bookings">View My Bookings</a>
                        `
                    })
                }
            }
        } else if (table === 'skill_videos' && type === 'INSERT') {
            // New Video -> Notify Followers
            const { data: provider } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', record.provider_id)
                .single()

            // Fetch followers
            const { data: followers } = await supabase
                .from('followers')
                .select('follower_id, profiles(email, full_name)')
                .eq('following_id', record.provider_id)

            if (provider && followers) {
                // 1. Notify Admin
                notifications.push({
                    to: ADMIN_EMAIL,
                    subject: `New Video for Approval: ${record.title}`,
                    html: `
                        <h1>New Video Uploaded</h1>
                        <p>A new video has been uploaded by <strong>${provider.full_name}</strong> and requires moderation.</p>
                        <p><strong>Title:</strong> ${record.title}</p>
                        <p><strong>Description:</strong> ${record.description || 'No description provided'}</p>
                        <p>Please log in to the admin panel to approve or reject this video.</p>
                        <a href="https://skilxpress.com/admin/moderation">Go to Moderation Panel</a>
                    `
                })

                // 2. Notify Followers
                followers.forEach((f: any) => {
                    const followerEmail = f.profiles?.email
                    const followerName = f.profiles?.full_name
                    if (followerEmail) {
                        notifications.push({
                            to: followerEmail,
                            subject: `${provider.full_name} uploaded a new video!`,
                            html: `
                                <h1>New Video Alert</h1>
                                <p>Hi ${followerName || 'there'},</p>
                                <p><strong>${provider.full_name}</strong> just uploaded a new skill video: <strong>${record.title}</strong>.</p>
                                <p>Watch it now on SkilXress!</p>
                                <a href="https://skilxpress.com/video/${record.id}">Watch Video</a>
                            `
                        })
                    }
                })
            }
        }

        // Send all emails
        const results = await Promise.all(notifications.map(async (n) => {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: 'SkilXress <updates@skilxpress.com>',
                    to: n.to,
                    subject: n.subject,
                    html: n.html,
                }),
            })
            return res.json()
        }))

        return new Response(JSON.stringify({ success: true, results }), {
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
