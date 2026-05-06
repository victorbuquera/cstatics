'use client'

import { Circle, Path, Text, Group } from 'react-konva'
import { TacticElement, PlayerData, TEAM_COLORS } from '@/lib/types'

const CT_EMBLEM = 'M 0 -7 L 6 -4 L 6 1 C 6 5 0 8 0 8 C 0 8 -6 5 -6 1 L -6 -4 Z'
const TR_EMBLEM = 'M -6 -7 L 6 -7 L 6 -4 L 2 -4 L 2 7 L -2 7 L -2 -4 L -6 -4 Z'

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
      draggable={!readOnly || animationStep !== undefined}
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
      <Path
        data={data.team === 'CT' ? CT_EMBLEM : TR_EMBLEM}
        fill="rgba(255,255,255,0.9)"
        strokeWidth={0}
        scaleX={0.85}
        scaleY={0.85}
        listening={false}
      />
      <Text
        text={data.label}
        fontSize={8}
        fontStyle="bold"
        fill="#ffffff"
        align="center"
        width={radius * 2}
        offsetX={radius}
        y={radius + 3}
        listening={false}
        shadowColor="rgba(0,0,0,0.8)"
        shadowBlur={3}
        shadowOffsetX={0}
        shadowOffsetY={1}
      />
    </Group>
  )
}
