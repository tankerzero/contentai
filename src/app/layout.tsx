import type { Metadata } from 'next'
import { Inter, Noto_Naskh_Arabic } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
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

const BASE_URL = 'https://contentai.ca'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'ContentAI — AI Content Generation in 5 Languages',
    template: '%s | ContentAI',
  },
  description:
    'Generate professional blog posts, social media captions, email campaigns, and ad copy with Claude AI — in English, Français, العربية, Español, and 中文.',
  keywords: [
    'AI content generation', 'multilingual AI', 'Arabic content AI', 'blog post generator',
    'social media content', 'Claude AI', 'content marketing', 'AI writing tool',
    'French content generator', 'MENA content AI',
  ],
  authors: [{ name: 'ContentAI', url: BASE_URL }],
  creator: 'ContentAI',
  publisher: 'ContentAI',
  alternates: {
    canonical: BASE_URL,
    // Note: language switching is client-side only (localStorage), so all language
    // variants resolve to the same URL. Self-referential hreflang signals supported
    // languages to Google. True per-URL hreflang requires path-based locale routing.
    languages: {
      'en':       BASE_URL,
      'fr':       BASE_URL,
      'ar':       BASE_URL,
      'es':       BASE_URL,
      'zh-Hans':  BASE_URL,
      'x-default': BASE_URL,
    },
  },
  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'ContentAI',
    title: 'ContentAI — AI Content Generation in 5 Languages',
    description:
      'Generate professional content with Claude AI in English, Français, العربية, Español, and 中文. RTL Arabic support included.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ContentAI — AI Content Generation in 5 Languages',
    description:
      'Generate professional content with Claude AI in English, Français, العربية, Español, and 中文.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#026676" />
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
        <Analytics />
      </body>
    </html>
  )
}
