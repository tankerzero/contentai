'use client'

import { useEffect, useState } from 'react'
import { useUILang } from '@/contexts/UILanguageContext'

const UI = {
  en: {
    title: 'Earn with ContentAI',
    subtitle: 'Share your referral link. Earn 20% commission on every paying user you bring.',
    yourLink: 'Your referral link',
    copy: 'Copy link', copied: '✓ Copied!',
    howTitle: 'How it works',
    steps: [
      { icon: '🔗', title: 'Share your link', desc: 'Send your unique referral link to friends, clients, or on social media.' },
      { icon: '👤', title: 'They sign up', desc: 'Anyone who signs up through your link is linked to your account.' },
      { icon: '💳', title: 'They upgrade', desc: 'When they subscribe to a paid plan, you earn 20% commission.' },
      { icon: '💸', title: 'You get paid', desc: 'We pay out via Stripe when your balance reaches $20.' },
    ],
    stats: { referrals: 'Referrals', converted: 'Converted', balance: 'Balance', pending: 'Pending payout' },
    commissions: { pending: 'Pending', converted: 'Converted', paid: 'Paid' },
    tableTitle: 'Referral history', tableEmpty: 'No referrals yet.',
    tableDate: 'Date', tableStatus: 'Status', tableAmount: 'Commission',
    rate: '20% commission', rateDesc: 'on every paid subscription from your referrals.',
    payoutNote: 'Payouts processed monthly. Minimum $20 balance required.',
    bufferNote: 'Want to schedule posts efficiently?',
    bufferCta: 'Use Buffer for scheduling →',
  },
  fr: {
    title: 'Gagnez avec ContentAI',
    subtitle: 'Partagez votre lien. Gagnez 20% de commission sur chaque utilisateur payant que vous amenez.',
    yourLink: 'Votre lien de parrainage',
    copy: 'Copier', copied: '✓ Copié !',
    howTitle: 'Comment ça marche',
    steps: [
      { icon: '🔗', title: 'Partagez votre lien', desc: 'Envoyez votre lien unique à vos amis, clients ou sur les réseaux.' },
      { icon: '👤', title: 'Ils s\'inscrivent', desc: 'Toute personne inscrite via votre lien est liée à votre compte.' },
      { icon: '💳', title: 'Ils s\'abonnent', desc: 'Quand ils passent à un forfait payant, vous touchez 20%.' },
      { icon: '💸', title: 'Vous êtes payé', desc: 'Paiement via Stripe dès que votre solde atteint 20$.' },
    ],
    stats: { referrals: 'Parrainages', converted: 'Convertis', balance: 'Solde', pending: 'En attente' },
    commissions: { pending: 'En attente', converted: 'Converti', paid: 'Payé' },
    tableTitle: 'Historique des parrainages', tableEmpty: 'Aucun parrainage pour l\'instant.',
    tableDate: 'Date', tableStatus: 'Statut', tableAmount: 'Commission',
    rate: '20% de commission', rateDesc: 'sur chaque abonnement payant de vos filleuls.',
    payoutNote: 'Paiements traités mensuellement. Solde minimum 20$ requis.',
    bufferNote: 'Planifiez vos publications efficacement ?',
    bufferCta: 'Utiliser Buffer pour programmer →',
  },
  ar: {
    title: 'اكسب مع ContentAI',
    subtitle: 'شارك رابطك. اكسب عمولة 20% على كل مستخدم مدفوع تجلبه.',
    yourLink: 'رابط الإحالة الخاص بك',
    copy: 'نسخ الرابط', copied: '✓ تم النسخ!',
    howTitle: 'كيف يعمل',
    steps: [
      { icon: '🔗', title: 'شارك رابطك', desc: 'أرسل رابطك الفريد للأصدقاء والعملاء أو على وسائل التواصل.' },
      { icon: '👤', title: 'يشتركون', desc: 'كل من يسجل عبر رابطك يرتبط بحسابك.' },
      { icon: '💳', title: 'يشتركون بخطة مدفوعة', desc: 'عندما يرقّون اشتراكهم تكسب 20% عمولة.' },
      { icon: '💸', title: 'تحصل على المال', desc: 'ندفع عبر Stripe عند بلوغ رصيدك 20 دولار.' },
    ],
    stats: { referrals: 'الإحالات', converted: 'المحوّلون', balance: 'الرصيد', pending: 'في الانتظار' },
    commissions: { pending: 'في الانتظار', converted: 'محوّل', paid: 'مدفوع' },
    tableTitle: 'سجل الإحالات', tableEmpty: 'لا إحالات بعد.',
    tableDate: 'التاريخ', tableStatus: 'الحالة', tableAmount: 'العمولة',
    rate: 'عمولة 20%', rateDesc: 'على كل اشتراك مدفوع من إحالاتك.',
    payoutNote: 'تُعالج المدفوعات شهرياً. الحد الأدنى للرصيد 20 دولار.',
    bufferNote: 'تريد جدولة منشوراتك بكفاءة؟',
    bufferCta: 'استخدم Buffer للجدولة ←',
  },
}

interface Referral {
  id: string
  status: 'pending' | 'converted' | 'paid'
  commission: number
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  converted: 'bg-green-50 text-green-700',
  paid: 'bg-brand-50 text-brand-700',
}

export default function EarnPage() {
  const { lang, isRTL } = useUILang()
  const uiLang: 'en' | 'fr' | 'ar' = (lang === 'es' || lang === 'zh') ? 'en' : lang
  const ui = UI[uiLang]

  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [balance, setBalance] = useState(0)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.json())
      .then(d => {
        setReferralCode(d.referral_code)
        setBalance(d.referral_balance ?? 0)
        setReferrals(d.referrals ?? [])
        setLoading(false)
      })
  }, [])

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://contentai.app'
  const referralLink = referralCode ? `${appUrl}/signup?ref=${referralCode}` : ''

  async function copyLink() {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const totalConverted = referrals.filter(r => r.status !== 'pending').length
  const totalEarned = referrals.reduce((s, r) => s + r.commission, 0)

  if (loading) {
    return (
      <div className={`p-8 flex items-center gap-3 text-gray-400 ${isRTL ? 'font-arabic flex-row-reverse' : ''}`}>
        <span className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`p-8 max-w-3xl ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{ui.title}</h1>
      <p className="text-gray-500 text-sm mb-8">{ui.subtitle}</p>

      {/* Referral link card */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white mb-8">
        <p className="text-brand-100 text-xs font-semibold uppercase tracking-wider mb-3">{ui.yourLink}</p>
        <div className={`flex items-center gap-3 bg-white/10 rounded-xl p-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <code className="text-sm flex-1 truncate text-white font-mono">{referralLink || '…'}</code>
          <button
            onClick={copyLink}
            className="bg-white text-brand-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-50 transition-colors shrink-0"
          >
            {copied ? ui.copied : ui.copy}
          </button>
        </div>
        <div className={`flex items-center gap-2 mt-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="text-brand-200 text-xs font-semibold">{ui.rate}</span>
          <span className="text-brand-300 text-xs">{ui.rateDesc}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: ui.stats.referrals, value: referrals.length },
          { label: ui.stats.converted, value: totalConverted },
          { label: ui.stats.balance,   value: `$${totalEarned.toFixed(2)}` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-5">{ui.howTitle}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {ui.steps.map((step, i) => (
            <div key={i} className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-2xl shrink-0">{step.icon}</span>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-5 pt-4 border-t border-gray-50">{ui.payoutNote}</p>
      </div>

      {/* Referral history */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">{ui.tableTitle}</h2>
        </div>
        {referrals.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">{ui.tableEmpty}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-50">
                <th className={`px-5 py-3 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{ui.tableDate}</th>
                <th className={`px-5 py-3 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{ui.tableStatus}</th>
                <th className={`px-5 py-3 font-medium ${isRTL ? 'text-left' : 'text-right'}`}>{ui.tableAmount}</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(r => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0">
                  <td className={`px-5 py-3 text-sm text-gray-500 ${isRTL ? 'text-right' : ''}`}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className={`px-5 py-3 ${isRTL ? 'text-right' : ''}`}>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? 'bg-gray-50 text-gray-500'}`}>
                      {ui.commissions[r.status]}
                    </span>
                  </td>
                  <td className={`px-5 py-3 text-sm font-semibold text-gray-700 ${isRTL ? 'text-left' : 'text-right'}`}>
                    ${r.commission.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Buffer CTA */}
      <div className={`mt-6 flex items-center gap-3 text-sm text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span>{ui.bufferNote}</span>
        <a
          href="https://buffer.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 hover:text-brand-700 font-medium"
        >
          {ui.bufferCta}
        </a>
      </div>
    </div>
  )
}
