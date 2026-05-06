'use client'

import { Wedge, Circle, Group } from 'react-konva'
import { TacticElement, WatchData } from '@/lib/types'

interface WatchShapeProps {
  element: TacticElement
  isSelected: boolean
  readOnly: boolean
  onClick: () => void
  onDragEnd: (x: number, y: number) => void
}

export function WatchShape({ element, isSelected, readOnly, onClick, onDragEnd }: WatchShapeProps) {
  const data = element.data as WatchData
  // Center the cone on the stored rotation direction
  const wedgeRotation = data.rotation - data.angle / 2

  return (
    <Group
      x={data.x}
      y={data.y}
      rotation={wedgeRotation}
      draggable={!readOnly}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={e => onDragEnd(e.target.x(), e.target.y())}
    >
      <Wedge
        radius={data.radius}
        angle={data.angle}
        fill={data.color}
        opacity={data.opacity}
        stroke={isSelected ? '#ffffff' : data.color}
        strokeWidth={isSelected ? 1.5 : 0.5}
        listening={false}
      />
      {/* Origin dot — click target */}
      <Circle
        radius={5}
        fill={data.color}
        opacity={0.85}
        stroke={isSelected ? '#ffffff' : 'rgba(0,0,0,0.4)'}
        strokeWidth={1}
        hitStrokeWidth={16}
        onClick={onClick}
        onTap={onClick}
      />
    </Group>
  )
}
