'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect } from 'react-konva'
import type Konva from 'konva'
import { TacticElement, TacticPhase, ElementType, PlayerData, RouteData, GrenadeData, TextData, CollaboratorPresence } from '@/lib/types'
import { PlayerShape } from './PlayerShape'
import { RouteShape } from './RouteShape'
import { GrenadeShape } from './GrenadeShape'
import { TextShape } from './TextShape'
import { CursorOverlay } from './CursorOverlay'
import { v4 as uuidv4 } from 'uuid'

export type ActiveTool = 'select' | 'player-ct' | 'player-tr' | 'route' | 'smoke' | 'flash' | 'molotov' | 'he' | 'text'

const CANVAS_SIZE = 700

interface MapCanvasProps {
  mapSlug: string
  elements: TacticElement[]
  phases: TacticPhase[]
  currentPhaseId: string | null
  activeTool: ActiveTool
  selectedElementId: string | null
  readOnly?: boolean
  collaborators?: CollaboratorPresence[]
  animationStep?: number
  onElementAdd: (element: Omit<TacticElement, 'id'>) => void
  onElementUpdate: (id: string, data: TacticElement['data']) => void
  onElementSelect: (id: string | null) => void
  onCursorMove?: (x: number, y: number) => void
  stageRef?: React.RefObject<Konva.Stage | null>
}

export function MapCanvas({
  mapSlug,
  elements,
  phases,
  currentPhaseId,
  activeTool,
  selectedElementId,
  readOnly = false,
  collaborators = [],
  animationStep,
  onElementAdd,
  onElementUpdate,
  onElementSelect,
  onCursorMove,
  stageRef: externalStageRef,
}: MapCanvasProps) {
  const internalStageRef = useRef<Konva.Stage>(null)
  const stageRef = externalStageRef || internalStageRef
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null)
  const [routePoints, setRoutePoints] = useState<number[]>([])
  const [isDrawingRoute, setIsDrawingRoute] = useState(false)

  useEffect(() => {
    const img = new window.Image()
    img.src = `/maps/${mapSlug}.svg`
    img.onload = () => setMapImage(img)
  }, [mapSlug])

  const getRelativePos = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current
    if (!stage) return { x: 0, y: 0 }
    const pos = stage.getPointerPosition()
    return pos || { x: 0, y: 0 }
  }, [stageRef])

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (readOnly) return
    const pos = getRelativePos(e)
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'map-bg'

    if (activeTool === 'select') {
      if (clickedOnEmpty) onElementSelect(null)
      return
    }

    if (activeTool === 'player-ct' || activeTool === 'player-tr') {
      const team = activeTool === 'player-ct' ? 'CT' : 'TR'
      const playerCount = elements.filter(el => el.type === 'player' && (el.data as PlayerData).team === team).length
      onElementAdd({
        tactic_id: '',
        phase_id: currentPhaseId,
        type: 'player',
        order_index: elements.length,
        data: {
          x: pos.x,
          y: pos.y,
          team,
          label: team === 'CT' ? `CT${playerCount + 1}` : `TR${playerCount + 1}`,
          color: team === 'CT' ? '#3b82f6' : '#f97316',
          keyframes: [],
        } as PlayerData,
      })
      return
    }

    if (activeTool === 'smoke' || activeTool === 'flash' || activeTool === 'molotov' || activeTool === 'he') {
      onElementAdd({
        tactic_id: '',
        phase_id: currentPhaseId,
        type: 'grenade',
        order_index: elements.length,
        data: {
          x: pos.x,
          y: pos.y,
          grenadeType: activeTool,
        } as GrenadeData,
      })
      return
    }

    if (activeTool === 'text') {
      onElementAdd({
        tactic_id: '',
        phase_id: currentPhaseId,
        type: 'text',
        order_index: elements.length,
        data: {
          x: pos.x,
          y: pos.y,
          text: 'Nota',
          fontSize: 16,
          color: '#ffffff',
        } as TextData,
      })
      return
    }

    if (activeTool === 'route') {
      setRoutePoints(prev => [...prev, pos.x, pos.y])
      setIsDrawingRoute(true)
    }
  }, [readOnly, activeTool, elements, currentPhaseId, onElementAdd, onElementSelect, getRelativePos])

  const handleStageDblClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'route' || !isDrawingRoute || routePoints.length < 4) return
    onElementAdd({
      tactic_id: '',
      phase_id: currentPhaseId,
      type: 'route',
      order_index: elements.length,
      data: {
        points: routePoints,
        color: '#facc15',
        dashed: false,
      } as RouteData,
    })
    setRoutePoints([])
    setIsDrawingRoute(false)
  }, [activeTool, isDrawingRoute, routePoints, currentPhaseId, elements.length, onElementAdd])

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!onCursorMove) return
    const pos = getRelativePos(e)
    onCursorMove(pos.x, pos.y)
  }, [onCursorMove, getRelativePos])

  const visibleElements = elements.filter(el => {
    if (animationStep !== undefined) return true
    if (!currentPhaseId) return true
    return el.phase_id === currentPhaseId || el.phase_id === null
  })

  return (
    <div className="relative" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
      <Stage
        ref={stageRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onClick={handleStageClick}
        onDblClick={handleStageDblClick}
        onMouseMove={handleMouseMove}
        style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
      >
        <Layer>
          {mapImage && (
            <KonvaImage
              image={mapImage}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              name="map-bg"
            />
          )}
          {!mapImage && (
            <Rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="#1a1a2e" name="map-bg" />
          )}

          {visibleElements.map(el => {
            const isSelected = el.id === selectedElementId
            if (el.type === 'route') {
              return (
                <RouteShape
                  key={el.id}
                  element={el}
                  isSelected={isSelected}
                  readOnly={readOnly}
                  onClick={() => onElementSelect(el.id)}
                />
              )
            }
            if (el.type === 'player') {
              return (
                <PlayerShape
                  key={el.id}
                  element={el}
                  isSelected={isSelected}
                  readOnly={readOnly}
                  animationStep={animationStep}
                  onClick={() => onElementSelect(el.id)}
                  onDragEnd={(x, y) => {
                    const data = { ...(el.data as PlayerData), x, y }
                    onElementUpdate(el.id, data)
                  }}
                />
              )
            }
            if (el.type === 'grenade') {
              return (
                <GrenadeShape
                  key={el.id}
                  element={el}
                  isSelected={isSelected}
                  readOnly={readOnly}
                  onClick={() => onElementSelect(el.id)}
                  onDragEnd={(x, y) => {
                    const data = { ...(el.data as GrenadeData), x, y }
                    onElementUpdate(el.id, data)
                  }}
                />
              )
            }
            if (el.type === 'text') {
              return (
                <TextShape
                  key={el.id}
                  element={el}
                  isSelected={isSelected}
                  readOnly={readOnly}
                  onClick={() => onElementSelect(el.id)}
                  onDragEnd={(x, y) => {
                    const data = { ...(el.data as TextData), x, y }
                    onElementUpdate(el.id, data)
                  }}
                />
              )
            }
            return null
          })}
        </Layer>

        <Layer listening={false}>
          <CursorOverlay collaborators={collaborators} />
        </Layer>
      </Stage>
    </div>
  )
}
