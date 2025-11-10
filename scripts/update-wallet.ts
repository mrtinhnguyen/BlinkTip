import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateWallet() {
  console.log('Updating wallet address for alice...')

  const { data, error } = await supabase
    .from('creators')
    .update({ wallet_address: '2ToRtjmTrsGhW2pjjMK4grUAnG3D3ppuQCUG5sRU9o5s' })
    .eq('slug', 'alice')
    .select()

  if (error) {
    console.error('Error updating wallet:', error)
    process.exit(1)
  }

  console.log('Successfully updated wallet address:', data)
}

updateWallet()
