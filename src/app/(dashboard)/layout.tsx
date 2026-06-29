import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavSidebar from '@/components/NavSidebar'
import MobileBottomNav from '@/components/MobileBottomNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 flex rtl:flex-row-reverse">
      <NavSidebar email={user.email ?? ''} />
      <main className="flex-1 overflow-auto pb-16 md:pb-0 min-w-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
