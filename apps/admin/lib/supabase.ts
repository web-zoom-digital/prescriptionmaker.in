import { createClient } from '@supabase/supabase-js'

// This client uses the Service Role Key — for admin backend operations only.
// NEVER expose service role key to the browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
