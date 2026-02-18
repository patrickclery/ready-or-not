import { GateResult } from './types'

interface ReviewThread {
  isResolved: boolean
}

export function evaluateThreads(threads: ReviewThread[]): GateResult {
  const unresolved = threads.filter((t) => !t.isResolved)

  if (unresolved.length === 0) {
    return { status: 'pass', detail: '' }
  }

  return {
    status: 'fail',
    detail: `${unresolved.length} unresolved thread${unresolved.length === 1 ? '' : 's'}`,
  }
}
