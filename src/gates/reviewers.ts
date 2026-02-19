import { GateResult } from './types'

const BOT_SUFFIX = '[bot]'

interface Reviewer {
  login: string
}

export function evaluateReviewers(reviewers: Reviewer[]): GateResult {
  const humans = reviewers.filter((r) => !r.login.endsWith(BOT_SUFFIX))

  if (humans.length > 1) {
    return {
      status: 'warn',
      detail: `${humans.length} reviewers: ${humans.map((r) => r.login).join(', ')}`,
    }
  }

  return { status: 'pass', detail: '' }
}
