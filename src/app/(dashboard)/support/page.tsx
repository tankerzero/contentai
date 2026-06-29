'use client'

import { useState, useRef, useEffect } from 'react'
import { useUILang } from '@/contexts/UILanguageContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const FAQ_SECTIONS = [
  {
    icon: '💳',
    q: 'How does billing work?',
    a: 'Plans are billed monthly. Free plan requires no credit card. Paid plans are processed via Stripe and you can cancel anytime from the Billing page.',
  },
  {
    icon: '✨',
    q: 'When do my generations reset?',
    a: 'Your generation credits reset at the start of each calendar month.',
  },
  {
    icon: '🌐',
    q: 'Which languages are supported?',
    a: 'ContentAI supports English, French, Arabic, Spanish, and Chinese (Simplified) for both the interface and content generation.',
  },
  {
    icon: '🎨',
    q: 'What is Brand Voice?',
    a: 'Brand Voice lets you save your company\'s tone, style, and key phrases. When enabled, all generated content automatically reflects your brand identity. Available on Basic plan and higher.',
  },
  {
    icon: '📅',
    q: 'What is the Weekly Planner?',
    a: 'The Weekly Planner generates 7 ready-to-post social media posts (one per day of the week) in a single click. Available on Pro plan and higher.',
  },
  {
    icon: '📤',
    q: 'How do I export my content?',
    a: 'Go to My Content → Export tab to download all your content as a CSV file. Export requires Pro plan or higher.',
  },
  {
    icon: '🔒',
    q: 'How do I reset my password?',
    a: 'Click "Forgot password?" on the login page, enter your email, and we\'ll send you a reset link.',
  },
  {
    icon: '📧',
    q: 'How do Email Campaigns work?',
    a: 'The Email Campaigns feature lets you manage contacts and send email newsletters. Available on Basic plan and higher, with limits of 500 contacts / 1,000 emails per month.',
  },
]

const UI = {
  en: {
    title: 'Support', subtitle: 'Get help with ContentAI — ask anything.',
    faqTitle: 'Frequently Asked Questions',
    inputPlaceholder: 'Type your question…',
    send: 'Send', sending: '…',
    greeting: "Hi! I'm your ContentAI assistant. How can I help you today?",
    escalated: "I've connected a human agent who will reach you by email. What else can I help with?",
    error: 'Something went wrong. Please try again.',
    humanHint: 'Type "human agent" to request human support',
  },
  fr: {
    title: 'Support', subtitle: 'Obtenez de l\'aide sur ContentAI — posez n\'importe quelle question.',
    faqTitle: 'Questions Fréquentes',
    inputPlaceholder: 'Tapez votre question…',
    send: 'Envoyer', sending: '…',
    greeting: "Bonjour ! Je suis votre assistant ContentAI. Comment puis-je vous aider aujourd'hui ?",
    escalated: "J'ai contacté un agent humain qui vous rejoindra par email. Comment puis-je encore vous aider ?",
    error: "Une erreur s'est produite. Veuillez réessayer.",
    humanHint: 'Tapez "agent humain" pour demander un support humain',
  },
  ar: {
    title: 'الدعم', subtitle: 'احصل على مساعدة بشأن ContentAI — اسأل أي شيء.',
    faqTitle: 'الأسئلة المتكررة',
    inputPlaceholder: 'اكتب سؤالك…',
    send: 'إرسال', sending: '…',
    greeting: 'مرحباً! أنا مساعدك في ContentAI. كيف يمكنني مساعدتك اليوم؟',
    escalated: 'لقد تواصلت مع وكيل بشري سيصل إليك عبر البريد الإلكتروني. هل هناك شيء آخر أستطيع مساعدتك به؟',
    error: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    humanHint: 'اكتب "وكيل" للتواصل مع موظف دعم',
  },
  es: {
    title: 'Soporte', subtitle: 'Obtén ayuda con ContentAI — pregunta lo que quieras.',
    faqTitle: 'Preguntas Frecuentes',
    inputPlaceholder: 'Escribe tu pregunta…',
    send: 'Enviar', sending: '…',
    greeting: '¡Hola! Soy tu asistente de ContentAI. ¿Cómo puedo ayudarte hoy?',
    escalated: 'He notificado a un agente humano que se pondrá en contacto contigo por email. ¿Puedo ayudarte con algo más?',
    error: 'Algo salió mal. Por favor, inténtalo de nuevo.',
    humanHint: 'Escribe "agente humano" para solicitar soporte humano',
  },
  zh: {
    title: '客服支持', subtitle: '获取ContentAI帮助 — 随时提问。',
    faqTitle: '常见问题',
    inputPlaceholder: '输入您的问题…',
    send: '发送', sending: '…',
    greeting: '您好！我是您的ContentAI助手。今天我能为您做什么？',
    escalated: '我已通知人工客服，他们将通过电子邮件与您联系。还有什么我可以帮助您的吗？',
    error: '出现了问题，请重试。',
    humanHint: '输入"人工"请求人工客服',
  },
}

export default function SupportPage() {
  const { lang, isRTL } = useUILang()
  const ui = UI[lang]
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: ui.greeting },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: ui.error }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className={`p-6 max-w-6xl ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{ui.title}</h1>
      <p className="text-gray-500 text-sm mb-6">{ui.subtitle}</p>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Chat — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 flex flex-col" style={{ height: '560px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? (isRTL ? 'flex-row' : 'flex-row-reverse') : (isRTL ? 'flex-row-reverse' : '')}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mt-0.5 text-sm">🤖</div>
                )}
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                } ${isRTL ? 'text-right' : ''}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mt-0.5 text-sm">🤖</div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-4">
            <p className="text-xs text-gray-300 mb-2 text-center">{ui.humanHint}</p>
            <form onSubmit={sendMessage} className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={ui.inputPlaceholder}
                className={`flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none ${isRTL ? 'text-right' : ''}`}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60 shrink-0"
              >
                {loading ? ui.sending : ui.send}
              </button>
            </form>
          </div>
        </div>

        {/* FAQ — 2 cols */}
        <div className="lg:col-span-2 space-y-2">
          <p className="text-sm font-semibold text-gray-600 mb-3">{ui.faqTitle}</p>
          {FAQ_SECTIONS.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className={`w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <span className="text-base shrink-0">{faq.icon}</span>
                <span className="text-sm font-medium text-gray-800 flex-1">{faq.q}</span>
                <span className={`text-gray-400 text-xs shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {openFaq === i && (
                <div className={`px-4 pb-4 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-50 ${isRTL ? 'text-right' : ''}`}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
