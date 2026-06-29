const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  const missing = [
    !url     && 'NEXT_PUBLIC_SUPABASE_URL',
    !anonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean).join(', ')
  throw new Error(
    `Missing Supabase environment variable(s): ${missing}. ` +
    `Add them in Vercel → Project Settings → Environment Variables.`
  )
}

export const SUPABASE_URL = url
export const SUPABASE_ANON_KEY = anonKey
