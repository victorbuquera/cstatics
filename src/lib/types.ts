export type Team = 'CT' | 'TR'
export type GrenadeType = 'smoke' | 'flash' | 'molotov' | 'he'
export type ElementType = 'player' | 'route' | 'grenade' | 'text'

export interface Keyframe {
  step: number
  x: number
  y: number
}

export interface PlayerData {
  x: number
  y: number
  team: Team
  label: string
  color: string
  keyframes?: Keyframe[]
}

export interface RouteData {
  points: number[]
  color: string
  dashed: boolean
}

export interface GrenadeData {
  x: number
  y: number
  grenadeType: GrenadeType
  targetX?: number
  targetY?: number
}

export interface TextData {
  x: number
  y: number
  text: string
  fontSize: number
  color: string
}

export type ElementData = PlayerData | RouteData | GrenadeData | TextData

export interface TacticElement {
  id: string
  tactic_id: string
  phase_id: string | null
  type: ElementType
  data: ElementData
  order_index: number
}

export interface TacticPhase {
  id: string
  tactic_id: string
  name: string
  order_index: number
}

export interface MapRecord {
  id: string
  name: string
  slug: string
}

export interface Tactic {
  id: string
  name: string
  description: string | null
  map_id: string
  side: Team
  created_at: string
  updated_at: string
  maps?: MapRecord
}

export interface ElementComment {
  id: string
  element_id: string
  author_name: string
  text: string
  created_at: string
}

export interface CollaboratorPresence {
  userId: string
  name: string
  color: string
  cursor?: { x: number; y: number }
}

export const GRENADE_COLORS: Record<GrenadeType, string> = {
  smoke: '#6b7280',
  flash: '#fbbf24',
  molotov: '#ef4444',
  he: '#10b981',
}

export const TEAM_COLORS: Record<Team, string> = {
  CT: '#3b82f6',
  TR: '#f97316',
}

export const COLLABORATOR_COLORS = [
  '#a855f7', '#ec4899', '#14b8a6', '#f59e0b',
  '#84cc16', '#06b6d4', '#8b5cf6', '#f43f5e',
]

export const MAP_SLUGS = ['dust2', 'inferno', 'mirage'] as const
export type MapSlug = typeof MAP_SLUGS[number]
