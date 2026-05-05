'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, Crosshair } from 'lucide-react'
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
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster, toast } from 'sonner'
import type Konva from 'konva'
import { v4 as uuidv4 } from 'uuid'

export default function EditTacticPage() {
  const params = useParams()
  const router = useRouter()
  const tacticId = params.id as string
  const stageRef = useRef<Konva.Stage>(null)

  const [tactic, setTactic] = useState<Tactic | null>(null)
  const [elements, setElements] = useState<TacticElement[]>([])
  const [phases, setPhases] = useState<TacticPhase[]>([])
  const [comments, setComments] = useState<ElementComment[]>([])
  const [activeTool, setActiveTool] = useState<ActiveTool>('select')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentPhaseId, setCurrentPhaseId] = useState<string | null>(null)
  const [animMode, setAnimMode] = useState(false)
  const [saving, setSaving] = useState(false)

  const { currentStep, isPlaying, play, pause, goToStep } = useAnimation(phases)

  const handleRealtimeChange = useCallback((payload: { eventType: string; new: TacticElement; old: { id: string } }) => {
    if (payload.eventType === 'INSERT') {
      setElements(prev => [...prev.filter(e => e.id !== payload.new.id), payload.new])
    } else if (payload.eventType === 'UPDATE') {
      setElements(prev => prev.map(e => e.id === payload.new.id ? payload.new : e))
    } else if (payload.eventType === 'DELETE') {
      setElements(prev => prev.filter(e => e.id !== payload.old.id))
    }
  }, [])

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
      setElements((elemData ?? []) as TacticElement[])
      setPhases((phaseData ?? []) as TacticPhase[])
    }
    load()
  }, [tacticId, router])

  useEffect(() => {
    if (!selectedId) return
    supabase
      .from('element_comments')
      .select('*')
      .eq('element_id', selectedId)
      .order('created_at')
      .then(({ data }) => setComments((data ?? []) as ElementComment[]))
  }, [selectedId])

  const handleElementAdd = useCallback(async (el: Omit<TacticElement, 'id'>) => {
    const id = uuidv4()
    const newEl = { ...el, id, tactic_id: tacticId }
    setElements(prev => [...prev, newEl])
    await supabase.from('tactic_elements').insert({ ...newEl })
  }, [tacticId])

  const handleElementUpdate = useCallback(async (id: string, data: TacticElement['data']) => {
    setElements(prev => prev.map(e => e.id === id ? { ...e, data } : e))
    await supabase.from('tactic_elements').update({ data }).eq('id', id)
  }, [])

  const handleElementDelete = useCallback(async (id: string) => {
    setElements(prev => prev.filter(e => e.id !== id))
    setSelectedId(null)
    await supabase.from('tactic_elements').delete().eq('id', id)
  }, [])

  const handlePhaseAdd = useCallback(async (name: string) => {
    const { data } = await supabase
      .from('tactic_phases')
      .insert({ tactic_id: tacticId, name, order_index: phases.length })
      .select()
      .single()
    if (data) setPhases(prev => [...prev, data as TacticPhase])
  }, [tacticId, phases.length])

  const handlePhaseDelete = useCallback(async (id: string) => {
    setPhases(prev => prev.filter(p => p.id !== id))
    if (currentPhaseId === id) setCurrentPhaseId(null)
    await supabase.from('tactic_phases').delete().eq('id', id)
  }, [currentPhaseId])

  const handleAddComment = useCallback(async (elementId: string, authorName: string, text: string) => {
    const { data } = await supabase
      .from('element_comments')
      .insert({ element_id: elementId, author_name: authorName, text })
      .select()
      .single()
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
        <header className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <Link href="/" className="text-zinc-500 hover:text-zinc-200">
            <ArrowLeft size={18} />
          </Link>
          <Crosshair className="text-yellow-400" size={18} />
          <span className="font-bold text-sm truncate flex-1">{tactic.name}</span>

          <CollaboratorsBar collaborators={collaborators} currentUser={currentUser} />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={animMode ? 'default' : 'outline'}
              className={`h-8 text-xs border-zinc-700 ${animMode ? 'bg-yellow-500 text-black' : ''}`}
              onClick={() => setAnimMode(v => !v)}
            >
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

        {/* Animation timeline */}
        {animMode && phases.length > 0 && (
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
            <AnimationTimeline
              phases={phases}
              currentStep={currentStep}
              isPlaying={isPlaying}
              onPlay={play}
              onPause={pause}
              onGoToStep={goToStep}
            />
          </div>
        )}

        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Toolbar */}
          {!animMode && (
            <div className="p-2 border-r border-zinc-800 bg-zinc-900 flex-shrink-0">
              <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
            </div>
          )}

          {/* Center: Canvas */}
          <div className="flex-1 flex items-center justify-center bg-zinc-950 overflow-auto p-4">
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
              onElementAdd={handleElementAdd}
              onElementUpdate={handleElementUpdate}
              onElementSelect={setSelectedId}
              onCursorMove={broadcastCursor}
              stageRef={stageRef}
            />
          </div>

          {/* Right: Sidebar */}
          <div className="w-56 border-l border-zinc-800 bg-zinc-900 flex flex-col overflow-hidden flex-shrink-0">
            <div className="p-3 border-b border-zinc-800">
              <PhasePanel
                phases={phases}
                currentPhaseId={currentPhaseId}
                onPhaseSelect={setCurrentPhaseId}
                onPhaseAdd={handlePhaseAdd}
                onPhaseDelete={handlePhaseDelete}
                readOnly={animMode}
              />
            </div>

            <div className="flex-1 overflow-y-auto border-b border-zinc-800">
              <PropertiesPanel
                element={selectedElement}
                onUpdate={handleElementUpdate}
                onDelete={handleElementDelete}
              />
            </div>

            <div className="p-3 flex-shrink-0" style={{ maxHeight: '220px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <CommentsSidebar
                elementId={selectedId}
                comments={comments}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                currentUserName={currentUser.name}
              />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
