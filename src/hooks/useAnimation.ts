'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TacticPhase } from '@/lib/types'

const STEP_DURATION_MS = 2000

export function useAnimation(phases: TacticPhase[]) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const play = useCallback(() => {
    if (phases.length === 0) return
    setIsPlaying(true)
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= phases.length - 1) {
          stop()
          return prev
        }
        return prev + 1
      })
    }, STEP_DURATION_MS)
  }, [phases.length, stop])

  const goToStep = useCallback((step: number) => {
    stop()
    setCurrentStep(Math.max(0, Math.min(step, phases.length - 1)))
  }, [phases.length, stop])

  useEffect(() => {
    return () => stop()
  }, [stop])

  useEffect(() => {
    if (currentStep >= phases.length && phases.length > 0) {
      setCurrentStep(phases.length - 1)
    }
  }, [phases.length, currentStep])

  return { currentStep, isPlaying, play, pause: stop, goToStep }
}
