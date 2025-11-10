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

// x402 uses USDC, not SOL
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

      console.log('[x402] Starting tip flow...', { amount, creator: slug })

      // Make x402 payment request
      // The client automatically handles:
      // 1. GET request to endpoint
      // 2. Receives 402 Payment Required
      // 3. Creates payment transaction
      // 4. Signs transaction with wallet
      // 5. Sends X-PAYMENT header
      // 6. Returns success response
      const response = await x402Client.fetch(
        `/api/x402/tip/${slug}/pay-solana?amount=${amount}`,
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  if (error && !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg">{error}</div>
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">BlinkTip</h1>
          <WalletMultiButton />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-4 mb-6">
            {creator.avatar_url && (
              <img
                src={creator.avatar_url}
                alt={creator.name}
                className="w-20 h-20 rounded-full"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold">{creator.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{creator.bio}</p>
            </div>
          </div>

          <div className="border-t dark:border-zinc-800 pt-6">
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-400">
                <strong>💡 x402 Payment:</strong> This uses the x402 protocol on Solana.
                When you click "Tip", your wallet will sign a USDC payment transaction that's verified on-chain.
              </p>
            </div>

            <h3 className="text-lg font-semibold mb-4">Select Tip Amount (USDC)</h3>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {TIP_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount)
                    setCustomAmount('')
                  }}
                  className={`py-3 px-4 rounded-lg font-semibold transition-colors ${
                    selectedAmount === amount && !customAmount
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  ${amount} USDC
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Custom Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter custom amount"
                className="w-full px-4 py-3 rounded-lg border dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            {!publicKey ? (
              <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                Connect your wallet to send a tip
              </div>
            ) : (
              <button
                onClick={handleTip}
                disabled={tipping}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors"
              >
                {tipping
                  ? 'Processing x402 Payment...'
                  : `Tip $${customAmount || selectedAmount} USDC`}
              </button>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 font-semibold mb-1">Payment Failed</p>
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {txSignature && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-400 font-semibold mb-2">
                  ✅ Tip sent successfully via x402!
                </p>
                <p className="text-sm text-green-700 dark:text-green-500 mb-2">
                  Your tip was verified and settled on Solana using the x402 protocol.
                </p>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:underline text-sm break-all"
                  >
                    View transaction on Solana Explorer →
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
