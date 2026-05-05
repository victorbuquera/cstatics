'use client'

import { useState, useCallback } from 'react'

const MAX_HISTORY = 50

export function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState])
  const [index, setIndex] = useState(0)

  const current = history[index]

  const push = useCallback((newState: T) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, index + 1)
      const next = [...trimmed, newState]
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
    })
    setIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [index])

  const undo = useCallback(() => {
    setIndex(prev => Math.max(prev - 1, 0))
  }, [])

  const redo = useCallback(() => {
    setIndex(prev => {
      return prev < history.length - 1 ? prev + 1 : prev
    })
  }, [history.length])

  const reset = useCallback((state: T) => {
    setHistory([state])
    setIndex(0)
  }, [])

  return {
    state: current,
    push,
    undo,
    redo,
    reset,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  }
}
