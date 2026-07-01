import type { ContentType, OutputLanguage } from './content-types'

export interface Template {
  id: string
  icon: string
  name: Record<string, string>
  description: Record<string, string>
  contentType: ContentType
  topic: Record<string, string>
  tone: string
  language: OutputLanguage
  keywords?: string
  wordCount?: number
}

export const TEMPLATES: Template[] = [
  {
    id: 'summer_sale',
    icon: '☀️',
    name: {
      fr: 'Soldes été',
      ar: 'تخفيضات الصيف',
      en: 'Summer Sale',
      es: 'Rebajas de Verano',
      zh: '夏季特卖',
    },
    description: {
      fr: "Annoncez vos promotions estivales avec urgence et enthousiasme",
      ar: 'أعلن عن تخفيضاتك الصيفية بحماس وإلحاح',
      en: 'Announce your summer promotions with urgency and enthusiasm',
      es: 'Anuncia tus promociones de verano con urgencia y entusiasmo',
      zh: '充满热情地宣传您的夏季促销活动',
    },
    contentType: 'ad_copy',
    topic: {
      fr: "Promotion soldes d'été avec jusqu'à -50% sur toute la collection, durée limitée, ne pas manquer cette offre exceptionnelle",
      ar: 'تخفيضات الصيف تصل إلى 50% على جميع المجموعة، عروض محدودة المدة لا تفوتها',
      en: 'Summer sale up to 50% off the entire collection, limited time only, do not miss this exceptional offer',
      es: 'Rebajas de verano hasta 50% de descuento en toda la colección, tiempo limitado, no te pierdas esta oferta',
      zh: '夏季特卖全系列低至5折，限时优惠，不容错过',
    },
    tone: 'Professionnel',
    language: 'fr',
    keywords: 'soldes, été, promotion, offre limitée',
    wordCount: 120,
  },
  {
    id: 'product_launch',
    icon: '🚀',
    name: {
      fr: 'Lancement produit',
      ar: 'إطلاق منتج',
      en: 'Product Launch',
      es: 'Lanzamiento de Producto',
      zh: '产品发布',
    },
    description: {
      fr: 'Annonce percutante pour le lancement de votre nouveau produit',
      ar: 'إعلان مؤثر لإطلاق منتجك الجديد',
      en: 'Impactful announcement for launching your new product',
      es: 'Anuncio impactante para el lanzamiento de tu nuevo producto',
      zh: '震撼人心的新产品发布公告',
    },
    contentType: 'social_media',
    topic: {
      fr: "Lancement d'un nouveau produit révolutionnaire qui va changer la façon dont les gens travaillent, avec des fonctionnalités inédites et un design moderne",
      ar: 'إطلاق منتج جديد ثوري سيغير طريقة عمل الناس، بميزات فريدة وتصميم عصري',
      en: 'Launching a revolutionary new product that will change how people work, with unique features and a modern design',
      es: 'Lanzamiento de un producto nuevo y revolucionario que cambiará la forma de trabajar, con características únicas',
      zh: '发布革命性新产品，将改变人们的工作方式，具有独特功能和现代设计',
    },
    tone: 'Professionnel',
    language: 'fr',
    keywords: 'nouveau, lancement, innovation, exclusif',
    wordCount: 200,
  },
  {
    id: 'restaurant_promo',
    icon: '🍽️',
    name: {
      fr: 'Promotion restaurant',
      ar: 'ترويج المطعم',
      en: 'Restaurant Promo',
      es: 'Promo Restaurante',
      zh: '餐厅促销',
    },
    description: {
      fr: 'Attirez des clients avec une offre spéciale alléchante',
      ar: 'اجذب العملاء بعرض خاص مغرٍ',
      en: 'Attract customers with an enticing special offer',
      es: 'Atrae clientes con una oferta especial irresistible',
      zh: '用诱人的特惠活动吸引顾客',
    },
    contentType: 'social_media',
    topic: {
      fr: "Promotion spéciale weekend au restaurant: menu dégustation à prix réduit, ambiance chaleureuse, cuisine traditionnelle revisitée, réservation recommandée",
      ar: 'عرض خاص لعطلة نهاية الأسبوع في المطعم: قائمة تذوق بسعر مخفض، أجواء دافئة، مطبخ تقليدي معاصر',
      en: 'Special weekend restaurant promotion: tasting menu at a reduced price, warm atmosphere, modern traditional cuisine, reservation recommended',
      es: 'Promoción especial de fin de semana en el restaurante: menú degustación a precio reducido, ambiente cálido',
      zh: '餐厅周末特惠：品鉴套餐优惠价，温馨氛围，传统美食新演绎，建议预约',
    },
    tone: 'Amical',
    language: 'fr',
    keywords: 'restaurant, promotion, weekend, menu',
    wordCount: 150,
  },
  {
    id: 'event_announcement',
    icon: '🎉',
    name: {
      fr: 'Annonce événement',
      ar: 'إعلان حدث',
      en: 'Event Announcement',
      es: 'Anuncio de Evento',
      zh: '活动公告',
    },
    description: {
      fr: 'Créez du buzz autour de votre prochain événement',
      ar: 'أنشئ ضجة حول حدثك القادم',
      en: 'Create buzz around your upcoming event',
      es: 'Crea expectación alrededor de tu próximo evento',
      zh: '为您即将举办的活动制造话题热度',
    },
    contentType: 'email',
    topic: {
      fr: "Invitation à un événement professionnel networking, conférences et ateliers sur l'innovation digitale, avec des intervenants de renom, inscription obligatoire",
      ar: 'دعوة لحضور فعالية مهنية للتواصل والمؤتمرات وورش عمل حول الابتكار الرقمي، مع متحدثين بارزين، التسجيل إلزامي',
      en: 'Invitation to a professional networking event, conferences and workshops on digital innovation, with renowned speakers, registration required',
      es: 'Invitación a un evento profesional de networking, conferencias y talleres sobre innovación digital, con ponentes reconocidos',
      zh: '专业网络交流活动邀请函，数字创新会议与研讨会，知名演讲嘉宾，需提前注册',
    },
    tone: 'Professionnel',
    language: 'fr',
    keywords: 'événement, networking, inscription, conférence',
    wordCount: 250,
  },
  {
    id: 'motivational',
    icon: '💪',
    name: {
      fr: 'Post motivationnel',
      ar: 'بوست تحفيزي',
      en: 'Motivational Post',
      es: 'Post Motivacional',
      zh: '励志帖子',
    },
    description: {
      fr: 'Inspirez votre audience avec un message fort et positif',
      ar: 'ألهم جمهورك برسالة قوية وإيجابية',
      en: 'Inspire your audience with a powerful and positive message',
      es: 'Inspira a tu audiencia con un mensaje fuerte y positivo',
      zh: '用有力量的积极信息激励您的受众',
    },
    contentType: 'social_media',
    topic: {
      fr: "Message d'encouragement pour une nouvelle semaine: dépasser ses limites, croire en soi, transformer les obstacles en opportunités, mindset gagnant",
      ar: 'رسالة تشجيعية لأسبوع جديد: تجاوز الحدود، الإيمان بالنفس، تحويل العقبات إلى فرص، عقلية الفائز',
      en: 'Encouraging message for a new week: pushing beyond limits, believing in yourself, turning obstacles into opportunities, winning mindset',
      es: 'Mensaje de aliento para una nueva semana: superar límites, creer en uno mismo, convertir obstáculos en oportunidades',
      zh: '新一周励志信息：突破极限，相信自己，将障碍转化为机遇，赢家思维',
    },
    tone: 'Inspirant',
    language: 'fr',
    keywords: 'motivation, succès, mindset, objectifs',
    wordCount: 150,
  },
]
