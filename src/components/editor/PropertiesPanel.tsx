'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TacticElement, PlayerData, RouteData, GrenadeData, TextData, GrenadeType, GRENADE_COLORS } from '@/lib/types'

interface PropertiesPanelProps {
  element: TacticElement | null
  onUpdate: (id: string, data: TacticElement['data']) => void
  onDelete: (id: string) => void
}

export function PropertiesPanel({ element, onUpdate, onDelete }: PropertiesPanelProps) {
  if (!element) {
    return (
      <div className="p-4 text-zinc-500 text-sm">
        Selecione um elemento para editar suas propriedades.
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          {element.type === 'player' ? 'Jogador' :
           element.type === 'route' ? 'Rota' :
           element.type === 'grenade' ? 'Granada' : 'Texto'}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-900/20"
          onClick={() => onDelete(element.id)}
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {element.type === 'player' && (
        <PlayerProperties element={element} onUpdate={onUpdate} />
      )}
      {element.type === 'route' && (
        <RouteProperties element={element} onUpdate={onUpdate} />
      )}
      {element.type === 'grenade' && (
        <GrenadeProperties element={element} onUpdate={onUpdate} />
      )}
      {element.type === 'text' && (
        <TextProperties element={element} onUpdate={onUpdate} />
      )}
    </div>
  )
}

function PlayerProperties({ element, onUpdate }: { element: TacticElement; onUpdate: PropertiesPanelProps['onUpdate'] }) {
  const data = element.data as PlayerData
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-zinc-400">Label</Label>
        <Input
          value={data.label}
          onChange={e => onUpdate(element.id, { ...data, label: e.target.value })}
          className="h-8 mt-1 bg-zinc-800 border-zinc-700 text-sm"
          maxLength={8}
        />
      </div>
      <div>
        <Label className="text-xs text-zinc-400">Cor</Label>
        <input
          type="color"
          value={data.color}
          onChange={e => onUpdate(element.id, { ...data, color: e.target.value })}
          className="mt-1 h-8 w-full rounded cursor-pointer bg-zinc-800 border border-zinc-700 p-1"
        />
      </div>
      <div className="text-xs text-zinc-500 bg-zinc-800/50 rounded p-2">
        Time: <span className={data.team === 'CT' ? 'text-blue-400 font-bold' : 'text-orange-400 font-bold'}>{data.team}</span>
      </div>
    </div>
  )
}

function RouteProperties({ element, onUpdate }: { element: TacticElement; onUpdate: PropertiesPanelProps['onUpdate'] }) {
  const data = element.data as RouteData
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-zinc-400">Cor</Label>
        <input
          type="color"
          value={data.color}
          onChange={e => onUpdate(element.id, { ...data, color: e.target.value })}
          className="mt-1 h-8 w-full rounded cursor-pointer bg-zinc-800 border border-zinc-700 p-1"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="dashed"
          checked={data.dashed}
          onChange={e => onUpdate(element.id, { ...data, dashed: e.target.checked })}
          className="accent-yellow-400"
        />
        <Label htmlFor="dashed" className="text-xs text-zinc-400 cursor-pointer">Linha tracejada</Label>
      </div>
    </div>
  )
}

const GRENADE_OPTIONS: { value: GrenadeType; label: string }[] = [
  { value: 'smoke', label: 'Smoke' },
  { value: 'flash', label: 'Flash' },
  { value: 'molotov', label: 'Molotov' },
  { value: 'he', label: 'HE' },
]

function GrenadeProperties({ element, onUpdate }: { element: TacticElement; onUpdate: PropertiesPanelProps['onUpdate'] }) {
  const data = element.data as GrenadeData
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-zinc-400">Tipo</Label>
        <div className="flex gap-2 mt-1">
          {GRENADE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onUpdate(element.id, { ...data, grenadeType: opt.value })}
              className="flex-1 py-1 text-xs rounded border transition-all"
              style={{
                borderColor: data.grenadeType === opt.value ? GRENADE_COLORS[opt.value] : '#3f3f46',
                color: data.grenadeType === opt.value ? GRENADE_COLORS[opt.value] : '#a1a1aa',
                background: data.grenadeType === opt.value ? `${GRENADE_COLORS[opt.value]}20` : 'transparent',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TextProperties({ element, onUpdate }: { element: TacticElement; onUpdate: PropertiesPanelProps['onUpdate'] }) {
  const data = element.data as TextData
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-zinc-400">Texto</Label>
        <Input
          value={data.text}
          onChange={e => onUpdate(element.id, { ...data, text: e.target.value })}
          className="h-8 mt-1 bg-zinc-800 border-zinc-700 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs text-zinc-400">Tamanho ({data.fontSize}px)</Label>
        <input
          type="range"
          min={10}
          max={36}
          value={data.fontSize}
          onChange={e => onUpdate(element.id, { ...data, fontSize: Number(e.target.value) })}
          className="w-full mt-1 accent-yellow-400"
        />
      </div>
      <div>
        <Label className="text-xs text-zinc-400">Cor</Label>
        <input
          type="color"
          value={data.color}
          onChange={e => onUpdate(element.id, { ...data, color: e.target.value })}
          className="mt-1 h-8 w-full rounded cursor-pointer bg-zinc-800 border border-zinc-700 p-1"
        />
      </div>
    </div>
  )
}
