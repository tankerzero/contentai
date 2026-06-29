'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import GoogleButton from '@/components/GoogleButton'
import { useUILang, type UILang } from '@/contexts/UILanguageContext'

const UI = {
  en: {
    title: 'Welcome back',
    subtitle: 'Sign in to your account',
    email: 'Email',
    password: 'Password',
    forgot: 'Forgot password?',
    submit: 'Sign in',
    submitting: 'Signing in…',
    google: 'Continue with Google',
    noAccount: "Don't have an account?",
    signup: 'Sign up free',
  },
  fr: {
    title: 'Bon retour',
    subtitle: 'Connectez-vous à votre compte',
    email: 'E-mail',
    password: 'Mot de passe',
    forgot: 'Mot de passe oublié ?',
    submit: 'Se connecter',
    submitting: 'Connexion…',
    google: 'Continuer avec Google',
    noAccount: 'Pas de compte ?',
    signup: "S'inscrire gratuitement",
  },
  ar: {
    title: 'مرحباً بعودتك',
    subtitle: 'سجّل دخولك إلى حسابك',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    forgot: 'نسيت كلمة المرور؟',
    submit: 'تسجيل الدخول',
    submitting: 'جارٍ التسجيل…',
    google: 'المتابعة مع Google',
    noAccount: 'ليس لديك حساب؟',
    signup: 'سجّل مجاناً',
  },
  es: {
    title: 'Bienvenido de nuevo',
    subtitle: 'Inicia sesión en tu cuenta',
    email: 'Correo electrónico',
    password: 'Contraseña',
    forgot: '¿Olvidaste tu contraseña?',
    submit: 'Iniciar sesión',
    submitting: 'Iniciando…',
    google: 'Continuar con Google',
    noAccount: '¿No tienes cuenta?',
    signup: 'Regístrate gratis',
  },
  zh: {
    title: '欢迎回来',
    subtitle: '登录您的账户',
    email: '电子邮件',
    password: '密码',
    forgot: '忘记密码？',
    submit: '登录',
    submitting: '登录中…',
    google: '使用 Google 继续',
    noAccount: '没有账户？',
    signup: '免费注册',
  },
}

const LANG_OPTIONS: { value: UILang; flag: string; label: string }[] = [
  { value: 'en', flag: '🇬🇧', label: 'EN' },
  { value: 'fr', flag: '🇫🇷', label: 'FR' },
  { value: 'ar', flag: '🇸🇦', label: 'AR' },
  { value: 'es', flag: '🇪🇸', label: 'ES' },
  { value: 'zh', flag: '🇨🇳', label: '中' },
]

export default function LoginPage() {
  const router = useRouter()
  const { lang, setLang, isRTL } = useUILang()
  const ui = UI[lang]

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Link href="/" className="text-2xl font-bold text-brand-700 mb-8">ContentAI</Link>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-sm border border-gray-100 p-8">

        {/* Language switcher */}
        <div className={`flex gap-1 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {LANG_OPTIONS.map(l => (
            <button
              key={l.value}
              onClick={() => setLang(l.value)}
              className={`h-7 px-2 rounded-lg text-xs font-semibold transition-all ${
                lang === l.value ? 'bg-brand-50 ring-1 ring-brand-300 text-brand-700' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{ui.title}</h1>
        <p className="text-gray-500 text-sm mb-6">{ui.subtitle}</p>

        <GoogleButton label={ui.google} />

        <div className={`flex items-center gap-3 my-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{ui.email}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              dir="ltr"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{ui.password}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              dir="ltr"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            {loading ? ui.submitting : ui.submit}
          </button>

          <div className={`text-center ${isRTL ? 'text-right' : ''}`}>
            <Link href="/forgot-password" className="text-sm text-gray-400 hover:text-brand-600 transition-colors">
              {ui.forgot}
            </Link>
          </div>
        </form>

        <p className={`text-sm text-gray-500 mt-6 ${isRTL ? 'text-right' : 'text-center'}`}>
          {ui.noAccount}{' '}
          <Link href="/signup" className="text-brand-600 font-medium hover:underline">
            {ui.signup}
          </Link>
        </p>
      </div>
    </div>
  )
}
