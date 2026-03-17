import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stack Universe | Every Developer Has a Universe',
  description:
    'Transform any GitHub profile into a living 3D solar system. Explore the multiverse of developers.',
  icons: {
    icon: '/icon.png',
  },
  openGraph: {
    title: 'Stack Universe',
    description: 'Your GitHub profile as a solar system',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="scanlines bg-space-black overflow-hidden">
        {children}
      </body>
    </html>
  )
}
