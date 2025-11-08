import { config } from 'dotenv'
config({ path: '.env' })

const API_BASE = 'http://localhost:3000'

async function testX402API() {
  console.log('Testing x402 Payment API...\n')

  console.log('Test 1: Fetching creator info for x402 tipping...')
  const infoResponse = await fetch(`${API_BASE}/api/x402/tip/alice`)

  if (infoResponse.ok) {
    const infoData = await infoResponse.json()
    console.log('[PASS] Creator info retrieved')
    console.log('       Creator:', infoData.creator.name)
    console.log('       Payment endpoint:', infoData.payment.endpoint)
    console.log('       Default amount:', infoData.payment.default_amount)
    console.log('       Networks:', infoData.payment.supported_networks.join(', '))
  } else {
    console.log('[FAIL] Failed to fetch creator info:', infoResponse.status)
  }

  console.log('\nTest 2: Attempting to access payment endpoint without payment...')
  const noPaymentResponse = await fetch(`${API_BASE}/api/x402/tip/alice/pay`)

  if (noPaymentResponse.status === 402) {
    console.log('[PASS] Correctly returned 402 Payment Required')
    const paymentDetails = await noPaymentResponse.json()
    console.log('       Payment details:', JSON.stringify(paymentDetails, null, 2))
  } else {
    console.log('[FAIL] Expected 402 status, got:', noPaymentResponse.status)
  }

  console.log('\nTest 3: Testing info endpoint for non-existent creator...')
  const notFoundResponse = await fetch(`${API_BASE}/api/x402/tip/nonexistent`)

  if (notFoundResponse.status === 404) {
    console.log('[PASS] Correctly returned 404 for non-existent creator')
  } else {
    console.log('[FAIL] Expected 404 status, got:', notFoundResponse.status)
  }

  console.log('\nx402 API tests complete!')
}

testX402API().catch(console.error)
