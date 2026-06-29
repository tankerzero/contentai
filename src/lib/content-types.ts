export type ContentType =
  | 'blog_post'
  | 'social_media'
  | 'email'
  | 'product_description'
  | 'ad_copy'

export type OutputLanguage = 'en' | 'fr' | 'ar'

export interface BrandVoice {
  companyName?: string
  industry?: string
  values?: string
  writingStyle?: string
  toneExamples?: string
}
