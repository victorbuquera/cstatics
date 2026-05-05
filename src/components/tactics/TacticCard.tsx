'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, Edit } from 'lucide-react'
import { Tactic } from '@/lib/types'

interface TacticCardProps {
  tactic: Tactic
}

export function TacticCard({ tactic }: TacticCardProps) {
  const mapName = tactic.maps?.name ?? '—'
  const mapSlug = tactic.maps?.slug ?? 'dust2'

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all group overflow-hidden">
      <div className="h-32 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/maps/${mapSlug}.svg`}
          alt={mapName}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge
            className="text-xs font-bold"
            style={{ background: tactic.side === 'CT' ? '#1d4ed8' : '#c2410c', border: 'none' }}
          >
            {tactic.side}
          </Badge>
        </div>
        <div className="absolute bottom-2 left-2">
          <span className="text-xs text-zinc-400 font-mono">{mapName}</span>
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-bold text-zinc-100 text-sm truncate mb-1">{tactic.name}</h3>
        {tactic.description && (
          <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{tactic.description}</p>
        )}
        <div className="flex gap-2">
          <Link
            href={`/tactics/${tactic.id}`}
            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all"
          >
            <Eye size={12} /> Ver
          </Link>
          <Link
            href={`/tactics/${tactic.id}/edit`}
            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition-all"
          >
            <Edit size={12} /> Editar
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
