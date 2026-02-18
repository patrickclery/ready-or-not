import { describe, test, expect } from 'vitest'
import { evaluateChecks } from '../../src/gates/checks'

describe('evaluateChecks', () => {
  test('pass when all checks succeed', () => {
    const result = evaluateChecks([
      { name: 'CI', conclusion: 'success', status: 'completed' },
      { name: 'SAST', conclusion: 'success', status: 'completed' },
    ])
    expect(result.status).toBe('pass')
    expect(result.detail).toBe('2/2 passed')
  })

  test('fail lists failing check names', () => {
    const result = evaluateChecks([
      { name: 'CI', conclusion: 'failure', status: 'completed' },
      { name: 'SAST', conclusion: 'success', status: 'completed' },
      { name: 'lint', conclusion: 'failure', status: 'completed' },
    ])
    expect(result.status).toBe('fail')
    expect(result.detail).toBe('2/3 failing: CI, lint')
  })

  test('pending when some checks still running', () => {
    const result = evaluateChecks([
      { name: 'CI', conclusion: null, status: 'in_progress' },
      { name: 'SAST', conclusion: 'success', status: 'completed' },
    ])
    expect(result.status).toBe('pending')
    expect(result.detail).toBe('1/2 pending, 1 passed')
  })

  test('fail takes priority over pending', () => {
    const result = evaluateChecks([
      { name: 'CI', conclusion: 'failure', status: 'completed' },
      { name: 'SAST', conclusion: null, status: 'in_progress' },
    ])
    expect(result.status).toBe('fail')
    expect(result.detail).toContain('CI')
  })

  test('pass when no checks configured', () => {
    const result = evaluateChecks([])
    expect(result.status).toBe('pass')
    expect(result.detail).toBe('No checks configured')
  })
})
