'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, Edit, Trash2, Copy, Check, X } from 'lucide-react'
import { Tactic } from '@/lib/types'

interface TacticCardProps {
  tactic: Tactic
  onDelete: (id: string) => void
  onDuplicate: (tactic: Tactic) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}min atrás`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export function TacticCard({ tactic, onDelete, onDuplicate }: TacticCardProps) {
  const [confirming, setConfirming] = useState(false)
  const mapSlug = tactic.maps?.slug ?? 'dust2'
  const sideColor = tactic.side === 'CT' ? '#1d4ed8' : '#c2410c'
  const sideBg = tactic.side === 'CT' ? 'bg-blue-900/80 text-blue-200' : 'bg-orange-900/80 text-orange-200'

  function handleDeleteClick() {
    if (!confirming) { setConfirming(true); return }
    onDelete(tactic.id)
  }

  return (
    <div className="group relative rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-600 bg-zinc-900 transition-all flex flex-col">
      {/* Map thumbnail */}
      <Link href={`/tactics/${tactic.id}/edit`} className="block relative h-36 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/maps/${mapSlug}.png`}
          alt={mapSlug}
          className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
        <span
          className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${sideBg}`}
          style={{ borderLeft: `2px solid ${sideColor}` }}
        >
          {tactic.side}
        </span>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-bold text-sm text-zinc-100 truncate leading-tight">{tactic.name}</h3>
          <span className="text-[10px] text-zinc-500">{timeAgo(tactic.updated_at)}</span>
        </div>
      </Link>

      {/* Action bar */}
      <div className="flex border-t border-zinc-800 bg-zinc-900">
        <Link
          href={`/tactics/${tactic.id}`}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all"
        >
          <Eye size={12} /> Ver
        </Link>
        <Link
          href={`/tactics/${tactic.id}/edit`}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-yellow-500 hover:text-yellow-300 hover:bg-zinc-800 transition-all"
        >
          <Edit size={12} /> Editar
        </Link>
        <button
          onClick={() => onDuplicate(tactic)}
          className="px-3 py-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all border-l border-zinc-800"
          title="Duplicar"
        >
          <Copy size={12} />
        </button>

        {/* Delete with inline confirmation */}
        {confirming ? (
          <div className="flex border-l border-zinc-800">
            <button
              onClick={handleDeleteClick}
              className="px-2 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 flex items-center gap-1 transition-all"
            >
              <Check size={11} /> Sim
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-2 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleDeleteClick}
            className="px-3 py-2 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 border-l border-zinc-800 transition-all"
            title="Excluir"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
