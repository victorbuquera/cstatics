'use client'

import { Circle, Text, Group } from 'react-konva'
import { TacticElement, PlayerData, TEAM_COLORS } from '@/lib/types'

interface PlayerShapeProps {
  element: TacticElement
  isSelected: boolean
  readOnly: boolean
  animationStep?: number
  onClick: () => void
  onDragEnd: (x: number, y: number) => void
}

export function PlayerShape({ element, isSelected, readOnly, animationStep, onClick, onDragEnd }: PlayerShapeProps) {
  const data = element.data as PlayerData

  let x = data.x
  let y = data.y

  if (animationStep !== undefined && data.keyframes && data.keyframes.length > 0) {
    const sorted = [...data.keyframes].sort((a, b) => a.step - b.step)
    const before = sorted.filter(k => k.step <= animationStep).at(-1)
    const after = sorted.find(k => k.step > animationStep)
    if (before && after) {
      const t = (animationStep - before.step) / (after.step - before.step)
      x = before.x + (after.x - before.x) * t
      y = before.y + (after.y - before.y) * t
    } else if (before) {
      x = before.x
      y = before.y
    }
  }

  const color = data.team === 'CT' ? TEAM_COLORS.CT : TEAM_COLORS.TR
  const radius = 18

  return (
    <Group
      x={x}
      y={y}
      draggable={!readOnly}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={e => onDragEnd(e.target.x(), e.target.y())}
    >
      <Circle
        radius={radius}
        fill={color}
        stroke={isSelected ? '#ffffff' : 'rgba(0,0,0,0.5)'}
        strokeWidth={isSelected ? 3 : 1.5}
        shadowColor={color}
        shadowBlur={isSelected ? 12 : 6}
        shadowOpacity={0.7}
      />
      <Text
        text={data.label}
        fontSize={10}
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
  )
}
