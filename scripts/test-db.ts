import { supabase } from '../lib/supabase'

async function testDatabaseConnection() {
  console.log('Testing Supabase connection...\n')

  try {
    const { data: creators, error: creatorsError } = await supabase
      .from('creators')
      .select('*')
      .limit(10)

    if (creatorsError) {
      console.error('[ERROR] Error fetching creators:', creatorsError)
    } else {
      console.log(`[OK] Creators table: ${creators?.length || 0} rows`)
    }

    const { data: tips, error: tipsError } = await supabase
      .from('tips')
      .select('*')
      .limit(10)

    if (tipsError) {
      console.error('[ERROR] Error fetching tips:', tipsError)
    } else {
      console.log(`[OK] Tips table: ${tips?.length || 0} rows`)
    }

    const { data: actions, error: actionsError } = await supabase
      .from('agent_actions')
      .select('*')
      .limit(10)

    if (actionsError) {
      console.error('[ERROR] Error fetching agent actions:', actionsError)
    } else {
      console.log(`[OK] Agent actions table: ${actions?.length || 0} rows`)
    }

    const { data: stats, error: statsError } = await supabase
      .from('creator_stats')
      .select('*')
      .limit(10)

    if (statsError) {
      console.error('[ERROR] Error fetching creator stats:', statsError)
    } else {
      console.log(`[OK] Creator stats view: ${stats?.length || 0} rows`)
    }

    console.log('\nDatabase connection successful!')
  } catch (error) {
    console.error('[ERROR] Unexpected error:', error)
    process.exit(1)
  }
}

testDatabaseConnection()
