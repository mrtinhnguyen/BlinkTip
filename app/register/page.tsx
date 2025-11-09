'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Link from 'next/link'

export default function RegisterPage() {
  const { publicKey } = useWallet()

  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tipLink, setTipLink] = useState('')

  const validateSlug = (value: string) => {
    const slugRegex = /^[a-z0-9_-]{3,50}$/
    return slugRegex.test(value)
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    setSlug(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publicKey) {
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
      const response = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          wallet_address: publicKey.toBase58(),
          name,
          bio: bio.trim() || undefined,
          avatar_url: avatarUrl.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register')
      }

      setSuccess(true)
      setTipLink(data.tip_link)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

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

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
              <h2 className="font-semibold mb-2">Your Tip Link:</h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tipLink}
                  readOnly
                  className="flex-1 px-4 py-2 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(tipLink)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold"
                >
                  Copy
                </button>
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            BlinkTip
          </Link>
          <WalletMultiButton />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Create Your Creator Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Register to start receiving tips from humans and AI agents
          </p>

          {!publicKey ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Connect your Solana wallet to continue
              </p>
              <div className="flex justify-center">
                <WalletMultiButton />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={publicKey.toBase58()}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 border dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Your Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">blink-tip.vercel.app/tip/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="your-slug"
                    required
                    className="flex-1 px-4 py-3 border dark:border-zinc-700 dark:bg-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  3-50 characters: lowercase letters, numbers, hyphens, underscores
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="w-full px-4 py-3 border dark:border-zinc-700 dark:bg-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about yourself..."
                  rows={3}
                  className="w-full px-4 py-3 border dark:border-zinc-700 dark:bg-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-3 border dark:border-zinc-700 dark:bg-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Creating Profile...' : 'Create Profile'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
