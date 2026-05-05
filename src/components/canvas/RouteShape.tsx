'use client'

import { Arrow } from 'react-konva'
import { TacticElement, RouteData } from '@/lib/types'

interface RouteShapeProps {
  element: TacticElement
  isSelected: boolean
  readOnly: boolean
  onClick: () => void
}

export function RouteShape({ element, isSelected, readOnly, onClick }: RouteShapeProps) {
  const data = element.data as RouteData

  return (
    <Arrow
      points={data.points}
      stroke={data.color}
      strokeWidth={isSelected ? 4 : 2.5}
      fill={data.color}
      pointerLength={12}
      pointerWidth={10}
      dash={data.dashed ? [10, 6] : undefined}
      opacity={0.9}
      shadowColor={data.color}
      shadowBlur={isSelected ? 10 : 4}
      shadowOpacity={0.5}
      onClick={onClick}
      onTap={onClick}
      hitStrokeWidth={12}
    />
  )
}
