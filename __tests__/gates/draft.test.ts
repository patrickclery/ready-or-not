import { describe, test, expect } from 'vitest'
import { evaluateDraft } from '../../src/gates/draft'

describe('evaluateDraft', () => {
  test('pass: draft while gates are failing (correct behavior)', () => {
    const result = evaluateDraft(true, false)
    expect(result.status).toBe('pass')
  })

  test('fail: draft but all gates passed (needs to be marked ready)', () => {
    const result = evaluateDraft(true, true)
    expect(result.status).toBe('fail')
    expect(result.detail).toContain('Mark as Ready')
  })

  test('warn: not draft while gates are failing', () => {
    const result = evaluateDraft(false, false)
    expect(result.status).toBe('warn')
    expect(result.detail).toContain('draft')
  })

  test('pass: not draft and all gates passed (ready to go)', () => {
    const result = evaluateDraft(false, true)
    expect(result.status).toBe('pass')
    expect(result.detail).toBe('')
  })
})
