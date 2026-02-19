import { describe, test, expect, vi } from 'vitest'
import { evaluate } from '../src/evaluate'

function mockOctokit(overrides: Record<string, unknown> = {}) {
  return {
    rest: {
      pulls: {
        get: vi.fn().mockResolvedValue({
          data: {
            title: 'Test PR',
            state: 'open',
            head: { sha: 'abc123', ref: 'feat/test' },
            base: { ref: 'main' },
          },
        }),
      },
      repos: {
        compareCommits: vi.fn().mockResolvedValue({
          data: { behind_by: 0, ahead_by: 1 },
        }),
      },
      checks: {
        listForRef: vi.fn().mockResolvedValue({
          data: {
            check_runs: [
              { name: 'CI', conclusion: 'success', status: 'completed' },
            ],
          },
        }),
      },
    },
    graphql: vi.fn().mockResolvedValue({
      repository: {
        pullRequest: {
          reviewThreads: { nodes: [] },
        },
      },
    }),
    ...overrides,
  } as any
}

describe('evaluate', () => {
  test('returns allPassed=true when all gates pass', async () => {
    const result = await evaluate({
      octokit: mockOctokit(),
      owner: 'owner',
      repo: 'repo',
      prNumber: 1,
    })
    expect(result.allPassed).toBe(true)
    expect(result.branch.status).toBe('pass')
    expect(result.checks.status).toBe('pass')
    expect(result.threads.status).toBe('pass')
    expect(result.chart).toContain('```mermaid')
  })

  test('filters out selfCheckName from check runs', async () => {
    const octokit = mockOctokit()
    octokit.rest.checks.listForRef.mockResolvedValue({
      data: {
        check_runs: [
          { name: 'CI', conclusion: 'success', status: 'completed' },
          { name: 'readiness', conclusion: null, status: 'in_progress' },
        ],
      },
    })

    const result = await evaluate({
      octokit,
      owner: 'owner',
      repo: 'repo',
      prNumber: 1,
      selfCheckName: 'readiness',
    })
    expect(result.checks.status).toBe('pass')
  })

  test('returns allPassed=false when branch is behind', async () => {
    const octokit = mockOctokit()
    octokit.rest.repos.compareCommits.mockResolvedValue({
      data: { behind_by: 3, ahead_by: 1 },
    })

    const result = await evaluate({
      octokit,
      owner: 'owner',
      repo: 'repo',
      prNumber: 1,
    })
    expect(result.allPassed).toBe(false)
    expect(result.branch.status).toBe('fail')
  })

  test('returns allPassed=false when checks fail', async () => {
    const octokit = mockOctokit()
    octokit.rest.checks.listForRef.mockResolvedValue({
      data: {
        check_runs: [
          { name: 'CI', conclusion: 'failure', status: 'completed' },
        ],
      },
    })

    const result = await evaluate({
      octokit,
      owner: 'owner',
      repo: 'repo',
      prNumber: 1,
    })
    expect(result.allPassed).toBe(false)
    expect(result.checks.status).toBe('fail')
  })

  test('returns allPassed=false when threads are unresolved', async () => {
    const octokit = mockOctokit()
    octokit.graphql.mockResolvedValue({
      repository: {
        pullRequest: {
          reviewThreads: { nodes: [{ isResolved: false }] },
        },
      },
    })

    const result = await evaluate({
      octokit,
      owner: 'owner',
      repo: 'repo',
      prNumber: 1,
    })
    expect(result.allPassed).toBe(false)
    expect(result.threads.status).toBe('fail')
  })

  test('includes PR metadata in result', async () => {
    const result = await evaluate({
      octokit: mockOctokit(),
      owner: 'owner',
      repo: 'repo',
      prNumber: 42,
    })
    expect(result.prTitle).toBe('Test PR')
    expect(result.headRef).toBe('feat/test')
    expect(result.baseRef).toBe('main')
  })
})
