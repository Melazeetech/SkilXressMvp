import { supabase } from './supabase';

export interface EmailPayload {
    to: string[];
    subject: string;
    html: string;
}

export const emailService = {
    /**
     * Broadcast sending via Supabase Edge Function (Proxy to Resend)
     */
    async sendBroadcast(recipients: string[], subject: string, bodyHtml: string) {
        try {
            const { data, error } = await supabase.functions.invoke('send-broadcast', {
                body: {
                    recipients,
                    subject,
                    html: bodyHtml
                }
            });

            if (error) {
                throw new Error(error.message || 'Failed to trigger broadcast function');
            }

            return data;
        } catch (error) {
            console.error('Email service invocation error:', error);
            throw error;
        }
    }
};
