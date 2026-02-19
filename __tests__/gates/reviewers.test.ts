import { describe, test, expect } from 'vitest'
import { evaluateReviewers } from '../../src/gates/reviewers'

describe('evaluateReviewers', () => {
  test('passes with 0 reviewers', () => {
    const result = evaluateReviewers([])
    expect(result.status).toBe('pass')
  })

  test('passes with 1 human reviewer', () => {
    const result = evaluateReviewers([{ login: 'alice' }])
    expect(result.status).toBe('pass')
  })

  test('warns with 2 human reviewers', () => {
    const result = evaluateReviewers([{ login: 'alice' }, { login: 'bob' }])
    expect(result.status).toBe('warn')
    expect(result.detail).toContain('2 reviewers')
    expect(result.detail).toContain('alice')
    expect(result.detail).toContain('bob')
  })

  test('excludes bot reviewers from count', () => {
    const result = evaluateReviewers([
      { login: 'alice' },
      { login: 'cursor[bot]' },
    ])
    expect(result.status).toBe('pass')
  })

  test('warns when multiple humans even with bots', () => {
    const result = evaluateReviewers([
      { login: 'alice' },
      { login: 'bob' },
      { login: 'dependabot[bot]' },
    ])
    expect(result.status).toBe('warn')
    expect(result.detail).toContain('2 reviewers')
    expect(result.detail).not.toContain('dependabot')
  })
})
