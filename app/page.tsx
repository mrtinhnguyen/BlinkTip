import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full">
          <h1 className="text-4xl font-bold mb-4">BlinkTip</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Universal micro-tip links for creators. Accept tips from humans via Solana Actions and AI agents via x402 protocol.
          </p>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Features</h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• Human tipping via Solana Actions/Blinks</li>
              <li>• AI agent tipping via x402 protocol</li>
              <li>• Multi-chain support (Solana + Base)</li>
              <li>• Shareable tip links</li>
            </ul>
          </div>

          <div className="flex gap-4 flex-wrap">
            <Link
              href="/register"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Register as Creator
            </Link>
            <Link
              href="/tip/alice"
              className="inline-block px-6 py-3 bg-gray-200 dark:bg-zinc-800 text-black dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors"
            >
              Try Demo Tip
            </Link>
            <Link
              href="/content/cheap"
              className="inline-block px-6 py-3 bg-neutral-800 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              x402 Demo
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
