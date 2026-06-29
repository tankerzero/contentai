import type { ContentType, OutputLanguage } from './content-types'

export interface Template {
  id: string
  icon: string
  name: { fr: string; ar: string }
  description: { fr: string; ar: string }
  contentType: ContentType
  topic: { fr: string; ar: string }
  tone: string
  language: OutputLanguage
  keywords?: string
  wordCount?: number
}

export const TEMPLATES: Template[] = [
  {
    id: 'ramadan',
    icon: '🌙',
    name: { fr: 'Post Ramadan', ar: 'بوست رمضان' },
    description: {
      fr: 'Message chaleureux pour souhaiter un bon Ramadan à votre communauté',
      ar: 'رسالة دافئة للتهنئة بشهر رمضان المبارك',
    },
    contentType: 'social_media',
    topic: {
      fr: 'Souhaiter un bon Ramadan à notre communauté, partager les valeurs de générosité, de partage et de spiritualité',
      ar: 'تهنئة المجتمع بحلول شهر رمضان المبارك، ومشاركة قيم الكرم والتواصل الاجتماعي والروحانية',
    },
    tone: 'Inspirant',
    language: 'ar',
    keywords: 'رمضان كريم، مبارك، شهر الخير',
    wordCount: 150,
  },
  {
    id: 'summer_sale',
    icon: '☀️',
    name: { fr: 'Soldes été', ar: 'تخفيضات الصيف' },
    description: {
      fr: "Annoncez vos promotions estivales avec urgence et enthousiasme",
      ar: 'أعلن عن تخفيضاتك الصيفية بحماس وإلحاح',
    },
    contentType: 'ad_copy',
    topic: {
      fr: "Promotion soldes d'été avec jusqu'à -50% sur toute la collection, durée limitée, ne pas manquer cette offre exceptionnelle",
      ar: 'تخفيضات الصيف تصل إلى 50% على جميع المجموعة، عروض محدودة المدة لا تفوتها',
    },
    tone: 'Professionnel',
    language: 'fr',
    keywords: 'soldes, été, promotion, offre limitée',
    wordCount: 120,
  },
  {
    id: 'product_launch',
    icon: '🚀',
    name: { fr: 'Lancement produit', ar: 'إطلاق منتج' },
    description: {
      fr: 'Annonce percutante pour le lancement de votre nouveau produit',
      ar: 'إعلان مؤثر لإطلاق منتجك الجديد',
    },
    contentType: 'social_media',
    topic: {
      fr: "Lancement d'un nouveau produit révolutionnaire qui va changer la façon dont les gens travaillent, avec des fonctionnalités inédites et un design moderne",
      ar: 'إطلاق منتج جديد ثوري سيغير طريقة عمل الناس، بميزات فريدة وتصميم عصري',
    },
    tone: 'Professionnel',
    language: 'fr',
    keywords: 'nouveau, lancement, innovation, exclusif',
    wordCount: 200,
  },
  {
    id: 'restaurant_promo',
    icon: '🍽️',
    name: { fr: 'Promotion restaurant', ar: 'ترويج المطعم' },
    description: {
      fr: 'Attirez des clients avec une offre spéciale alléchante',
      ar: 'اجذب العملاء بعرض خاص مغرٍ',
    },
    contentType: 'social_media',
    topic: {
      fr: "Promotion spéciale weekend au restaurant: menu dégustation à prix réduit, ambiance chaleureuse, cuisine traditionnelle revisitée, réservation recommandée",
      ar: 'عرض خاص لعطلة نهاية الأسبوع في المطعم: قائمة تذوق بسعر مخفض، أجواء دافئة، مطبخ تقليدي معاصر',
    },
    tone: 'Amical',
    language: 'fr',
    keywords: 'restaurant, promotion, weekend, menu',
    wordCount: 150,
  },
  {
    id: 'event_announcement',
    icon: '🎉',
    name: { fr: 'Annonce événement', ar: 'إعلان حدث' },
    description: {
      fr: 'Créez du buzz autour de votre prochain événement',
      ar: 'أنشئ ضجة حول حدثك القادم',
    },
    contentType: 'email',
    topic: {
      fr: "Invitation à un événement professionnel networking, conférences et ateliers sur l'innovation digitale, avec des intervenants de renom, inscription obligatoire",
      ar: 'دعوة لحضور فعالية مهنية للتواصل والمؤتمرات وورش عمل حول الابتكار الرقمي، مع متحدثين بارزين، التسجيل إلزامي',
    },
    tone: 'Professionnel',
    language: 'fr',
    keywords: 'événement, networking, inscription, conférence',
    wordCount: 250,
  },
  {
    id: 'motivational',
    icon: '💪',
    name: { fr: 'Post motivationnel', ar: 'بوست تحفيزي' },
    description: {
      fr: 'Inspirez votre audience avec un message fort et positif',
      ar: 'ألهم جمهورك برسالة قوية وإيجابية',
    },
    contentType: 'social_media',
    topic: {
      fr: "Message d'encouragement pour une nouvelle semaine: dépasser ses limites, croire en soi, transformer les obstacles en opportunités, mindset gagnant",
      ar: 'رسالة تشجيعية لأسبوع جديد: تجاوز الحدود، الإيمان بالنفس، تحويل العقبات إلى فرص، عقلية الفائز',
    },
    tone: 'Inspirant',
    language: 'fr',
    keywords: 'motivation, succès, mindset, objectifs',
    wordCount: 150,
  },
]
