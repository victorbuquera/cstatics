'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { MapRecord, Team } from '@/lib/types'
import { cn } from '@/lib/utils'

interface QuickCreateProps {
  maps: MapRecord[]
}

export function QuickCreate({ maps }: QuickCreateProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mapId, setMapId] = useState(maps[0]?.id ?? '')
  const [side, setSide] = useState<Team>('CT')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedMap = maps.find(m => m.id === mapId)

  const handleCreate = async () => {
    if (!mapId) return
    setLoading(true)

    const tacticName = name.trim() || `${selectedMap?.name} ${side} — ${new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`

    const { data, error } = await supabase
      .from('tactics')
      .insert({ name: tacticName, map_id: mapId, side })
      .select()
      .single()

    if (error || !data) { setLoading(false); return }

    await supabase.from('tactic_phases').insert([
      { tactic_id: data.id, name: 'Saída', order_index: 0 },
      { tactic_id: data.id, name: 'Execução', order_index: 1 },
    ])

    router.push(`/tactics/${data.id}/edit`)
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-9"
      >
        <Zap size={15} className="mr-1" /> Criar rápido
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 p-0 overflow-hidden max-w-sm">
          <div className="p-5 space-y-4">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" /> Nova tática
            </DialogTitle>

            {/* Mapa */}
            <div className="grid grid-cols-3 gap-2">
              {maps.map(map => (
                <button
                  key={map.id}
                  onClick={() => setMapId(map.id)}
                  className={cn(
                    'relative h-16 rounded-lg overflow-hidden border-2 transition-all',
                    mapId === map.id ? 'border-yellow-400 scale-[1.03]' : 'border-zinc-700 opacity-50 hover:opacity-80'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/maps/${map.slug}.png`} alt={map.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold text-white">{map.name}</span>
                </button>
              ))}
            </div>

            {/* Lado */}
            <div className="flex gap-2">
              {(['CT', 'TR'] as Team[]).map(t => (
                <button
                  key={t}
                  onClick={() => setSide(t)}
                  className={cn(
                    'flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-all',
                    side === t
                      ? t === 'CT' ? 'border-blue-500 bg-blue-900/30 text-blue-300' : 'border-orange-500 bg-orange-900/30 text-orange-300'
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                  )}
                >
                  {t === 'CT' ? '🔵 CT' : '🟠 TR'}
                </button>
              ))}
            </div>

            {/* Nome opcional */}
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`Nome (opcional) — ${selectedMap?.name} ${side}`}
              className="bg-zinc-800 border-zinc-700 h-9 text-sm"
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
              maxLength={60}
            />

            <Button
              onClick={handleCreate}
              disabled={!mapId || loading}
              className="w-full h-10 bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
            >
              {loading ? 'Criando...' : 'Criar e Abrir Editor →'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
