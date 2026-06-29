'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import GoogleButton from '@/components/GoogleButton'
import { useUILang, type UILang } from '@/contexts/UILanguageContext'

const UI = {
  en: {
    title: 'Create your account',
    subtitle: 'Free — no credit card required',
    email: 'Email',
    password: 'Password',
    passwordHint: 'Min. 8 characters',
    submit: 'Create account',
    submitting: 'Creating account…',
    google: 'Sign up with Google',
    hasAccount: 'Already have an account?',
    signin: 'Sign in',
    checkEmail: 'Check your email',
    checkEmailDesc: 'We sent a confirmation link to',
    checkEmailDesc2: 'Click it to activate your account.',
    backToSignin: 'Back to sign in',
  },
  fr: {
    title: 'Créer votre compte',
    subtitle: 'Gratuit — sans carte bancaire',
    email: 'E-mail',
    password: 'Mot de passe',
    passwordHint: 'Min. 8 caractères',
    submit: 'Créer un compte',
    submitting: 'Création…',
    google: "S'inscrire avec Google",
    hasAccount: 'Déjà un compte ?',
    signin: 'Se connecter',
    checkEmail: 'Vérifiez vos e-mails',
    checkEmailDesc: "Nous avons envoyé un lien de confirmation à",
    checkEmailDesc2: 'Cliquez dessus pour activer votre compte.',
    backToSignin: 'Retour à la connexion',
  },
  ar: {
    title: 'إنشاء حسابك',
    subtitle: 'مجاني — لا حاجة لبطاقة بنكية',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    passwordHint: '٨ أحرف على الأقل',
    submit: 'إنشاء حساب',
    submitting: 'جارٍ الإنشاء…',
    google: 'التسجيل مع Google',
    hasAccount: 'لديك حساب بالفعل؟',
    signin: 'سجّل دخولك',
    checkEmail: 'تحقّق من بريدك',
    checkEmailDesc: 'أرسلنا رابط تأكيد إلى',
    checkEmailDesc2: 'انقر عليه لتفعيل حسابك.',
    backToSignin: 'العودة إلى تسجيل الدخول',
  },
  es: {
    title: 'Crear tu cuenta',
    subtitle: 'Gratis — sin tarjeta de crédito',
    email: 'Correo electrónico',
    password: 'Contraseña',
    passwordHint: 'Mín. 8 caracteres',
    submit: 'Crear cuenta',
    submitting: 'Creando…',
    google: 'Registrarse con Google',
    hasAccount: '¿Ya tienes cuenta?',
    signin: 'Inicia sesión',
    checkEmail: 'Revisa tu correo',
    checkEmailDesc: 'Enviamos un enlace de confirmación a',
    checkEmailDesc2: 'Haz clic para activar tu cuenta.',
    backToSignin: 'Volver a iniciar sesión',
  },
  zh: {
    title: '创建您的账户',
    subtitle: '免费 — 无需信用卡',
    email: '电子邮件',
    password: '密码',
    passwordHint: '至少 8 个字符',
    submit: '创建账户',
    submitting: '创建中…',
    google: '使用 Google 注册',
    hasAccount: '已有账户？',
    signin: '登录',
    checkEmail: '查看您的邮件',
    checkEmailDesc: '我们已将确认链接发送至',
    checkEmailDesc2: '点击它以激活您的账户。',
    backToSignin: '返回登录',
  },
}

const LANG_OPTIONS: { value: UILang; flag: string; label: string }[] = [
  { value: 'en', flag: '🇬🇧', label: 'EN' },
  { value: 'fr', flag: '🇫🇷', label: 'FR' },
  { value: 'ar', flag: '🇸🇦', label: 'AR' },
  { value: 'es', flag: '🇪🇸', label: 'ES' },
  { value: 'zh', flag: '🇨🇳', label: '中' },
]

export default function SignupPage() {
  const { lang, setLang, isRTL } = useUILang()
  const ui = UI[lang]

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className={`min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-white w-full max-w-md rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{ui.checkEmail}</h2>
          <p className="text-gray-500 text-sm">
            {ui.checkEmailDesc} <strong>{email}</strong>. {ui.checkEmailDesc2}
          </p>
          <Link href="/login" className="mt-6 inline-block text-brand-600 text-sm font-medium hover:underline">
            {ui.backToSignin}
          </Link>
        </div>
      </div>
    )
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
              minLength={8}
              dir="ltr"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder={ui.passwordHint}
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
        </form>

        <p className={`text-sm text-gray-500 mt-6 ${isRTL ? 'text-right' : 'text-center'}`}>
          {ui.hasAccount}{' '}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">
            {ui.signin}
          </Link>
        </p>
      </div>
    </div>
  )
}
