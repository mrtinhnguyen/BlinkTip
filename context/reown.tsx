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

// Create AppKit instance with BOTH Wagmi (EVM) and Solana adapters
createAppKit({
  adapters: [wagmiAdapter, solanaAdapter],
  projectId,
  networks: [...evmNetworks, ...solanaNetworks],
  defaultNetwork: solana, // Default to Solana since that's your primary chain
  metadata,
  features: {
    analytics: true, // Enable Reown analytics
    email: true, // Enable email login with embedded wallets
    socials: ['google', 'x', 'github', 'discord', 'apple'], // Enable social logins
    emailShowWallets: true, // Show wallet options on first screen
  },
  allWallets: 'SHOW', // Show all available wallets
  themeMode: 'light', // or 'dark' or 'auto'
  themeVariables: {
    // Customize to match your brand
    '--w3m-accent': '#8B5CF6', // Purple accent color
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
