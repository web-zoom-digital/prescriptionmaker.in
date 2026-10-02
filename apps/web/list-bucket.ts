import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabase.storage.from('doctor-assets').list('')
  if (error) console.error(error)
  else console.log("FILES IN ROOT:", data)
  
  // also try listing inside the user's folder
  // wait, we don't know the exact user id, so we just list the root folders
}
main()
