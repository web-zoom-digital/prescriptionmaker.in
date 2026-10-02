import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const BUCKET = 'doctor-assets'
  const { data, error } = await supabase.storage.getBucket(BUCKET)
  
  if (error) {
    console.error('Error fetching bucket:', error)
    if (error.message.includes('not found')) {
      console.log('Bucket not found, creating it as public...')
      const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true })
      if (createError) console.error('Error creating bucket:', createError)
      else console.log('Created bucket successfully.')
    }
    return
  }

  if (!data.public) {
    console.log('Bucket is not public. Updating to public...')
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET, { public: true })
    if (updateError) {
      console.error('Failed to update bucket:', updateError)
    } else {
      console.log('Bucket is now public!')
    }
  } else {
    console.log('Bucket is already public.')
  }
}

main()
