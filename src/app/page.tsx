'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PLANS } from '@/lib/plans'
import { useUILang, type UILang } from '@/contexts/UILanguageContext'
import { CURRENCIES, type CurrencyCode, loadCurrency, saveCurrency, formatPrice } from '@/lib/currency'
import DemoModal from '@/components/DemoModal'

// ── Translations ────────────────────────────────────────────────────────────

const T = {
  en: {
    nav: { signIn: 'Sign in', getStarted: 'Get started free' },
    hero: {
      eyebrow: 'Powered by Claude AI',
      headline: 'Create content that',
      headlineAccent: ' stands out',
      cycling: ['Instagram captions', 'blog posts', 'ad copy', 'Arabic content'],
      subtitle: 'Generate professional content in 5 languages — English, French, Arabic, Spanish & Chinese.',
      tagline: 'Generate. Approve. Posted. ContentAI handles everything after you click.',
      cta: 'Start for free', ctaSecondary: 'See demo',
      badge1: '🤖 Claude AI', badge2: '🌍 5 languages', badge3: '✦ RTL Arabic',
    },
    proof: {
      langBand: 'EN · FR · AR · ES · 中文 — Five languages. One tool.',
      founderQuote: 'I built this because I couldn\'t find an AI content tool that actually worked in French and Arabic — not just translated into them. So I made one.',
      founderName: '— Slim, founder, Montréal 🇨🇦',
    },
    features: {
      title: 'Everything you need to create great content',
      subtitle: 'One platform. Five languages. Unlimited creativity.',
      autoPost: {
        icon: '🚀',
        title: 'Writes & Posts For You',
        desc: 'ContentAI generates your content AND publishes it to your social accounts automatically. Connect Twitter, LinkedIn and Facebook once — ContentAI handles everything else.',
        badge: 'PRO',
      },
      items: [
        { icon: '✍️', title: 'Blog Posts',          desc: 'SEO-optimised long-form content with proper structure.' },
        { icon: '📱', title: 'Social Media',         desc: 'Punchy posts with hashtags for any platform.' },
        { icon: '📧', title: 'Email Campaigns',      desc: 'CASL-compliant campaigns for your list.' },
        { icon: '🛒', title: 'Product Descriptions', desc: 'Conversion-focused copy that sells.' },
        { icon: '🌙', title: 'Arabic RTL',           desc: 'Native Arabic content, correct direction.' },
        { icon: '🎨', title: 'Brand Voice',          desc: 'Consistent tone across all your content.' },
        { icon: '📅', title: 'Content Planner',      desc: 'Plan your week of content in minutes.' },
        { icon: '📊', title: 'Analytics',            desc: 'Track engagement across all platforms.' },
      ],
    },
    howItWorks: {
      title: 'How it works',
      subtitle: 'Three steps. Zero manual effort.',
      steps: [
        {
          icon: '✨',
          step: 'Step 1',
          title: 'Generate',
          desc: 'Describe your topic, pick your language and tone. ContentAI writes professional content in seconds — natively in EN, FR, AR, ES or 中文. No prompting skills needed.',
        },
        {
          icon: '✅',
          step: 'Step 2',
          title: 'Approve',
          desc: 'Get an email preview before anything goes live. One tap to approve, one tap to skip. You stay in control without doing any of the work.',
        },
        {
          icon: '🚀',
          step: 'Step 3',
          title: 'Posted',
          desc: 'ContentAI publishes directly to Twitter, LinkedIn and Facebook at the scheduled time. No copy-pasting. No logging in to 3 different apps. Just results.',
        },
      ],
      tagline: 'Most tools stop at writing. ContentAI goes all the way to posted.',
    },
    pricing: {
      title: 'Simple, transparent pricing',
      subtitle: 'Start free. Upgrade when you need more.',
      monthly: 'Monthly', yearly: 'Yearly',
      save: 'Save 2 months',
      recommended: 'Most popular',
      cta: 'Get started', ctaFree: 'Start free',
      perMonth: '/mo', perYear: '/yr',
      taglinePro: 'Create content once. Wake up to it already posted.',
      features: {
        free:   ['5 generations/month', 'All content types', '5 languages', 'Standard quality'],
        basic:  ['30 generations/month', 'All content types', '5 languages', 'Brand voice', 'Priority generation'],
        pro:    [
          'ContentAI writes your content automatically',
          'Email preview — approve in one tap',
          'Auto-posts to Twitter, LinkedIn & Facebook',
          'Zero copy-pasting. Zero manual posting.',
          'Brand voice profiles so it sounds like you',
        ],
        agency: [
          'Unlimited generations',
          'Everything in Pro',
          'Multi-workspace (manage client accounts)',
          'Client approval flow',
          'Priority support',
          'White-label ready',
        ],
      },
    },
    alacarte: {
      title: 'One-time purchases',
      items: [
        {
          icon: '⚡',
          title: 'Content Pack',
          price: 'CA$4.99',
          desc: '20 extra generations, added instantly to your account.',
          cta: 'Buy now',
          addOnId: 'content_pack',
        },
        {
          icon: '🎨',
          title: 'Brand Voice Setup',
          price: 'CA$19',
          desc: 'We configure your brand voice professionally — delivered within 48h.',
          cta: 'Get setup',
          addOnId: 'brand_voice_setup',
        },
      ],
    },
    phBanner: '🚀 We\'re live on Product Hunt today! Support us →',
    faq: {
      title: 'Frequently asked questions',
      items: [
        { q: 'What AI powers ContentAI?', a: 'ContentAI is built on Claude AI by Anthropic — one of the most capable and safety-focused AI models available.' },
        { q: 'Is my content private?', a: 'Yes. Your content and brand data are never used to train AI models. We comply with PIPEDA and Quebec Law 25.' },
        { q: 'Does it really write in Arabic, not just translate?', a: 'Yes — ContentAI generates Arabic content natively, with proper RTL layout, cultural context, and no translation artifacts.' },
        { q: 'Can I try it without a credit card?', a: 'Yes — the free plan gives you 5 generations with no credit card required.' },
        { q: 'What social platforms does auto-posting support?', a: 'Twitter/X, LinkedIn, and Facebook. You review and approve every post before it goes live.' },
        { q: 'What happens if I need more generations?', a: 'You can upgrade your plan anytime, or add a one-time Content Pack (CA$4.99) for 20 extra generations.' },
      ],
    },
    footer: {
      tagline: 'Made with ❤️ for MENA, Francophone & global creators',
      privacy: 'Privacy', terms: 'Terms', blog: 'Blog',
    },
    langToggle: 'FR | AR',
  },
  fr: {
    nav: { signIn: 'Se connecter', getStarted: 'Commencer gratuitement' },
    hero: {
      eyebrow: 'Propulsé par Claude AI',
      headline: 'Créez du contenu qui',
      headlineAccent: ' se démarque',
      cycling: ['captions Instagram', 'articles de blog', 'textes publicitaires', 'contenu en arabe'],
      subtitle: 'Générez du contenu professionnel en 5 langues — français, anglais, arabe, espagnol et chinois.',
      tagline: 'Générez. Approuvez. Publié. ContentAI gère tout après votre validation.',
      cta: 'Commencer gratuitement', ctaSecondary: 'Voir la démo',
      badge1: '🤖 Claude AI', badge2: '🌍 5 langues', badge3: '✦ Arabe RTL',
    },
    proof: {
      langBand: 'EN · FR · AR · ES · 中文 — Cinq langues. Un seul outil.',
      founderQuote: "J'ai créé ContentAI parce que je ne trouvais pas d'outil IA qui fonctionnait vraiment en français et en arabe — pas juste traduit. Alors je l'ai construit.",
      founderName: '— Slim, fondateur, Montréal 🇨🇦',
    },
    features: {
      title: "Tout ce qu'il faut pour créer du contenu remarquable",
      subtitle: 'Une plateforme. Cinq langues. Une créativité sans limites.',
      autoPost: {
        icon: '🚀',
        title: 'Écrit et publie pour vous',
        desc: 'ContentAI génère votre contenu ET le publie automatiquement sur vos réseaux sociaux. Connectez Twitter, LinkedIn et Facebook une seule fois — ContentAI gère tout le reste.',
        badge: 'PRO',
      },
      items: [
        { icon: '✍️', title: 'Articles de Blog',      desc: 'Contenu long format optimisé SEO avec structure claire.' },
        { icon: '📱', title: 'Réseaux Sociaux',        desc: 'Publications percutantes avec hashtags pour toutes les plateformes.' },
        { icon: '📧', title: 'Campagnes Email',        desc: "Emails persuasifs conformes CASL pour votre liste." },
        { icon: '🛒', title: 'Descriptions Produits',  desc: 'Textes axés sur la conversion qui vendent.' },
        { icon: '🌙', title: 'Arabe RTL',              desc: 'Contenu arabe natif, direction correcte.' },
        { icon: '🎨', title: 'Ton de Marque',          desc: "Cohérence de ton sur l'ensemble de votre contenu." },
        { icon: '📅', title: 'Planificateur',          desc: 'Planifiez votre semaine de contenu en minutes.' },
        { icon: '📊', title: 'Analytiques',            desc: "Suivez l'engagement sur toutes les plateformes." },
      ],
    },
    howItWorks: {
      title: 'Comment ça marche',
      subtitle: 'Trois étapes. Zéro effort manuel.',
      steps: [
        {
          icon: '✨',
          step: 'Étape 1',
          title: 'Générez',
          desc: "Décrivez votre sujet, choisissez votre langue et votre ton. ContentAI rédige un contenu professionnel en quelques secondes — nativement en FR, EN, AR, ES ou 中文. Aucune compétence en prompting requise.",
        },
        {
          icon: '✅',
          step: 'Étape 2',
          title: 'Approuvez',
          desc: "Recevez un aperçu par email avant toute publication. Un tap pour approuver, un tap pour passer. Vous gardez le contrôle sans faire le travail.",
        },
        {
          icon: '🚀',
          step: 'Étape 3',
          title: 'Publié',
          desc: "ContentAI publie directement sur Twitter, LinkedIn et Facebook à l'heure prévue. Pas de copier-coller. Pas de connexion à 3 applis différentes. Juste des résultats.",
        },
      ],
      tagline: "La plupart des outils s'arrêtent à l'écriture. ContentAI va jusqu'à la publication.",
    },
    pricing: {
      title: 'Tarification simple et transparente',
      subtitle: 'Commencez gratuitement. Évoluez quand vous en avez besoin.',
      monthly: 'Mensuel', yearly: 'Annuel',
      save: '2 mois offerts',
      recommended: 'Le plus populaire',
      cta: 'Commencer', ctaFree: 'Gratuit',
      perMonth: '/mois', perYear: '/an',
      taglinePro: 'Créez une fois. Réveillez-vous avec tout déjà publié.',
      features: {
        free:   ['5 générations/mois', 'Tous les types', '5 langues', 'Qualité standard'],
        basic:  ['30 générations/mois', 'Tous les types', '5 langues', 'Ton de marque', 'Priorité'],
        pro:    [
          'ContentAI rédige votre contenu automatiquement',
          'Aperçu email — approuvez en un tap',
          'Publie sur Twitter, LinkedIn et Facebook',
          'Zéro copier-coller. Zéro publication manuelle.',
          'Profils de ton de marque pour garder votre style',
        ],
        agency: [
          'Générations illimitées',
          'Tout le Pro inclus',
          'Multi-espace (gérez des comptes clients)',
          "Flux d'approbation client",
          'Support prioritaire',
          'Prêt pour le marque blanche',
        ],
      },
    },
    alacarte: {
      title: 'Achats uniques',
      items: [
        {
          icon: '⚡',
          title: 'Pack Contenu',
          price: '4,99 CA$',
          desc: '20 générations supplémentaires ajoutées instantanément.',
          cta: 'Acheter',
          addOnId: 'content_pack',
        },
        {
          icon: '🎨',
          title: 'Configuration Ton de Marque',
          price: '19 CA$',
          desc: 'Nous configurons votre ton de marque professionnellement — livré dans 48h.',
          cta: 'Commander',
          addOnId: 'brand_voice_setup',
        },
      ],
    },
    phBanner: '🚀 Nous sommes en direct sur Product Hunt aujourd\'hui ! Soutenez-nous →',
    faq: {
      title: 'Questions fréquentes',
      items: [
        { q: 'Quelle IA propulse ContentAI ?', a: "ContentAI est propulsé par Claude AI d'Anthropic — l'un des modèles d'IA les plus performants et axés sur la sécurité." },
        { q: 'Mon contenu est-il privé ?', a: 'Oui. Votre contenu et vos données de marque ne sont jamais utilisés pour entraîner des modèles IA. Nous respectons la LPRPDE et la Loi 25 du Québec.' },
        { q: "Écrit-il vraiment en arabe, pas juste traduit ?", a: "Oui — ContentAI génère du contenu arabe nativement, avec le bon sens de lecture, le contexte culturel approprié, et sans artefacts de traduction." },
        { q: 'Puis-je l\'essayer sans carte de crédit ?', a: 'Oui — le plan gratuit vous offre 5 générations sans carte de crédit requise.' },
        { q: 'Quelles plateformes sociales sont prises en charge ?', a: 'Twitter/X, LinkedIn et Facebook. Vous révisez et approuvez chaque publication avant qu\'elle soit mise en ligne.' },
        { q: "Que faire si j'ai besoin de plus de générations ?", a: "Vous pouvez mettre à niveau votre plan à tout moment, ou ajouter un Content Pack ponctuel (4,99 CA$) pour 20 générations supplémentaires." },
      ],
    },
    footer: {
      tagline: 'Fait avec ❤️ pour les créateurs MENA, francophones et du monde entier',
      privacy: 'Confidentialité', terms: 'Conditions', blog: 'Blog',
    },
    langToggle: 'EN | AR',
  },
  ar: {
    nav: { signIn: 'تسجيل الدخول', getStarted: 'ابدأ مجاناً' },
    hero: {
      eyebrow: 'مدعوم بتقنية Claude AI',
      headline: 'أنشئ محتوى',
      headlineAccent: ' يتميّز بالفعل',
      cycling: ['تعليقات إنستغرام', 'مقالات المدونة', 'نصوص إعلانية', 'محتوى عربي أصيل'],
      subtitle: 'أنشئ محتوى احترافياً بـ5 لغات — العربية والفرنسية والإنجليزية والإسبانية والصينية.',
      tagline: 'أنشئ. وافق. نُشر. ContentAI يتولى كل شيء بعد موافقتك.',
      cta: 'ابدأ مجاناً', ctaSecondary: 'شاهد العرض',
      badge1: '🤖 Claude AI', badge2: '🌍 5 لغات', badge3: '✦ عربي RTL',
    },
    proof: {
      langBand: 'EN · FR · AR · ES · 中文 — خمس لغات. أداة واحدة.',
      founderQuote: 'بنيت هذا لأنني لم أجد أداة ذكاء اصطناعي تعمل فعلاً بالفرنسية والعربية — لا مجرد ترجمة. فقررت أن أبنيها بنفسي.',
      founderName: '— سليم، المؤسس، مونتريال 🇨🇦',
    },
    features: {
      title: 'كل ما تحتاجه لإنشاء محتوى رائع',
      subtitle: 'منصة واحدة. خمس لغات. إبداع بلا حدود.',
      autoPost: {
        icon: '🚀',
        title: 'يكتب وينشر نيابةً عنك',
        desc: 'ContentAI يولّد محتواك وينشره تلقائياً على حساباتك في وسائل التواصل. صِل Twitter وLinkedIn وFacebook مرة واحدة — ContentAI يتولى الباقي.',
        badge: 'PRO',
      },
      items: [
        { icon: '✍️', title: 'مقالات المدونة',   desc: 'محتوى طويل محسّن لمحركات البحث مع هيكل واضح.' },
        { icon: '📱', title: 'وسائل التواصل',    desc: 'منشورات مؤثرة مع هاشتاقات لجميع المنصات.' },
        { icon: '📧', title: 'حملات البريد',      desc: 'رسائل إلكترونية مقنعة مع دعوات واضحة للتصرف.' },
        { icon: '🛒', title: 'أوصاف المنتجات',   desc: 'نصوص موجّهة نحو التحويل تزيد المبيعات.' },
        { icon: '🌙', title: 'عربي RTL',          desc: 'محتوى عربي أصيل بالاتجاه الصحيح.' },
        { icon: '🎨', title: 'صوت العلامة',      desc: 'تناسق في الأسلوب عبر جميع محتواك.' },
        { icon: '📅', title: 'مخطط المحتوى',     desc: 'خطط أسبوعك من المحتوى في دقائق.' },
        { icon: '📊', title: 'التحليلات',         desc: 'تتبع التفاعل عبر جميع المنصات.' },
      ],
    },
    howItWorks: {
      title: 'كيف يعمل',
      subtitle: 'ثلاث خطوات. صفر جهد يدوي.',
      steps: [
        {
          icon: '✨',
          step: 'الخطوة 1',
          title: 'أنشئ',
          desc: 'صف موضوعك، اختر لغتك وأسلوبك. ContentAI يكتب محتوى احترافياً في ثوانٍ — بشكل أصيل بالعربية والفرنسية والإنجليزية والإسبانية والصينية. لا تحتاج إلى مهارات في الأوامر.',
        },
        {
          icon: '✅',
          step: 'الخطوة 2',
          title: 'وافق',
          desc: 'احصل على معاينة بالبريد الإلكتروني قبل أي نشر. نقرة واحدة للموافقة، نقرة للتخطي. أنت تتحكم دون أن تقوم بأي عمل.',
        },
        {
          icon: '🚀',
          step: 'الخطوة 3',
          title: 'نُشر',
          desc: 'ContentAI ينشر مباشرةً على Twitter وLinkedIn وFacebook في الوقت المحدد. لا نسخ ولصق. لا تسجيل دخول لثلاث تطبيقات مختلفة. فقط نتائج.',
        },
      ],
      tagline: 'معظم الأدوات تتوقف عند الكتابة. ContentAI يصل حتى النشر.',
    },
    pricing: {
      title: 'تسعير بسيط وشفاف',
      subtitle: 'ابدأ مجاناً. طوّر اشتراكك عند الحاجة.',
      monthly: 'شهري', yearly: 'سنوي',
      save: 'وفّر شهرين',
      recommended: 'الأكثر شعبية',
      cta: 'ابدأ الآن', ctaFree: 'مجاني',
      perMonth: '/شهر', perYear: '/سنة',
      taglinePro: 'أنشئ المحتوى مرة واحدة. استيقظ وقد نُشر بالفعل.',
      features: {
        free:   ['5 توليدات/شهر', 'جميع الأنواع', '5 لغات', 'جودة قياسية'],
        basic:  ['30 توليداً/شهر', 'جميع الأنواع', '5 لغات', 'صوت العلامة', 'أولوية'],
        pro:    [
          'ContentAI يكتب محتواك تلقائياً',
          'معاينة بالبريد — وافق بنقرة واحدة',
          'ينشر على Twitter وLinkedIn وFacebook',
          'صفر نسخ ولصق. صفر نشر يدوي.',
          'ملفات صوت العلامة لتبقى بأسلوبك',
        ],
        agency: [
          'توليدات غير محدودة',
          'كل مزايا Pro',
          'متعدد الأعمال (إدارة حسابات العملاء)',
          'تدفق موافقة العميل',
          'دعم ذو أولوية',
          'جاهز للعلامة البيضاء',
        ],
      },
    },
    alacarte: {
      title: 'مشتريات لمرة واحدة',
      items: [
        {
          icon: '⚡',
          title: 'حزمة المحتوى',
          price: '4.99 دولار كندي',
          desc: '20 توليداً إضافياً يُضاف فوراً إلى حسابك.',
          cta: 'اشتر الآن',
          addOnId: 'content_pack',
        },
        {
          icon: '🎨',
          title: 'إعداد صوت العلامة',
          price: '19 دولاراً كندياً',
          desc: 'نُعدّ صوت علامتك التجارية باحترافية — يُسلَّم خلال 48 ساعة.',
          cta: 'اطلب الإعداد',
          addOnId: 'brand_voice_setup',
        },
      ],
    },
    phBanner: '🚀 نحن الآن على Product Hunt! ادعمنا →',
    faq: {
      title: 'الأسئلة الشائعة',
      items: [
        { q: 'ما هو الذكاء الاصطناعي الذي يشغّل ContentAI؟', a: 'يعتمد ContentAI على Claude AI من Anthropic — أحد أكثر نماذج الذكاء الاصطناعي قدرةً وأماناً.' },
        { q: 'هل محتواي خاص؟', a: 'نعم. لا يُستخدم محتواك أو بيانات علامتك التجارية في تدريب نماذج الذكاء الاصطناعي. نحن ملتزمون بـ PIPEDA وقانون 25 في كيبيك.' },
        { q: 'هل يكتب باللغة العربية فعلاً لا مجرد ترجمة؟', a: 'نعم — يُنشئ ContentAI المحتوى العربي بشكل أصلي، مع تخطيط صحيح من اليمين إلى اليسار، وسياق ثقافي مناسب، دون أي أثر للترجمة.' },
        { q: 'هل يمكنني التجربة دون بطاقة ائتمان؟', a: 'نعم — تتيح لك الخطة المجانية 5 عمليات توليد دون الحاجة إلى بطاقة ائتمان.' },
        { q: 'ما منصات التواصل الاجتماعي المدعومة للنشر التلقائي؟', a: 'تويتر/X وLinkedIn وفيسبوك. تراجع وتوافق على كل منشور قبل نشره.' },
        { q: 'ماذا أفعل إذا احتجت مزيداً من التوليدات؟', a: 'يمكنك ترقية خطتك في أي وقت، أو إضافة Content Pack لمرة واحدة (4.99 دولار كندي) للحصول على 20 توليداً إضافياً.' },
      ],
    },
    footer: {
      tagline: 'صُنع بـ ❤️ للمبدعين حول العالم',
      privacy: 'الخصوصية', terms: 'الشروط', blog: 'المدونة',
    },
    langToggle: 'EN | FR',
  },
  es: {
    nav: { signIn: 'Iniciar sesión', getStarted: 'Empezar gratis' },
    hero: {
      eyebrow: 'Impulsado por Claude AI',
      headline: 'Crea contenido que',
      headlineAccent: ' destaca',
      cycling: ['captions de Instagram', 'artículos de blog', 'textos publicitarios', 'contenido en árabe'],
      subtitle: 'Genera contenido profesional en 5 idiomas — español, inglés, francés, árabe y chino.',
      tagline: 'Genera. Aprueba. Publicado. ContentAI se encarga del resto.',
      cta: 'Comenzar gratis', ctaSecondary: 'Ver demo',
      badge1: '🤖 Claude AI', badge2: '🌍 5 idiomas', badge3: '✦ Árabe RTL',
    },
    proof: {
      langBand: 'EN · FR · AR · ES · 中文 — Cinco idiomas. Una herramienta.',
      founderQuote: 'Construí esto porque no encontraba una herramienta de IA que funcionara de verdad en francés y árabe — no solo traducido. Así que la construí yo mismo.',
      founderName: '— Slim, fundador, Montréal 🇨🇦',
    },
    features: {
      title: 'Todo lo que necesitas para crear gran contenido',
      subtitle: 'Una plataforma. Cinco idiomas. Creatividad ilimitada.',
      autoPost: {
        icon: '🚀',
        title: 'Escribe y publica por ti',
        desc: 'ContentAI genera tu contenido Y lo publica automáticamente en tus redes sociales. Conecta Twitter, LinkedIn y Facebook una vez — ContentAI hace todo lo demás.',
        badge: 'PRO',
      },
      items: [
        { icon: '✍️', title: 'Artículos de Blog',        desc: 'Contenido largo optimizado para SEO con estructura clara.' },
        { icon: '📱', title: 'Redes Sociales',            desc: 'Posts impactantes con hashtags para cualquier plataforma.' },
        { icon: '📧', title: 'Campañas de Email',         desc: 'Emails persuasivos con llamadas a la acción claras.' },
        { icon: '🛒', title: 'Descripciones de Producto', desc: 'Textos orientados a la conversión que venden.' },
        { icon: '🌙', title: 'Árabe RTL',                 desc: 'Contenido árabe nativo con dirección correcta.' },
        { icon: '🎨', title: 'Voz de Marca',              desc: 'Tono consistente en todo tu contenido.' },
        { icon: '📅', title: 'Planificador',              desc: 'Planifica tu semana de contenido en minutos.' },
        { icon: '📊', title: 'Analíticas',                desc: 'Rastrea el engagement en todas las plataformas.' },
      ],
    },
    howItWorks: {
      title: 'Cómo funciona',
      subtitle: 'Tres pasos. Cero esfuerzo manual.',
      steps: [
        {
          icon: '✨',
          step: 'Paso 1',
          title: 'Genera',
          desc: 'Describe tu tema, elige tu idioma y tono. ContentAI escribe contenido profesional en segundos — de forma nativa en ES, EN, FR, AR o 中文. Sin necesidad de habilidades de prompting.',
        },
        {
          icon: '✅',
          step: 'Paso 2',
          title: 'Aprueba',
          desc: 'Recibe una vista previa por email antes de que se publique nada. Un toque para aprobar, uno para saltar. Tú controlas sin hacer el trabajo.',
        },
        {
          icon: '🚀',
          step: 'Paso 3',
          title: 'Publicado',
          desc: 'ContentAI publica directamente en Twitter, LinkedIn y Facebook a la hora programada. Sin copiar y pegar. Sin iniciar sesión en 3 apps diferentes. Solo resultados.',
        },
      ],
      tagline: 'La mayoría de las herramientas se detienen en escribir. ContentAI va hasta publicado.',
    },
    pricing: {
      title: 'Precios simples y transparentes',
      subtitle: 'Empieza gratis. Mejora cuando necesites más.',
      monthly: 'Mensual', yearly: 'Anual',
      save: 'Ahorra 2 meses',
      recommended: 'Más popular',
      cta: 'Comenzar', ctaFree: 'Gratis',
      perMonth: '/mes', perYear: '/año',
      taglinePro: 'Crea contenido una vez. Despiértate con todo ya publicado.',
      features: {
        free:   ['5 generaciones/mes', 'Todos los tipos', '5 idiomas', 'Calidad estándar'],
        basic:  ['30 generaciones/mes', 'Todos los tipos', '5 idiomas', 'Voz de marca', 'Prioridad'],
        pro:    [
          'ContentAI escribe tu contenido automáticamente',
          'Vista previa email — aprueba en un toque',
          'Publica en Twitter, LinkedIn y Facebook',
          'Cero copiar-pegar. Cero publicación manual.',
          'Perfiles de voz de marca para sonar siempre igual',
        ],
        agency: [
          'Generaciones ilimitadas',
          'Todo lo de Pro',
          'Multi-espacio (gestiona cuentas de clientes)',
          'Flujo de aprobación de clientes',
          'Soporte prioritario',
          'Listo para marca blanca',
        ],
      },
    },
    alacarte: {
      title: 'Compras únicas',
      items: [
        {
          icon: '⚡',
          title: 'Pack de Contenido',
          price: 'CA$4.99',
          desc: '20 generaciones extra añadidas instantáneamente a tu cuenta.',
          cta: 'Comprar ahora',
          addOnId: 'content_pack',
        },
        {
          icon: '🎨',
          title: 'Configuración de Voz de Marca',
          price: 'CA$19',
          desc: 'Configuramos tu voz de marca profesionalmente — entregado en 48h.',
          cta: 'Obtener setup',
          addOnId: 'brand_voice_setup',
        },
      ],
    },
    phBanner: '🚀 ¡Estamos en vivo en Product Hunt hoy! Apóyanos →',
    faq: {
      title: 'Preguntas frecuentes',
      items: [
        { q: '¿Qué IA impulsa ContentAI?', a: 'ContentAI está impulsado por Claude AI de Anthropic — uno de los modelos de IA más capaces y enfocados en la seguridad.' },
        { q: '¿Mi contenido es privado?', a: 'Sí. Tu contenido y datos de marca nunca se usan para entrenar modelos de IA. Cumplimos con PIPEDA y la Ley 25 de Quebec.' },
        { q: '¿Realmente escribe en árabe, no solo traduce?', a: 'Sí — ContentAI genera contenido en árabe de forma nativa, con diseño RTL correcto, contexto cultural y sin artefactos de traducción.' },
        { q: '¿Puedo probarlo sin tarjeta de crédito?', a: 'Sí — el plan gratuito te da 5 generaciones sin necesidad de tarjeta de crédito.' },
        { q: '¿Qué plataformas sociales admite la publicación automática?', a: 'Twitter/X, LinkedIn y Facebook. Revisas y apruebas cada publicación antes de que se publique.' },
        { q: '¿Qué pasa si necesito más generaciones?', a: 'Puedes actualizar tu plan en cualquier momento, o añadir un Content Pack puntual (CA$4.99) para 20 generaciones adicionales.' },
      ],
    },
    footer: {
      tagline: 'Hecho con ❤️ para creadores de todo el mundo',
      privacy: 'Privacidad', terms: 'Términos', blog: 'Blog',
    },
    langToggle: 'EN | FR',
  },
  zh: {
    nav: { signIn: '登录', getStarted: '免费开始' },
    hero: {
      eyebrow: '由 Claude AI 驱动',
      headline: '创作',
      headlineAccent: '出众的内容',
      cycling: ['Instagram 标题', '博客文章', '广告文案', '阿拉伯语内容'],
      subtitle: '用5种语言生成专业内容 — 中文、英语、法语、阿拉伯语和西班牙语，只需几秒钟。',
      tagline: '生成。审批。发布。ContentAI 为您处理一切。',
      cta: '免费开始', ctaSecondary: '查看演示',
      badge1: '🤖 Claude AI', badge2: '🌍 5种语言', badge3: '✦ 阿拉伯语RTL',
    },
    proof: {
      langBand: 'EN · FR · AR · ES · 中文 — 五种语言，一个工具。',
      founderQuote: '我建造这个工具，是因为找不到一款真正支持法语和阿拉伯语的AI内容工具——而不只是翻译。所以我自己做了一个。',
      founderName: '— Slim，创始人，蒙特利尔 🇨🇦',
    },
    features: {
      title: '创作优质内容所需的一切',
      subtitle: '一个平台。五种语言。无限创意。',
      autoPost: {
        icon: '🚀',
        title: '自动写作并发布',
        desc: 'ContentAI为您生成内容，并自动发布到您的社交账户。只需连接一次Twitter、LinkedIn和Facebook — ContentAI处理一切。',
        badge: 'PRO',
      },
      items: [
        { icon: '✍️', title: '博客文章',    desc: '结构清晰、SEO优化的长篇内容。' },
        { icon: '📱', title: '社交媒体',    desc: '适合各平台的精彩帖子，含热门标签。' },
        { icon: '📧', title: '邮件营销',    desc: '带有明确行动号召的说服性邮件。' },
        { icon: '🛒', title: '产品描述',    desc: '以转化为导向、提升销售的文案。' },
        { icon: '🌙', title: '阿拉伯语RTL', desc: '方向正确的原生阿拉伯语内容。' },
        { icon: '🎨', title: '品牌声音',    desc: '所有内容保持一致的品牌风格。' },
        { icon: '📅', title: '内容计划',    desc: '几分钟内规划一周的内容。' },
        { icon: '📊', title: '数据分析',    desc: '跨平台跟踪互动数据。' },
      ],
    },
    howItWorks: {
      title: '工作原理',
      subtitle: '三个步骤。零手动操作。',
      steps: [
        {
          icon: '✨',
          step: '第一步',
          title: '生成',
          desc: '描述您的主题，选择语言和语气。ContentAI在几秒内以中文、英语、法语、阿拉伯语或西班牙语原生生成专业内容。无需提示技巧。',
        },
        {
          icon: '✅',
          step: '第二步',
          title: '审批',
          desc: '在发布前收到邮件预览。点击一下批准，点击一下跳过。您保持控制，无需做任何工作。',
        },
        {
          icon: '🚀',
          step: '第三步',
          title: '发布',
          desc: 'ContentAI在预定时间直接发布到Twitter、LinkedIn和Facebook。无需复制粘贴。无需登录3个不同的应用。只有结果。',
        },
      ],
      tagline: '大多数工具停在写作。ContentAI一路走到发布。',
    },
    pricing: {
      title: '简单透明的定价',
      subtitle: '免费开始，按需升级。',
      monthly: '按月', yearly: '按年',
      save: '省2个月',
      recommended: '最受欢迎',
      cta: '立即开始', ctaFree: '免费',
      perMonth: '/月', perYear: '/年',
      taglinePro: '创建一次内容。醒来时已全部发布。',
      features: {
        free:   ['5次生成/月', '所有内容类型', '5种语言', '标准质量'],
        basic:  ['30次生成/月', '所有内容类型', '5种语言', '品牌声音', '优先生成'],
        pro:    [
          'ContentAI自动为您写内容',
          '邮件预览 — 一键审批',
          '自动发布到Twitter、LinkedIn和Facebook',
          '零复制粘贴。零手动发布。',
          '品牌声音档案，始终保持您的风格',
        ],
        agency: [
          '无限次生成',
          '包含所有Pro功能',
          '多工作区（管理客户账户）',
          '客户审批流程',
          '优先支持',
          '支持白标',
        ],
      },
    },
    alacarte: {
      title: '单次购买',
      items: [
        {
          icon: '⚡',
          title: '内容包',
          price: 'CA$4.99',
          desc: '立即添加20次额外生成到您的账户。',
          cta: '立即购买',
          addOnId: 'content_pack',
        },
        {
          icon: '🎨',
          title: '品牌声音配置',
          price: 'CA$19',
          desc: '我们专业配置您的品牌声音 — 48小时内交付。',
          cta: '获取配置',
          addOnId: 'brand_voice_setup',
        },
      ],
    },
    phBanner: '🚀 我们今天在 Product Hunt 上线了！支持我们 →',
    faq: {
      title: '常见问题',
      items: [
        { q: 'ContentAI 使用什么 AI？', a: 'ContentAI 基于 Anthropic 的 Claude AI — 目前最强大、最注重安全的 AI 模型之一。' },
        { q: '我的内容是否私密？', a: '是的。您的内容和品牌数据永远不会用于训练 AI 模型。我们遵守 PIPEDA 和魁北克第 25 号法律。' },
        { q: '它真的能用阿拉伯语写作，而不只是翻译？', a: '是的 — ContentAI 以原生方式生成阿拉伯语内容，支持正确的从右到左布局、文化语境，无任何翻译痕迹。' },
        { q: '可以不用信用卡试用吗？', a: '是的 — 免费计划提供 5 次生成，无需信用卡。' },
        { q: '自动发布支持哪些社交平台？', a: 'Twitter/X、LinkedIn 和 Facebook。每篇帖子在发布前都需要您审核并批准。' },
        { q: '如果需要更多次生成怎么办？', a: '您可以随时升级套餐，或购买一次性内容包（CA$4.99）获得额外 20 次生成。' },
      ],
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phDismissed, setPhDismissed] = useState(true)

  // PH banner: show only on 2026-07-01, unless dismissed
  useEffect(() => {
    const now = new Date()
    const isLaunchDay = now.getFullYear() === 2026 && now.getMonth() === 6 && now.getDate() === 1
    const dismissed = localStorage.getItem('ph_banner_dismissed') === '1'
    if (isLaunchDay && !dismissed) setPhDismissed(false)
  }, [])

  function dismissPhBanner() {
    localStorage.setItem('ph_banner_dismissed', '1')
    setPhDismissed(true)
  }

  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  // Only play teaser when it scrolls into view
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? el.play().catch(() => {}) : el.pause() },
      { threshold: 0.25 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [lang])

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

  async function handleAddOnCheckout(addOnId: string) {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addOnId }),
    })
    if (res.status === 401) {
      window.location.href = '/login'
      return
    }
    const { url, error } = await res.json()
    if (error) { alert(error); return }
    window.location.href = url
  }

  const dir = isRTL ? 'rtl' : 'ltr'

  return (
    <div className={`min-h-screen bg-white ${isRTL ? 'font-arabic' : ''}`} dir={dir}>
      {/* ── Product Hunt launch banner ───────────────────── */}
      {!phDismissed && (
        <div className={`relative flex items-center justify-center gap-3 px-10 py-2.5 text-sm font-semibold ${isRTL ? 'flex-row-reverse font-arabic' : ''}`}
          style={{ background: '#C9A84C', color: '#026676' }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <a
            href="https://www.producthunt.com/posts/contentai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity truncate"
          >
            {t.phBanner}
          </a>
          <button
            onClick={dismissPhBanner}
            aria-label="Dismiss"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors shrink-0 text-base leading-none"
            style={{ color: '#026676' }}
          >
            ×
          </button>
        </div>
      )}

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

            <p className="text-lg text-gray-500 mb-3 max-w-lg leading-relaxed">
              {t.hero.subtitle}
            </p>

            {/* Hero tagline — the loop pitch */}
            <p className={`text-base font-semibold mb-8 max-w-lg ${isRTL ? 'text-brand-700' : 'text-brand-700'}`}>
              {t.hero.tagline}
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
              <div className="flex gap-1.5 mb-5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
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
                  {['Pro', 'Casual', 'Friendly'].map(tone => (
                    <div key={tone} className="h-6 px-2 bg-gray-50 rounded-full border border-gray-100 text-xs text-gray-400 flex items-center">{tone}</div>
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
            ref={videoRef}
            key={lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr' : 'en'}
            src={
              lang === 'ar' ? '/videos/teaser_arabic.mp4' :
              lang === 'fr' ? '/videos/teaser_french.mp4' :
              '/videos/teaser_english.mp4'
            }
            poster={
              lang === 'ar' ? '/videos/teaser_arabic_poster.jpg' :
              lang === 'fr' ? '/videos/teaser_french_poster.jpg' :
              '/videos/teaser_english_poster.jpg'
            }
            muted
            loop
            playsInline
            preload="none"
            className="w-full rounded-2xl shadow-lg"
          />
        </div>
      </div>

      {/* ── Language band (replaces fake stats) ─────────── */}
      <section className="bg-brand-600 py-6">
        <p className={`text-center text-white font-medium text-base tracking-wide px-6 ${isRTL ? 'font-arabic' : ''}`}>
          {t.proof.langBand}
        </p>
      </section>

      {/* ── Founder quote (replaces fake testimonials) ───── */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <p className={`text-2xl font-light text-gray-700 leading-relaxed mb-6 ${isRTL ? 'font-arabic text-right' : ''}`}>
            &ldquo;{t.proof.founderQuote}&rdquo;
          </p>
          <p className={`text-sm font-semibold text-brand-600 ${isRTL ? 'font-arabic' : ''}`}>
            {t.proof.founderName}
          </p>
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

          {/* Auto-posting featured card */}
          <div className={`mb-6 rounded-2xl p-7 border-2 border-brand-400 bg-gradient-to-br from-brand-50 via-white to-brand-50 shadow-lg flex flex-col sm:flex-row items-start gap-5 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <div className="text-5xl shrink-0">{t.features.autoPost.icon}</div>
            <div className="flex-1">
              <div className={`flex items-center gap-3 mb-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-xl font-bold text-gray-900">{t.features.autoPost.title}</h3>
                <span className="text-xs font-bold bg-brand-600 text-white px-2.5 py-1 rounded-full tracking-wide">
                  {t.features.autoPost.badge}
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">{t.features.autoPost.desc}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* ── How it works ────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-14 ${isRTL ? 'font-arabic' : ''}`}>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{t.howItWorks.title}</h2>
            <p className="text-gray-500">{t.howItWorks.subtitle}</p>
          </div>

          <div className={`grid md:grid-cols-3 gap-8 mb-12 ${isRTL ? 'font-arabic' : ''}`}>
            {t.howItWorks.steps.map((step, idx) => (
              <div key={step.step} className={`relative ${isRTL ? 'text-right' : 'text-left'}`}>
                {/* connector line (hidden on mobile, last col) */}
                {idx < 2 && (
                  <div className={`hidden md:block absolute top-8 ${isRTL ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'} w-full h-px bg-brand-200 -z-0`} style={{ width: 'calc(50% + 2rem)', top: '2rem', ...(isRTL ? { left: 'auto', right: 0, transform: 'translateX(50%)' } : {}) }} />
                )}
                <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-1">{step.step}</p>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className={`text-lg font-bold text-brand-700 ${isRTL ? 'font-arabic' : ''}`}>
              {t.howItWorks.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* ── Arabesque divider ───────────────────────────── */}
      <div className="divider-arabesque my-2" />

      {/* ── Pricing ─────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(['free', 'basic', 'pro', 'agency'] as const).map(key => {
              const plan = PLANS[key]
              const isRecommended = key === 'pro'
              const monthlyPrice = plan.price
              const yearlyPrice = Math.round(plan.price * 10)
              const displayPrice = yearly ? yearlyPrice : monthlyPrice
              const suffix = yearly ? t.pricing.perYear : t.pricing.perMonth
              const features = t.pricing.features[key]

              return (
                <div
                  key={key}
                  className={`rounded-2xl p-6 border relative flex flex-col ${
                    isRecommended
                      ? 'border-brand-500 bg-gradient-to-b from-brand-50 to-white shadow-xl'
                      : key === 'agency'
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                      {t.pricing.recommended}
                    </div>
                  )}
                  <h3 className={`text-lg font-bold mb-1 ${key === 'agency' ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>

                  {/* Pro tagline */}
                  {key === 'pro' && (
                    <p className="text-xs text-brand-600 font-medium mb-3 leading-snug">{t.pricing.taglinePro}</p>
                  )}

                  <div className="mb-5">
                    <span className={`text-4xl font-bold ${key === 'agency' ? 'text-white' : 'text-gray-900'}`}>
                      {displayPrice === 0 ? t.pricing.ctaFree : formatPrice(displayPrice, currency)}
                    </span>
                    {displayPrice > 0 && (
                      <span className={`text-sm ${key === 'agency' ? 'text-gray-400' : 'text-gray-400'}`}>{suffix}</span>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {features.map(f => (
                      <li key={f} className={`flex items-start gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''} ${key === 'agency' ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className={`shrink-0 font-bold ${key === 'agency' ? 'text-brand-400' : 'text-brand-500'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                      isRecommended
                        ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                        : key === 'agency'
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
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

      {/* ── À la carte ──────────────────────────────────── */}
      <section className="py-14 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className={`text-xl font-bold text-gray-900 mb-6 text-center ${isRTL ? 'font-arabic' : ''}`}>
            {t.alacarte.title}
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {t.alacarte.items.map(item => (
              <div key={item.addOnId} className={`bg-white rounded-2xl p-6 border border-gray-200 flex flex-col gap-3 ${isRTL ? 'text-right' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-brand-600 font-bold text-sm">{item.price}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">{item.desc}</p>
                <button
                  onClick={() => handleAddOnCheckout(item.addOnId)}
                  className="mt-auto self-start bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
                >
                  {item.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <h2 className={`text-2xl font-bold text-gray-900 mb-8 text-center ${isRTL ? 'font-arabic' : ''}`}>
            {t.faq.title}
          </h2>
          <div className="space-y-3">
            {t.faq.items.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className={`w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors ${isRTL ? 'flex-row-reverse text-right font-arabic' : ''}`}
                >
                  <span className="font-medium text-gray-900 text-sm pr-4">{item.q}</span>
                  <span className={`text-brand-600 shrink-0 text-lg transition-transform ${faqOpen === idx ? 'rotate-45' : ''}`}>+</span>
                </button>
                {faqOpen === idx && (
                  <div className={`px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-gray-50 ${isRTL ? 'text-right font-arabic' : ''}`}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
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
              <a href="https://twitter.com/ContentAICa" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-brand-50 flex items-center justify-center text-gray-400 hover:text-brand-600 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              {/* LinkedIn */}
              <a href="https://www.linkedin.com/company/content-ai-00635441a" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-brand-50 flex items-center justify-center text-gray-400 hover:text-brand-600 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              {/* Facebook */}
              <a href="https://www.facebook.com/Contentai" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-brand-50 flex items-center justify-center text-gray-400 hover:text-brand-600 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
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
