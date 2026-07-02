'use client'

import { useState } from 'react'
import type { UILang } from '@/contexts/UILanguageContext'

const T = {
  en: {
    title: 'Be first to know',
    subtitle: "Enter your email and we'll notify you the moment ContentAI opens to the public.",
    email: 'Email',
    placeholder: 'you@example.com',
    submit: 'Notify me',
    submitting: 'Saving…',
    success: "You're on the list! 🎉",
    successSub: "We'll email you the moment we launch.",
    error: 'Something went wrong. Please try again.',
  },
  fr: {
    title: 'Soyez le premier informé',
    subtitle: 'Entrez votre e-mail et nous vous préviendrons dès que ContentAI ouvre ses portes.',
    email: 'E-mail',
    placeholder: 'vous@exemple.com',
    submit: 'Me notifier',
    submitting: 'Enregistrement…',
    success: 'Vous êtes sur la liste ! 🎉',
    successSub: 'Nous vous enverrons un e-mail dès le lancement.',
    error: "Une erreur s'est produite. Réessayez.",
  },
  ar: {
    title: 'كن أول من يعلم',
    subtitle: 'أدخل بريدك الإلكتروني وسنُخطرك فور إطلاق ContentAI للعامة.',
    email: 'البريد الإلكتروني',
    placeholder: 'you@example.com',
    submit: 'أخطرني',
    submitting: 'جارٍ الحفظ…',
    success: 'أنت على القائمة! 🎉',
    successSub: 'سنرسل لك بريداً إلكترونياً فور الإطلاق.',
    error: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
  },
  es: {
    title: 'Sé el primero en saber',
    subtitle: 'Ingresa tu correo y te avisaremos en cuanto ContentAI abra al público.',
    email: 'Correo electrónico',
    placeholder: 'tu@ejemplo.com',
    submit: 'Notificarme',
    submitting: 'Guardando…',
    success: '¡Estás en la lista! 🎉',
    successSub: 'Te enviaremos un correo en cuanto lancemos.',
    error: 'Algo salió mal. Inténtalo de nuevo.',
  },
  zh: {
    title: '抢先知晓',
    subtitle: '输入您的邮箱，ContentAI 正式开放时我们会第一时间通知您。',
    email: '电子邮件',
    placeholder: 'you@example.com',
    submit: '通知我',
    submitting: '保存中…',
    success: '您已加入候补名单！🎉',
    successSub: '我们将在发布时第一时间发送邮件给您。',
    error: '出现错误，请重试。',
  },
}

interface Props {
  lang: UILang
  source?: string
  onClose: () => void
}

export default function WaitlistModal({ lang, source, onClose }: Props) {
  const ui = T[lang] ?? T.en
  const isRTL = lang === 'ar'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), lang, source }),
    })

    setLoading(false)
    if (res.ok) {
      setDone(true)
    } else {
      setError(ui.error)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative ${isRTL ? 'font-arabic text-right' : ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-xl"
        >
          ×
        </button>

        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{ui.success}</h2>
            <p className="text-gray-500 text-sm">{ui.successSub}</p>
            <button
              onClick={onClose}
              className="mt-6 bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              OK
            </button>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-4 text-center">🚀</div>
            <h2 className={`text-xl font-bold text-gray-900 mb-2 ${isRTL ? '' : 'text-center'}`}>{ui.title}</h2>
            <p className={`text-gray-500 text-sm mb-6 leading-relaxed ${isRTL ? '' : 'text-center'}`}>{ui.subtitle}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{ui.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  placeholder={ui.placeholder}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
          </>
        )}
      </div>
    </div>
  )
}
