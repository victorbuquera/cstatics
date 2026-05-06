import { Crosshair } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TacticsGrid } from '@/components/tactics/TacticsGrid'
import { QuickCreate } from '@/components/tactics/QuickCreate'
import { Toaster } from 'sonner'
import { Tactic, MapRecord } from '@/lib/types'

async function getTactics(): Promise<Tactic[]> {
  const { data } = await supabase
    .from('tactics')
    .select('*, maps(id, name, slug)')
    .order('updated_at', { ascending: false })
  return (data as Tactic[]) ?? []
}

async function getMaps(): Promise<MapRecord[]> {
  const { data } = await supabase.from('maps').select('*').order('name')
  return data ?? []
}

export default async function HomePage() {
  const [tactics, maps] = await Promise.all([getTactics(), getMaps()])

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Toaster theme="dark" />

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2.5 mr-auto">
            <Crosshair className="text-yellow-400" size={22} />
            <span className="text-base font-bold tracking-tight">CS2 Tactics</span>
          </div>
          <QuickCreate maps={maps} />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <TacticsGrid initialTactics={tactics} maps={maps} />
      </div>
    </main>
  )
}
