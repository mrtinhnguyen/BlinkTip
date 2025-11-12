'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { createX402Client } from 'x402-solana/client'

type Creator = {
  slug: string
  name: string
  bio: string
  avatar_url: string
  wallet_address: string
}

// Token options for tipping
const TOKENS = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mint
  CASH: 'CASHedBw9NfhsLBXq1WNVfueVznx255j8LLTScto3S6s', // Phantom CASH mint
}

const TIP_AMOUNTS = [0.01, 0.05, 0.1]

export default function TipPage() {
  const params = useParams()
  const slug = params.slug as string
  const wallet = useWallet()
  const { publicKey, signTransaction } = wallet

  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAmount, setSelectedAmount] = useState(0.01)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'CASH'>('USDC')
  const [tipping, setTipping] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCreator() {
      try {
        const response = await fetch(`/api/creators?slug=${slug}`)
        if (!response.ok) throw new Error('Creator not found')
        const data = await response.json()
        setCreator(data.creator)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load creator')
      } finally {
        setLoading(false)
      }
    }
    fetchCreator()
  }, [slug])

  const handleTip = async () => {
    if (!publicKey || !signTransaction || !creator) return

    setTipping(true)
    setError(null)
    setTxSignature(null)

    try {
      const amount = customAmount ? parseFloat(customAmount) : selectedAmount

      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid tip amount')
      }

      // Create x402 client with Solana wallet adapter
      const x402Client = createX402Client({
        wallet: {
          address: publicKey.toBase58(),
          signTransaction: signTransaction,
        },
        network: process.env.NEXT_PUBLIC_NETWORK === 'solana-mainnet-beta' ? 'solana' : 'solana-devnet',
      })

      console.log('[x402] Starting tip flow...', { amount, creator: slug, token: selectedToken })

      // Make x402 payment request
      // The client automatically handles:
      // 1. GET request to endpoint
      // 2. Receives 402 Payment Required
      // 3. Creates payment transaction
      // 4. Signs transaction with wallet
      // 5. Sends X-PAYMENT header
      // 6. Returns success response
      const response = await x402Client.fetch(
        `/api/x402/tip/${slug}/pay-solana?amount=${amount}&token=${selectedToken}`,
        {
          method: 'GET',
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Payment failed')
      }

      const result = await response.json()
      console.log('[x402] Payment successful:', result)

      // Extract transaction signature from response
      if (result.tip?.transaction) {
        setTxSignature(result.tip.transaction)
      }

      // Show success message
      setError(null)
    } catch (err) {
      console.error('[x402] Tip error:', err)
      setError(err instanceof Error ? err.message : 'Failed to send tip')
    } finally {
      setTipping(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">💰</div>
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading creator...</div>
        </div>
      </div>
    )
  }

  if (error && !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-5xl mb-4">😕</div>
          <div className="text-red-600 dark:text-red-400 text-xl font-bold mb-2">Creator Not Found</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!creator) return null

  const explorerUrl = txSignature
    ? `https://explorer.solana.com/tx/${txSignature}?cluster=${
        process.env.NEXT_PUBLIC_NETWORK === 'solana-mainnet-beta' ? 'mainnet' : 'devnet'
      }`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">BlinkTip</h1>
          <WalletMultiButton />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white">
            <div className="flex items-center gap-6">
              {creator.avatar_url && (
                <img
                  src={creator.avatar_url}
                  alt={creator.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-xl"
                />
              )}
              <div>
                <h2 className="text-3xl font-bold mb-2">{creator.name}</h2>
                <p className="text-purple-100 text-lg">{creator.bio}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>💡 Powered by x402:</strong> Instant stablecoin tips via Solana. Choose USDC or Phantom CASH. Your wallet signs the transaction, and it's verified on-chain.
              </p>
            </div>

            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Select Tip Amount</h3>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {TIP_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount)
                    setCustomAmount('')
                  }}
                  className={`py-4 px-4 rounded-xl font-bold transition-all transform hover:scale-105 ${
                    selectedAmount === amount && !customAmount
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                Or Enter Custom Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-lg font-semibold transition-all"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                Choose Token
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedToken('USDC')}
                  className={`py-4 px-4 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                    selectedToken === 'USDC'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <span className="text-2xl">💵</span>
                  <span>USDC</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedToken('CASH')}
                  className={`py-4 px-4 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                    selectedToken === 'CASH'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <span className="text-2xl">👻</span>
                  <span>CASH</span>
                </button>
              </div>
              {selectedToken === 'CASH' && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
                  Phantom CASH - USD stablecoin powered by Bridge
                </p>
              )}
            </div>

            {!publicKey ? (
              <div className="text-center py-8 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                <p className="text-gray-700 dark:text-gray-300 font-semibold mb-4">
                  Connect your wallet to send a tip
                </p>
                <div className="flex justify-center">
                  <WalletMultiButton />
                </div>
              </div>
            ) : (
              <button
                onClick={handleTip}
                disabled={tipping}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] text-lg"
              >
                {tipping
                  ? 'Processing Payment...'
                  : `Send $${customAmount || selectedAmount} ${selectedToken} Tip`}
              </button>
            )}

            {error && (
              <div className="mt-6 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl">
                <p className="text-red-700 dark:text-red-300 font-bold text-lg mb-2">❌ Payment Failed</p>
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {txSignature && (
              <div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl">
                <p className="text-green-800 dark:text-green-300 font-bold text-lg mb-3">
                  ✅ Tip Sent Successfully!
                </p>
                <p className="text-green-700 dark:text-green-400 mb-4">
                  Your tip was verified and settled on Solana via the x402 protocol. Thank you for supporting this creator!
                </p>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    View on Solana Explorer →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
