import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TunedUp Garage - AI-Powered Tools for Car Enthusiasts',
  description: 'Calculate performance, plan builds, and generate stunning car visuals with AI. Your personal automotive AI assistant in your pocket.',
  keywords: 'car performance calculator, build planner, car AI, automotive tools, horsepower calculator',
  openGraph: {
    title: 'TunedUp Garage - AI Tools for Car Enthusiasts',
    description: 'Calculate performance, plan builds, and generate stunning car visuals with AI.',
    url: 'https://www.tunedup.dev',
    siteName: 'TunedUp Garage',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TunedUp Garage - AI Tools for Car Enthusiasts',
    description: 'Calculate performance, plan builds, and generate stunning car visuals with AI.',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#121212',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
