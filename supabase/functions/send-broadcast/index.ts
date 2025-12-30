import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { recipients, subject, html } = await req.json()
        console.log(`Email broadcast started: Sending "${subject}" to ${recipients?.length} recipients.`);

        if (!recipients || !subject || !html) {
            throw new Error('Missing required fields: recipients, subject, html')
        }

        // We send emails INDIVIDUALLY. 
        // 1. Better privacy (users don't see each other in 'To')
        // 2. Better tracking (Resend tracks each delivery)
        // 3. Easier to debug bounces

        const results = []
        for (const email of recipients) {
            console.log(`Sending to: ${email}`);

            try {
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: 'SkilXress <updates@skilxpress.com>',
                        to: email, // Individual recipient
                        subject: subject,
                        html: html,
                    }),
                })

                const data = await res.json()
                results.push({ email, ...data })

                if (!res.ok) {
                    console.error(`Error sending to ${email}:`, data);
                }
            } catch (err) {
                console.error(`Failed to dispatch for ${email}:`, err.message);
                results.push({ email, error: err.message })
            }
        }

        console.log(`Broadcast completed. Summary: ${results.length} attempts.`);

        return new Response(
            JSON.stringify({ success: true, results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        console.error('Broadcast Function Error:', error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
