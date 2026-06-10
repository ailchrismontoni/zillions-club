import type { User } from '@/types'
import { CURRENT_AGENT_ID } from './seed'

export const CURRENT_USER: User = {
  id: 'usr_chris_montoni',
  name: 'Chris Montoni',
  email: 'ailchrismontoni@gmail.com',
  role: 'Agency Owner',
  agentId: CURRENT_AGENT_ID,
}
