import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/auth/',
        '/dashboard',
        '/generate',
        '/history',
        '/billing',
        '/brand',
        '/earn',
        '/planner',
        '/marketing',
        '/social',
        '/content',
        '/support',
        '/campaigns',
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
      ],
    },
    sitemap: 'https://contentai.ca/sitemap.xml',
  }
}
