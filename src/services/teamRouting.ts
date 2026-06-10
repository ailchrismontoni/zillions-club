import type { InviteCode, Team } from '@/types'

export interface RoutingInput {
  inviteCode?: string
  sponsor?: string
  preferredTeamId?: string
}

export interface RoutingResult {
  teamId: string
  teamName: string
  matchedBy: 'invite' | 'sponsor' | 'preferred' | 'default'
  needsReview: boolean
  inviteCodeId?: string
  resolvedSponsor: string
}

/** Map a sponsor/recruiter name fragment to a team name keyword. */
const SPONSOR_KEYWORDS: { keyword: string; teamMatch: string }[] = [
  { keyword: 'montoni', teamMatch: 'Montoni' },
  { keyword: 'hogan', teamMatch: 'Hogan' },
  { keyword: 'mickovic', teamMatch: 'Mickovic' },
  { keyword: 'nixon', teamMatch: 'Nixon' },
  { keyword: 'dean', teamMatch: 'Dean' },
  { keyword: 'pronschinske', teamMatch: 'Pronschinske' },
  { keyword: 'pron', teamMatch: 'Pronschinske' },
]

/**
 * Resolve which team a new account is routed to.
 * Priority: invite code → sponsor name → preferred team → default (Needs Review).
 */
export function resolveTeam(
  input: RoutingInput,
  teams: Team[],
  inviteCodes: InviteCode[],
): RoutingResult {
  const defaultTeam =
    teams.find((t) => t.name === 'Team Montoni') ?? teams[0]
  const resolvedSponsor = input.sponsor?.trim() ?? ''

  // 1) Invite code
  const code = input.inviteCode?.trim().toUpperCase()
  if (code) {
    const match = inviteCodes.find((c) => c.code.toUpperCase() === code && c.active)
    if (match) {
      return {
        teamId: match.teamId,
        teamName: match.teamName,
        matchedBy: 'invite',
        needsReview: false,
        inviteCodeId: match.id,
        resolvedSponsor,
      }
    }
  }

  // 2) Sponsor / recruiter name
  const sponsorLc = resolvedSponsor.toLowerCase()
  if (sponsorLc) {
    for (const { keyword, teamMatch } of SPONSOR_KEYWORDS) {
      if (sponsorLc.includes(keyword)) {
        const team = teams.find((t) => t.name.includes(teamMatch))
        if (team) {
          return {
            teamId: team.id,
            teamName: team.name,
            matchedBy: 'sponsor',
            needsReview: false,
            resolvedSponsor,
          }
        }
      }
    }
  }

  // 3) Preferred team chosen during onboarding
  if (input.preferredTeamId) {
    const team = teams.find((t) => t.id === input.preferredTeamId)
    if (team) {
      return {
        teamId: team.id,
        teamName: team.name,
        matchedBy: 'preferred',
        needsReview: false,
        resolvedSponsor,
      }
    }
  }

  // 4) Default — flag for admin review
  return {
    teamId: defaultTeam.id,
    teamName: defaultTeam.name,
    matchedBy: 'default',
    needsReview: true,
    resolvedSponsor,
  }
}

/** Validate an invite code and return the team it maps to (or null). */
export function lookupInviteCode(code: string, inviteCodes: InviteCode[]): InviteCode | null {
  const c = code.trim().toUpperCase()
  if (!c) return null
  return inviteCodes.find((ic) => ic.code.toUpperCase() === c && ic.active) ?? null
}
