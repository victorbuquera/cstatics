'use client'

import { Arrow } from 'react-konva'
import { TacticElement, RouteData, RouteStyle } from '@/lib/types'

interface RouteShapeProps {
  element: TacticElement
  isSelected: boolean
  readOnly: boolean
  onClick: () => void
}

function getRouteStyle(data: RouteData): { dash?: number[]; opacity: number } {
  const style: RouteStyle = data.style ?? (data.dashed ? 'walk' : 'run')
  if (style === 'walk') return { dash: [16, 8], opacity: 0.9 }
  if (style === 'fake') return { dash: [4, 6], opacity: 0.5 }
  return { dash: undefined, opacity: 0.9 }
}

export function RouteShape({ element, isSelected, readOnly: _readOnly, onClick }: RouteShapeProps) {
  const data = element.data as RouteData
  const { dash, opacity } = getRouteStyle(data)

  return (
    <Arrow
      points={data.points}
      stroke={data.color}
      strokeWidth={isSelected ? 4 : 2.5}
      fill={data.color}
      pointerLength={12}
      pointerWidth={10}
      dash={dash}
      opacity={opacity}
      shadowColor={data.color}
      shadowBlur={isSelected ? 10 : 4}
      shadowOpacity={0.5}
      onClick={onClick}
      onTap={onClick}
      hitStrokeWidth={12}
    />
  )
}
