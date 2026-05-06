'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TacticElement, PlayerData, RouteData, GrenadeData, TextData, WatchData, GrenadeType, RouteStyle, GRENADE_COLORS } from '@/lib/types'

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
           element.type === 'grenade' ? 'Granada' :
           element.type === 'watch' ? 'Cone de Visão' : 'Texto'}
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
      {element.type === 'watch' && (
        <WatchProperties element={element} onUpdate={onUpdate} />
      )}
    </div>
  )
}

function PlayerProperties({ element, onUpdate }: { element: TacticElement; onUpdate: PropertiesPanelProps['onUpdate'] }) {
  const data = element.data as PlayerData
  const keyframeCount = data.keyframes?.length ?? 0
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
      <div className="flex items-center justify-between text-xs bg-zinc-800/50 rounded p-2">
        <span className="text-zinc-400">
          {keyframeCount === 0 ? 'Sem keyframes' : `${keyframeCount} keyframe${keyframeCount !== 1 ? 's' : ''}`}
        </span>
        {keyframeCount > 0 && (
          <button
            onClick={() => onUpdate(element.id, { ...data, keyframes: [] })}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  )
}

const ROUTE_STYLES: { value: RouteStyle; label: string; glyph: string }[] = [
  { value: 'run',  label: 'Correr', glyph: '——→' },
  { value: 'walk', label: 'Andar',  glyph: '- -→' },
  { value: 'fake', label: 'Fake',   glyph: '···→' },
]

function RouteProperties({ element, onUpdate }: { element: TacticElement; onUpdate: PropertiesPanelProps['onUpdate'] }) {
  const data = element.data as RouteData
  const currentStyle: RouteStyle = data.style ?? (data.dashed ? 'walk' : 'run')
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-zinc-400">Estilo</Label>
        <div className="flex gap-1 mt-1">
          {ROUTE_STYLES.map(opt => (
            <button
              key={opt.value}
              onClick={() => onUpdate(element.id, { ...data, style: opt.value, dashed: opt.value !== 'run' })}
              className="flex-1 py-1.5 text-xs rounded border transition-all flex flex-col items-center gap-0.5"
              style={{
                borderColor: currentStyle === opt.value ? data.color : '#3f3f46',
                color: currentStyle === opt.value ? data.color : '#a1a1aa',
                background: currentStyle === opt.value ? `${data.color}20` : 'transparent',
              }}
            >
              <span className="font-mono text-[9px] opacity-70">{opt.glyph}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
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

function WatchProperties({ element, onUpdate }: { element: TacticElement; onUpdate: PropertiesPanelProps['onUpdate'] }) {
  const data = element.data as WatchData
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-zinc-400">Direção ({data.rotation}°)</Label>
        <input
          type="range" min={0} max={359} value={data.rotation}
          onChange={e => onUpdate(element.id, { ...data, rotation: Number(e.target.value) })}
          className="w-full mt-1 accent-cyan-400"
        />
      </div>
      <div>
        <Label className="text-xs text-zinc-400">Ângulo FOV ({data.angle}°)</Label>
        <input
          type="range" min={15} max={120} value={data.angle}
          onChange={e => onUpdate(element.id, { ...data, angle: Number(e.target.value) })}
          className="w-full mt-1 accent-cyan-400"
        />
      </div>
      <div>
        <Label className="text-xs text-zinc-400">Alcance ({data.radius}px)</Label>
        <input
          type="range" min={30} max={220} value={data.radius}
          onChange={e => onUpdate(element.id, { ...data, radius: Number(e.target.value) })}
          className="w-full mt-1 accent-cyan-400"
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
      <div>
        <Label className="text-xs text-zinc-400">Opacidade ({Math.round(data.opacity * 100)}%)</Label>
        <input
          type="range" min={10} max={60} value={Math.round(data.opacity * 100)}
          onChange={e => onUpdate(element.id, { ...data, opacity: Number(e.target.value) / 100 })}
          className="w-full mt-1 accent-cyan-400"
        />
      </div>
    </div>
  )
}
