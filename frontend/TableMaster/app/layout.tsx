import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TableMaster', 
  description: 'Seu sistema de gerenciamento de restaurante.',
  generator: 'Table Master',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}