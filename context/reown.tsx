'use client'

import { wagmiAdapter, solanaAdapter, projectId, evmNetworks, solanaNetworks } from '@/config/reown'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { base } from '@reown/appkit/networks'
import { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

const queryClient = new QueryClient()

const metadata = {
  name: 'LinkTip',
  description: 'Universal tip link for creators. Get tipped by humans and AI agents.',
  url: 'https://linktip.xyz',
  icons: ['https://linktip.xyz/icon.png']
}

// Create AppKit for wallet creation (email, social, external wallets)
// Twitter verification handled separately via NextAuth for profile data
if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not set')
}

createAppKit({
  adapters: [wagmiAdapter, solanaAdapter],
  projectId,
  networks: [...evmNetworks, ...solanaNetworks] as any, // Combined EVM (Base, Celo) and Solana networks
  defaultNetwork: base,
  metadata,
  features: {
    analytics: true,
    email: true, // Enable email embedded wallets
    socials: ['google', 'github', 'discord', 'apple'], // Social logins (X handled via NextAuth)
    emailShowWallets: true,
  },
  allWallets: 'SHOW',
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#8B5CF6',
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
