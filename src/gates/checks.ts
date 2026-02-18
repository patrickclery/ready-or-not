import { GateResult } from './types'

interface CheckItem {
  name: string
  conclusion: string | null
  status: string
}

export function evaluateChecks(checks: CheckItem[]): GateResult {
  if (checks.length === 0) {
    return { status: 'pass', detail: 'No checks configured' }
  }

  const failed = checks.filter((c) => c.conclusion === 'failure')
  const pending = checks.filter(
    (c) => c.conclusion === null && c.status !== 'completed'
  )
  const passed = checks.filter((c) => c.conclusion === 'success')

  if (failed.length > 0) {
    const names = failed.map((c) => c.name).join(', ')
    return {
      status: 'fail',
      detail: `${failed.length}/${checks.length} failing: ${names}`,
    }
  }

  if (pending.length > 0) {
    return {
      status: 'pending',
      detail: `${pending.length}/${checks.length} pending, ${passed.length} passed`,
    }
  }

  return {
    status: 'pass',
    detail: `${passed.length}/${checks.length} passed`,
  }
}
