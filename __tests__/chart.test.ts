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
  })

  test('branch passing: Yes is solid bold, No is dotted', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'pass', detail: '' },
    })
    // Yes edge: solid (==>) with bold
    expect(result).toContain('BranchCheck ==>|<b>Yes</b>| CIPassed')
    // No edge: dotted (-.->) without bold
    expect(result).toMatch(/BranchCheck -\.->/)
  })

  test('branch failing: No is solid bold with detail, Yes is dotted', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'fail', detail: '3 commits behind' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'pass', detail: '' },
    })
    // No edge: solid with bold detail
    expect(result).toContain('BranchCheck ==>|<b>No: 3 commits behind</b>|')
    // Yes edge: dotted
    expect(result).toContain('BranchCheck -.->|Yes| CIPassed')
    expect(result).toContain('fill:#cf222e') // red UpdateBranch node
  })

  test('checks passing: Yes is solid bold, No is dotted', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'pass', detail: '' },
    })
    expect(result).toContain('ChecksGate ==>|<b>Yes</b>| CIPassed')
    expect(result).toMatch(/ChecksGate -\.->/)
  })

  test('checks failing: No is solid bold with detail, Yes is dotted', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'fail', detail: '2/5 failing: CI, lint' },
      threads: { status: 'pass', detail: '' },
    })
    expect(result).toContain('ChecksGate ==>|<b>No: 2/5 failing: CI, lint</b>|')
    expect(result).toContain('ChecksGate -.->|Yes| CIPassed')
    expect(result).toContain('fill:#cf222e')
  })

  test('unresolved threads shows solid No edge with detail', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'fail', detail: '2 unresolved threads' },
    })
    expect(result).toContain('2 unresolved threads')
    expect(result).toContain('ChecksGate ==>|<b>No:')
  })

  test('pending checks: Some pending is solid bold, Yes/No dotted', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pending', detail: '2/5 pending' },
      threads: { status: 'pass', detail: '' },
    })
    expect(result).toContain('ChecksGate ==>|<b>Some pending: 2/5 pending</b>| WaitForCI')
    expect(result).toContain('ChecksGate -.->|Yes| CIPassed')
    expect(result).toContain('ChecksGate -.->|No|')
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

  test('shows reviewer warning node when multiple reviewers', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'pass', detail: '' },
      reviewers: { status: 'warn', detail: '2 reviewers: alice, bob' },
    })
    expect(result).toContain('ReviewerWarn')
    expect(result).toContain('2 reviewers: alice, bob')
    expect(result).toContain('fill:#d29922,color:#000')
  })

  test('no reviewer warning when single reviewer', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'pass', detail: '' },
      reviewers: { status: 'pass', detail: '' },
    })
    expect(result).not.toContain('ReviewerWarn')
    expect(result).not.toContain('#d29922')
  })

  test('no reviewer warning when reviewers not provided', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'pass', detail: '' },
    })
    expect(result).not.toContain('ReviewerWarn')
  })

  test('draft PR with gates passed shows DraftCheck node', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'pass', detail: '' },
      draft: { status: 'fail', detail: 'Mark as Ready for Review' },
      isDraft: true,
    })
    expect(result).toContain('DraftCheck')
    expect(result).toContain('PR is still a draft')
    expect(result).toContain('Mark as Ready')
    expect(result).toContain('fill:#cf222e')
  })

  test('non-draft PR with gates passed shows green ReadyForReview', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'pass', detail: '' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'pass', detail: '' },
      draft: { status: 'pass', detail: '' },
      isDraft: false,
    })
    expect(result).not.toContain('DraftCheck')
    expect(result).toContain('ReadyForReview')
  })

  test('non-draft PR with gates failing shows draft warning', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'fail', detail: '2 commits behind' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'pass', detail: '' },
      draft: { status: 'warn', detail: 'Should be in draft while gates are failing' },
      isDraft: false,
    })
    expect(result).toContain('DraftWarn')
    expect(result).toContain('draft')
    expect(result).toContain('fill:#d29922,color:#000')
  })

  test('draft PR with gates failing shows no draft warning', () => {
    const result = generateChart({
      ...baseInput,
      branch: { status: 'fail', detail: '2 commits behind' },
      checks: { status: 'pass', detail: '5/5 passed' },
      threads: { status: 'pass', detail: '' },
      draft: { status: 'pass', detail: 'Draft (gates pending)' },
      isDraft: true,
    })
    expect(result).not.toContain('DraftWarn')
    expect(result).not.toContain('DraftCheck')
  })
})
