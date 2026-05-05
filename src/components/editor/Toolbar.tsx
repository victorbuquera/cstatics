'use client'

import { MousePointer2, Type } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ActiveTool } from '@/components/canvas/MapCanvas'
import { cn } from '@/lib/utils'

// ── Custom SVG icons ──────────────────────────────────────────────────────────

const PlayerCTIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="16" height="16">
    <circle cx="8" cy="5" r="2.5" />
    <path d="M3 14c0-3 2-4.5 5-4.5s5 1.5 5 4.5" strokeLinecap="round" />
    <path d="M6 9.5l1.5 2 1.5-2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PlayerTRIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="16" height="16">
    <circle cx="8" cy="5" r="2.5" />
    <path d="M3 14c0-3 2-4.5 5-4.5s5 1.5 5 4.5" strokeLinecap="round" />
    <path d="M6 10h4M8 9v3" strokeLinecap="round" />
  </svg>
)

const RouteIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
    <path d="M2 12 Q4 4 8 6 Q12 8 14 3" strokeLinecap="round" />
    <path d="M12 2l2 1-1 2" strokeLinejoin="round" strokeLinecap="round" fill="currentColor" />
  </svg>
)

const BrushIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
    <path d="M2 14 Q4 10 7 8" strokeLinecap="round" />
    <path d="M7 8 Q9 6 11 4 L13 2" strokeLinecap="round" />
    <circle cx="2.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
)

const SmokeIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="16" height="16">
    <circle cx="8" cy="11" r="3.5" />
    <path d="M6.5 7.5 Q8 4 9.5 7.5" strokeLinecap="round" />
    <path d="M5.5 5.5 Q8 1.5 10.5 5.5" strokeLinecap="round" opacity="0.6" />
  </svg>
)

const FlashIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="16" height="16">
    <circle cx="8" cy="8" r="5" />
    <path d="M8 3v2M8 11v2M3 8h2M11 8h2M4.5 4.5l1.5 1.5M10 10l1.5 1.5M11.5 4.5L10 6M6 10l-1.5 1.5" strokeLinecap="round" />
  </svg>
)

const MolotovIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="16" height="16">
    <rect x="5" y="8" width="6" height="6" rx="1.5" />
    <path d="M7 8V6h2v2" />
    <path d="M8 1 Q11 3.5 8 6 Q5 3.5 8 1Z" fill="currentColor" stroke="none" />
  </svg>
)

const HEIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="16" height="16">
    <ellipse cx="8" cy="9.5" rx="4" ry="4.5" />
    <path d="M6.5 5V3.5h3V5" strokeLinecap="round" />
    <path d="M8 2.5v-1" strokeLinecap="round" />
    <path d="M7 1.5h2" strokeLinecap="round" />
  </svg>
)

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS: { id: ActiveTool; label: string; shortcut?: string; icon: React.ReactNode; group?: string }[] = [
  { id: 'select',    label: 'Selecionar',   shortcut: 'V', icon: <MousePointer2 size={16} /> },
  { id: 'draw',      label: 'Pincel',       shortcut: 'B', icon: <BrushIcon />, group: 'draw' },
  { id: 'player-ct', label: 'Jogador CT',   shortcut: 'C', icon: <PlayerCTIcon />, group: 'players' },
  { id: 'player-tr', label: 'Jogador TR',   shortcut: 'X', icon: <PlayerTRIcon />, group: 'players' },
  { id: 'route',     label: 'Rota',         shortcut: 'R', icon: <RouteIcon /> },
  { id: 'smoke',     label: 'Smoke',        shortcut: '1', icon: <SmokeIcon />,   group: 'grenades' },
  { id: 'flash',     label: 'Flash',        shortcut: '2', icon: <FlashIcon />,   group: 'grenades' },
  { id: 'molotov',   label: 'Molotov',      shortcut: '3', icon: <MolotovIcon />, group: 'grenades' },
  { id: 'he',        label: 'HE',           shortcut: '4', icon: <HEIcon />,      group: 'grenades' },
  { id: 'text',      label: 'Texto',        shortcut: 'T', icon: <Type size={15} /> },
]

const TOOL_COLORS: Partial<Record<ActiveTool, string>> = {
  'player-ct': 'text-blue-400',
  'player-tr': 'text-orange-400',
  'draw':      'text-purple-400',
  'route':     'text-yellow-400',
  'smoke':     'text-gray-400',
  'flash':     'text-yellow-300',
  'molotov':   'text-red-400',
  'he':        'text-green-400',
}

interface ToolbarProps {
  activeTool: ActiveTool
  onToolChange: (tool: ActiveTool) => void
  drawColor: string
  drawColorSecondary: string
  drawStrokeWidth: number
  onDrawColorChange: (color: string) => void
  onDrawColorSecondaryChange: (color: string) => void
  onDrawStrokeWidthChange: (w: number) => void
}

export function Toolbar({
  activeTool, onToolChange,
  drawColor, drawColorSecondary, drawStrokeWidth,
  onDrawColorChange, onDrawColorSecondaryChange, onDrawStrokeWidthChange,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-1 p-2 bg-zinc-900 border border-zinc-700 rounded-lg w-12">
      {TOOLS.map((tool, i) => {
        const isActive = activeTool === tool.id
        const colorClass = TOOL_COLORS[tool.id] ?? 'text-zinc-300'
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
                    ? `bg-zinc-700 ${colorClass} border-zinc-500`
                    : 'border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                )}
              >
                {tool.icon}
              </TooltipTrigger>
              <TooltipContent side="right">
                {tool.label}{tool.shortcut ? ` (${tool.shortcut})` : ''}
              </TooltipContent>
            </Tooltip>
          </div>
        )
      })}

      {/* Color swatches — visible when draw is active */}
      {activeTool === 'draw' && (
        <>
          <div className="h-px bg-zinc-700 my-1" />
          <Tooltip>
            <TooltipTrigger className="relative w-8 h-8 rounded overflow-hidden border border-zinc-600">
              <input
                type="color"
                value={drawColor}
                onChange={e => onDrawColorChange(e.target.value)}
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
              />
              <div className="w-full h-full rounded" style={{ background: drawColor }} />
            </TooltipTrigger>
            <TooltipContent side="right">Cor principal (LMB)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger className="relative w-8 h-8 rounded overflow-hidden border border-zinc-600 border-dashed">
              <input
                type="color"
                value={drawColorSecondary}
                onChange={e => onDrawColorSecondaryChange(e.target.value)}
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
              />
              <div className="w-full h-full rounded" style={{ background: drawColorSecondary }} />
            </TooltipTrigger>
            <TooltipContent side="right">Cor secundária (RMB)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger className="w-8 h-8 flex items-center justify-center">
              <input
                type="range" min={1} max={20} value={drawStrokeWidth}
                onChange={e => onDrawStrokeWidthChange(Number(e.target.value))}
                className="w-6 accent-purple-400"
                style={{ writingMode: 'vertical-lr', direction: 'rtl', height: 24 }}
              />
            </TooltipTrigger>
            <TooltipContent side="right">Espessura: {drawStrokeWidth}px</TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  )
}
