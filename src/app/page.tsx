'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PLANS } from '@/lib/plans'
import { useUILang, type UILang } from '@/contexts/UILanguageContext'
import { CURRENCIES, type CurrencyCode, loadCurrency, saveCurrency, formatPrice } from '@/lib/currency'
import DemoModal from '@/components/DemoModal'

// ── Translations ────────────────────────────────────────────────────────────

const T = {
  en: {
    nav:    { signIn: 'Sign in', getStarted: 'Get started free' },
    hero: {
      eyebrow: 'Powered by Claude AI',
      headline: 'Create content that',
      headlineAccent: ' stands out',
      cycling: ['Instagram captions', 'blog posts', 'ad copy', 'Arabic content'],
      subtitle: 'Generate professional content in 5 languages — English, French, Arabic, Spanish & Chinese.',
      cta: 'Start for free', ctaSecondary: 'See demo',
      badge1: '🤖 Claude AI', badge2: '🌍 5 languages', badge3: '✦ RTL Arabic',
    },
    proof: {
      stats: [
        { value: '10K+', label: 'Pieces generated' },
        { value: '5',    label: 'Languages' },
        { value: '500+', label: 'Creators' },
      ],
      testimonials: [
        { name: 'Sophie M.',   location: 'Montréal',  text: 'ContentAI doubled my posting frequency. The French output is indistinguishable from native writing.', rating: 5 },
        { name: 'Ahmed K.',    location: 'Dubaï',     text: 'Finally an AI that generates proper Arabic RTL content. I use it every day for my social media.', rating: 5 },
        { name: 'Leila B.',    location: 'Paris',     text: 'The brand voice feature is a game changer. My clients always get content that sounds like them.', rating: 5 },
      ],
    },
    features: {
      title: 'Everything you need to create great content',
      subtitle: 'One platform. Five languages. Unlimited creativity.',
      items: [
        { icon: '✍️', title: 'Blog Posts',          desc: 'SEO-optimised long-form content with proper structure.' },
        { icon: '📱', title: 'Social Media',         desc: 'Punchy posts with hashtags for any platform.' },
        { icon: '📧', title: 'Email Campaigns',      desc: 'Persuasive emails with strong CTAs.' },
        { icon: '🛒', title: 'Product Descriptions', desc: 'Conversion-focused copy that sells.' },
        { icon: '🌙', title: 'Arabic RTL',           desc: 'Native Arabic content, correct direction.' },
        { icon: '🎨', title: 'Brand Voice',          desc: 'Consistent tone across all your content.' },
      ],
    },
    pricing: {
      title: 'Simple, transparent pricing',
      subtitle: 'Start free. Upgrade when you need more.',
      monthly: 'Monthly', yearly: 'Yearly',
      save: 'Save 2 months',
      recommended: 'Most popular',
      cta: 'Get started', ctaFree: 'Start free',
      perMonth: '/mo', perYear: '/yr',
      features: {
        free: ['5 generations/month', 'All content types', '5 languages', 'Standard quality'],
        basic: ['30 generations/month', 'All content types', '5 languages', 'Brand voice', 'Priority generation'],
        pro: ['100 generations/month', 'All content types', '5 languages', 'Brand voice', 'Priority generation', 'Weekly planner'],
      },
    },
    footer: {
      tagline: 'Made with ❤️ for MENA, Francophone & global creators',
      privacy: 'Privacy', terms: 'Terms', blog: 'Blog',
    },
    langToggle: 'FR | AR',
  },
  fr: {
    nav:    { signIn: 'Se connecter', getStarted: 'Commencer gratuitement' },
    hero: {
      eyebrow: 'Propulsé par Claude AI',
      headline: 'Créez du contenu qui',
      headlineAccent: ' se démarque',
      cycling: ['captions Instagram', 'articles de blog', 'textes publicitaires', 'contenu en arabe'],
      subtitle: 'Générez du contenu professionnel en 5 langues — français, anglais, arabe, espagnol et chinois.',
      cta: 'Commencer gratuitement', ctaSecondary: 'Voir la démo',
      badge1: '🤖 Claude AI', badge2: '🌍 5 langues', badge3: '✦ Arabe RTL',
    },
    proof: {
      stats: [
        { value: '10K+', label: 'Contenus générés' },
        { value: '5',    label: 'Langues' },
        { value: '500+', label: 'Créateurs' },
      ],
      testimonials: [
        { name: 'Sophie M.',   location: 'Montréal', text: 'ContentAI a doublé ma fréquence de publication. Le contenu en français est parfait, rien à retoucher.', rating: 5 },
        { name: 'Ahmed K.',    location: 'Dubaï',    text: "Enfin une IA qui génère du contenu arabe RTL correct. Je l'utilise tous les jours pour mes réseaux sociaux.", rating: 5 },
        { name: 'Leila B.',    location: 'Paris',    text: 'Le ton de marque est révolutionnaire. Mes clients reçoivent toujours un contenu qui leur ressemble vraiment.', rating: 5 },
      ],
    },
    features: {
      title: "Tout ce qu'il faut pour créer du contenu remarquable",
      subtitle: 'Une plateforme. Cinq langues. Une créativité sans limites.',
      items: [
        { icon: '✍️', title: 'Articles de Blog',       desc: 'Contenu long format optimisé SEO avec structure claire.' },
        { icon: '📱', title: 'Réseaux Sociaux',         desc: 'Publications percutantes avec hashtags pour toutes les plateformes.' },
        { icon: '📧', title: 'Campagnes Email',         desc: "Emails persuasifs avec des appels à l'action forts." },
        { icon: '🛒', title: 'Descriptions Produits',   desc: 'Textes axés sur la conversion qui vendent.' },
        { icon: '🌙', title: 'Arabe RTL',               desc: 'Contenu arabe natif, direction correcte.' },
        { icon: '🎨', title: 'Ton de Marque',           desc: "Cohérence de ton sur l'ensemble de votre contenu." },
      ],
    },
    pricing: {
      title: 'Tarification simple et transparente',
      subtitle: 'Commencez gratuitement. Évoluez quand vous en avez besoin.',
      monthly: 'Mensuel', yearly: 'Annuel',
      save: '2 mois offerts',
      recommended: 'Le plus populaire',
      cta: 'Commencer', ctaFree: 'Gratuit',
      perMonth: '/mois', perYear: '/an',
      features: {
        free: ['5 générations/mois', 'Tous les types', '5 langues', 'Qualité standard'],
        basic: ['30 générations/mois', 'Tous les types', '5 langues', 'Ton de marque', 'Priorité'],
        pro: ['100 générations/mois', 'Tous les types', '5 langues', 'Ton de marque', 'Priorité', 'Planificateur semaine'],
      },
    },
    footer: {
      tagline: 'Fait avec ❤️ pour les créateurs MENA, francophones et du monde entier',
      privacy: 'Confidentialité', terms: 'Conditions', blog: 'Blog',
    },
    langToggle: 'EN | AR',
  },
  ar: {
    nav:    { signIn: 'تسجيل الدخول', getStarted: 'ابدأ مجاناً' },
    hero: {
      eyebrow: 'مدعوم بتقنية Claude AI',
      headline: 'أنشئ محتوى',
      headlineAccent: ' يتميّز بالفعل',
      cycling: ['تعليقات إنستغرام', 'مقالات المدونة', 'نصوص إعلانية', 'محتوى عربي أصيل'],
      subtitle: 'أنشئ محتوى احترافياً بـ5 لغات — العربية والفرنسية والإنجليزية والإسبانية والصينية.',
      cta: 'ابدأ مجاناً', ctaSecondary: 'شاهد العرض',
      badge1: '🤖 Claude AI', badge2: '🌍 5 لغات', badge3: '✦ عربي RTL',
    },
    proof: {
      stats: [
        { value: '+10K', label: 'محتوى مولَّد' },
        { value: '5',    label: 'لغات' },
        { value: '+500', label: 'مبدع' },
      ],
      testimonials: [
        { name: 'سوفي م.',  location: 'مونتريال', text: 'ضاعف ContentAI تردد نشري. المحتوى بالفرنسية لا يمكن تمييزه عن كتابة الناطقين الأصليين.', rating: 5 },
        { name: 'أحمد ك.',  location: 'دبي',      text: 'أخيراً ذكاء اصطناعي يولّد محتوى عربياً صحيحاً من اليمين لليسار. أستخدمه يومياً لوسائل التواصل.', rating: 5 },
        { name: 'ليلى ب.',  location: 'باريس',    text: 'ميزة صوت العلامة التجارية تغيير قواعد اللعبة. عملائي يحصلون دائماً على محتوى يعكس هويتهم.', rating: 5 },
      ],
    },
    features: {
      title: 'كل ما تحتاجه لإنشاء محتوى رائع',
      subtitle: 'منصة واحدة. خمس لغات. إبداع بلا حدود.',
      items: [
        { icon: '✍️', title: 'مقالات المدونة',     desc: 'محتوى طويل محسّن لمحركات البحث مع هيكل واضح.' },
        { icon: '📱', title: 'وسائل التواصل',      desc: 'منشورات مؤثرة مع هاشتاقات لجميع المنصات.' },
        { icon: '📧', title: 'حملات البريد',        desc: 'رسائل إلكترونية مقنعة بدعوات واضحة للتصرف.' },
        { icon: '🛒', title: 'أوصاف المنتجات',     desc: 'نصوص موجّهة نحو التحويل تزيد المبيعات.' },
        { icon: '🌙', title: 'عربي RTL',            desc: 'محتوى عربي أصيل بالاتجاه الصحيح.' },
        { icon: '🎨', title: 'صوت العلامة',        desc: 'تناسق في الأسلوب عبر جميع محتواك.' },
      ],
    },
    pricing: {
      title: 'تسعير بسيط وشفاف',
      subtitle: 'ابدأ مجاناً. طوّر اشتراكك عند الحاجة.',
      monthly: 'شهري', yearly: 'سنوي',
      save: 'وفّر شهرين',
      recommended: 'الأكثر شعبية',
      cta: 'ابدأ الآن', ctaFree: 'مجاني',
      perMonth: '/شهر', perYear: '/سنة',
      features: {
        free: ['5 توليدات/شهر', 'جميع الأنواع', '5 لغات', 'جودة قياسية'],
        basic: ['30 توليداً/شهر', 'جميع الأنواع', '5 لغات', 'صوت العلامة', 'أولوية'],
        pro: ['100 توليد/شهر', 'جميع الأنواع', '5 لغات', 'صوت العلامة', 'أولوية', 'مخطط أسبوعي'],
      },
    },
    footer: {
      tagline: 'صُنع بـ ❤️ للمبدعين حول العالم',
      privacy: 'الخصوصية', terms: 'الشروط', blog: 'المدونة',
    },
    langToggle: 'EN | FR',
  },
  es: {
    nav:    { signIn: 'Iniciar sesión', getStarted: 'Empezar gratis' },
    hero: {
      eyebrow: 'Impulsado por Claude AI',
      headline: 'Crea contenido que',
      headlineAccent: ' destaca',
      cycling: ['captions de Instagram', 'artículos de blog', 'textos publicitarios', 'contenido en árabe'],
      subtitle: 'Genera contenido profesional en 5 idiomas — español, inglés, francés, árabe y chino.',
      cta: 'Comenzar gratis', ctaSecondary: 'Ver demo',
      badge1: '🤖 Claude AI', badge2: '🌍 5 idiomas', badge3: '✦ Árabe RTL',
    },
    proof: {
      stats: [
        { value: '10K+', label: 'Contenidos generados' },
        { value: '5',    label: 'Idiomas' },
        { value: '500+', label: 'Creadores' },
      ],
      testimonials: [
        { name: 'Sophie M.',   location: 'Montréal',  text: 'ContentAI duplicó mi frecuencia de publicación. El contenido en francés es perfecto, sin retoques.', rating: 5 },
        { name: 'Ahmed K.',    location: 'Dubái',     text: 'Por fin una IA que genera contenido árabe RTL correcto. Lo uso todos los días para mis redes sociales.', rating: 5 },
        { name: 'Leila B.',    location: 'París',     text: 'La función de voz de marca es revolucionaria. Mis clientes siempre reciben contenido que los representa.', rating: 5 },
      ],
    },
    features: {
      title: 'Todo lo que necesitas para crear gran contenido',
      subtitle: 'Una plataforma. Cinco idiomas. Creatividad ilimitada.',
      items: [
        { icon: '✍️', title: 'Artículos de Blog',        desc: 'Contenido largo optimizado para SEO con estructura clara.' },
        { icon: '📱', title: 'Redes Sociales',            desc: 'Posts impactantes con hashtags para cualquier plataforma.' },
        { icon: '📧', title: 'Campañas de Email',         desc: 'Emails persuasivos con llamadas a la acción claras.' },
        { icon: '🛒', title: 'Descripciones de Producto', desc: 'Textos orientados a la conversión que venden.' },
        { icon: '🌙', title: 'Árabe RTL',                 desc: 'Contenido árabe nativo con dirección correcta.' },
        { icon: '🎨', title: 'Voz de Marca',              desc: 'Tono consistente en todo tu contenido.' },
      ],
    },
    pricing: {
      title: 'Precios simples y transparentes',
      subtitle: 'Empieza gratis. Mejora cuando necesites más.',
      monthly: 'Mensual', yearly: 'Anual',
      save: 'Ahorra 2 meses',
      recommended: 'Más popular',
      cta: 'Comenzar', ctaFree: 'Gratis',
      perMonth: '/mes', perYear: '/año',
      features: {
        free: ['5 generaciones/mes', 'Todos los tipos', '5 idiomas', 'Calidad estándar'],
        basic: ['30 generaciones/mes', 'Todos los tipos', '5 idiomas', 'Voz de marca', 'Prioridad'],
        pro: ['100 generaciones/mes', 'Todos los tipos', '5 idiomas', 'Voz de marca', 'Prioridad', 'Planificador semanal'],
      },
    },
    footer: {
      tagline: 'Hecho con ❤️ para creadores de todo el mundo',
      privacy: 'Privacidad', terms: 'Términos', blog: 'Blog',
    },
    langToggle: 'EN | FR',
  },
  zh: {
    nav:    { signIn: '登录', getStarted: '免费开始' },
    hero: {
      eyebrow: '由 Claude AI 驱动',
      headline: '创作',
      headlineAccent: '出众的内容',
      cycling: ['Instagram 标题', '博客文章', '广告文案', '阿拉伯语内容'],
      subtitle: '用5种语言生成专业内容 — 中文、英语、法语、阿拉伯语和西班牙语，只需几秒钟。',
      cta: '免费开始', ctaSecondary: '查看演示',
      badge1: '🤖 Claude AI', badge2: '🌍 5种语言', badge3: '✦ 阿拉伯语RTL',
    },
    proof: {
      stats: [
        { value: '10K+', label: '已生成内容' },
        { value: '5',    label: '支持语言' },
        { value: '500+', label: '创作者' },
      ],
      testimonials: [
        { name: 'Sophie M.',  location: '蒙特利尔', text: 'ContentAI让我的发布频率翻倍。法语内容质量堪比母语写作，无需修改。', rating: 5 },
        { name: 'Ahmed K.',   location: '迪拜',     text: '终于有一款AI能正确生成阿拉伯语RTL内容。我每天都用它来管理社交媒体。', rating: 5 },
        { name: 'Leila B.',   location: '巴黎',     text: '品牌声音功能彻底改变了我的工作方式。客户总能收到真正代表他们的内容。', rating: 5 },
      ],
    },
    features: {
      title: '创作优质内容所需的一切',
      subtitle: '一个平台。五种语言。无限创意。',
      items: [
        { icon: '✍️', title: '博客文章',   desc: '结构清晰、SEO优化的长篇内容。' },
        { icon: '📱', title: '社交媒体',   desc: '适合各平台的精彩帖子，含热门标签。' },
        { icon: '📧', title: '邮件营销',   desc: '带有明确行动号召的说服性邮件。' },
        { icon: '🛒', title: '产品描述',   desc: '以转化为导向、提升销售的文案。' },
        { icon: '🌙', title: '阿拉伯语RTL', desc: '方向正确的原生阿拉伯语内容。' },
        { icon: '🎨', title: '品牌声音',   desc: '所有内容保持一致的品牌风格。' },
      ],
    },
    pricing: {
      title: '简单透明的定价',
      subtitle: '免费开始，按需升级。',
      monthly: '按月', yearly: '按年',
      save: '省2个月',
      recommended: '最受欢迎',
      cta: '立即开始', ctaFree: '免费',
      perMonth: '/月', perYear: '/年',
      features: {
        free: ['5次生成/月', '所有内容类型', '5种语言', '标准质量'],
        basic: ['30次生成/月', '所有内容类型', '5种语言', '品牌声音', '优先生成'],
        pro: ['100次生成/月', '所有内容类型', '5种语言', '品牌声音', '优先生成', '每周计划'],
      },
    },
    footer: {
      tagline: '用 ❤️ 为全球创作者打造',
      privacy: '隐私政策', terms: '服务条款', blog: '博客',
    },
    langToggle: 'EN | FR',
  },
} as const

const LANG_OPTIONS: { value: UILang; flag: string; label: string }[] = [
  { value: 'en', flag: '🇬🇧', label: 'EN' },
  { value: 'fr', flag: '🇫🇷', label: 'FR' },
  { value: 'ar', flag: '🇸🇦', label: 'AR' },
  { value: 'es', flag: '🇪🇸', label: 'ES' },
  { value: 'zh', flag: '🇨🇳', label: '中' },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { lang, setLang, isRTL } = useUILang()
  const t = T[lang]

  const [wordIdx, setWordIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  const [yearly, setYearly] = useState(false)
  const [currency, setCurrency] = useState<CurrencyCode>('CAD')
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    setCurrency(loadCurrency())
  }, [])

  function handleCurrencyChange(code: CurrencyCode) {
    setCurrency(code)
    saveCurrency(code)
  }

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setWordIdx(i => (i + 1) % t.hero.cycling.length)
        setVisible(true)
      }, 350)
    }, 2600)
    return () => clearInterval(id)
  }, [t.hero.cycling.length])

  const dir = isRTL ? 'rtl' : 'ltr'

  return (
    <div className={`min-h-screen bg-white ${isRTL ? 'font-arabic' : ''}`} dir={dir}>
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className={`flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1 L10.8 6.4 L16.5 6.4 L12 9.8 L13.8 15.2 L9 11.8 L4.2 15.2 L6 9.8 L1.5 6.4 L7.2 6.4 Z"
                fill="none" stroke="#0D7377" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            <span className="text-xl font-bold text-brand-700">ContentAI</span>
          </div>

          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Language picker */}
            <div className={`flex gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {LANG_OPTIONS.map(l => (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value)}
                  className={`h-8 px-2 rounded-lg text-xs font-semibold transition-all ${
                    lang === l.value ? 'bg-brand-50 ring-1 ring-brand-300 text-brand-700' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                  title={l.label}
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
            <Link href="/login" className="text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
              {t.nav.signIn}
            </Link>
            <Link href="/signup" className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
              {t.nav.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden hero-pattern">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
              {t.hero.eyebrow}
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
              {t.hero.headline}
              <span className="text-gradient-brand">{t.hero.headlineAccent}</span>
            </h1>

            {/* Cycling typewriter */}
            <div className="h-10 mb-4 flex items-center">
              <span className={`text-2xl font-semibold text-brand-600 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                {t.hero.cycling[wordIdx]}
              </span>
            </div>

            <p className="text-lg text-gray-500 mb-10 max-w-lg leading-relaxed">
              {t.hero.subtitle}
            </p>

            <div className={`flex items-center gap-4 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Link href="/signup" className="bg-brand-600 text-white px-7 py-3.5 rounded-2xl font-semibold text-base hover:bg-brand-700 transition-all shadow-lg hover:shadow-brand-200 hover:-translate-y-0.5">
                {t.hero.cta}
              </Link>
              <button
                onClick={() => setShowDemo(true)}
                className="text-gray-600 px-7 py-3.5 rounded-2xl font-semibold text-base border border-gray-200 hover:border-brand-300 hover:text-brand-700 transition-all"
              >
                {t.hero.ctaSecondary}
              </button>
            </div>

            {/* Badges */}
            <div className={`flex gap-3 mt-8 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
              {[t.hero.badge1, t.hero.badge2, t.hero.badge3].map(b => (
                <span key={b} className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Right: app mockup — always LTR regardless of page direction */}
          <div className="relative" dir="ltr">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 max-w-sm mx-auto relative">
              {/* Window chrome */}
              <div className="flex gap-1.5 mb-5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              {/* Mock UI */}
              <div className="space-y-3">
                <div className="flex gap-1.5">
                  {(['EN', 'FR', 'AR'] as const).map((label, i) => (
                    <div key={label} className={`h-7 px-2.5 rounded-lg text-xs flex items-center font-semibold ${i === 0 ? 'bg-brand-100 border border-brand-300 text-brand-700' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
                      {label}
                    </div>
                  ))}
                </div>
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
                <div className="flex flex-wrap gap-1.5">
                  {(['Blog', 'Social', 'Email', 'Ad', 'Product'] as const).map((label, i) => (
                    <div key={label} className={`h-8 px-2.5 rounded-lg text-xs flex items-center justify-center font-medium ${i === 0 ? 'bg-brand-50 border border-brand-200 text-brand-700' : 'bg-gray-50 border border-gray-100 text-gray-400'}`}>
                      {label}
                    </div>
                  ))}
                </div>
                <div className="h-14 bg-gray-50 rounded-xl border border-gray-100" />
                <div className="flex gap-1.5">
                  {['Pro', 'Casual', 'Friendly'].map(t => (
                    <div key={t} className="h-6 px-2 bg-gray-50 rounded-full border border-gray-100 text-xs text-gray-400 flex items-center">{t}</div>
                  ))}
                </div>
                <div className="h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">✨ Generate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hero video ──────────────────────────────────── */}
      <div className="hidden md:block py-8 bg-white">
        <div className="max-w-[800px] mx-auto px-6">
          <video
            key={lang === 'ar' ? 'ar' : 'en'}
            src={lang === 'ar' ? '/videos/teaser_arabic.mp4' : '/videos/teaser_english.mp4'}
            autoPlay
            muted
            loop
            playsInline
            className="w-full rounded-2xl shadow-lg"
          />
        </div>
      </div>

      {/* ── Stats bar ───────────────────────────────────── */}
      <section className="bg-brand-600 py-8">
        <div className={`max-w-4xl mx-auto px-6 flex items-center justify-around gap-8 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
          {t.proof.stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="text-brand-200 text-sm mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {t.proof.testimonials.map(tw => (
              <div key={tw.name} className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${isRTL ? 'text-right' : ''}`}>
                <div className={`flex mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {'★'.repeat(tw.rating).split('').map((s, i) => (
                    <span key={i} className="text-amber-400 text-sm">{s}</span>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{tw.text}&rdquo;</p>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                    {tw.name[0]}
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="text-sm font-semibold text-gray-800">{tw.name}</p>
                    <p className="text-xs text-gray-400">{tw.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Arabesque divider ───────────────────────────── */}
      <div className="divider-arabesque my-2" />

      {/* ── Features ────────────────────────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-14 ${isRTL ? 'font-arabic' : ''}`}>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{t.features.title}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t.features.subtitle}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.items.map(f => (
              <div
                key={f.title}
                className={`group bg-white rounded-2xl p-6 border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all duration-200 cursor-default ${isRTL ? 'text-right' : ''}`}
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{f.icon}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Arabesque divider ───────────────────────────── */}
      <div className="divider-arabesque my-2" />

      {/* ── Pricing ─────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{t.pricing.title}</h2>
            <p className="text-gray-500 mb-8">{t.pricing.subtitle}</p>

            {/* Monthly/yearly toggle + currency selector */}
            <div className={`flex flex-col items-center gap-3 ${isRTL ? 'font-arabic' : ''}`}>
              <div className={`inline-flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => setYearly(false)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${!yearly ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500'}`}
                >
                  {t.pricing.monthly}
                </button>
                <button
                  onClick={() => setYearly(true)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''} ${yearly ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500'}`}
                >
                  {t.pricing.yearly}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${yearly ? 'bg-white text-brand-700' : 'bg-amber-100 text-amber-700'}`}>
                    {t.pricing.save}
                  </span>
                </button>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <select
                  value={currency}
                  onChange={e => handleCurrencyChange(e.target.value as CurrencyCode)}
                  className="border border-gray-200 rounded-lg px-2.5 py-1 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
                  ))}
                </select>
                {currency !== 'CAD' && (
                  <span className="text-xs text-gray-400">Charged in CAD</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {(['free', 'basic', 'pro'] as const).map(key => {
              const plan = PLANS[key]
              const isRecommended = key === 'basic'
              const monthlyPrice = plan.price
              const yearlyPrice = Math.round(plan.price * 10)
              const displayPrice = yearly ? yearlyPrice : monthlyPrice
              const suffix = yearly ? t.pricing.perYear : t.pricing.perMonth
              const features = t.pricing.features[key]

              return (
                <div
                  key={key}
                  className={`rounded-2xl p-7 border relative flex flex-col ${
                    isRecommended ? 'border-brand-500 bg-gradient-to-b from-brand-50 to-white shadow-lg' : 'border-gray-200 bg-white'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      {t.pricing.recommended}
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <div className="mb-5">
                    <span className="text-4xl font-bold text-gray-900">
                      {displayPrice === 0 ? t.pricing.ctaFree : formatPrice(displayPrice, currency)}
                    </span>
                    {displayPrice > 0 && <span className="text-gray-400 text-sm">{suffix}</span>}
                  </div>
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {features.map(f => (
                      <li key={f} className={`flex items-start gap-2 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-brand-500 shrink-0 font-bold">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                      isRecommended
                        ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {key === 'free' ? t.pricing.ctaFree : t.pricing.cta}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className={`max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M9 1 L10.8 6.4 L16.5 6.4 L12 9.8 L13.8 15.2 L9 11.8 L4.2 15.2 L6 9.8 L1.5 6.4 L7.2 6.4 Z"
                fill="none" stroke="#0D7377" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            <span className="font-bold text-gray-700">ContentAI</span>
            <span className="text-gray-300 mx-2">·</span>
            <span className="text-sm text-gray-400">{t.footer.tagline}</span>
          </div>
          <div className={`flex items-center gap-6 text-sm text-gray-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">{t.footer.privacy}</Link>
            <Link href="/terms"   className="hover:text-gray-600 transition-colors">{t.footer.terms}</Link>
            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* Twitter/X */}
              <a href="#" aria-label="Twitter" className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-brand-50 flex items-center justify-center text-gray-400 hover:text-brand-600 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              {/* LinkedIn */}
              <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-brand-50 flex items-center justify-center text-gray-400 hover:text-brand-600 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-brand-50 flex items-center justify-center text-gray-400 hover:text-brand-600 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
          <p className="text-xs text-gray-300">© 2026 ContentAI</p>
        </div>
      </footer>
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
    </div>
  )
}
