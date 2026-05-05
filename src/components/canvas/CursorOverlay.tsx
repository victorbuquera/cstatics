'use client'

import { Group, Circle, Text } from 'react-konva'
import { CollaboratorPresence } from '@/lib/types'

interface CursorOverlayProps {
  collaborators: CollaboratorPresence[]
}

export function CursorOverlay({ collaborators }: CursorOverlayProps) {
  return (
    <>
      {collaborators.map(collab => {
        if (!collab.cursor) return null
        return (
          <Group key={collab.userId} x={collab.cursor.x} y={collab.cursor.y} listening={false}>
            <Circle radius={6} fill={collab.color} opacity={0.9} />
            <Text
              text={collab.name}
              fontSize={11}
              fill={collab.color}
              fontStyle="bold"
              x={8}
              y={-6}
              shadowColor="rgba(0,0,0,0.8)"
              shadowBlur={3}
            />
          </Group>
        )
      })}
    </>
  )
}
