-- SQL for setting up Database Webhooks (or triggers) for notifications
-- Note: Replace YOUR_EDGE_FUNCTION_URL and YOUR_SERVICE_ROLE_KEY if running manually

-- Function to call the edge function
CREATE OR REPLACE FUNCTION notify_api_on_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  );

  -- In Supabase dashboard, you would usually just click "Create Webhook"
  -- But if you want to do it via SQL using the http extension:
  -- PERFORM http_post('YOUR_EDGE_FUNCTION_URL', payload::text, 'application/json');
  
  -- For now, this is just a reminder of the logic. 
  -- We recommend using the Supabase Dashboard > Database > Webhooks UI for stability.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/*
Triggers to set up in the dashboard:

1. New Booking Notification
   Table: bookings
   Events: INSERT
   URL: [Edge Function URL]/notifications
   
2. Booking Status Update Notification
   Table: bookings
   Events: UPDATE
   Columns: status
   URL: [Edge Function URL]/notifications

3. New Video Notification
   Table: skill_videos
   Events: INSERT
   URL: [Edge Function URL]/notifications
*/
