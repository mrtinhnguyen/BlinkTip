'use client'

import { useState, useEffect } from 'react'
import { useAppKitAccount, useAppKitNetwork, useAppKit } from '@reown/appkit/react'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'

export default function RegisterPage() {
  // Reown hooks for wallet connection
  const { address, isConnected, caipAddress, embeddedWalletInfo } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()
  const { open } = useAppKit()

  // NextAuth for Twitter profile data (username, display name, avatar)
  const { data: session } = useSession()

  // Form state
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tipLink, setTipLink] = useState('')
  const [blinkUrl, setBlinkUrl] = useState('')

  // Auto-fill form with Twitter profile data from NextAuth
  // Reown creates the wallet, NextAuth fetches the profile data
  useEffect(() => {
    if (session?.user) {
      if (session.user.twitterHandle && !slug) {
        setSlug(session.user.twitterHandle)
      }
      if (session.user.twitterName && !name) {
        setName(session.user.twitterName)
      }
      if (session.user.twitterAvatarUrl && !avatarUrl) {
        setAvatarUrl(session.user.twitterAvatarUrl)
      }
    }
  }, [session])

  const validateSlug = (value: string) => {
    const slugRegex = /^[a-z0-9_-]{3,50}$/
    return slugRegex.test(value)
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    setSlug(value)
  }

  // Detect if user is connected via Solana or EVM
  const isEVMConnection = caipAddress?.startsWith('eip155:')
  const isSolanaConnection = caipAddress?.startsWith('solana:')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    if (!validateSlug(slug)) {
      setError('Slug must be 3-50 characters (lowercase letters, numbers, hyphens, underscores only)')
      return
    }

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Determine supported chains and wallet addresses based on connection
      const supportedChains = []
      let walletAddress = ''
      let evmWalletAddress = ''

      if (isSolanaConnection) {
        // Solana wallet connected
        supportedChains.push('solana')
        walletAddress = address
      } else if (isEVMConnection) {
        // EVM wallet connected (works for Base, Celo, and any EVM chain)
        supportedChains.push('base', 'celo')
        evmWalletAddress = address

        // Embedded wallets support ALL chains, so add Solana too
        if (embeddedWalletInfo) {
          supportedChains.push('solana')
          walletAddress = address // Same address works for Solana with embedded wallet
        }
      }

      // Determine Twitter verification source: Reown (primary) or NextAuth (fallback)
      const isTwitterAuth = embeddedWalletInfo?.authProvider === 'x'
      const twitterData = isTwitterAuth ? {
        // Twitter identity from Reown embedded wallet (primary source)
        twitter_verified: true,
        // We'll use the wallet address as proof of Twitter ownership
        // Reown ensures same Twitter = same wallet address
      } : session?.user ? {
        // Fallback to NextAuth Twitter data if available
        twitter_id: session.user.twitterId,
        twitter_handle: session.user.twitterHandle,
        twitter_name: session.user.twitterName,
        twitter_avatar_url: session.user.twitterAvatarUrl,
        twitter_follower_count: session.user.twitterFollowerCount,
        twitter_created_at: session.user.twitterCreatedAt,
        twitter_verified: !!session.user.twitterId,
      } : {}

      const response = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          wallet_address: walletAddress || undefined,
          evm_wallet_address: evmWalletAddress || undefined,
          name,
          bio: bio.trim() || undefined,
          avatar_url: avatarUrl.trim() || undefined,
          supported_chains: supportedChains,
          ...twitterData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register')
      }

      setSuccess(true)
      setTipLink(data.tip_link)
      setBlinkUrl(data.blink_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-4">Registration Successful!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your BlinkTip creator profile has been created
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                <h2 className="font-semibold mb-1">Your Universal Tip Page</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Share this link anywhere - Instagram, TikTok, email, etc. Works with x402 protocol.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tipLink}
                    readOnly
                    className="flex-1 px-4 py-2 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(tipLink)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h2 className="font-semibold mb-1">Your Blink URL (Twitter/X)</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Share this on Twitter/X - it will unfurl as an interactive Blink once domain is registered.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={blinkUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(blinkUrl)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href={`/tip/${slug}`}
                className="block w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
              >
                View Your Tip Page
              </Link>
              <Link
                href="/"
                className="block w-full py-3 px-6 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 font-semibold rounded-lg transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Registration flow
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            BlinkTip
          </Link>
          {/* Reown AppKit Button */}
          <appkit-button />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100 dark:border-zinc-800">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎨</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Create Your Creator Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Start receiving tips from humans and AI agents worldwide
            </p>
          </div>

          {/* Step 1: Sign in with Twitter */}
          {!isConnected ? (
            <div className="text-center py-16">
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-8 mb-6">
                <div className="text-6xl mb-6">𝕏</div>
                <p className="text-2xl text-gray-800 dark:text-gray-200 mb-4 font-bold">
                  Sign in with X (Twitter)
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Your Twitter account creates a secure, self-custodial wallet that works on all chains (Solana, Base, Celo).
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-6 bg-blue-100 dark:bg-blue-900/30 p-3 rounded">
                  Same Twitter = Same Wallet Address. No fragmentation!
                </p>
                <button
                  onClick={() => open()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-bold text-lg shadow-lg transition-all inline-flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  Continue with X
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Powered by Reown - Secure, non-custodial authentication
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Connected Wallet Info */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="font-semibold text-green-900 dark:text-green-200">
                    Wallet Connected
                  </p>
                </div>
                <div className="space-y-2 ml-9">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-mono">{address?.slice(0, 8)}...{address?.slice(-6)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="text-gray-600 dark:text-gray-400">Network:</span>
                    <span className="font-semibold">{caipNetwork?.name || 'Unknown'}</span>
                    {embeddedWalletInfo && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold">
                        Embedded Wallet ({embeddedWalletInfo.authProvider})
                      </span>
                    )}
                  </div>
                  {embeddedWalletInfo && (
                    <p className="text-xs text-green-700 dark:text-green-300">
                      💡 Your embedded wallet works on all chains: Solana, Base, and Celo!
                    </p>
                  )}
                </div>
              </div>

              {/* Twitter Profile Data Fetching */}
              {embeddedWalletInfo?.authProvider === 'x' && !session && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold mb-2">
                        Step 2: Fetch your Twitter profile (username, avatar)
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                        This will auto-fill your profile with your Twitter username and display picture
                      </p>
                      <button
                        type="button"
                        onClick={() => signIn('twitter')}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm inline-flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                        Fetch Twitter Profile
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Twitter Profile Fetched */}
              {session && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-200">
                      Twitter Profile Loaded: @{session.user.twitterHandle}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Profile auto-filled from Twitter
                    </p>
                  </div>
                </div>
              )}

              {/* Slug */}
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-200">
                  Your Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-2 border-2 border-purple-200 dark:border-purple-800">
                  <span className="text-gray-500 dark:text-gray-400 text-sm px-2">blink-tip.vercel.app/tip/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="your-slug"
                    required
                    className="flex-1 px-4 py-3 bg-white dark:bg-zinc-900 border-none rounded-lg focus:ring-2 focus:ring-purple-600 outline-none font-semibold"
                  />
                </div>
                {session?.user?.twitterHandle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                    Auto-filled from Twitter: @{session.user.twitterHandle}
                  </p>
                )}
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-200">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-200">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about yourself..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none resize-none transition-all"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-200">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all"
                />
                {avatarUrl && session?.user?.twitterAvatarUrl && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                    Auto-filled from Twitter profile picture
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl">
                  <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Creating Profile...' : 'Create Your Tip Page'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
