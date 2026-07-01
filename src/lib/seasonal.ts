import type { ContentType, OutputLanguage } from './content-types'

export interface SeasonalWindow {
  start: string
  end: string
}

export interface SeasonalTemplate {
  id: string
  icon: string
  contentType: ContentType
  windows: SeasonalWindow[]
  name: Record<OutputLanguage, string>
  description: Record<OutputLanguage, string>
  topic: Record<OutputLanguage, string>
  tone: string
  language: OutputLanguage
  /**
   * Primary target locale prefixes (e.g. 'ar', 'en-CA', 'zh', 'es-MX').
   * Matching: exact OR startsWith(l + '-').
   * If absent → universal (show for all locales when in window).
   */
  locales?: string[]
  /**
   * Additional locale prefixes shown during the date window only.
   * Used for Christmas/NY: Arabic users see it during the season.
   */
  alsoShowLocales?: string[]
  /**
   * When true: always show for `locales` users regardless of date window,
   * AND also show for all other locales when date is in window.
   * Pattern: Islamic holidays (always for ar-*), CNY (always for zh-*).
   */
  localeRequiredOutsideWindow?: boolean
}

// ── Islamic windows ──────────────────────────────────────────────────────────

// Ramadan start + 6 weeks window (2 weeks before → Eid al-Fitr)
const RAMADAN_WINDOWS: SeasonalWindow[] = [
  { start: '2024-02-26', end: '2024-04-10' },
  { start: '2025-02-16', end: '2025-03-31' },
  { start: '2026-02-17', end: '2026-03-18' },
  { start: '2027-01-22', end: '2027-03-10' },
  { start: '2028-01-14', end: '2028-02-28' },
  { start: '2029-01-03', end: '2029-02-17' },
]

// Eid al-Adha: 1 week before → 2 days after
const EID_ADHA_WINDOWS: SeasonalWindow[] = [
  { start: '2024-06-09', end: '2024-06-19' },
  { start: '2025-05-29', end: '2025-06-08' },
  { start: '2026-05-18', end: '2026-05-28' },
  { start: '2027-05-07', end: '2027-05-17' },
  { start: '2028-04-25', end: '2028-05-05' },
  { start: '2029-04-14', end: '2029-04-24' },
]

// Chinese New Year: 2 weeks before → 2 weeks after
const CNY_WINDOWS: SeasonalWindow[] = [
  { start: '2024-01-22', end: '2024-02-21' },
  { start: '2025-01-15', end: '2025-02-14' },
  { start: '2026-01-28', end: '2026-02-27' },
  { start: '2027-01-15', end: '2027-02-12' },
  { start: '2028-02-06', end: '2028-03-06' },
  { start: '2029-01-26', end: '2029-02-24' },
]

function yearWindows(m1: number, d1: number, m2: number, d2: number): SeasonalWindow[] {
  const windows: SeasonalWindow[] = []
  for (let y = 2024; y <= 2030; y++) {
    const endYear = m2 < m1 ? y + 1 : y
    windows.push({
      start: `${y}-${String(m1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`,
      end:   `${endYear}-${String(m2).padStart(2, '0')}-${String(d2).padStart(2, '0')}`,
    })
  }
  return windows
}

// ── Templates ────────────────────────────────────────────────────────────────

export const SEASONAL_TEMPLATES: SeasonalTemplate[] = [
  // ── Islamic: always visible for ar-* users; visible for all during window ──
  {
    id: 'ramadan_seasonal',
    icon: '🌙',
    contentType: 'social_media',
    windows: RAMADAN_WINDOWS,
    name: { en: 'Ramadan Greetings', fr: 'Vœux Ramadan', ar: 'تهاني رمضان', es: 'Saludo Ramadán', zh: '斋月祝福' },
    description: {
      en: 'Warm message for the holy month of Ramadan',
      fr: 'Message chaleureux pour le Ramadan',
      ar: 'رسالة دافئة لشهر رمضان المبارك',
      es: 'Mensaje cálido para el Ramadán',
      zh: '斋月温馨祝福',
    },
    topic: {
      en: 'Wishing our community a blessed Ramadan filled with generosity, community, and spirituality',
      fr: 'Souhaiter un bon Ramadan à notre communauté, partager les valeurs de générosité, de partage et de spiritualité',
      ar: 'تهنئة المجتمع بحلول شهر رمضان المبارك ومشاركة قيم الكرم والتواصل والروحانية',
      es: 'Desear a nuestra comunidad un Ramadán bendecido lleno de generosidad, comunidad y espiritualidad',
      zh: '祝愿我们的社区度过一个充满慷慨、社区精神和灵性的圣洁斋月',
    },
    tone: 'Inspirant',
    language: 'ar',
    locales: ['ar'],
    localeRequiredOutsideWindow: true,
  },
  {
    id: 'eid_adha_seasonal',
    icon: '🐑',
    contentType: 'social_media',
    windows: EID_ADHA_WINDOWS,
    name: { en: 'Eid al-Adha', fr: 'Aïd al-Adha', ar: 'عيد الأضحى', es: 'Eid al-Adha', zh: '古尔邦节' },
    description: {
      en: 'Eid al-Adha celebration post',
      fr: "Post pour l'Aïd al-Adha",
      ar: 'منشور الاحتفال بعيد الأضحى',
      es: 'Publicación de celebración Eid al-Adha',
      zh: '古尔邦节庆祝帖子',
    },
    topic: {
      en: 'Celebrating Eid al-Adha with our community, sharing wishes of joy, sacrifice, and blessings',
      fr: "Célébrer l'Aïd al-Adha avec notre communauté, partager des vœux de joie et de bénédictions",
      ar: 'الاحتفال بعيد الأضحى مع مجتمعنا ومشاركة تمنيات الفرح والتضحية والبركة',
      es: 'Celebrar el Eid al-Adha con nuestra comunidad, compartiendo deseos de alegría y bendiciones',
      zh: '与我们的社区一起庆祝古尔邦节，分享欢乐、奉献与祝福',
    },
    tone: 'Inspirant',
    language: 'ar',
    locales: ['ar'],
    localeRequiredOutsideWindow: true,
  },

  // ── Chinese New Year: always for zh-*; for all during window ──
  {
    id: 'chinese_new_year',
    icon: '🧧',
    contentType: 'social_media',
    windows: CNY_WINDOWS,
    name: { en: 'Chinese New Year', fr: 'Nouvel An Chinois', ar: 'رأس السنة الصينية', es: 'Año Nuevo Chino', zh: '农历新年' },
    description: {
      en: 'Lunar New Year celebration post',
      fr: 'Post Nouvel An Lunaire',
      ar: 'منشور الاحتفال برأس السنة الصينية',
      es: 'Publicación de Año Nuevo Lunar',
      zh: '农历新年庆祝帖子',
    },
    topic: {
      en: 'Wishing our community a prosperous Lunar New Year, celebrating new beginnings and good fortune',
      fr: 'Souhaiter à notre communauté un Nouvel An Lunaire prospère, célébrer les nouveaux départs et la bonne fortune',
      ar: 'تمني عام قمري جديد مزدهر لمجتمعنا والاحتفال بالبدايات الجديدة والحظ السعيد',
      es: 'Desear a nuestra comunidad un próspero Año Nuevo Lunar, celebrando nuevos comienzos y buena fortuna',
      zh: '祝愿我们的社区农历新年快乐、万事如意，庆祝新的开始和好运',
    },
    tone: 'Amical',
    language: 'zh',
    locales: ['zh'],
    localeRequiredOutsideWindow: true,
  },

  // ── Christmas: en/fr/es + ar during window; zh excluded ──
  {
    id: 'christmas_seasonal',
    icon: '🎄',
    contentType: 'social_media',
    windows: yearWindows(12, 1, 12, 26),
    name: { en: 'Christmas', fr: 'Noël', ar: 'عيد الميلاد', es: 'Navidad', zh: '圣诞节' },
    description: {
      en: 'Warm holiday wishes for Christmas',
      fr: 'Vœux chaleureux pour Noël',
      ar: 'تهاني دافئة لعيد الميلاد',
      es: 'Cálidos deseos navideños',
      zh: '温馨圣诞节祝福',
    },
    topic: {
      en: 'Wishing our customers a wonderful Christmas filled with joy, warmth, and family moments',
      fr: 'Souhaiter à nos clients un merveilleux Noël rempli de joie, de chaleur et de moments en famille',
      ar: 'تمني لعملائنا عيد ميلاد رائع مليء بالفرح والدفء ولحظات العائلة',
      es: 'Desear a nuestros clientes una maravillosa Navidad llena de alegría, calidez y momentos familiares',
      zh: '祝愿我们的客户圣诞节快乐，充满喜悦、温暖和家庭时光',
    },
    tone: 'Amical',
    language: 'fr',
    locales: ['en-CA', 'en-US', 'fr-CA', 'fr-FR', 'fr-BE', 'es'],
    alsoShowLocales: ['ar'],
  },

  // ── New Year: same locale scope as Christmas ──
  {
    id: 'new_year_seasonal',
    icon: '🎆',
    contentType: 'social_media',
    windows: yearWindows(12, 26, 1, 3),
    name: { en: 'New Year', fr: 'Nouvel An', ar: 'رأس السنة', es: 'Año Nuevo', zh: '新年' },
    description: {
      en: 'New Year wishes for your community',
      fr: 'Vœux du Nouvel An pour votre communauté',
      ar: 'تهاني رأس السنة لمجتمعك',
      es: 'Deseos de Año Nuevo para tu comunidad',
      zh: '新年祝福给您的社区',
    },
    topic: {
      en: 'Wishing everyone a fantastic New Year filled with success, health, and exciting new opportunities ahead',
      fr: 'Souhaiter à tous une fantastique nouvelle année pleine de succès, de santé et de nouvelles opportunités',
      ar: 'تمني عام جديد رائع للجميع مليء بالنجاح والصحة والفرص الجديدة المثيرة',
      es: 'Desear a todos un fantástico Año Nuevo lleno de éxito, salud y emocionantes nuevas oportunidades',
      zh: '祝大家新年快乐，充满成功、健康和令人兴奋的新机遇',
    },
    tone: 'Inspirant',
    language: 'fr',
    locales: ['en-CA', 'en-US', 'fr-CA', 'fr-FR', 'fr-BE', 'es'],
    alsoShowLocales: ['ar'],
  },

  // ── Canada Day: en-CA and fr-CA only ──
  {
    id: 'canada_day',
    icon: '🍁',
    contentType: 'social_media',
    windows: yearWindows(6, 25, 7, 3),
    name: { en: 'Canada Day', fr: 'Fête du Canada', ar: 'يوم كندا', es: 'Día de Canadá', zh: '加拿大国庆' },
    description: {
      en: 'Canada Day celebration post',
      fr: 'Post pour la Fête du Canada',
      ar: 'منشور يوم كندا',
      es: 'Publicación del Día de Canadá',
      zh: '加拿大国庆帖子',
    },
    topic: {
      en: 'Happy Canada Day — celebrating our great country with our community and customers across Canada',
      fr: 'Bonne Fête du Canada — célébrer notre beau pays avec notre communauté et nos clients à travers le Canada',
      ar: 'عيد كندا سعيد — الاحتفال ببلدنا الرائع مع مجتمعنا وعملائنا في جميع أنحاء كندا',
      es: 'Feliz Día de Canadá — celebrando nuestro gran país con nuestra comunidad y clientes en todo Canadá',
      zh: '加拿大国庆快乐——与我们全国的社区和客户一起庆祝伟大的国家',
    },
    tone: 'Amical',
    language: 'en',
    locales: ['en-CA', 'fr-CA'],
  },

  // ── US Independence Day: en-US only ──
  {
    id: 'us_independence_day',
    icon: '🇺🇸',
    contentType: 'social_media',
    windows: yearWindows(6, 28, 7, 6),
    name: { en: 'Independence Day', fr: '4 Juillet', ar: 'عيد الاستقلال الأمريكي', es: 'Día de la Independencia', zh: '美国独立日' },
    description: {
      en: 'July 4th celebration post',
      fr: 'Post 4 juillet américain',
      ar: 'منشور الاستقلال الأمريكي',
      es: 'Publicación del 4 de julio',
      zh: '美国独立日帖子',
    },
    topic: {
      en: 'Happy 4th of July — celebrating American independence, freedom, and the spirit of our great nation',
      fr: "Joyeux 4 juillet — célébrer l'indépendance américaine, la liberté et l'esprit de notre grande nation",
      ar: 'عيد استقلال أمريكا سعيد — الاحتفال بالاستقلال الأمريكي والحرية وروح الأمة العظيمة',
      es: 'Feliz 4 de julio — celebrando la independencia americana, la libertad y el espíritu de nuestra gran nación',
      zh: '美国独立日快乐——庆祝美国独立、自由和我们伟大国家的精神',
    },
    tone: 'Amical',
    language: 'en',
    locales: ['en-US'],
  },

  // ── Bastille Day: fr-FR and fr-BE only ──
  {
    id: 'bastille_day',
    icon: '🥁',
    contentType: 'social_media',
    windows: yearWindows(7, 10, 7, 16),
    name: { en: 'Bastille Day', fr: 'Fête Nationale', ar: 'اليوم الوطني الفرنسي', es: 'Día de la Bastilla', zh: '法国国庆日' },
    description: {
      en: 'French National Day post',
      fr: 'Post Fête Nationale française',
      ar: 'منشور اليوم الوطني الفرنسي',
      es: 'Publicación del Día Nacional francés',
      zh: '法国国庆日帖子',
    },
    topic: {
      en: 'Happy Bastille Day — celebrating French liberty, equality, and fraternity with our community',
      fr: "Bonne Fête Nationale — célébrer la liberté, l'égalité et la fraternité avec notre communauté",
      ar: 'عيد الفطر الوطني الفرنسي سعيد — الاحتفال بالحرية والمساواة والأخوة الفرنسية مع مجتمعنا',
      es: 'Feliz Día de la Bastilla — celebrando la libertad, igualdad y fraternidad francesas con nuestra comunidad',
      zh: '法国国庆节快乐——与我们的社区一起庆祝法国的自由、平等和博爱精神',
    },
    tone: 'Amical',
    language: 'fr',
    locales: ['fr-FR', 'fr-BE'],
  },

  // ── Día de Muertos: es-MX only ──
  {
    id: 'dia_de_muertos',
    icon: '💀',
    contentType: 'social_media',
    windows: yearWindows(10, 29, 11, 2),
    name: { en: 'Día de Muertos', fr: 'Jour des Morts', ar: 'يوم الموتى', es: 'Día de Muertos', zh: '亡灵节' },
    description: {
      en: 'Day of the Dead celebration',
      fr: 'Célébration Jour des Morts mexicain',
      ar: 'الاحتفال بيوم الموتى المكسيكي',
      es: 'Celebración del Día de Muertos',
      zh: '墨西哥亡灵节庆祝',
    },
    topic: {
      en: 'Honoring Día de Muertos — celebrating the lives of loved ones with color, tradition, and remembrance',
      fr: 'Honorer le Día de Muertos — célébrer la vie de nos proches avec couleur, tradition et souvenir',
      ar: 'إحياء ذكرى يوم الموتى — الاحتفال بحياة الأحبة بالألوان والتقاليد والذكريات',
      es: 'Honrando el Día de Muertos — celebrando la vida de nuestros seres queridos con color, tradición y memoria',
      zh: '纪念亡灵节——以色彩、传统和回忆庆祝我们所爱之人的生命',
    },
    tone: 'Inspirant',
    language: 'es',
    locales: ['es-MX'],
  },

  // ── Cinco de Mayo: es-MX only ──
  {
    id: 'cinco_de_mayo',
    icon: '🎉',
    contentType: 'social_media',
    windows: yearWindows(5, 3, 5, 7),
    name: { en: 'Cinco de Mayo', fr: 'Cinco de Mayo', ar: 'سينكو دي مايو', es: 'Cinco de Mayo', zh: '五月五日' },
    description: {
      en: 'Cinco de Mayo celebration',
      fr: 'Célébration Cinco de Mayo',
      ar: 'الاحتفال بسينكو دي مايو',
      es: 'Celebración del Cinco de Mayo',
      zh: '五月五日庆典',
    },
    topic: {
      en: 'Happy Cinco de Mayo — celebrating Mexican culture, heritage, and community spirit',
      fr: "Joyeux Cinco de Mayo — célébrer la culture, le patrimoine et l'esprit communautaire mexicain",
      ar: 'عيد سينكو دي مايو سعيد — الاحتفال بالثقافة والتراث والروح المجتمعية المكسيكية',
      es: 'Feliz Cinco de Mayo — celebrando la cultura, herencia y espíritu comunitario mexicano',
      zh: '五月五日快乐——庆祝墨西哥文化、遗产和社区精神',
    },
    tone: 'Amical',
    language: 'es',
    locales: ['es-MX'],
  },

  // ── Universal: Valentine's, Black Friday, Back to School ──
  {
    id: 'valentines_seasonal',
    icon: '💝',
    contentType: 'ad_copy',
    windows: yearWindows(2, 1, 2, 14),
    name: { en: "Valentine's Day", fr: 'Saint-Valentin', ar: 'عيد الحب', es: 'San Valentín', zh: '情人节' },
    description: {
      en: 'Love & appreciation campaign',
      fr: 'Campagne amour & gratitude',
      ar: 'حملة الحب والتقدير',
      es: 'Campaña de amor y apreciación',
      zh: '爱与感恩活动',
    },
    topic: {
      en: "Valentine's Day special offer — celebrating love and appreciation with our customers and community",
      fr: "Offre spéciale Saint-Valentin — célébrer l'amour et la gratitude avec nos clients et notre communauté",
      ar: 'عرض خاص لعيد الحب — الاحتفال بالمحبة والتقدير مع عملائنا ومجتمعنا',
      es: 'Oferta especial de San Valentín — celebrando el amor y la apreciación con nuestros clientes y comunidad',
      zh: '情人节特惠活动——与我们的客户和社区一起庆祝爱与感恩',
    },
    tone: 'Amical',
    language: 'fr',
  },
  {
    id: 'black_friday_seasonal',
    icon: '🛍️',
    contentType: 'ad_copy',
    windows: yearWindows(11, 20, 11, 30),
    name: { en: 'Black Friday', fr: 'Black Friday', ar: 'الجمعة السوداء', es: 'Black Friday', zh: '黑色星期五' },
    description: {
      en: 'Biggest sale of the year',
      fr: "Plus grande vente de l'année",
      ar: 'أكبر تخفيض في العام',
      es: 'La mayor venta del año',
      zh: '全年最大折扣',
    },
    topic: {
      en: 'Black Friday sale announcement — massive discounts up to 70% on our best products, limited time only',
      fr: "Annonce des soldes Black Friday — remises massives jusqu'à 70% sur nos meilleurs produits, durée limitée",
      ar: 'إعلان تخفيضات الجمعة السوداء — خصومات ضخمة تصل إلى 70% على أفضل منتجاتنا، لفترة محدودة',
      es: 'Anuncio de ventas del Black Friday — descuentos masivos de hasta 70% en nuestros mejores productos, tiempo limitado',
      zh: '黑色星期五促销公告——最高70%折扣，限时优惠，不要错过',
    },
    tone: 'Professionnel',
    language: 'fr',
  },
  {
    id: 'back_to_school_seasonal',
    icon: '🎒',
    contentType: 'social_media',
    windows: yearWindows(8, 15, 9, 15),
    name: { en: 'Back to School', fr: 'Rentrée Scolaire', ar: 'العودة للمدرسة', es: 'Vuelta al Cole', zh: '开学季' },
    description: {
      en: 'Back to school promotions',
      fr: 'Promos rentrée scolaire',
      ar: 'عروض العودة للمدرسة',
      es: 'Promociones vuelta al cole',
      zh: '开学季促销活动',
    },
    topic: {
      en: 'Back to school season — special offers and tips to help students and parents start the new school year right',
      fr: "Rentrée scolaire — offres spéciales et conseils pour les élèves et parents pour bien commencer l'année",
      ar: 'موسم العودة للمدرسة — عروض خاصة ونصائح للطلاب وأولياء الأمور لبدء عام دراسي جديد بشكل صحيح',
      es: 'Temporada de vuelta al cole — ofertas especiales y consejos para estudiantes y padres para empezar bien el año',
      zh: '开学季——为学生和家长提供特别优惠和建议，让新学年有个好的开始',
    },
    tone: 'Amical',
    language: 'fr',
  },
]

// ── Filter function ──────────────────────────────────────────────────────────

function matchesLocale(locale: string, targets: string[]): boolean {
  return targets.some(l => locale === l || locale.startsWith(l + '-'))
}

export function getActiveSeasonalTemplates(locale: string, uiLang: OutputLanguage): SeasonalTemplate[] {
  const rawNav = typeof navigator !== 'undefined' ? navigator.language : '(server)'
  console.log('[seasonal DEBUG] raw locale:', rawNav, 'lowercased:', rawNav.toLowerCase())
  const today = new Date().toISOString().slice(0, 10)

  // Arabic context: UI lang is Arabic OR effective locale starts with 'ar'
  const isArabicContext = (uiLang === 'ar') || locale.toLowerCase().startsWith('ar')
  // CNY context: UI lang is Chinese OR effective locale starts with 'zh'
  const isCNYContext = (uiLang === 'zh') || locale.toLowerCase().startsWith('zh')

  const active = SEASONAL_TEMPLATES.filter(t => {
    const inWindow = t.windows.some(w => today >= w.start && today <= w.end)

    if (!t.locales) return inWindow

    if (t.localeRequiredOutsideWindow) {
      // Islamic & CNY require BOTH context match AND date window — never shown outside season
      const isIslamic = t.locales.includes('ar')
      const contextMatch = (isIslamic ? isArabicContext : isCNYContext)
      const showTemplate = contextMatch && inWindow

      if (isIslamic) {
        console.log('[seasonal] isArabicContext:', isArabicContext, 'isWithinWindow:', inWindow, 'showRamadan:', showTemplate)
      }

      return showTemplate
    }

    const primaryMatch = matchesLocale(locale, t.locales)
    const alsoMatch = t.alsoShowLocales ? matchesLocale(locale, t.alsoShowLocales) : false

    return (primaryMatch || alsoMatch) && inWindow
  })

  console.log('[seasonal] locale:', locale, 'uiLang:', uiLang, 'isArabicContext:', isArabicContext, 'active templates:', active.map(t => t.id))
  return active
}
