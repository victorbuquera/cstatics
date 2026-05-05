'use client'

import { Users } from 'lucide-react'
import { CollaboratorPresence } from '@/lib/types'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface CollaboratorsBarProps {
  collaborators: CollaboratorPresence[]
  currentUser: { name: string; color: string }
}

export function CollaboratorsBar({ collaborators, currentUser }: CollaboratorsBarProps) {
  const all = [{ userId: 'me', ...currentUser }, ...collaborators]

  return (
    <div className="flex items-center gap-2">
      <Users size={14} className="text-zinc-500" />
      <div className="flex -space-x-1">
        {all.map(user => (
          <Tooltip key={user.userId}>
            <TooltipTrigger>
              <div
                className="w-7 h-7 rounded-full border-2 border-zinc-900 flex items-center justify-center text-xs font-bold text-white"
                style={{ background: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            </TooltipTrigger>
            <TooltipContent>{user.userId === 'me' ? `${user.name} (você)` : user.name}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <span className="text-xs text-zinc-500">{all.length} online</span>
    </div>
  )
}
