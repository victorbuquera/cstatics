'use client'

import { useState, useMemo } from 'react'
import { Search, Crosshair } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Tactic, MapRecord } from '@/lib/types'
import { TacticCard } from './TacticCard'
import { QuickCreate } from './QuickCreate'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'

interface TacticsGridProps {
  initialTactics: Tactic[]
  maps: MapRecord[]
}

export function TacticsGrid({ initialTactics, maps }: TacticsGridProps) {
  const [tactics, setTactics] = useState<Tactic[]>(initialTactics)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return tactics
    const q = search.toLowerCase()
    return tactics.filter(t => t.name.toLowerCase().includes(q))
  }, [tactics, search])

  const byMap = maps.map(map => ({
    map,
    tactics: filtered.filter(t => t.map_id === map.id),
  })).filter(g => g.tactics.length > 0)

  const ctCount = tactics.filter(t => t.side === 'CT').length
  const trCount = tactics.filter(t => t.side === 'TR').length

  async function handleDelete(id: string) {
    setTactics(prev => prev.filter(t => t.id !== id))
    const { error } = await supabase.from('tactics').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao excluir tática')
      // Reload to restore
      const { data } = await supabase.from('tactics').select('*, maps(id, name, slug)').order('updated_at', { ascending: false })
      if (data) setTactics(data as Tactic[])
    } else {
      toast.success('Tática excluída')
    }
  }

  async function handleDuplicate(tactic: Tactic) {
    const newId = uuidv4()
    const now = new Date().toISOString()

    const { data: newTactic, error } = await supabase
      .from('tactics')
      .insert({
        id: newId,
        name: `${tactic.name} (cópia)`,
        map_id: tactic.map_id,
        side: tactic.side,
        description: tactic.description,
        created_at: now,
        updated_at: now,
      })
      .select('*, maps(id, name, slug)')
      .single()

    if (error || !newTactic) { toast.error('Erro ao duplicar'); return }

    // Copy phases
    const { data: phases } = await supabase.from('tactic_phases').select('*').eq('tactic_id', tactic.id)
    const phaseIdMap: Record<string, string> = {}
    if (phases?.length) {
      const newPhases = phases.map(p => {
        const newPhaseId = uuidv4()
        phaseIdMap[p.id] = newPhaseId
        return { id: newPhaseId, tactic_id: newId, name: p.name, order_index: p.order_index }
      })
      await supabase.from('tactic_phases').insert(newPhases)
    }

    // Copy elements
    const { data: elements } = await supabase.from('tactic_elements').select('*').eq('tactic_id', tactic.id)
    if (elements?.length) {
      const newElements = elements.map(e => ({
        ...e,
        id: uuidv4(),
        tactic_id: newId,
        phase_id: e.phase_id ? (phaseIdMap[e.phase_id] ?? null) : null,
      }))
      await supabase.from('tactic_elements').insert(newElements)
    }

    setTactics(prev => [newTactic as Tactic, ...prev])
    toast.success('Tática duplicada')
  }

  return (
    <div className="space-y-8">
      {/* Stats + search bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className="font-bold text-zinc-200">{tactics.length}</span> tática{tactics.length !== 1 ? 's' : ''}
          {tactics.length > 0 && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-blue-400 font-bold">{ctCount} CT</span>
              <span className="text-zinc-700">·</span>
              <span className="text-orange-400 font-bold">{trCount} TR</span>
            </>
          )}
        </div>
        <div className="flex-1 relative min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar táticas..."
            className="w-full pl-8 pr-3 h-9 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>
      </div>

      {/* Empty state */}
      {tactics.length === 0 && (
        <div className="text-center py-24">
          <Crosshair size={48} className="text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-400 mb-2">Nenhuma tática ainda</h2>
          <p className="text-zinc-600 mb-6">Clique em <strong className="text-yellow-400">Criar rápido</strong> para começar.</p>
          <QuickCreate maps={maps} />
        </div>
      )}

      {/* No results from search */}
      {tactics.length > 0 && byMap.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-500">Nenhuma tática encontrada para <strong className="text-zinc-300">&quot;{search}&quot;</strong></p>
        </div>
      )}

      {/* Tactics by map */}
      {byMap.map(({ map, tactics: mapTactics }) => (
        <section key={map.id}>
          <div className="flex items-center gap-3 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/maps/${map.slug}.png`}
              alt={map.name}
              className="w-12 h-12 rounded-lg object-cover opacity-80 border border-zinc-700"
            />
            <div>
              <h2 className="text-base font-bold text-zinc-100">{map.name}</h2>
              <span className="text-xs text-zinc-500">{mapTactics.length} tática{mapTactics.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {mapTactics.map(tactic => (
              <TacticCard
                key={tactic.id}
                tactic={tactic}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
