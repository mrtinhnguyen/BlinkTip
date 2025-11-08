import { config } from 'dotenv'
config({ path: '.env' })

const API_BASE = 'http://localhost:3000'

async function testCreatorAPI() {
  console.log('Testing Creator API...\n')

  // Test 1: Create a creator
  console.log('Test 1: Creating a creator...')
  const createResponse = await fetch(`${API_BASE}/api/creators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: 'alice',
      wallet_address: 'AliceWallet1234567890',
      name: 'Alice Creator',
      bio: 'Crypto content creator',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'
    })
  })

  const createData = await createResponse.json()
  if (createResponse.ok) {
    console.log('[PASS] Creator created:', createData.creator.slug)
    console.log('       Tip link:', createData.tip_link)
  } else {
    console.log('[FAIL] Failed:', createData.error)
  }

  // Test 2: Try duplicate slug
  console.log('\nTest 2: Testing duplicate slug...')
  const dupResponse = await fetch(`${API_BASE}/api/creators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: 'alice',
      wallet_address: 'DifferentWallet123',
      name: 'Another Alice'
    })
  })

  const dupData = await dupResponse.json()
  if (dupResponse.status === 409) {
    console.log('[PASS] Correctly rejected duplicate:', dupData.error)
  } else {
    console.log('[FAIL] Should have rejected duplicate')
  }

  // Test 3: Get creator by slug
  console.log('\nTest 3: Fetching creator by slug...')
  const getResponse = await fetch(`${API_BASE}/api/creators?slug=alice`)
  const getData = await getResponse.json()

  if (getResponse.ok && getData.creator) {
    console.log('[PASS] Found creator:', getData.creator.name)
  } else {
    console.log('[FAIL] Failed to fetch creator')
  }

  // Test 4: List all creators
  console.log('\nTest 4: Listing all creators...')
  const listResponse = await fetch(`${API_BASE}/api/creators`)
  const listData = await listResponse.json()

  if (listResponse.ok) {
    console.log(`[PASS] Found ${listData.creators.length} creators`)
  } else {
    console.log('[FAIL] Failed to list creators')
  }

  console.log('\nAPI tests complete!')
}

testCreatorAPI().catch(console.error)
