import type { LucideIcon } from 'lucide-react'
import { NotebookPen } from 'lucide-react'

export interface PlaceholderDef {
  path: string
  title: string
  description: string
  icon: LucideIcon
}

export const PLACEHOLDER_PAGES: PlaceholderDef[] = [
  {
    path: '/journal',
    title: 'Journal',
    description: 'Daily reflections, call notes, and personal accountability log.',
    icon: NotebookPen,
  },
]
