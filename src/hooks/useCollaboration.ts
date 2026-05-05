'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { CollaboratorPresence, TacticElement, COLLABORATOR_COLORS } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'
import { useDebounce } from 'use-debounce'

const SESSION_USER_KEY = 'cs2tactics_user'

function getSessionUser(): { id: string; name: string; color: string } {
  if (typeof window === 'undefined') return { id: '', name: 'Anônimo', color: '#a855f7' }
  const stored = sessionStorage.getItem(SESSION_USER_KEY)
  if (stored) return JSON.parse(stored)
  const id = uuidv4()
  const color = COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)]
  const user = { id, name: `Player${Math.floor(Math.random() * 1000)}`, color }
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
  return user
}

interface UseCollaborationOptions {
  tacticId: string
  onElementChange: (payload: { eventType: string; new: TacticElement; old: { id: string } }) => void
}

export function useCollaboration({ tacticId, onElementChange }: UseCollaborationOptions) {
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([])
  const currentUser = useRef(getSessionUser())
  const [rawCursor, setRawCursor] = useState({ x: 0, y: 0 })
  const [debouncedCursor] = useDebounce(rawCursor, 50)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!tacticId) return

    const channel = supabase.channel(`tactic:${tacticId}`, {
      config: { presence: { key: currentUser.current.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ name: string; color: string; cursor?: { x: number; y: number } }>()
        const others: CollaboratorPresence[] = []
        for (const [userId, presences] of Object.entries(state)) {
          if (userId === currentUser.current.id) continue
          const p = presences[0]
          if (p) others.push({ userId, name: p.name, color: p.color, cursor: p.cursor })
        }
        setCollaborators(others)
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        if (payload.userId === currentUser.current.id) return
        setCollaborators(prev =>
          prev.map(c => c.userId === payload.userId ? { ...c, cursor: { x: payload.x, y: payload.y } } : c)
        )
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tactic_elements', filter: `tactic_id=eq.${tacticId}` },
        (payload) => {
          onElementChange(payload as unknown as { eventType: string; new: TacticElement; old: { id: string } })
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: currentUser.current.name,
            color: currentUser.current.color,
          })
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tacticId, onElementChange])

  useEffect(() => {
    if (!channelRef.current || !debouncedCursor) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: { userId: currentUser.current.id, x: debouncedCursor.x, y: debouncedCursor.y },
    })
  }, [debouncedCursor])

  const broadcastCursor = useCallback((x: number, y: number) => {
    setRawCursor({ x, y })
  }, [])

  return {
    collaborators,
    currentUser: currentUser.current,
    broadcastCursor,
  }
}
