'use client'

import { wagmiAdapter, solanaAdapter, projectId, evmNetworks, solanaNetworks } from '@/config/reown'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { base, solana } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

const queryClient = new QueryClient()

const metadata = {
  name: 'BlinkTip',
  description: 'Universal tip link for creators. Get tipped by humans and AI agents.',
  url: 'https://blink-tip.vercel.app',
  icons: ['https://blink-tip.vercel.app/icon.png']
}

// Create AppKit instance with Twitter-First authentication
// This forces Twitter as the identity anchor to prevent wallet fragmentation
// User's Twitter account creates a stable embedded wallet that works on ALL chains
if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not set')
}

createAppKit({
  adapters: [wagmiAdapter, solanaAdapter],
  projectId,
  networks: [...evmNetworks, ...solanaNetworks], // Support both Solana AND EVM (Base, Celo)
  defaultNetwork: solana,
  metadata,
  features: {
    analytics: true,
    email: false, // Disable email to force Twitter login
    socials: ['x'], // ONLY Twitter/X - creates stable embedded wallet per Twitter account
    emailShowWallets: false, // Hide wallet list initially - forces social auth first
  },
  allWallets: 'HIDE', // Hide external wallets initially - Twitter login creates embedded wallet
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#8B5CF6', // Purple accent matching BlinkTip brand
  }
})

export function ReownProvider({
  children,
  cookies
}: {
  children: ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
