import type { Octokit } from './types'

export async function hideOldComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  tag: string
): Promise<number> {
  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  })

  let hidden = 0
  for (const comment of comments) {
    if (comment.body?.includes(`<!-- ${tag} -->`)) {
      await octokit.graphql(
        `mutation($id: ID!) {
          minimizeComment(input: { subjectId: $id, classifier: OUTDATED }) {
            minimizedComment { isMinimized }
          }
        }`,
        { id: comment.node_id }
      )
      hidden++
    }
  }
  return hidden
}

export async function postComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<number> {
  const { data: comment } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  })
  return comment.id
}

export async function addReaction(
  octokit: Octokit,
  owner: string,
  repo: string,
  commentId: number
): Promise<void> {
  await octokit.rest.reactions.createForIssueComment({
    owner,
    repo,
    comment_id: commentId,
    content: '+1',
  })
}
