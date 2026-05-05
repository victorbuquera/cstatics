'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { TacticElement, TacticPhase, Tactic } from '@/lib/types'
import { MapCanvas } from '@/components/canvas/MapCanvas'
import { PhasePanel } from '@/components/editor/PhasePanel'
import { AnimationTimeline } from '@/components/editor/AnimationTimeline'
import { ExportButton } from '@/components/editor/ExportButton'
import { CollaboratorsBar } from '@/components/editor/CollaboratorsBar'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useAnimation } from '@/hooks/useAnimation'
import { TooltipProvider } from '@/components/ui/tooltip'
import type Konva from 'konva'

export default function ViewTacticPage() {
  const params = useParams()
  const router = useRouter()
  const tacticId = params.id as string
  const stageRef = useRef<Konva.Stage>(null)

  const [tactic, setTactic] = useState<Tactic | null>(null)
  const [elements, setElements] = useState<TacticElement[]>([])
  const [phases, setPhases] = useState<TacticPhase[]>([])
  const [currentPhaseId, setCurrentPhaseId] = useState<string | null>(null)
  const [animMode, setAnimMode] = useState(false)

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

  const mapSlug = (tactic?.maps as { slug: string } | undefined)?.slug ?? 'dust2'
  const animStep = animMode ? currentStep : undefined

  if (!tactic) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-zinc-500 text-sm">Carregando...</div>
    </div>
  )

  return (
    <TooltipProvider>
      <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
        <header className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <Link href="/" className="text-zinc-500 hover:text-zinc-200">
            <ArrowLeft size={18} />
          </Link>
          <Crosshair className="text-yellow-400" size={18} />
          <span className="font-bold text-sm truncate flex-1">{tactic.name}</span>
          <Badge style={{ background: tactic.side === 'CT' ? '#1d4ed8' : '#c2410c', border: 'none' }}>
            {tactic.side}
          </Badge>

          <CollaboratorsBar collaborators={collaborators} currentUser={currentUser} />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={animMode ? 'default' : 'outline'}
              className={`h-8 text-xs border-zinc-700 ${animMode ? 'bg-yellow-500 text-black' : ''}`}
              onClick={() => setAnimMode(v => !v)}
            >
              {animMode ? 'Parar' : '▶ Animar'}
            </Button>
            <ExportButton stageRef={stageRef} tacticName={tactic.name} />
            <Link href={`/tactics/${tacticId}/edit`}>
              <Button size="sm" className="h-8 text-xs bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                <Edit size={13} className="mr-1" /> Editar
              </Button>
            </Link>
          </div>
        </header>

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

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex items-center justify-center bg-zinc-950 overflow-auto p-4">
            <MapCanvas
              mapSlug={mapSlug}
              elements={elements}
              phases={phases}
              currentPhaseId={currentPhaseId}
              activeTool="select"
              selectedElementId={null}
              readOnly
              collaborators={collaborators}
              animationStep={animStep}
              onElementAdd={() => {}}
              onElementUpdate={() => {}}
              onElementSelect={() => {}}
              onCursorMove={broadcastCursor}
              stageRef={stageRef}
              drawColor="#facc15"
              drawColorSecondary="#ef4444"
              drawStrokeWidth={4}
            />
          </div>

          <div className="w-48 border-l border-zinc-800 bg-zinc-900 p-3">
            <PhasePanel
              phases={phases}
              currentPhaseId={currentPhaseId}
              onPhaseSelect={setCurrentPhaseId}
              onPhaseAdd={() => {}}
              onPhaseDelete={() => {}}
              readOnly
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
