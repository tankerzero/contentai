export type Lang = 'fr' | 'ar'

export const translations = {
  fr: {
    dir: 'ltr' as const,
    htmlLang: 'fr',
    langToggleLabel: 'العربية',
    nav: {
      signIn: 'Se connecter',
      getStarted: 'Commencer gratuitement',
    },
    hero: {
      badge: 'Propulsé par Claude AI',
      title: 'Créez du contenu remarquable',
      titleHighlight: ' en quelques secondes',
      subtitle:
        "Articles de blog, réseaux sociaux, emails, descriptions produits — générez du contenu professionnel avec l'IA et concentrez-vous sur l'essentiel.",
      cta: 'Commencer gratuitement',
      ctaSecondary: 'Voir les fonctionnalités',
    },
    features: {
      title: 'Tout ce dont vous avez besoin',
      subtitle:
        "Une plateforme pour tous vos besoins en contenu, propulsée par les derniers modèles d'IA.",
      items: [
        { icon: '✍️', title: 'Articles de Blog', desc: 'Articles complets, optimisés SEO avec structure et titres appropriés.' },
        { icon: '📱', title: 'Réseaux Sociaux', desc: 'Publications engageantes avec hashtags pour Twitter, LinkedIn et Instagram.' },
        { icon: '📧', title: 'Emails', desc: "Emails persuasifs avec des lignes d'objet fortes et des appels à l'action clairs." },
        { icon: '🛒', title: 'Descriptions Produits', desc: 'Textes axés sur la conversion qui mettent en valeur les avantages.' },
        { icon: '📣', title: 'Textes Publicitaires', desc: "Copies percutantes qui captent l'attention rapidement." },
        { icon: '⚡', title: 'Ultra Rapide', desc: 'Générez du contenu de qualité en moins de 10 secondes.' },
      ],
    },
    pricing: {
      title: 'Tarification simple',
      subtitle: 'Commencez gratuitement. Évoluez quand vous avez besoin de plus.',
      mostPopular: 'Le plus populaire',
      getStarted: 'Commencer',
      active: 'Actif',
      monthly: '/mois',
      free: 'Gratuit',
    },
    footer: {
      privacy: 'Confidentialité',
      terms: 'Conditions',
    },
  },
  ar: {
    dir: 'rtl' as const,
    htmlLang: 'ar',
    langToggleLabel: 'Français',
    nav: {
      signIn: 'تسجيل الدخول',
      getStarted: 'ابدأ مجاناً',
    },
    hero: {
      badge: 'مدعوم بتقنية Claude AI',
      title: 'أنشئ محتوى استثنائياً',
      titleHighlight: ' في ثوانٍ معدودة',
      subtitle:
        'مقالات المدونات، وسائل التواصل الاجتماعي، البريد الإلكتروني، أوصاف المنتجات — أنشئ محتوى احترافياً بالذكاء الاصطناعي وركّز على ما يهمّ.',
      cta: 'ابدأ مجاناً',
      ctaSecondary: 'اكتشف المميزات',
    },
    features: {
      title: 'كل ما تحتاجه',
      subtitle: 'منصة واحدة لجميع احتياجاتك من المحتوى، مدعومة بأحدث نماذج الذكاء الاصطناعي.',
      items: [
        { icon: '✍️', title: 'مقالات المدونة', desc: 'مقالات طويلة محسّنة لمحركات البحث مع هيكل وعناوين واضحة.' },
        { icon: '📱', title: 'وسائل التواصل الاجتماعي', desc: 'منشورات جذابة مع هاشتاقات لتويتر ولينكدإن وإنستغرام.' },
        { icon: '📧', title: 'البريد الإلكتروني', desc: 'رسائل إلكترونية مقنعة بسطور موضوع قوية ودعوات واضحة للتصرف.' },
        { icon: '🛒', title: 'أوصاف المنتجات', desc: 'نصوص مُحسَّنة للتحويل تبرز الفوائد وتدفع للشراء.' },
        { icon: '📣', title: 'نصوص إعلانية', desc: 'نصوص موجزة ومؤثرة تلفت الانتباه بسرعة.' },
        { icon: '⚡', title: 'سرعة فائقة', desc: 'أنشئ محتوى عالي الجودة في أقل من 10 ثوانٍ.' },
      ],
    },
    pricing: {
      title: 'تسعير شفاف وبسيط',
      subtitle: 'ابدأ مجاناً. طوّر اشتراكك عند الحاجة.',
      mostPopular: 'الأكثر شعبية',
      getStarted: 'ابدأ الآن',
      active: 'مفعّل',
      monthly: '/شهر',
      free: 'مجاني',
    },
    footer: {
      privacy: 'الخصوصية',
      terms: 'الشروط',
    },
  },
} as const

export type Translations = (typeof translations)[Lang]
