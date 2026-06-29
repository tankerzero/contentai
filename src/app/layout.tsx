import type { Metadata } from 'next'
import { Inter, Noto_Naskh_Arabic } from 'next/font/google'
import { UILanguageProvider } from '@/contexts/UILanguageContext'
import CookieBanner from '@/components/CookieBanner'
import PWAInstallBanner from '@/components/PWAInstallBanner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const notoNaskhArabic = Noto_Naskh_Arabic({
  weight: ['400', '500', '600', '700'],
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ContentAI — AI-Powered Content Generation',
  description: 'Generate blog posts, social media content, emails, and more with Claude AI. Available in English, French & Arabic.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0D7377" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="ContentAI" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className={`${inter.variable} ${notoNaskhArabic.variable} font-sans`}>
        <UILanguageProvider>
          {children}
          <CookieBanner />
          <PWAInstallBanner />
        </UILanguageProvider>
      </body>
    </html>
  )
}
