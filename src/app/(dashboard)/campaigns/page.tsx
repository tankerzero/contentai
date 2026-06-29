'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUILang } from '@/contexts/UILanguageContext'

interface Contact {
  id: string
  email: string
  name: string | null
  subscribed: boolean
  created_at: string
}

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  sent_at: string | null
  created_at: string
  sends_count: number | null
}

type Tab = 'contacts' | 'campaigns'

const UI = {
  en: {
    title: 'Email Campaigns', subtitle: 'Manage your mailing list and send campaigns.',
    tabs: { contacts: 'Contacts', campaigns: 'Campaigns' },
    addContact: 'Add contact', importContacts: 'Import (paste emails)',
    emailLabel: 'Email', nameLabel: 'Name (optional)',
    importLabel: 'Paste emails (one per line)',
    add: 'Add', adding: 'Adding…', import: 'Import', importing: 'Importing…',
    noContacts: 'No contacts yet. Add your first contact.',
    subscribed: 'Subscribed', unsubscribed: 'Unsubscribed',
    deleteSelected: 'Delete selected',
    newCampaign: '+ New Campaign', campaignName: 'Campaign name',
    subject: 'Subject', content: 'Email content',
    generateBtn: '✨ Generate with AI', generating: 'Generating…',
    save: 'Save draft', saving: 'Saving…',
    send: 'Send to all contacts', sending: 'Sending…',
    noCampaigns: 'No campaigns yet.',
    status: { draft: 'Draft', sending: 'Sending…', sent: 'Sent', failed: 'Failed' },
    sentCount: 'sent',
    upgradeMsg: 'Upgrade to Basic plan or higher to use Email Campaigns.',
    upgradeBtn: 'Upgrade now',
    caslNote: 'CASL compliant: every email includes an unsubscribe link.',
    topicForAI: 'Topic for AI generation (optional)',
  },
  fr: {
    title: 'Campagnes Email', subtitle: 'Gérez votre liste de diffusion et envoyez des campagnes.',
    tabs: { contacts: 'Contacts', campaigns: 'Campagnes' },
    addContact: 'Ajouter un contact', importContacts: 'Importer (coller des emails)',
    emailLabel: 'Email', nameLabel: 'Nom (optionnel)',
    importLabel: 'Collez les emails (un par ligne)',
    add: 'Ajouter', adding: 'Ajout…', import: 'Importer', importing: 'Import…',
    noContacts: 'Aucun contact. Ajoutez votre premier contact.',
    subscribed: 'Abonné', unsubscribed: 'Désabonné',
    deleteSelected: 'Supprimer la sélection',
    newCampaign: '+ Nouvelle Campagne', campaignName: 'Nom de la campagne',
    subject: 'Objet', content: 'Contenu de l\'email',
    generateBtn: '✨ Générer avec IA', generating: 'Génération…',
    save: 'Sauvegarder brouillon', saving: 'Sauvegarde…',
    send: 'Envoyer à tous les contacts', sending: 'Envoi…',
    noCampaigns: 'Aucune campagne.',
    status: { draft: 'Brouillon', sending: 'Envoi…', sent: 'Envoyé', failed: 'Échoué' },
    sentCount: 'envoyé(s)',
    upgradeMsg: 'Passez au forfait Basic ou supérieur pour utiliser les campagnes email.',
    upgradeBtn: 'Mettre à niveau',
    caslNote: 'Conforme CASL : chaque email inclut un lien de désabonnement.',
    topicForAI: 'Sujet pour la génération IA (optionnel)',
  },
  ar: {
    title: 'الحملات البريدية', subtitle: 'أدر قائمة بريدك وأرسل الحملات.',
    tabs: { contacts: 'جهات الاتصال', campaigns: 'الحملات' },
    addContact: 'إضافة جهة اتصال', importContacts: 'استيراد (لصق رسائل)',
    emailLabel: 'البريد الإلكتروني', nameLabel: 'الاسم (اختياري)',
    importLabel: 'الصق رسائل البريد الإلكتروني (سطر واحد لكل رسالة)',
    add: 'إضافة', adding: 'جارٍ الإضافة…', import: 'استيراد', importing: 'جارٍ الاستيراد…',
    noContacts: 'لا توجد جهات اتصال بعد.',
    subscribed: 'مشترك', unsubscribed: 'غير مشترك',
    deleteSelected: 'حذف المحدد',
    newCampaign: '+ حملة جديدة', campaignName: 'اسم الحملة',
    subject: 'الموضوع', content: 'محتوى البريد الإلكتروني',
    generateBtn: '✨ توليد بالذكاء الاصطناعي', generating: 'جارٍ التوليد…',
    save: 'حفظ مسودة', saving: 'جارٍ الحفظ…',
    send: 'إرسال لجميع جهات الاتصال', sending: 'جارٍ الإرسال…',
    noCampaigns: 'لا توجد حملات بعد.',
    status: { draft: 'مسودة', sending: 'جارٍ الإرسال…', sent: 'أُرسل', failed: 'فشل' },
    sentCount: 'مُرسَل',
    upgradeMsg: 'قم بالترقية إلى خطة Basic أو أعلى لاستخدام حملات البريد الإلكتروني.',
    upgradeBtn: 'الترقية الآن',
    caslNote: 'متوافق مع CASL: يتضمن كل بريد إلكتروني رابط إلغاء الاشتراك.',
    topicForAI: 'موضوع التوليد بالذكاء الاصطناعي (اختياري)',
  },
  es: {
    title: 'Campañas de Email', subtitle: 'Gestiona tu lista de correo y envía campañas.',
    tabs: { contacts: 'Contactos', campaigns: 'Campañas' },
    addContact: 'Añadir contacto', importContacts: 'Importar (pegar emails)',
    emailLabel: 'Email', nameLabel: 'Nombre (opcional)',
    importLabel: 'Pega los emails (uno por línea)',
    add: 'Añadir', adding: 'Añadiendo…', import: 'Importar', importing: 'Importando…',
    noContacts: 'Sin contactos aún.',
    subscribed: 'Suscrito', unsubscribed: 'Desuscrito',
    deleteSelected: 'Eliminar seleccionados',
    newCampaign: '+ Nueva Campaña', campaignName: 'Nombre de la campaña',
    subject: 'Asunto', content: 'Contenido del email',
    generateBtn: '✨ Generar con IA', generating: 'Generando…',
    save: 'Guardar borrador', saving: 'Guardando…',
    send: 'Enviar a todos los contactos', sending: 'Enviando…',
    noCampaigns: 'Sin campañas aún.',
    status: { draft: 'Borrador', sending: 'Enviando…', sent: 'Enviado', failed: 'Fallido' },
    sentCount: 'enviado(s)',
    upgradeMsg: 'Actualiza al plan Basic o superior para usar campañas de email.',
    upgradeBtn: 'Actualizar ahora',
    caslNote: 'Compatible con CASL: cada email incluye un enlace de cancelación.',
    topicForAI: 'Tema para generación IA (opcional)',
  },
  zh: {
    title: '邮件营销', subtitle: '管理您的邮件列表并发送营销活动。',
    tabs: { contacts: '联系人', campaigns: '活动' },
    addContact: '添加联系人', importContacts: '批量导入（粘贴邮箱）',
    emailLabel: '邮箱', nameLabel: '姓名（可选）',
    importLabel: '粘贴邮箱地址（每行一个）',
    add: '添加', adding: '添加中…', import: '导入', importing: '导入中…',
    noContacts: '暂无联系人。',
    subscribed: '已订阅', unsubscribed: '已退订',
    deleteSelected: '删除所选',
    newCampaign: '+ 新建活动', campaignName: '活动名称',
    subject: '主题', content: '邮件内容',
    generateBtn: '✨ AI生成', generating: '生成中…',
    save: '保存草稿', saving: '保存中…',
    send: '发送给所有联系人', sending: '发送中…',
    noCampaigns: '暂无活动。',
    status: { draft: '草稿', sending: '发送中…', sent: '已发送', failed: '发送失败' },
    sentCount: '已发送',
    upgradeMsg: '升级到Basic计划或更高版本以使用邮件营销功能。',
    upgradeBtn: '立即升级',
    caslNote: '符合CASL法规：每封邮件均包含退订链接。',
    topicForAI: 'AI生成主题（可选）',
  },
}

export default function CampaignsPage() {
  const { lang, isRTL } = useUILang()
  const ui = UI[lang]
  const [tab, setTab] = useState<Tab>('contacts')
  const [plan, setPlan] = useState<string>('free')

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [addingContact, setAddingContact] = useState(false)
  const [importText, setImportText] = useState('')
  const [importingContacts, setImportingContacts] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [contactError, setContactError] = useState('')
  const [contactSuccess, setContactSuccess] = useState('')

  // Campaigns state
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(true)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [campaignName, setCampaignName] = useState('')
  const [campaignSubject, setCampaignSubject] = useState('')
  const [campaignContent, setCampaignContent] = useState('')
  const [topicForAI, setTopicForAI] = useState('')
  const [savingCampaign, setSavingCampaign] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [generatingContent, setGeneratingContent] = useState(false)
  const [campaignError, setCampaignError] = useState('')
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('plan').eq('id', user.id).single()
        .then(({ data }) => setPlan(data?.plan ?? 'free'))
    })
    loadContacts()
    loadCampaigns()
  }, [])

  async function loadContacts() {
    setContactsLoading(true)
    const r = await fetch('/api/campaigns/contacts')
    if (r.ok) {
      const d = await r.json()
      setContacts(d.contacts ?? [])
    }
    setContactsLoading(false)
  }

  async function loadCampaigns() {
    setCampaignsLoading(true)
    const r = await fetch('/api/campaigns')
    if (r.ok) {
      const d = await r.json()
      setCampaigns(d.campaigns ?? [])
    }
    setCampaignsLoading(false)
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault()
    setContactError('')
    setAddingContact(true)
    const r = await fetch('/api/campaigns/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, name: newName }),
    })
    const d = await r.json()
    if (!r.ok) {
      setContactError(d.error ?? 'Error adding contact')
    } else {
      setNewEmail('')
      setNewName('')
      setContactSuccess('Contact added!')
      setTimeout(() => setContactSuccess(''), 3000)
      await loadContacts()
    }
    setAddingContact(false)
  }

  async function importContacts() {
    setContactError('')
    setImportingContacts(true)
    const emails = importText.split('\n').map(e => e.trim()).filter(Boolean)
    const r = await fetch('/api/campaigns/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails }),
    })
    const d = await r.json()
    if (!r.ok) {
      setContactError(d.error ?? 'Import error')
    } else {
      setImportText('')
      setShowImport(false)
      setContactSuccess(`${d.added ?? 0} contacts imported!`)
      setTimeout(() => setContactSuccess(''), 3000)
      await loadContacts()
    }
    setImportingContacts(false)
  }

  async function deleteContacts(idsToDelete?: string[]) {
    const ids = idsToDelete ?? Array.from(selectedContacts)
    if (!ids.length) return
    const r = await fetch('/api/campaigns/contacts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (r.ok) {
      setSelectedContacts(prev => {
        const s = new Set(prev)
        ids.forEach(id => s.delete(id))
        return s
      })
      await loadContacts()
    }
  }

  async function generateWithAI() {
    setGeneratingContent(true)
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'email',
        topic: topicForAI || campaignSubject || campaignName,
        tone: 'Professional',
        language: lang === 'zh' ? 'zh' : lang === 'es' ? 'es' : lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr' : 'en',
        wordCount: 250,
      }),
    })
    const d = await r.json()
    if (r.ok && d.content) {
      setCampaignContent(d.content)
    }
    setGeneratingContent(false)
  }

  async function saveCampaign() {
    setCampaignError('')
    setSavingCampaign(true)
    const r = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: campaignName, subject: campaignSubject, content: campaignContent }),
    })
    const d = await r.json()
    if (!r.ok) {
      setCampaignError(d.error ?? 'Error saving campaign')
    } else {
      setCampaignName('')
      setCampaignSubject('')
      setCampaignContent('')
      setTopicForAI('')
      setShowNewCampaign(false)
      await loadCampaigns()
    }
    setSavingCampaign(false)
  }

  async function sendCampaign(id: string) {
    setSendingId(id)
    setSendResult(null)
    const r = await fetch('/api/campaigns/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: id }),
    })
    const d = await r.json()
    if (r.ok) {
      setSendResult({ sent: d.sent, failed: d.failed })
      await loadCampaigns()
    } else {
      setCampaignError(d.error ?? 'Send error')
    }
    setSendingId(null)
  }

  async function deleteCampaign(id: string) {
    await fetch('/api/campaigns', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await loadCampaigns()
  }

  const isFreePlan = plan === 'free'

  return (
    <div className={`p-6 max-w-5xl ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{ui.title}</h1>
      <p className="text-gray-500 text-sm mb-6">{ui.subtitle}</p>

      {isFreePlan ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3">📧</p>
          <p className="text-amber-800 font-semibold mb-2">{ui.upgradeMsg}</p>
          <a href="/billing" className="inline-block bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors mt-2">
            {ui.upgradeBtn} →
          </a>
        </div>
      ) : (
        <>
          {/* CASL note */}
          <div className={`flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>🔒</span>
            <span>{ui.caslNote}</span>
          </div>

          {/* Tabs */}
          <div className={`flex gap-1 mb-6 border-b border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {(['contacts', 'campaigns'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {ui.tabs[t]}
              </button>
            ))}
          </div>

          {/* ── CONTACTS TAB ── */}
          {tab === 'contacts' && (
            <div>
              {/* Add contact form */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
                <form onSubmit={addContact} className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">{ui.addContact}</p>
                  <div className={`flex gap-3 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      required
                      placeholder={ui.emailLabel}
                      className="flex-1 min-w-48 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder={ui.nameLabel}
                      className="flex-1 min-w-32 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={addingContact}
                      className="bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60"
                    >
                      {addingContact ? ui.adding : ui.add}
                    </button>
                  </div>
                </form>

                {/* Import toggle */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setShowImport(v => !v)}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                  >
                    {showImport ? '▲' : '▼'} {ui.importContacts}
                  </button>
                  {showImport && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        rows={4}
                        placeholder={ui.importLabel}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                      />
                      <button
                        onClick={importContacts}
                        disabled={importingContacts || !importText.trim()}
                        className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60"
                      >
                        {importingContacts ? ui.importing : ui.import}
                      </button>
                    </div>
                  )}
                </div>

                {contactError && <p className="text-red-500 text-xs mt-2">{contactError}</p>}
                {contactSuccess && <p className="text-green-600 text-xs mt-2">✓ {contactSuccess}</p>}
              </div>

              {/* Contacts table */}
              {contactsLoading ? (
                <div className="text-gray-400 text-sm p-4">Loading…</div>
              ) : contacts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                  {ui.noContacts}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Bulk bar */}
                  {selectedContacts.size > 0 && (
                    <div className={`flex items-center gap-3 px-5 py-3 bg-brand-50 border-b border-brand-100 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-brand-700 font-medium">{selectedContacts.size} selected</span>
                      <button onClick={() => deleteContacts()} className="text-red-500 hover:text-red-600 font-medium">{ui.deleteSelected}</button>
                    </div>
                  )}
                  <div className="divide-y divide-gray-50">
                    {contacts.map(c => (
                      <div key={c.id} className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(c.id)}
                          onChange={() => {
                            const s = new Set(selectedContacts)
                            s.has(c.id) ? s.delete(c.id) : s.add(c.id)
                            setSelectedContacts(s)
                          }}
                          className="accent-brand-600 shrink-0"
                        />
                        <span className="text-sm text-gray-800 flex-1 truncate">{c.email}</span>
                        {c.name && <span className="text-xs text-gray-400 hidden sm:block truncate max-w-32">{c.name}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.subscribed ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.subscribed ? ui.subscribed : ui.unsubscribed}
                        </span>
                        <button
                          onClick={() => deleteContacts([c.id])}
                          className="text-gray-200 hover:text-red-400 text-xs shrink-0 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CAMPAIGNS TAB ── */}
          {tab === 'campaigns' && (
            <div>
              {/* New campaign button */}
              {!showNewCampaign && (
                <div className={`flex items-center justify-between mb-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div />
                  <button
                    onClick={() => setShowNewCampaign(true)}
                    className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
                  >
                    {ui.newCampaign}
                  </button>
                </div>
              )}

              {/* New campaign form */}
              {showNewCampaign && (
                <div className="bg-white rounded-2xl border border-brand-200 p-6 mb-6 space-y-4">
                  <h3 className="font-semibold text-gray-800">{ui.newCampaign.replace('+ ', '')}</h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{ui.campaignName}</label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={e => setCampaignName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{ui.subject}</label>
                    <input
                      type="text"
                      value={campaignSubject}
                      onChange={e => setCampaignSubject(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <div className={`flex items-center justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <label className="text-xs font-medium text-gray-600">{ui.content}</label>
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <input
                          type="text"
                          value={topicForAI}
                          onChange={e => setTopicForAI(e.target.value)}
                          placeholder={ui.topicForAI}
                          className="border border-gray-200 rounded-lg px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 w-48"
                        />
                        <button
                          type="button"
                          onClick={generateWithAI}
                          disabled={generatingContent}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium border border-brand-200 px-3 py-1 rounded-lg hover:bg-brand-50 transition-colors disabled:opacity-60"
                        >
                          {generatingContent ? ui.generating : ui.generateBtn}
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={campaignContent}
                      onChange={e => setCampaignContent(e.target.value)}
                      rows={8}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                  </div>
                  {campaignError && <p className="text-red-500 text-xs">{campaignError}</p>}
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button
                      onClick={saveCampaign}
                      disabled={savingCampaign || !campaignName || !campaignSubject || !campaignContent}
                      className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60"
                    >
                      {savingCampaign ? ui.saving : ui.save}
                    </button>
                    <button onClick={() => setShowNewCampaign(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                  </div>
                </div>
              )}

              {/* Send result */}
              {sendResult && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 mb-4 text-sm text-green-700">
                  ✓ Sent: {sendResult.sent} | Failed: {sendResult.failed}
                </div>
              )}

              {/* Campaign list */}
              {campaignsLoading ? (
                <div className="text-gray-400 text-sm p-4">Loading…</div>
              ) : campaigns.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                  {ui.noCampaigns}
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(c => (
                    <div key={c.id} className={`bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.subject}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                        c.status === 'sent' ? 'bg-green-50 text-green-700' :
                        c.status === 'sending' ? 'bg-blue-50 text-blue-700' :
                        c.status === 'failed' ? 'bg-red-50 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {ui.status[c.status as keyof typeof ui.status] ?? c.status}
                      </span>
                      {c.sends_count != null && c.sends_count > 0 && (
                        <span className="text-xs text-gray-400 shrink-0">{c.sends_count} {ui.sentCount}</span>
                      )}
                      {c.status === 'draft' && (
                        <button
                          onClick={() => sendCampaign(c.id)}
                          disabled={sendingId === c.id}
                          className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60 shrink-0"
                        >
                          {sendingId === c.id ? ui.sending : ui.send.split(' ').slice(0, 2).join(' ')}
                        </button>
                      )}
                      <button
                        onClick={() => deleteCampaign(c.id)}
                        className="text-gray-200 hover:text-red-400 text-xs shrink-0 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
