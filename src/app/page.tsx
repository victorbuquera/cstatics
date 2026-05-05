import { Crosshair } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TacticCard } from '@/components/tactics/TacticCard'
import { QuickCreate } from '@/components/tactics/QuickCreate'
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

  const byMap = maps.map(map => ({
    map,
    tactics: tactics.filter(t => t.map_id === map.id),
  }))

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crosshair className="text-yellow-400" size={24} />
            <span className="text-lg font-bold tracking-tight">CS2 Tactics</span>
          </div>
          <QuickCreate maps={maps} />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {tactics.length === 0 ? (
          <div className="text-center py-24">
            <Crosshair size={48} className="text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-zinc-400 mb-2">Nenhuma tática criada ainda</h2>
            <p className="text-zinc-600 mb-6">Clique em <strong className="text-yellow-400">Criar rápido</strong> para começar.</p>
            <QuickCreate maps={maps} />
          </div>
        ) : (
          <div className="space-y-10">
            {byMap.filter(g => g.tactics.length > 0).map(({ map, tactics: mapTactics }) => (
              <section key={map.id}>
                <div className="flex items-center gap-3 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/maps/${map.slug}.png`} alt={map.name} className="w-10 h-10 rounded object-cover opacity-70" />
                  <h2 className="text-lg font-bold text-zinc-200">{map.name}</h2>
                  <span className="text-sm text-zinc-600">{mapTactics.length} tática{mapTactics.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {mapTactics.map(tactic => (
                    <TacticCard key={tactic.id} tactic={tactic} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
