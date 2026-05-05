'use client'

import { MousePointer2, User, Move, Circle, Zap, Flame, Bomb, Type } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ActiveTool } from '@/components/canvas/MapCanvas'
import { cn } from '@/lib/utils'

const TOOLS: { id: ActiveTool; label: string; icon: React.ReactNode; group?: string }[] = [
  { id: 'select', label: 'Selecionar (V)', icon: <MousePointer2 size={18} /> },
  { id: 'player-ct', label: 'Jogador CT', icon: <User size={18} />, group: 'players' },
  { id: 'player-tr', label: 'Jogador TR', icon: <User size={18} />, group: 'players' },
  { id: 'route', label: 'Rota / Caminho (clique múltiplos pontos, dbl-clique p/ finalizar)', icon: <Move size={18} /> },
  { id: 'smoke', label: 'Smoke', icon: <Circle size={18} />, group: 'grenades' },
  { id: 'flash', label: 'Flash', icon: <Zap size={18} />, group: 'grenades' },
  { id: 'molotov', label: 'Molotov', icon: <Flame size={18} />, group: 'grenades' },
  { id: 'he', label: 'HE Grenade', icon: <Bomb size={18} />, group: 'grenades' },
  { id: 'text', label: 'Texto / Nota', icon: <Type size={18} /> },
]

const TOOL_COLORS: Partial<Record<ActiveTool, string>> = {
  'player-ct': 'text-blue-400 border-blue-500',
  'player-tr': 'text-orange-400 border-orange-500',
  'smoke': 'text-gray-400 border-gray-500',
  'flash': 'text-yellow-400 border-yellow-500',
  'molotov': 'text-red-400 border-red-500',
  'he': 'text-green-400 border-green-500',
}

interface ToolbarProps {
  activeTool: ActiveTool
  onToolChange: (tool: ActiveTool) => void
}

export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  return (
    <div className="flex flex-col gap-1 p-2 bg-zinc-900 border border-zinc-700 rounded-lg w-12">
      {TOOLS.map((tool, i) => {
        const isActive = activeTool === tool.id
        const colorClass = TOOL_COLORS[tool.id] ?? 'text-zinc-300 border-zinc-600'
        const prevGroup = TOOLS[i - 1]?.group
        const showDivider = i > 0 && (tool.group !== prevGroup || (!tool.group && prevGroup))

        return (
          <div key={tool.id}>
            {showDivider && <div className="h-px bg-zinc-700 my-1" />}
            <Tooltip>
              <TooltipTrigger
                onClick={() => onToolChange(tool.id)}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded border transition-all',
                  isActive
                    ? `bg-zinc-700 ${colorClass} border-current`
                    : 'border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                )}
              >
                {tool.icon}
              </TooltipTrigger>
              <TooltipContent side="right">{tool.label}</TooltipContent>
            </Tooltip>
          </div>
        )
      })}
    </div>
  )
}
