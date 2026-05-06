'use client'

import { Circle, Path, Group, Line } from 'react-konva'
import { TacticElement, GrenadeData, GrenadeType, GRENADE_COLORS } from '@/lib/types'

const GRENADE_PATHS: Record<GrenadeType, string> = {
  smoke: 'M 0 5 C -8 5 -10 -2 -5 -4 C -7 -10 -1 -10 0 -6 C 1 -10 7 -10 5 -4 C 10 -2 8 5 0 5 Z',
  flash: 'M 0 -4.5 A 4.5 4.5 0 1 1 0.001 -4.5 Z M 0 -7 L 0 -11 M 4.9 -4.9 L 7.8 -7.8 M 7 0 L 11 0 M 4.9 4.9 L 7.8 7.8 M 0 7 L 0 11 M -4.9 4.9 L -7.8 7.8 M -7 0 L -11 0 M -4.9 -4.9 L -7.8 -7.8',
  molotov: 'M 0 -11 C 6 -6 9 1 7 6 C 5 10 -5 10 -7 6 C -9 1 -6 -6 0 -11 Z',
  he: 'M -1.5 -12 L 1.5 -12 M 0 -12 L 0 -9 M -5.5 -9 A 5.5 7.5 0 1 0 5.5 -9 L 5.5 -1 A 5.5 7.5 0 0 1 -5.5 -1 Z',
}

interface GrenadeShapeProps {
  element: TacticElement
  isSelected: boolean
  readOnly: boolean
  onClick: () => void
  onDragEnd: (x: number, y: number) => void
}

export function GrenadeShape({ element, isSelected, readOnly, onClick, onDragEnd }: GrenadeShapeProps) {
  const data = element.data as GrenadeData
  const color = GRENADE_COLORS[data.grenadeType]
  const radius = 14

  return (
    <>
      {data.targetX !== undefined && data.targetY !== undefined && (
        <Line
          points={[data.x, data.y, data.targetX, data.targetY]}
          stroke={color}
          strokeWidth={1.5}
          dash={[6, 4]}
          opacity={0.6}
          listening={false}
        />
      )}
      <Group
        x={data.x}
        y={data.y}
        draggable={!readOnly}
        onClick={onClick}
        onTap={onClick}
        onDragEnd={e => onDragEnd(e.target.x(), e.target.y())}
      >
        <Circle
          radius={radius}
          fill={color}
          stroke={isSelected ? '#ffffff' : 'rgba(0,0,0,0.4)'}
          strokeWidth={isSelected ? 2.5 : 1}
          shadowColor={color}
          shadowBlur={isSelected ? 10 : 5}
          shadowOpacity={0.8}
        />
        <Path
          data={GRENADE_PATHS[data.grenadeType]}
          fill="rgba(255,255,255,0.95)"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={1.5}
          fillRule="evenodd"
          listening={false}
        />
      </Group>
    </>
  )
}
