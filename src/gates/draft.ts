import { GateResult } from './types'

export function evaluateDraft(isDraft: boolean, allGatesPassed: boolean): GateResult {
  if (isDraft && !allGatesPassed) {
    // Draft while gates failing — correct behavior
    return { status: 'pass', detail: 'Draft (gates pending)' }
  }

  if (isDraft && allGatesPassed) {
    // Draft but gates passed — time to mark as ready
    return { status: 'fail', detail: 'Mark as Ready for Review' }
  }

  if (!isDraft && !allGatesPassed) {
    // Not draft but gates failing — should be a draft
    return { status: 'warn', detail: 'Should be in draft while gates are failing' }
  }

  // Not draft and gates passed — good to go
  return { status: 'pass', detail: '' }
}
