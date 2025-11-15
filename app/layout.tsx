import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SolanaWalletProvider } from './providers/SolanaWalletProvider'
import { ThirdwebProvider } from './providers/ThirdwebProvider'
import { AuthProvider } from './providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BlinkTip - Universal Micro-Tip Links',
  description: 'Accept tips from humans via Solana Actions and AI agents via x402 protocol. Multi-chain support for Solana and Base.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ThirdwebProvider>
            <SolanaWalletProvider>{children}</SolanaWalletProvider>
          </ThirdwebProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
