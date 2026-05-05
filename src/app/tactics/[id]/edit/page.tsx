'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, Crosshair, Undo2, Redo2, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { TacticElement, TacticPhase, Tactic, ElementComment } from '@/lib/types'
import { MapCanvas, ActiveTool } from '@/components/canvas/MapCanvas'
import { Toolbar } from '@/components/editor/Toolbar'
import { PropertiesPanel } from '@/components/editor/PropertiesPanel'
import { PhasePanel } from '@/components/editor/PhasePanel'
import { AnimationTimeline } from '@/components/editor/AnimationTimeline'
import { CollaboratorsBar } from '@/components/editor/CollaboratorsBar'
import { CommentsSidebar } from '@/components/editor/CommentsSidebar'
import { ExportButton } from '@/components/editor/ExportButton'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useAnimation } from '@/hooks/useAnimation'
import { useUndoRedo } from '@/hooks/useUndoRedo'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster, toast } from 'sonner'
import type Konva from 'konva'
import { v4 as uuidv4 } from 'uuid'

export default function EditTacticPage() {
  const params = useParams()
  const router = useRouter()
  const tacticId = params.id as string
  const stageRef = useRef<Konva.Stage>(null)
  const zoomRef = useRef<{ reset: () => void }>({ reset: () => {} })

  const [tactic, setTactic] = useState<Tactic | null>(null)
  const [phases, setPhases] = useState<TacticPhase[]>([])
  const [comments, setComments] = useState<ElementComment[]>([])
  const [activeTool, setActiveTool] = useState<ActiveTool>('select')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentPhaseId, setCurrentPhaseId] = useState<string | null>(null)
  const [animMode, setAnimMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [drawColor, setDrawColor] = useState('#facc15')
  const [drawColorSecondary, setDrawColorSecondary] = useState('#ef4444')
  const [drawStrokeWidth, setDrawStrokeWidth] = useState(4)

  const { state: elements, push: pushHistory, undo, redo, reset: resetHistory, canUndo, canRedo } = useUndoRedo<TacticElement[]>([])
  const { currentStep, isPlaying, play, pause, goToStep } = useAnimation(phases)

  const handleRealtimeChange = useCallback((payload: { eventType: string; new: TacticElement; old: { id: string } }) => {
    if (payload.eventType === 'INSERT') {
      pushHistory([...elements.filter(e => e.id !== payload.new.id), payload.new])
    } else if (payload.eventType === 'UPDATE') {
      pushHistory(elements.map(e => e.id === payload.new.id ? payload.new : e))
    } else if (payload.eventType === 'DELETE') {
      pushHistory(elements.filter(e => e.id !== payload.old.id))
    }
  }, [elements, pushHistory])

  const { collaborators, currentUser, broadcastCursor } = useCollaboration({
    tacticId,
    onElementChange: handleRealtimeChange,
  })

  useEffect(() => {
    async function load() {
      const [{ data: tacticData }, { data: elemData }, { data: phaseData }] = await Promise.all([
        supabase.from('tactics').select('*, maps(id, name, slug)').eq('id', tacticId).single(),
        supabase.from('tactic_elements').select('*').eq('tactic_id', tacticId).order('order_index'),
        supabase.from('tactic_phases').select('*').eq('tactic_id', tacticId).order('order_index'),
      ])
      if (!tacticData) { router.push('/'); return }
      setTactic(tacticData as Tactic)
      resetHistory((elemData ?? []) as TacticElement[])
      setPhases((phaseData ?? []) as TacticPhase[])
    }
    load()
  }, [tacticId, router, resetHistory])

  useEffect(() => {
    if (!selectedId) return
    supabase.from('element_comments').select('*').eq('element_id', selectedId).order('created_at')
      .then(({ data }) => setComments((data ?? []) as ElementComment[]))
  }, [selectedId])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') { e.preventDefault(); handleSave(); return }
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); return }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); handleRedo(); return }
      }

      switch (e.key) {
        case 'v': case 'V': setActiveTool('select'); break
        case 'b': case 'B': setActiveTool('draw'); break
        case 'r': case 'R': setActiveTool('route'); break
        case 't': case 'T': setActiveTool('text'); break
        case 'c': case 'C': if (!e.ctrlKey) setActiveTool('player-ct'); break
        case 'x': case 'X': if (!e.ctrlKey) setActiveTool('player-tr'); break
        case '1': setActiveTool('smoke'); break
        case '2': setActiveTool('flash'); break
        case '3': setActiveTool('molotov'); break
        case '4': setActiveTool('he'); break
        case 'Delete': case 'Backspace':
          if (selectedId) handleElementDelete(selectedId)
          break
        case 'Escape':
          setSelectedId(null)
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, elements, canUndo, canRedo])

  const syncElementsToSupabase = useCallback(async (newElements: TacticElement[]) => {
    const currentIds = new Set(newElements.map(e => e.id))
    const prevIds = new Set(elements.map(e => e.id))
    const toDelete = [...prevIds].filter(id => !currentIds.has(id))
    const toUpsert = newElements

    if (toDelete.length > 0) {
      await supabase.from('tactic_elements').delete().in('id', toDelete)
    }
    if (toUpsert.length > 0) {
      await supabase.from('tactic_elements').upsert(toUpsert.map(e => ({ ...e, tactic_id: tacticId })))
    }
  }, [elements, tacticId])

  const handleElementAdd = useCallback(async (el: Omit<TacticElement, 'id'>) => {
    const newEl = { ...el, id: uuidv4(), tactic_id: tacticId }
    const newElements = [...elements, newEl]
    pushHistory(newElements)
    await supabase.from('tactic_elements').insert({ ...newEl })
  }, [tacticId, elements, pushHistory])

  const handleElementUpdate = useCallback(async (id: string, data: TacticElement['data']) => {
    const newElements = elements.map(e => e.id === id ? { ...e, data } : e)
    pushHistory(newElements)
    await supabase.from('tactic_elements').update({ data }).eq('id', id)
  }, [elements, pushHistory])

  const handleElementDelete = useCallback(async (id: string) => {
    const newElements = elements.filter(e => e.id !== id)
    pushHistory(newElements)
    setSelectedId(null)
    await supabase.from('tactic_elements').delete().eq('id', id)
  }, [elements, pushHistory])

  const handleUndo = useCallback(async () => {
    if (!canUndo) return
    undo()
    // sync happens via useEffect on elements change
  }, [canUndo, undo])

  const handleRedo = useCallback(async () => {
    if (!canRedo) return
    redo()
  }, [canRedo, redo])

  // Sync to Supabase after undo/redo
  const prevElementsRef = useRef(elements)
  useEffect(() => {
    if (prevElementsRef.current !== elements && tactic) {
      syncElementsToSupabase(elements)
    }
    prevElementsRef.current = elements
  }, [elements, tactic, syncElementsToSupabase])

  const handlePhaseAdd = useCallback(async (name: string) => {
    const { data } = await supabase.from('tactic_phases').insert({ tactic_id: tacticId, name, order_index: phases.length }).select().single()
    if (data) setPhases(prev => [...prev, data as TacticPhase])
  }, [tacticId, phases.length])

  const handlePhaseDelete = useCallback(async (id: string) => {
    setPhases(prev => prev.filter(p => p.id !== id))
    if (currentPhaseId === id) setCurrentPhaseId(null)
    await supabase.from('tactic_phases').delete().eq('id', id)
  }, [currentPhaseId])

  const handleAddComment = useCallback(async (elementId: string, authorName: string, text: string) => {
    const { data } = await supabase.from('element_comments').insert({ element_id: elementId, author_name: authorName, text }).select().single()
    if (data) setComments(prev => [...prev, data as ElementComment])
  }, [])

  const handleDeleteComment = useCallback(async (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId))
    await supabase.from('element_comments').delete().eq('id', commentId)
  }, [])

  const handleSave = async () => {
    if (!tactic) return
    setSaving(true)
    await supabase.from('tactics').update({ updated_at: new Date().toISOString() }).eq('id', tacticId)
    setSaving(false)
    toast.success('Tática salva!')
  }

  const selectedElement = elements.find(e => e.id === selectedId) ?? null
  const mapSlug = (tactic?.maps as { slug: string } | undefined)?.slug ?? 'dust2'
  const animStep = animMode ? currentStep : undefined

  if (!tactic) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-zinc-500 text-sm">Carregando...</div>
    </div>
  )

  return (
    <TooltipProvider>
      <Toaster theme="dark" />
      <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 flex items-center gap-2 flex-shrink-0">
          <Link href="/" className="text-zinc-500 hover:text-zinc-200">
            <ArrowLeft size={18} />
          </Link>
          <Crosshair className="text-yellow-400" size={18} />
          <span className="font-bold text-sm truncate flex-1">{tactic.name}</span>

          <CollaboratorsBar collaborators={collaborators} currentUser={currentUser} />

          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleUndo} disabled={!canUndo} title="Desfazer (Ctrl+Z)">
              <Undo2 size={15} />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleRedo} disabled={!canRedo} title="Refazer (Ctrl+Y)">
              <Redo2 size={15} />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-zinc-200" onClick={() => zoomRef.current.reset()} title="Resetar zoom (100%)">
              <ZoomIn size={15} />
            </Button>

            <div className="w-px h-5 bg-zinc-700 mx-1" />

            <Button size="sm" variant={animMode ? 'default' : 'outline'} className={`h-8 text-xs border-zinc-700 ${animMode ? 'bg-yellow-500 text-black' : ''}`} onClick={() => setAnimMode(v => !v)}>
              {animMode ? 'Editar' : '▶ Animar'}
            </Button>
            <ExportButton stageRef={stageRef} tacticName={tactic.name} />
            <Link href={`/tactics/${tacticId}`}>
              <Button size="sm" variant="outline" className="h-8 text-xs border-zinc-700">
                <Eye size={13} className="mr-1" /> Ver
              </Button>
            </Link>
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 text-xs bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
              <Save size={13} className="mr-1" /> {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </header>

        {animMode && phases.length > 0 && (
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
            <AnimationTimeline phases={phases} currentStep={currentStep} isPlaying={isPlaying} onPlay={play} onPause={pause} onGoToStep={goToStep} />
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {!animMode && (
            <div className="p-2 border-r border-zinc-800 bg-zinc-900 flex-shrink-0">
              <Toolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                drawColor={drawColor}
                drawColorSecondary={drawColorSecondary}
                drawStrokeWidth={drawStrokeWidth}
                onDrawColorChange={setDrawColor}
                onDrawColorSecondaryChange={setDrawColorSecondary}
                onDrawStrokeWidthChange={setDrawStrokeWidth}
              />
            </div>
          )}

          <div className="flex-1 flex items-center justify-center bg-zinc-950 overflow-hidden p-4">
            <MapCanvas
              mapSlug={mapSlug}
              elements={elements}
              phases={phases}
              currentPhaseId={currentPhaseId}
              activeTool={activeTool}
              selectedElementId={selectedId}
              readOnly={animMode}
              collaborators={collaborators}
              animationStep={animStep}
              drawColor={drawColor}
              drawColorSecondary={drawColorSecondary}
              drawStrokeWidth={drawStrokeWidth}
              onElementAdd={handleElementAdd}
              onElementUpdate={handleElementUpdate}
              onElementSelect={setSelectedId}
              onCursorMove={broadcastCursor}
              stageRef={stageRef}
              zoomRef={zoomRef}
            />
          </div>

          <div className="w-56 border-l border-zinc-800 bg-zinc-900 flex flex-col overflow-hidden flex-shrink-0">
            <div className="p-3 border-b border-zinc-800">
              <PhasePanel phases={phases} currentPhaseId={currentPhaseId} onPhaseSelect={setCurrentPhaseId} onPhaseAdd={handlePhaseAdd} onPhaseDelete={handlePhaseDelete} readOnly={animMode} />
            </div>
            <div className="flex-1 overflow-y-auto border-b border-zinc-800">
              <PropertiesPanel element={selectedElement} onUpdate={handleElementUpdate} onDelete={handleElementDelete} />
            </div>
            <div className="p-3 flex-shrink-0" style={{ maxHeight: '220px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <CommentsSidebar elementId={selectedId} comments={comments} onAddComment={handleAddComment} onDeleteComment={handleDeleteComment} currentUserName={currentUser.name} />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
