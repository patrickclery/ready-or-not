import { describe, test, expect, vi } from 'vitest'
import { hideOldComments, postComment, addReaction } from '../src/comment'

function mockOctokit(overrides: Record<string, unknown> = {}) {
  return {
    rest: {
      issues: {
        listComments: vi.fn().mockResolvedValue({ data: [] }),
        createComment: vi.fn().mockResolvedValue({ data: { id: 999 } }),
      },
      reactions: {
        createForIssueComment: vi.fn().mockResolvedValue({}),
      },
    },
    graphql: vi.fn().mockResolvedValue({}),
    ...overrides,
  } as any
}

describe('hideOldComments', () => {
  test('minimizes comments containing the tag', async () => {
    const octokit = mockOctokit()
    octokit.rest.issues.listComments.mockResolvedValue({
      data: [
        { id: 1, node_id: 'node1', body: 'old <!-- ready-or-not-marker -->' },
        { id: 2, node_id: 'node2', body: 'unrelated comment' },
        { id: 3, node_id: 'node3', body: 'also old <!-- ready-or-not-marker -->' },
      ],
    })

    const hidden = await hideOldComments(octokit, 'owner', 'repo', 1, 'ready-or-not-marker')

    expect(hidden).toBe(2)
    expect(octokit.graphql).toHaveBeenCalledTimes(2)
    expect(octokit.graphql).toHaveBeenCalledWith(
      expect.stringContaining('minimizeComment'),
      { id: 'node1' }
    )
    expect(octokit.graphql).toHaveBeenCalledWith(
      expect.stringContaining('minimizeComment'),
      { id: 'node3' }
    )
  })

  test('returns 0 when no matching comments', async () => {
    const octokit = mockOctokit()
    octokit.rest.issues.listComments.mockResolvedValue({
      data: [{ id: 1, node_id: 'node1', body: 'unrelated' }],
    })

    const hidden = await hideOldComments(octokit, 'owner', 'repo', 1, 'ready-or-not-marker')
    expect(hidden).toBe(0)
    expect(octokit.graphql).not.toHaveBeenCalled()
  })
})

describe('postComment', () => {
  test('creates comment and returns id', async () => {
    const octokit = mockOctokit()

    const id = await postComment(octokit, 'owner', 'repo', 42, 'hello')

    expect(id).toBe(999)
    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 42,
      body: 'hello',
    })
  })
})

describe('addReaction', () => {
  test('adds thumbs up reaction', async () => {
    const octokit = mockOctokit()

    await addReaction(octokit, 'owner', 'repo', 123)

    expect(octokit.rest.reactions.createForIssueComment).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      comment_id: 123,
      content: '+1',
    })
  })
})
