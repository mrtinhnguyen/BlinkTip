'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { createX402Client } from 'x402-solana/client'
import { ConnectButton, useActiveAccount, useActiveWallet } from "thirdweb/react"
import { createThirdwebClient, defineChain } from "thirdweb"
import { wrapFetchWithPayment } from "thirdweb/x402"

// Initialize thirdweb client for frontend
const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
})

// Define Celo Sepolia chain
const celoSepolia = defineChain({
  id: 11142220,
  rpc: "https://forno.celo-sepolia.celo-testnet.org",
})

type Creator = {
  slug: string
  name: string
  bio: string
  avatar_url: string
  wallet_address: string | null
  evm_wallet_address?: string
  supported_chains?: string[]
}

// Token options for tipping
const SOLANA_TOKENS = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  CASH: 'CASHedBw9NfhsLBXq1WNVfueVznx255j8LLTScto3S6s',
}

const CELO_TOKENS = {
  USDC: '0x01C5C0122039549AD1493B8220cABEdD739BC44E',
  cUSD: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b',
}

const TIP_AMOUNTS = [0.01, 0.05, 0.1]

export default function TipPage() {
  const params = useParams()
  const slug = params.slug as string

  // Solana wallet
  const solanaWallet = useWallet()
  const { publicKey, signTransaction } = solanaWallet

  // Celo/EVM wallet (thirdweb)
  const celoAccount = useActiveAccount()
  const celoWallet = useActiveWallet()

  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedChain, setSelectedChain] = useState<'solana' | 'celo'>('solana')
  const [selectedAmount, setSelectedAmount] = useState(0.01)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState<string>('USDC')
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
    setTipping(true)
    setError(null)
    setTxSignature(null)

    try {
      const amount = customAmount ? parseFloat(customAmount) : selectedAmount

      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid tip amount')
      }

      if (selectedChain === 'solana') {
        // Solana tipping via x402
        if (!publicKey || !signTransaction || !creator) {
          throw new Error('Please connect your Solana wallet')
        }

        const x402Client = createX402Client({
          wallet: {
            address: publicKey.toBase58(),
            signTransaction: signTransaction,
          },
          network: process.env.NEXT_PUBLIC_NETWORK === 'solana-mainnet-beta' ? 'solana' : 'solana-devnet',
        })

        console.log('[x402-Solana] Starting tip flow...', { amount, creator: slug, token: selectedToken })

        const response = await x402Client.fetch(
          `/api/x402/tip/${slug}/pay-solana?amount=${amount}&token=${selectedToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Payment failed')
        }

        const result = await response.json()
        console.log('[x402-Solana] Payment successful:', result)

        if (result.tip?.transaction) {
          setTxSignature(result.tip.transaction)
        }
      } else if (selectedChain === 'celo') {
        // Celo tipping via x402 protocol
        if (!celoAccount || !celoWallet || !creator?.evm_wallet_address) {
          throw new Error('Please connect your EVM wallet or creator has no EVM address')
        }

        console.log('[x402-Celo] Starting x402 tip flow...', { amount, creator: slug, token: selectedToken })

        // Debug wallet state
        const walletAccount = celoWallet.getAccount()
        const walletChain = celoWallet.getChain()
        console.log('[x402-Celo] Wallet account:', walletAccount?.address)
        console.log('[x402-Celo] Wallet chain:', walletChain?.id, walletChain?.name)

        if (!walletAccount || !walletChain) {
          throw new Error('Wallet not properly connected. Please reconnect your wallet.')
        }

        // Calculate max payment amount in base units
        // For cUSD (18 decimals) or USDC (6 decimals)
        const maxPaymentAmount = selectedToken === 'cUSD'
          ? BigInt(Math.ceil(amount * 1.1 * 1e18)) // 10% buffer for cUSD (18 decimals)
          : BigInt(Math.ceil(amount * 1.1 * 1e6))  // 10% buffer for USDC (6 decimals)

        console.log('[x402-Celo] Max payment amount:', maxPaymentAmount.toString())

        // Wrap fetch with x402 payment handling
        const fetchWithPay = wrapFetchWithPayment(
          fetch,
          thirdwebClient,
          celoWallet,
          maxPaymentAmount
        )

        console.log('[x402-Celo] Making x402 request with auto-payment handling...')

        // Make request - wrapFetchWithPayment handles the 402 flow automatically
        let response: Response
        try {
          response = await fetchWithPay(
            `/api/x402/tip/${slug}/pay-celo?amount=${amount}&token=${selectedToken}`,
            { method: 'GET' }
          )
          console.log('[x402-Celo] Response status:', response.status)
        } catch (fetchError) {
          console.error('[x402-Celo] Fetch with payment error:', fetchError)
          throw new Error(`Payment signing failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
        }

        if (!response.ok) {
          // Clone response before reading body to avoid "body already read" errors
          const responseClone = response.clone()
          try {
            const errorData = await responseClone.json()
            console.error('[x402-Celo] Error response:', errorData)
            throw new Error(errorData.error || `x402 payment failed with status ${response.status}`)
          } catch {
            throw new Error(`x402 payment failed with status ${response.status}`)
          }
        }

        const result = await response.json()
        console.log('[x402-Celo] Payment successful:', result)

        if (result.transactionHash) {
          setTxSignature(result.transactionHash)
        }
      }

      setError(null)
    } catch (err) {
      console.error('[Tip] Error:', err)
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
    ? selectedChain === 'solana'
      ? `https://explorer.solana.com/tx/${txSignature}?cluster=${
          process.env.NEXT_PUBLIC_NETWORK === 'solana-mainnet-beta' ? 'mainnet' : 'devnet'
        }`
      : `https://sepolia.celoscan.io/tx/${txSignature}`
    : null

  // Check if creator supports selected chain
  const creatorSupportsEVM = creator?.evm_wallet_address && creator.evm_wallet_address.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">BlinkTip</h1>
          <div className="flex gap-2">
            {selectedChain === 'solana' && <WalletMultiButton />}
            {selectedChain === 'celo' && <ConnectButton client={thirdwebClient} chain={celoSepolia} />}
          </div>
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
                <strong>💡 Multi-Chain Tipping:</strong> Send tips on Solana, Base, or Celo. Choose your preferred chain, token, and amount. Your wallet signs the transaction, and it's verified on-chain.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                Select Blockchain
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChain('solana')
                    setSelectedToken('USDC')
                  }}
                  className={`py-4 px-4 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                    selectedChain === 'solana'
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <span className="text-2xl">◎</span>
                  <span>Solana</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChain('celo')
                    setSelectedToken('cUSD')
                  }}
                  disabled={!creatorSupportsEVM}
                  className={`py-4 px-4 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                    selectedChain === 'celo'
                      ? 'bg-gradient-to-r from-yellow-500 to-green-500 text-white shadow-lg'
                      : !creatorSupportsEVM
                      ? 'bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <span className="text-2xl">🌱</span>
                  <span>Celo</span>
                </button>
              </div>
              {!creatorSupportsEVM && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  This creator hasn't added an EVM wallet address yet (Base/Celo).
                </p>
              )}
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
              {selectedChain === 'solana' ? (
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
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedToken('cUSD')}
                    className={`py-4 px-4 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                      selectedToken === 'cUSD'
                        ? 'bg-gradient-to-r from-yellow-500 to-green-500 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <span className="text-2xl">🌱</span>
                    <span>cUSD</span>
                  </button>
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
                </div>
              )}
              {selectedToken === 'CASH' && selectedChain === 'solana' && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
                  Phantom CASH - USD stablecoin powered by Bridge
                </p>
              )}
              {selectedToken === 'cUSD' && selectedChain === 'celo' && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
                  Celo Dollar - Native stablecoin on Celo blockchain
                </p>
              )}
            </div>

            {selectedChain === 'solana' && !publicKey ? (
              <div className="text-center py-8 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                <p className="text-gray-700 dark:text-gray-300 font-semibold mb-4">
                  Connect your Solana wallet to send a tip
                </p>
                <div className="flex justify-center">
                  <WalletMultiButton />
                </div>
              </div>
            ) : selectedChain === 'celo' && !celoAccount ? (
              <div className="text-center py-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800">
                <p className="text-gray-700 dark:text-gray-300 font-semibold mb-4">
                  Connect your EVM wallet (MetaMask, etc.) to send a tip on Celo
                </p>
                <div className="flex justify-center">
                  <ConnectButton client={thirdwebClient} chain={celoSepolia} />
                </div>
              </div>
            ) : (
              <button
                onClick={handleTip}
                disabled={tipping || (selectedChain === 'celo' && !creatorSupportsEVM)}
                className={`w-full font-bold py-5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] text-lg ${
                  selectedChain === 'solana'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white'
                    : 'bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-400 text-white'
                }`}
              >
                {tipping
                  ? 'Processing Payment...'
                  : `Send $${customAmount || selectedAmount} ${selectedToken} Tip on ${selectedChain === 'solana' ? 'Solana' : 'Celo'}`}
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
                  {selectedChain === 'solana'
                    ? 'Your tip was verified and settled on Solana via the x402 protocol. Thank you for supporting this creator!'
                    : 'Your tip was verified and settled on Celo via the x402 protocol. Thank you for supporting this creator!'}
                </p>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block px-4 py-2 font-semibold rounded-lg transition-colors ${
                      selectedChain === 'solana'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    View on {selectedChain === 'solana' ? 'Solana' : 'Celo'} Explorer →
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
