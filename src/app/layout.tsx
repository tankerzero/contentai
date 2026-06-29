import type { Metadata } from 'next'
import { Inter, Noto_Naskh_Arabic } from 'next/font/google'
import { UILanguageProvider } from '@/contexts/UILanguageContext'
import CookieBanner from '@/components/CookieBanner'
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
      <body className={`${inter.variable} ${notoNaskhArabic.variable} font-sans`}>
        <UILanguageProvider>
          {children}
          <CookieBanner />
        </UILanguageProvider>
      </body>
    </html>
  )
}
