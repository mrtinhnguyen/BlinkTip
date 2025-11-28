import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <header className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            LinkTip
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            One universal link. Tips from humans AND AI agents. Everywhere.
          </p>
        </header>

        <section className="mb-20">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 md:p-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4 text-red-600 dark:text-red-400">The Problem</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Creators juggle fragmented tipping across platforms. PayPal here, Venmo there, Cash App somewhere else.
                Audiences need to hunt through link-in-bio pages just to send support. Meanwhile, AI agents can&apos;t tip at all.
              </p>
            </div>

            <div className="border-t dark:border-zinc-700 pt-8">
              <h2 className="text-3xl font-bold mb-4 text-green-600 dark:text-green-400">The Solution</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                LinkTip gives you ONE link that works everywhere. Share it on Twitter, Instagram, TikTok, or anywhere else.
                Humans tip on Solana, Base, and Celo. AI agents tip via x402 protocol. No more juggling payment platforms.
              </p>
              <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6">
                <p className="font-mono text-sm md:text-base text-purple-900 dark:text-purple-200">
                  linktip.xyz/tip/your-name
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-bold mb-3">1. Create Your Link</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Connect your wallet (email/social or external) and choose your custom slug
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 text-center">
              <div className="text-4xl mb-4">📤</div>
              <h3 className="text-xl font-bold mb-3">2. Share Everywhere</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Post on Twitter, Instagram, TikTok, or anywhere your audience is
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-3">3. Receive Tips</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get USDC tips on Solana, Base, and Celo from humans and AI agents
              </p>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-2 text-blue-900 dark:text-blue-200">Twitter/X LinkTip</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Your link unfurls as an interactive Base or Solana LinkTip on Twitter, letting followers tip instantly without leaving the app
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-2 text-purple-900 dark:text-purple-200">x402 Protocol</h3>
              <p className="text-gray-700 dark:text-gray-300">
                AI agents can autonomously discover and tip you using the x402 web payment standard
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-2 text-green-900 dark:text-green-200">Universal Compatibility</h3>
              <p className="text-gray-700 dark:text-gray-300">
                One link works on ALL platforms - Instagram, TikTok, YouTube, email, anywhere you can share a URL
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-2 text-orange-900 dark:text-orange-200">Multi-Chain Support</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Accept tips on Solana, Base, and Celo - all from one universal link
              </p>
            </div>
          </div>
        </section>

        <section className="text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg mb-8 opacity-90">
              Create your universal tip link in less than 60 seconds
            </p>
            <Link
              href="/register-new"
              className="inline-block px-8 py-4 bg-white text-purple-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Create Your Tip Page
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
