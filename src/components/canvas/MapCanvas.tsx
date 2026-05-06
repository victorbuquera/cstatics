'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { TacticElement, TacticPhase, PlayerData, RouteData, GrenadeData, TextData, DrawData, WatchData, CollaboratorPresence } from '@/lib/types'
import { PlayerShape } from './PlayerShape'
import { RouteShape } from './RouteShape'
import { GrenadeShape } from './GrenadeShape'
import { TextShape } from './TextShape'
import { DrawShape, DrawPreview } from './DrawShape'
import { WatchShape } from './WatchShape'
import { CursorOverlay } from './CursorOverlay'
import { v4 as uuidv4 } from 'uuid'

export type ActiveTool = 'select' | 'player-ct' | 'player-tr' | 'route' | 'smoke' | 'flash' | 'molotov' | 'he' | 'text' | 'draw' | 'watch'

const CANVAS_SIZE = 700
const MIN_SCALE = 0.3
const MAX_SCALE = 4
const SCALE_BY = 1.08
const MIN_DRAW_DIST = 4

interface ZoomState { scale: number; x: number; y: number }

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
  drawColor: string
  drawColorSecondary: string
  drawStrokeWidth: number
  onElementAdd: (element: Omit<TacticElement, 'id'>) => void
  onElementUpdate: (id: string, data: TacticElement['data']) => void
  onElementSelect: (id: string | null) => void
  onCursorMove?: (x: number, y: number) => void
  stageRef?: React.RefObject<Konva.Stage | null>
  zoomRef?: React.MutableRefObject<{ reset: () => void }>
}

export function MapCanvas({
  mapSlug, elements, phases, currentPhaseId, activeTool, selectedElementId,
  readOnly = false, collaborators = [], animationStep,
  drawColor, drawColorSecondary, drawStrokeWidth,
  onElementAdd, onElementUpdate, onElementSelect, onCursorMove,
  stageRef: externalStageRef, zoomRef,
}: MapCanvasProps) {
  const internalStageRef = useRef<Konva.Stage>(null)
  const stageRef = (externalStageRef as React.RefObject<Konva.Stage>) || internalStageRef
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null)
  const [routePoints, setRoutePoints] = useState<number[]>([])
  const [isDrawingRoute, setIsDrawingRoute] = useState(false)
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, x: 0, y: 0 })
  const [draftPoints, setDraftPoints] = useState<number[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [draftColor, setDraftColor] = useState(drawColor)
  const isPressedRef = useRef(false)

  useEffect(() => {
    const img = new window.Image()
    img.src = `/maps/${mapSlug}.png`
    img.onload = () => setMapImage(img)
  }, [mapSlug])

  if (zoomRef) {
    zoomRef.current = {
      reset: () => setZoom({ scale: 1, x: 0, y: 0 }),
    }
  }

  const getRelativePos = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return { x: 0, y: 0 }
    const ptr = stage.getPointerPosition()
    if (!ptr) return { x: 0, y: 0 }
    return {
      x: (ptr.x - stage.x()) / stage.scaleX(),
      y: (ptr.y - stage.y()) / stage.scaleY(),
    }
  }, [stageRef])

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * SCALE_BY, MAX_SCALE)
      : Math.max(oldScale / SCALE_BY, MIN_SCALE)
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }
    setZoom({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }, [stageRef])

  const handleStageDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    setZoom(prev => ({ ...prev, x: e.target.x(), y: e.target.y() }))
  }, [])

  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (readOnly || activeTool !== 'draw') return
    const pos = getRelativePos()
    const color = e.evt.button === 2 ? drawColorSecondary : drawColor
    setDraftColor(color)
    setDraftPoints([pos.x, pos.y])
    setIsDrawing(true)
    isPressedRef.current = true
  }, [readOnly, activeTool, drawColor, drawColorSecondary, getRelativePos])

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const pos = getRelativePos()
    if (onCursorMove) onCursorMove(pos.x, pos.y)

    if (!isPressedRef.current || activeTool !== 'draw') return
    setDraftPoints(prev => {
      if (prev.length < 2) return [...prev, pos.x, pos.y]
      const lx = prev[prev.length - 2]
      const ly = prev[prev.length - 1]
      const dx = pos.x - lx
      const dy = pos.y - ly
      if (Math.sqrt(dx * dx + dy * dy) < MIN_DRAW_DIST) return prev
      return [...prev, pos.x, pos.y]
    })
  }, [activeTool, getRelativePos, onCursorMove])

  const handleMouseUp = useCallback(() => {
    if (!isPressedRef.current || activeTool !== 'draw') return
    isPressedRef.current = false
    setIsDrawing(false)
    if (draftPoints.length >= 4) {
      onElementAdd({
        tactic_id: '',
        phase_id: currentPhaseId,
        type: 'draw',
        order_index: elements.length,
        data: { points: draftPoints, color: draftColor, strokeWidth: drawStrokeWidth } as DrawData,
      })
    }
    setDraftPoints([])
  }, [activeTool, draftPoints, draftColor, drawStrokeWidth, currentPhaseId, elements.length, onElementAdd])

  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (readOnly || activeTool === 'draw') return
    const pos = getRelativePos()
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'map-bg'

    if (activeTool === 'select') {
      if (clickedOnEmpty) onElementSelect(null)
      return
    }

    if (activeTool === 'player-ct' || activeTool === 'player-tr') {
      const team = activeTool === 'player-ct' ? 'CT' : 'TR'
      const playerCount = elements.filter(el => el.type === 'player' && (el.data as PlayerData).team === team).length
      onElementAdd({
        tactic_id: '', phase_id: currentPhaseId, type: 'player', order_index: elements.length,
        data: { x: pos.x, y: pos.y, team, label: team === 'CT' ? `CT${playerCount + 1}` : `TR${playerCount + 1}`, color: team === 'CT' ? '#3b82f6' : '#f97316', keyframes: [] } as PlayerData,
      })
      return
    }

    if (['smoke', 'flash', 'molotov', 'he'].includes(activeTool)) {
      onElementAdd({
        tactic_id: '', phase_id: currentPhaseId, type: 'grenade', order_index: elements.length,
        data: { x: pos.x, y: pos.y, grenadeType: activeTool as 'smoke' | 'flash' | 'molotov' | 'he' } as GrenadeData,
      })
      return
    }

    if (activeTool === 'text') {
      onElementAdd({
        tactic_id: '', phase_id: currentPhaseId, type: 'text', order_index: elements.length,
        data: { x: pos.x, y: pos.y, text: 'Nota', fontSize: 16, color: '#ffffff' } as TextData,
      })
      return
    }

    if (activeTool === 'route') {
      setRoutePoints(prev => [...prev, pos.x, pos.y])
      setIsDrawingRoute(true)
      return
    }

    if (activeTool === 'watch') {
      onElementAdd({
        tactic_id: '', phase_id: currentPhaseId, type: 'watch', order_index: elements.length,
        data: { x: pos.x, y: pos.y, rotation: 0, angle: 50, radius: 90, color: '#3b82f6', opacity: 0.25 } as WatchData,
      })
      return
    }
  }, [readOnly, activeTool, elements, currentPhaseId, onElementAdd, onElementSelect, getRelativePos])

  const handleStageDblClick = useCallback(() => {
    if (activeTool !== 'route' || !isDrawingRoute || routePoints.length < 4) return
    onElementAdd({
      tactic_id: '', phase_id: currentPhaseId, type: 'route', order_index: elements.length,
      data: { points: routePoints, color: '#facc15', dashed: false } as RouteData,
    })
    setRoutePoints([])
    setIsDrawingRoute(false)
  }, [activeTool, isDrawingRoute, routePoints, currentPhaseId, elements.length, onElementAdd])

  const handleContextMenu = useCallback((e: KonvaEventObject<PointerEvent>) => {
    if (activeTool === 'draw') e.evt.preventDefault()
  }, [activeTool])

  const visibleElements = elements.filter(el => {
    if (animationStep !== undefined) return true
    if (!currentPhaseId) return true
    return el.phase_id === currentPhaseId || el.phase_id === null
  })

  const isDraggableStage = activeTool === 'select' && !readOnly

  const cursorStyle = activeTool === 'draw' ? 'crosshair'
    : activeTool === 'select' ? (isDraggableStage ? 'grab' : 'default')
    : 'crosshair'

  return (
    <div className="relative rounded-lg overflow-hidden shadow-2xl" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
      <Stage
        ref={stageRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        scaleX={zoom.scale}
        scaleY={zoom.scale}
        x={zoom.x}
        y={zoom.y}
        draggable={isDraggableStage}
        onWheel={handleWheel}
        onDragEnd={handleStageDragEnd}
        onClick={handleStageClick}
        onDblClick={handleStageDblClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        style={{ cursor: cursorStyle }}
      >
        <Layer>
          {mapImage ? (
            <KonvaImage image={mapImage} width={CANVAS_SIZE} height={CANVAS_SIZE} name="map-bg" />
          ) : (
            <Rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="#1a1a2e" name="map-bg" />
          )}

          {visibleElements.map(el => {
            const isSelected = el.id === selectedElementId
            if (el.type === 'draw') {
              return <DrawShape key={el.id} element={el} isSelected={isSelected} onClick={() => onElementSelect(el.id)} />
            }
            if (el.type === 'route') {
              return <RouteShape key={el.id} element={el} isSelected={isSelected} readOnly={readOnly} onClick={() => onElementSelect(el.id)} />
            }
            if (el.type === 'player') {
              return <PlayerShape key={el.id} element={el} isSelected={isSelected} readOnly={readOnly} animationStep={animationStep} onClick={() => onElementSelect(el.id)} onDragEnd={(x, y) => {
                const pData = el.data as PlayerData
                if (animationStep !== undefined) {
                  const keyframes = [...(pData.keyframes ?? []).filter(k => k.step !== animationStep), { step: animationStep, x, y }]
                  onElementUpdate(el.id, { ...pData, keyframes })
                } else {
                  onElementUpdate(el.id, { ...pData, x, y })
                }
              }} />
            }
            if (el.type === 'grenade') {
              return <GrenadeShape key={el.id} element={el} isSelected={isSelected} readOnly={readOnly} onClick={() => onElementSelect(el.id)} onDragEnd={(x, y) => onElementUpdate(el.id, { ...(el.data as GrenadeData), x, y })} />
            }
            if (el.type === 'text') {
              return <TextShape key={el.id} element={el} isSelected={isSelected} readOnly={readOnly} onClick={() => onElementSelect(el.id)} onDragEnd={(x, y) => onElementUpdate(el.id, { ...(el.data as TextData), x, y })} />
            }
            if (el.type === 'watch') {
              return <WatchShape key={el.id} element={el} isSelected={isSelected} readOnly={readOnly} onClick={() => onElementSelect(el.id)} onDragEnd={(x, y) => onElementUpdate(el.id, { ...(el.data as WatchData), x, y })} />
            }
            return null
          })}

          {/* Live preview do pincel */}
          {isDrawing && draftPoints.length >= 2 && (
            <DrawPreview points={draftPoints} color={draftColor} strokeWidth={drawStrokeWidth} />
          )}
        </Layer>

        <Layer listening={false}>
          <CursorOverlay collaborators={collaborators} />
        </Layer>
      </Stage>
    </div>
  )
}
