'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TacticPhase } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface PhasePanelProps {
  phases: TacticPhase[]
  currentPhaseId: string | null
  onPhaseSelect: (id: string | null) => void
  onPhaseAdd: (name: string) => void
  onPhaseDelete: (id: string) => void
  readOnly?: boolean
}

export function PhasePanel({ phases, currentPhaseId, onPhaseSelect, onPhaseAdd, onPhaseDelete, readOnly }: PhasePanelProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const handleAdd = () => {
    if (!newName.trim()) return
    onPhaseAdd(newName.trim())
    setNewName('')
    setAdding(false)
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Fases</div>

      <button
        onClick={() => onPhaseSelect(null)}
        className={cn(
          'w-full text-left text-xs px-2 py-1.5 rounded transition-all',
          currentPhaseId === null
            ? 'bg-yellow-500/20 text-yellow-300 font-bold'
            : 'text-zinc-400 hover:bg-zinc-800'
        )}
      >
        Todas as fases
      </button>

      {phases.map(phase => (
        <div key={phase.id} className="flex items-center gap-1">
          <button
            onClick={() => onPhaseSelect(phase.id)}
            className={cn(
              'flex-1 text-left text-xs px-2 py-1.5 rounded transition-all',
              currentPhaseId === phase.id
                ? 'bg-yellow-500/20 text-yellow-300 font-bold'
                : 'text-zinc-300 hover:bg-zinc-800'
            )}
          >
            {phase.name}
          </button>
          {!readOnly && (
            <button
              onClick={() => onPhaseDelete(phase.id)}
              className="text-zinc-600 hover:text-red-400 p-1"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      ))}

      {!readOnly && (
        adding ? (
          <div className="flex gap-1 mt-2">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nome da fase"
              className="h-7 text-xs bg-zinc-800 border-zinc-700"
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              autoFocus
            />
            <Button size="sm" className="h-7 px-2 text-xs" onClick={handleAdd}>OK</Button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-1 px-2 py-1"
          >
            <Plus size={12} /> Adicionar fase
          </button>
        )
      )}
    </div>
  )
}
