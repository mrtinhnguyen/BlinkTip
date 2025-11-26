'use client'

import { ThirdwebProvider as TWProvider } from "thirdweb/react"
import { ReactNode } from 'react'

export function ThirdwebProvider({ children }: { children: ReactNode }) {
  return <TWProvider>{children}</TWProvider>
}
