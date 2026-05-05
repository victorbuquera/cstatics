'use client'

import { Circle, Text, Group, Line } from 'react-konva'
import { TacticElement, GrenadeData, GRENADE_COLORS } from '@/lib/types'

const GRENADE_ICONS: Record<string, string> = {
  smoke: 'S',
  flash: 'F',
  molotov: 'M',
  he: 'H',
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
        <Text
          text={GRENADE_ICONS[data.grenadeType]}
          fontSize={11}
          fontStyle="bold"
          fill="#ffffff"
          align="center"
          verticalAlign="middle"
          width={radius * 2}
          height={radius * 2}
          offsetX={radius}
          offsetY={radius}
          listening={false}
        />
      </Group>
    </>
  )
}
