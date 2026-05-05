'use client'

import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TacticPhase } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AnimationTimelineProps {
  phases: TacticPhase[]
  currentStep: number
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onGoToStep: (step: number) => void
}

export function AnimationTimeline({ phases, currentStep, isPlaying, onPlay, onPause, onGoToStep }: AnimationTimelineProps) {
  const totalSteps = phases.length
  const currentPhase = phases[currentStep]

  if (totalSteps === 0) return null

  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2">
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={() => onGoToStep(Math.max(0, currentStep - 1))}
        disabled={currentStep === 0}
      >
        <SkipBack size={16} />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-yellow-400 hover:text-yellow-300"
        onClick={isPlaying ? onPause : onPlay}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </Button>

      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={() => onGoToStep(Math.min(totalSteps - 1, currentStep + 1))}
        disabled={currentStep >= totalSteps - 1}
      >
        <SkipForward size={16} />
      </Button>

      <div className="flex items-center gap-1 flex-1">
        {phases.map((phase, i) => (
          <button
            key={phase.id}
            onClick={() => onGoToStep(i)}
            className={cn(
              'flex-1 h-2 rounded-full transition-all',
              i <= currentStep ? 'bg-yellow-400' : 'bg-zinc-700'
            )}
            title={phase.name}
          />
        ))}
      </div>

      <span className="text-xs text-zinc-400 whitespace-nowrap">
        {currentStep + 1}/{totalSteps}: <span className="text-yellow-300 font-bold">{currentPhase?.name}</span>
      </span>
    </div>
  )
}
