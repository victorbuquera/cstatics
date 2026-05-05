'use client'

import { Text, Group, Rect } from 'react-konva'
import { TacticElement, TextData } from '@/lib/types'

interface TextShapeProps {
  element: TacticElement
  isSelected: boolean
  readOnly: boolean
  onClick: () => void
  onDragEnd: (x: number, y: number) => void
}

export function TextShape({ element, isSelected, readOnly, onClick, onDragEnd }: TextShapeProps) {
  const data = element.data as TextData
  const padding = 4

  return (
    <Group
      x={data.x}
      y={data.y}
      draggable={!readOnly}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={e => onDragEnd(e.target.x(), e.target.y())}
    >
      {isSelected && (
        <Rect
          x={-padding}
          y={-padding}
          width={data.text.length * (data.fontSize * 0.6) + padding * 2}
          height={data.fontSize + padding * 2}
          fill="rgba(255,255,255,0.1)"
          stroke="#ffffff"
          strokeWidth={1}
          cornerRadius={3}
          dash={[4, 2]}
        />
      )}
      <Text
        text={data.text}
        fontSize={data.fontSize}
        fill={data.color}
        fontFamily="monospace"
        fontStyle="bold"
        shadowColor="rgba(0,0,0,0.8)"
        shadowBlur={4}
        shadowOffsetX={1}
        shadowOffsetY={1}
      />
    </Group>
  )
}
