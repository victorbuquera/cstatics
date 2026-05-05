'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { MapRecord, Team } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function NewTacticPage() {
  const router = useRouter()
  const [maps, setMaps] = useState<MapRecord[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mapId, setMapId] = useState('')
  const [side, setSide] = useState<Team>('CT')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('maps').select('*').order('name').then(({ data }) => {
      if (data) {
        setMaps(data)
        setMapId(data[0]?.id ?? '')
      }
    })
  }, [])

  const handleCreate = async () => {
    if (!name.trim() || !mapId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('tactics')
      .insert({ name: name.trim(), description: description.trim() || null, map_id: mapId, side })
      .select()
      .single()

    if (error || !data) {
      toast.error('Erro ao criar tática')
      setLoading(false)
      return
    }

    await supabase.from('tactic_phases').insert([
      { tactic_id: data.id, name: 'Saída', order_index: 0 },
      { tactic_id: data.id, name: 'Execução', order_index: 1 },
    ])

    router.push(`/tactics/${data.id}/edit`)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/" className="text-zinc-500 hover:text-zinc-200">
            <ArrowLeft size={20} />
          </Link>
          <Crosshair className="text-yellow-400" size={20} />
          <span className="font-bold">Nova Tática</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-10 space-y-6">
        <div>
          <Label className="text-zinc-300">Nome da tática *</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Rush B com smokes"
            className="mt-2 bg-zinc-900 border-zinc-700 h-10"
            maxLength={60}
          />
        </div>

        <div>
          <Label className="text-zinc-300">Descrição</Label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descreva a tática brevemente..."
            className="mt-2 bg-zinc-900 border-zinc-700 resize-none"
            rows={3}
          />
        </div>

        <div>
          <Label className="text-zinc-300">Mapa *</Label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {maps.map(map => (
              <button
                key={map.id}
                onClick={() => setMapId(map.id)}
                className={cn(
                  'relative h-20 rounded-lg overflow-hidden border-2 transition-all',
                  mapId === map.id ? 'border-yellow-400' : 'border-zinc-700 opacity-60 hover:opacity-80'
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/maps/${map.slug}.svg`} alt={map.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute bottom-1 left-0 right-0 text-center text-xs font-bold text-white">{map.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-zinc-300">Lado</Label>
          <div className="flex gap-3 mt-2">
            {(['CT', 'TR'] as Team[]).map(t => (
              <button
                key={t}
                onClick={() => setSide(t)}
                className={cn(
                  'flex-1 py-3 rounded-lg font-bold text-sm border-2 transition-all',
                  side === t
                    ? t === 'CT' ? 'border-blue-500 bg-blue-900/30 text-blue-300' : 'border-orange-500 bg-orange-900/30 text-orange-300'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                )}
              >
                {t === 'CT' ? '🔵 Counter-Terrorist' : '🟠 Terrorist'}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleCreate}
          disabled={!name.trim() || !mapId || loading}
          className="w-full h-11 bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
        >
          {loading ? 'Criando...' : 'Criar e Abrir Editor'}
        </Button>
      </div>
    </main>
  )
}
