import { describe, test, expect } from 'vitest'
import { evaluateThreads } from '../../src/gates/threads'

describe('evaluateThreads', () => {
  test('pass when all threads resolved', () => {
    const result = evaluateThreads([
      { isResolved: true },
      { isResolved: true },
    ])
    expect(result).toEqual({ status: 'pass', detail: '' })
  })

  test('pass when no threads exist', () => {
    const result = evaluateThreads([])
    expect(result).toEqual({ status: 'pass', detail: '' })
  })

  test('fail with unresolved threads', () => {
    const result = evaluateThreads([
      { isResolved: true },
      { isResolved: false },
      { isResolved: false },
    ])
    expect(result).toEqual({ status: 'fail', detail: '2 unresolved threads' })
  })

  test('singular thread in detail', () => {
    const result = evaluateThreads([{ isResolved: false }])
    expect(result).toEqual({ status: 'fail', detail: '1 unresolved thread' })
  })
})
