'use client'

import { useEffect, useRef } from 'react'

interface QRCodeProps {
  url: string
  size?: number
  className?: string
}

export default function QRCode({ url, size = 200, className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    function generateQR() {
      if (!canvasRef.current) return

      // Fallback: show URL text since qrcode package is optional
      // To enable QR code generation, install: npm install qrcode @types/qrcode
      // Then uncomment the dynamic import below
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('QR Code', size / 2, size / 2 - 10)
        ctx.font = '10px monospace'
        ctx.fillText('(Optional)', size / 2, size / 2 + 10)
        ctx.fillText('package)', size / 2, size / 2 + 25)
      }

      // Uncomment below to enable QR code generation after installing qrcode package:
      /*
      import('qrcode').then((QRCodeLib) => {
        QRCodeLib.toCanvas(canvasRef.current, url, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        }).catch(() => {
          // Fallback if generation fails
        })
      }).catch(() => {
        // Package not installed, use fallback above
      })
      */
    }

    generateQR()
  }, [url, size])

  return (
    <div className={`inline-block ${className}`}>
      <canvas ref={canvasRef} width={size} height={size} className="border border-gray-200 dark:border-zinc-700 rounded-lg" />
    </div>
  )
}

