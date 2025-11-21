'use client'

import { useAppKitAccount, useAppKitNetwork, useAppKit } from '@reown/appkit/react'

export default function TestReownPage() {
  const { address, isConnected, caipAddress, embeddedWalletInfo } = useAppKitAccount()
  const { caipNetwork, switchNetwork, caipNetworkId } = useAppKitNetwork()
  const { open } = useAppKit()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-zinc-800">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Test Reown AppKit
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Testing multi-chain wallet connection with embedded wallets & social auth
          </p>

          {/* AppKit Connect Button (Web Component) */}
          <div className="mb-8">
            <appkit-button />
          </div>

          {/* Connection Status */}
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700">
              <h2 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-200">
                Connection Status
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Connected:</span>
                  <span className={`font-mono font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Yes ✓' : 'No ✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Address:</span>
                  <span className="font-mono text-xs">
                    {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'Not connected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">CAIP Address:</span>
                  <span className="font-mono text-xs">
                    {caipAddress || 'Not connected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Network:</span>
                  <span className="font-mono text-xs">
                    {caipNetwork?.name || 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Chain ID:</span>
                  <span className="font-mono text-xs">
                    {caipNetworkId || 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* Embedded Wallet Info (if using email/social login) */}
            {embeddedWalletInfo && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <h2 className="font-semibold text-lg mb-3 text-purple-900 dark:text-purple-200">
                  Embedded Wallet Info
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700 dark:text-purple-300">Account Type:</span>
                    <span className="font-mono font-semibold">
                      {embeddedWalletInfo.accountType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700 dark:text-purple-300">Auth Provider:</span>
                    <span className="font-mono font-semibold">
                      {embeddedWalletInfo.authProvider}
                    </span>
                  </div>
                  {embeddedWalletInfo.user?.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700 dark:text-purple-300">Email:</span>
                      <span className="font-mono text-xs">
                        {embeddedWalletInfo.user.email}
                      </span>
                    </div>
                  )}
                  {embeddedWalletInfo.user?.username && (
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700 dark:text-purple-300">Username:</span>
                      <span className="font-mono text-xs">
                        {embeddedWalletInfo.user.username}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700 dark:text-purple-300">Smart Account Deployed:</span>
                    <span className="font-mono font-semibold">
                      {embeddedWalletInfo.isSmartAccountDeployed ? 'Yes ✓' : 'No ✗'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => open()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Open Modal
            </button>
            <button
              onClick={() => open({ view: 'Networks' })}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Switch Network
            </button>
            <button
              onClick={() => open({ view: 'Account' })}
              disabled={!isConnected}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:cursor-not-allowed"
            >
              View Account
            </button>
            <button
              onClick={() => open({ view: 'Connect' })}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Connect View
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-lg mb-3 text-blue-900 dark:text-blue-200">
              Testing Checklist
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>✅ Test email login (embedded wallet)</li>
              <li>✅ Test social login: Google, X, GitHub, Discord, Apple</li>
              <li>✅ Test external wallet: Phantom (Solana)</li>
              <li>✅ Test external wallet: MetaMask (Base, Celo)</li>
              <li>✅ Test network switching (Solana ↔ Base ↔ Celo)</li>
              <li>✅ Verify address and network info displayed correctly</li>
              <li>✅ Check embedded wallet info (for email/social logins)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
