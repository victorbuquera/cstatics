'use client'

import { Group, Line, Path } from 'react-konva'
import { TacticElement, RouteData, RouteStyle } from '@/lib/types'

interface RouteShapeProps {
  element: TacticElement
  isSelected: boolean
  readOnly: boolean
  onClick: () => void
}

function getRouteDash(data: RouteData): { dash?: number[]; opacity: number } {
  const style: RouteStyle = data.style ?? (data.dashed ? 'walk' : 'run')
  if (style === 'walk') return { dash: [16, 8], opacity: 0.9 }
  if (style === 'fake') return { dash: [4, 6], opacity: 0.5 }
  return { dash: undefined, opacity: 0.9 }
}

export function RouteShape({ element, isSelected, readOnly: _readOnly, onClick }: RouteShapeProps) {
  const data = element.data as RouteData
  const { dash, opacity } = getRouteDash(data)
  const pts = data.points

  // Compute arrowhead angle from last two distinct points
  let arrowAngle = 0
  if (pts.length >= 4) {
    const lx = pts[pts.length - 2], ly = pts[pts.length - 1]
    const px = pts[pts.length - 4], py = pts[pts.length - 3]
    arrowAngle = Math.atan2(ly - py, lx - px) * (180 / Math.PI)
  }
  const lastX = pts[pts.length - 2] ?? 0
  const lastY = pts[pts.length - 1] ?? 0

  const strokeWidth = isSelected ? 3.5 : 2.5

  return (
    <Group onClick={onClick} onTap={onClick}>
      {/* Curved route line — no built-in arrowhead so we draw it separately */}
      <Line
        points={pts}
        stroke={data.color}
        strokeWidth={strokeWidth}
        tension={0.35}
        lineCap="round"
        lineJoin="round"
        dash={dash}
        opacity={opacity}
        shadowColor={data.color}
        shadowBlur={isSelected ? 10 : 4}
        shadowOpacity={0.5}
        hitStrokeWidth={14}
      />
      {/* Arrowhead — small filled triangle at last point */}
      <Path
        x={lastX}
        y={lastY}
        data="M 0 -9 L 5.5 4 L 0 1.5 L -5.5 4 Z"
        fill={data.color}
        rotation={arrowAngle + 90}
        opacity={opacity}
        listening={false}
      />
    </Group>
  )
}
