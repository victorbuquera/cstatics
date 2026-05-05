'use client'

import { Line } from 'react-konva'
import { TacticElement, DrawData } from '@/lib/types'

interface DrawShapeProps {
  element: TacticElement
  isSelected?: boolean
  onClick?: () => void
}

export function DrawShape({ element, isSelected, onClick }: DrawShapeProps) {
  const data = element.data as DrawData

  return (
    <Line
      points={data.points}
      stroke={data.color}
      strokeWidth={isSelected ? data.strokeWidth + 1 : data.strokeWidth}
      tension={0.4}
      lineCap="round"
      lineJoin="round"
      globalCompositeOperation="source-over"
      shadowColor={isSelected ? data.color : undefined}
      shadowBlur={isSelected ? 8 : 0}
      shadowOpacity={0.5}
      hitStrokeWidth={12}
      onClick={onClick}
      onTap={onClick}
    />
  )
}

interface DrawPreviewProps {
  points: number[]
  color: string
  strokeWidth: number
}

export function DrawPreview({ points, color, strokeWidth }: DrawPreviewProps) {
  if (points.length < 2) return null
  return (
    <Line
      points={points}
      stroke={color}
      strokeWidth={strokeWidth}
      tension={0.4}
      lineCap="round"
      lineJoin="round"
      listening={false}
      opacity={0.85}
    />
  )
}
