import { GateResult } from './types'

interface CompareData {
  behind_by: number
  ahead_by: number
}

export function evaluateBranch(compare: CompareData): GateResult {
  if (compare.behind_by === 0) {
    return { status: 'pass', detail: '' }
  }
  return {
    status: 'fail',
    detail: `${compare.behind_by} commit${compare.behind_by === 1 ? '' : 's'} behind`,
  }
}
