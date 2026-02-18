import { describe, test, expect } from 'vitest'
import { generateChart } from '../src/chart'

const baseInput = {
  prTitle: 'Add feature X',
  headRef: 'feat/add-feature-x',
  baseRef: 'main',
  prNumber: 123,
  prState: 'OPEN',
}

describe('generateChart', () => {
  test('all gates passing shows green path', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'pass', detail: '' },
    })
    expect(result).toContain('```mermaid')
    expect(result).toContain('PR #123: Add feature X')
    expect(result).toContain('fill:#2ea043') // green nodes
    expect(result).not.toContain('fill:#cf222e') // no red nodes
  })

  test('branch behind shows red update node', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'fail', detail: '3 commits behind' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'pass', detail: '' },
    })
    expect(result).toContain('3 commits behind')
    expect(result).toContain('fill:#cf222e') // red node for UpdateBranch
  })

  test('failing checks shows red fix node', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'fail', detail: '2/5 failing: CI, lint' },
      threads: { status: 'pass', detail: '' },
    })
    expect(result).toContain('2/5 failing: CI, lint')
    expect(result).toContain('fill:#cf222e') // red node for FixChecks
  })

  test('unresolved threads shows red fix node', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'fail', detail: '2 unresolved threads' },
    })
    expect(result).toContain('2 unresolved threads')
    expect(result).toContain('fill:#cf222e')
  })

  test('pending checks shows grey', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pending', detail: '2/5 pending, 3 passed' },
      threads: { status: 'pass', detail: '' },
    })
    expect(result).toContain('Some pending')
  })

  test('uses <br/> not \\n for line breaks', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pass', detail: '' },
      threads: { status: 'pass', detail: '' },
    })
    expect(result).toContain('<br/>')
    expect(result).not.toContain('\\n')
  })

  test('includes header with PR metadata', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pass', detail: '' },
      threads: { status: 'pass', detail: '' },
    })
    expect(result).toContain('`feat/add-feature-x` -> `main`')
    expect(result).toContain('State: OPEN')
  })
})
