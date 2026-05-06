'use client'

import { useReducer, useCallback } from 'react'

const MAX_HISTORY = 50

type State<T> = { history: T[]; index: number }
type Action<T> =
  | { type: 'push'; payload: T }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; payload: T }

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'push': {
      const trimmed = state.history.slice(0, state.index + 1)
      const next = [...trimmed, action.payload]
      const clamped = next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
      return { history: clamped, index: clamped.length - 1 }
    }
    case 'undo':
      return { ...state, index: Math.max(state.index - 1, 0) }
    case 'redo':
      return { ...state, index: Math.min(state.index + 1, state.history.length - 1) }
    case 'reset':
      return { history: [action.payload], index: 0 }
  }
}

export function useUndoRedo<T>(initialState: T) {
  const [{ history, index }, dispatch] = useReducer(
    reducer as (state: State<T>, action: Action<T>) => State<T>,
    { history: [initialState], index: 0 }
  )

  const push = useCallback((newState: T) => dispatch({ type: 'push', payload: newState }), [])
  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])
  const reset = useCallback((state: T) => dispatch({ type: 'reset', payload: state }), [])

  return {
    state: history[index],
    push,
    undo,
    redo,
    reset,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  }
}
