import { NextResponse } from 'next/server'
import { ACTIONS_CORS_HEADERS } from '@solana/actions'

export async function GET() {
  const payload = {
    rules: [
      {
        pathPattern: '/tip/*',
        apiPath: '/api/actions/tip/*',
      },
      {
        pathPattern: '/api/actions/**',
        apiPath: '/api/actions/**',
      },
    ],
  }

  return NextResponse.json(payload, { headers: ACTIONS_CORS_HEADERS })
}

export async function OPTIONS() {
  return new Response(null, { headers: ACTIONS_CORS_HEADERS })
}
