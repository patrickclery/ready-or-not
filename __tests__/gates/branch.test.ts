import { describe, test, expect } from 'vitest'
import { evaluateBranch } from '../../src/gates/branch'

describe('evaluateBranch', () => {
  test('pass when branch is not behind', () => {
    const result = evaluateBranch({ behind_by: 0, ahead_by: 3 })
    expect(result).toEqual({ status: 'pass', detail: '' })
  })

  test('fail when branch is behind', () => {
    const result = evaluateBranch({ behind_by: 5, ahead_by: 3 })
    expect(result).toEqual({ status: 'fail', detail: '5 commits behind' })
  })

  test('singular commit in detail', () => {
    const result = evaluateBranch({ behind_by: 1, ahead_by: 0 })
    expect(result).toEqual({ status: 'fail', detail: '1 commit behind' })
  })

  test('pass when both zero', () => {
    const result = evaluateBranch({ behind_by: 0, ahead_by: 0 })
    expect(result).toEqual({ status: 'pass', detail: '' })
  })
})
