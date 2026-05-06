'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect, Line, Circle as KonvaCircle } from 'react-konva'
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

export type ActiveTool = 'select' | 'player-ct' | 'player-tr' | 'route' | 'smoke' | 'flash' | 'molotov' | 'he' | 'text' | 'draw' | 'watch'

const CANVAS_SIZE = 700
const MIN_SCALE = 0.3
const MAX_SCALE = 4
const SCALE_BY = 1.08
const MIN_DRAW_DIST = 4
const GRID_SCALE = 7  // 700 / 7 = 100×100 walkability grid
const GRID_W = Math.ceil(CANVAS_SIZE / GRID_SCALE)
const GRID_H = Math.ceil(CANVAS_SIZE / GRID_SCALE)

// ── Walkability grid ──────────────────────────────────────────���───────────────

function buildWalkGrid(image: HTMLImageElement): boolean[][] {
  const canvas = document.createElement('canvas')
  canvas.width = GRID_W
  canvas.height = GRID_H
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0, GRID_W, GRID_H)
  const { data } = ctx.getImageData(0, 0, GRID_W, GRID_H)

  return Array.from({ length: GRID_H }, (_, y) =>
    Array.from({ length: GRID_W }, (_, x) => {
      const i = (y * GRID_W + x) * 4
      // Walkable if pixel is bright enough and not fully transparent
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      return brightness > 40 && data[i + 3] > 20
    })
  )
}

// ── A* pathfinding ────────────────────────────────────────────────────────────

function nearestWalkable(grid: boolean[][], px: number, py: number): [number, number] {
  if (grid[py]?.[px]) return [px, py]
  for (let r = 1; r <= 6; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue
        const nx = px + dx, ny = py + dy
        if (nx >= 0 && ny >= 0 && nx < GRID_W && ny < GRID_H && grid[ny]?.[nx]) return [nx, ny]
      }
    }
  }
  return [px, py]
}

function astar(
  grid: boolean[][],
  fx: number, fy: number,
  tx: number, ty: number
): [number, number][] {
  const sx = Math.max(0, Math.min(GRID_W - 1, Math.round(fx / GRID_SCALE)))
  const sy = Math.max(0, Math.min(GRID_H - 1, Math.round(fy / GRID_SCALE)))
  const ex = Math.max(0, Math.min(GRID_W - 1, Math.round(tx / GRID_SCALE)))
  const ey = Math.max(0, Math.min(GRID_H - 1, Math.round(ty / GRID_SCALE)))

  const [startX, startY] = nearestWalkable(grid, sx, sy)
  const [endX, endY] = nearestWalkable(grid, ex, ey)

  if (startX === endX && startY === endY) return [[fx, fy], [tx, ty]]

  const key = (x: number, y: number) => y * GRID_W + x
  const total = GRID_W * GRID_H
  const gScore = new Float32Array(total).fill(Infinity)
  const fScore = new Float32Array(total).fill(Infinity)
  const parent = new Int32Array(total).fill(-1)
  const inOpen = new Uint8Array(total)

  const heur = (x: number, y: number) => Math.hypot(x - endX, y - endY)
  const startK = key(startX, startY)
  gScore[startK] = 0
  fScore[startK] = heur(startX, startY)
  const open: number[] = [startK]
  inOpen[startK] = 1

  const dirs: [number, number, number][] = [
    [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
    [-1, -1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [1, 1, 1.414],
  ]

  const MAX_ITER = 12000
  let iter = 0

  while (open.length > 0 && iter < MAX_ITER) {
    iter++
    let minIdx = 0
    for (let i = 1; i < open.length; i++) {
      if (fScore[open[i]] < fScore[open[minIdx]]) minIdx = i
    }
    const cur = open[minIdx]
    open.splice(minIdx, 1)
    inOpen[cur] = 0

    const cx = cur % GRID_W
    const cy = Math.floor(cur / GRID_W)

    if (cx === endX && cy === endY) {
      const path: [number, number][] = []
      let node = cur
      while (node !== -1) {
        const nx = node % GRID_W, ny = Math.floor(node / GRID_W)
        path.unshift([nx * GRID_SCALE + GRID_SCALE / 2, ny * GRID_SCALE + GRID_SCALE / 2])
        node = parent[node]
      }
      if (path.length > 0) { path[0] = [fx, fy]; path[path.length - 1] = [tx, ty] }
      return path
    }

    for (const [dx, dy, cost] of dirs) {
      const nx = cx + dx, ny = cy + dy
      if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue
      if (!grid[ny]?.[nx]) continue
      // Prevent diagonal movement through wall corners
      if (dx !== 0 && dy !== 0 && (!grid[cy]?.[nx] || !grid[ny]?.[cx])) continue
      const nk = key(nx, ny)
      const tg = gScore[cur] + cost
      if (tg < gScore[nk]) {
        parent[nk] = cur
        gScore[nk] = tg
        fScore[nk] = tg + heur(nx, ny)
        if (!inOpen[nk]) { open.push(nk); inOpen[nk] = 1 }
      }
    }
  }

  // Fallback to straight line
  return [[fx, fy], [tx, ty]]
}

// ── Path smoothing (string-pulling / line-of-sight) ──────────────────────────

function lineOfSight(grid: boolean[][], ax: number, ay: number, bx: number, by: number): boolean {
  const x0 = Math.floor(ax / GRID_SCALE), y0 = Math.floor(ay / GRID_SCALE)
  const x1 = Math.floor(bx / GRID_SCALE), y1 = Math.floor(by / GRID_SCALE)
  let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1
  let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1
  let err = dx + dy, x = x0, y = y0
  for (let i = 0; i < 300; i++) {
    if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return false
    if (!grid[y]?.[x]) return false
    if (x === x1 && y === y1) return true
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x += sx }
    if (e2 <= dx) { err += dx; y += sy }
  }
  return true
}

function smoothPath(grid: boolean[][], path: [number, number][]): [number, number][] {
  if (path.length <= 2) return path
  const out: [number, number][] = [path[0]]
  let i = 0
  while (i < path.length - 1) {
    let j = path.length - 1
    while (j > i + 1 && !lineOfSight(grid, path[i][0], path[i][1], path[j][0], path[j][1])) j--
    i = j
    out.push(path[i])
  }
  return out
}

// ── Component ────────────────────────────────────────────────────────────────���

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
  zoomRef?: React.RefObject<{ reset: () => void }>
}

export function MapCanvas({
  mapSlug, elements, phases: _phases, currentPhaseId, activeTool, selectedElementId,
  readOnly = false, collaborators = [], animationStep,
  drawColor, drawColorSecondary, drawStrokeWidth,
  onElementAdd, onElementUpdate, onElementSelect, onCursorMove,
  stageRef: externalStageRef, zoomRef,
}: MapCanvasProps) {
  const internalStageRef = useRef<Konva.Stage>(null)
  const stageRef = (externalStageRef as React.RefObject<Konva.Stage>) || internalStageRef

  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null)
  const [walkGrid, setWalkGrid] = useState<boolean[][] | null>(null)

  // Route drawing state
  const [routeWaypoints, setRouteWaypoints] = useState<[number, number][]>([])
  const [resolvedPoints, setResolvedPoints] = useState<number[]>([])
  const [isDrawingRoute, setIsDrawingRoute] = useState(false)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)

  // Draw (freehand) state
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, x: 0, y: 0 })
  const [draftPoints, setDraftPoints] = useState<number[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [draftColor, setDraftColor] = useState(drawColor)
  const isPressedRef = useRef(false)

  useEffect(() => {
    const img = new window.Image()
    img.src = `/maps/${mapSlug}.png`
    img.onload = () => {
      setMapImage(img)
      setWalkGrid(buildWalkGrid(img))
    }
  }, [mapSlug])

  // Clear route state when tool changes
  useEffect(() => {
    if (activeTool !== 'route') {
      setRouteWaypoints([])
      setResolvedPoints([])
      setIsDrawingRoute(false)
    }
  }, [activeTool])

  if (zoomRef) {
    zoomRef.current = { reset: () => setZoom({ scale: 1, x: 0, y: 0 }) }
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

  const resolveSegment = useCallback((fx: number, fy: number, tx: number, ty: number): [number, number][] => {
    if (!walkGrid) return [[fx, fy], [tx, ty]]
    const raw = astar(walkGrid, fx, fy, tx, ty)
    return smoothPath(walkGrid, raw)
  }, [walkGrid])

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
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale }
    setZoom({ scale: newScale, x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale })
  }, [stageRef])

  const handleStageDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    const t = e.target as Konva.Stage
    setZoom(prev => ({ ...prev, x: t.x(), y: t.y() }))
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

  const handleMouseMove = useCallback((_e: KonvaEventObject<MouseEvent>) => {
    const pos = getRelativePos()
    if (onCursorMove) onCursorMove(pos.x, pos.y)
    setCursorPos(pos)

    if (!isPressedRef.current || activeTool !== 'draw') return
    setDraftPoints(prev => {
      if (prev.length < 2) return [...prev, pos.x, pos.y]
      const lx = prev[prev.length - 2], ly = prev[prev.length - 1]
      const dx = pos.x - lx, dy = pos.y - ly
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
        tactic_id: '', phase_id: currentPhaseId, type: 'draw', order_index: elements.length,
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
      const newWp: [number, number] = [pos.x, pos.y]
      setRouteWaypoints(prev => {
        if (prev.length === 0) {
          setResolvedPoints([pos.x, pos.y])
          setIsDrawingRoute(true)
          return [newWp]
        }
        const last = prev[prev.length - 1]
        const seg = resolveSegment(last[0], last[1], pos.x, pos.y)
        // Skip first point of segment — it's already in resolvedPoints
        const extra = seg.slice(1).flatMap(([x, y]) => [x, y])
        setResolvedPoints(rp => [...rp, ...extra])
        return [...prev, newWp]
      })
      return
    }

    if (activeTool === 'watch') {
      onElementAdd({
        tactic_id: '', phase_id: currentPhaseId, type: 'watch', order_index: elements.length,
        data: { x: pos.x, y: pos.y, rotation: 0, angle: 50, radius: 90, color: '#3b82f6', opacity: 0.25 } as WatchData,
      })
      return
    }
  }, [readOnly, activeTool, elements, currentPhaseId, onElementAdd, onElementSelect, getRelativePos, resolveSegment])

  const handleStageDblClick = useCallback(() => {
    if (activeTool !== 'route' || !isDrawingRoute) return
    // resolvedPoints already has all path segments incl. last click point
    if (resolvedPoints.length >= 4) {
      onElementAdd({
        tactic_id: '', phase_id: currentPhaseId, type: 'route', order_index: elements.length,
        data: { points: resolvedPoints, color: '#facc15', dashed: false } as RouteData,
      })
    }
    setRouteWaypoints([])
    setResolvedPoints([])
    setIsDrawingRoute(false)
  }, [activeTool, isDrawingRoute, resolvedPoints, currentPhaseId, elements.length, onElementAdd])

  const handleContextMenu = useCallback((e: KonvaEventObject<PointerEvent>) => {
    if (activeTool === 'draw') e.evt.preventDefault()
    // Right-click while drawing route = cancel
    if (activeTool === 'route' && isDrawingRoute) {
      e.evt.preventDefault()
      setRouteWaypoints([])
      setResolvedPoints([])
      setIsDrawingRoute(false)
    }
  }, [activeTool, isDrawingRoute])

  // Preview: resolved path + dashed line to cursor
  const routePreviewPoints = useMemo(() => {
    if (!isDrawingRoute || resolvedPoints.length < 2 || !cursorPos) return null
    const lx = resolvedPoints[resolvedPoints.length - 2]
    const ly = resolvedPoints[resolvedPoints.length - 1]
    return [lx, ly, cursorPos.x, cursorPos.y]
  }, [isDrawingRoute, resolvedPoints, cursorPos])

  const visibleElements = elements.filter(el => {
    if (animationStep !== undefined) return true
    if (!currentPhaseId) return true
    return el.phase_id === currentPhaseId || el.phase_id === null
  })

  const isDraggableStage = activeTool === 'select' && !readOnly

  const cursorStyle = activeTool === 'draw' ? 'crosshair'
    : activeTool === 'route' ? 'crosshair'
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

          {/* Freehand draw preview */}
          {isDrawing && draftPoints.length >= 2 && (
            <DrawPreview points={draftPoints} color={draftColor} strokeWidth={drawStrokeWidth} />
          )}

          {/* Route drawing preview */}
          {isDrawingRoute && (
            <>
              {/* Resolved A* path so far */}
              {resolvedPoints.length >= 4 && (
                <Line
                  points={resolvedPoints}
                  stroke="#facc15"
                  strokeWidth={2.5}
                  tension={0.35}
                  lineCap="round"
                  lineJoin="round"
                  opacity={0.75}
                  listening={false}
                />
              )}
              {/* Dashed preview to cursor */}
              {routePreviewPoints && (
                <Line
                  points={routePreviewPoints}
                  stroke="#facc15"
                  strokeWidth={1.5}
                  dash={[6, 5]}
                  opacity={0.45}
                  lineCap="round"
                  listening={false}
                />
              )}
              {/* Waypoint dots */}
              {routeWaypoints.map(([wx, wy], i) => (
                <KonvaCircle
                  key={i}
                  x={wx}
                  y={wy}
                  radius={i === 0 ? 5 : 4}
                  fill={i === 0 ? '#22c55e' : '#facc15'}
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth={1.2}
                  listening={false}
                />
              ))}
              {/* Hint: click count */}
              {routeWaypoints.length > 0 && cursorPos && (
                <KonvaCircle
                  x={cursorPos.x}
                  y={cursorPos.y}
                  radius={3}
                  fill="#facc15"
                  opacity={0.5}
                  listening={false}
                />
              )}
            </>
          )}
        </Layer>

        <Layer listening={false}>
          <CursorOverlay collaborators={collaborators} />
        </Layer>
      </Stage>

      {/* Route hint overlay */}
      {isDrawingRoute && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 pointer-events-none select-none">
          <span className="text-yellow-400 font-bold">{routeWaypoints.length}</span> ponto{routeWaypoints.length !== 1 ? 's' : ''} · Clique para adicionar · <span className="text-zinc-500">2× clique para finalizar · clique direito para cancelar</span>
        </div>
      )}
    </div>
  )
}
