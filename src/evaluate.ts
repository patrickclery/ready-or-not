import { evaluateBranch } from './gates/branch'
import { evaluateChecks } from './gates/checks'
import { evaluateThreads } from './gates/threads'
import { evaluateReviewers } from './gates/reviewers'
import { evaluateDraft } from './gates/draft'
import { generateChart } from './chart'
import type { Octokit } from './types'
import type { GateResult } from './gates/types'

export interface EvaluateOptions {
  octokit: Octokit
  owner: string
  repo: string
  prNumber: number
  /** Name of the current check run to exclude (GHA self-filtering) */
  selfCheckName?: string
}

export interface EvaluateResult {
  branch: GateResult
  checks: GateResult
  threads: GateResult
  reviewers: GateResult
  draft: GateResult
  isDraft: boolean
  chart: string
  allPassed: boolean
  prTitle: string
  headRef: string
  baseRef: string
}

export async function evaluate(opts: EvaluateOptions): Promise<EvaluateResult> {
  const { octokit, owner, repo, prNumber, selfCheckName } = opts

  const { data: pr } = await octokit.rest.pulls.get({ owner, repo, pull_number: prNumber })
  const headSha = pr.head.sha
  const baseRef = pr.base.ref
  const headRef = pr.head.ref

  const [compareData, checkRunsData, threadsData] = await Promise.all([
    octokit.rest.repos.compareCommits({ owner, repo, base: baseRef, head: headRef }),
    octokit.rest.checks.listForRef({ owner, repo, ref: headSha, per_page: 100 }),
    octokit.graphql<{
      repository: {
        pullRequest: {
          reviewThreads: {
            nodes: Array<{ isResolved: boolean }>
          }
        }
      }
    }>(
      `query($owner: String!, $repo: String!, $pr: Int!) {
        repository(owner: $owner, name: $repo) {
          pullRequest(number: $pr) {
            reviewThreads(first: 100) {
              nodes { isResolved }
            }
          }
        }
      }`,
      { owner, repo, pr: prNumber }
    ),
  ])

  const branch = evaluateBranch({
    behind_by: compareData.data.behind_by,
    ahead_by: compareData.data.ahead_by,
  })

  let checkRuns = checkRunsData.data.check_runs
  if (selfCheckName) {
    checkRuns = checkRuns.filter((cr) => cr.name !== selfCheckName)
  }

  const checks = evaluateChecks(
    checkRuns.map((cr) => ({
      name: cr.name,
      conclusion: cr.conclusion,
      status: cr.status,
    }))
  )

  const threads = evaluateThreads(
    threadsData.repository.pullRequest.reviewThreads.nodes
  )

  const reviewers = evaluateReviewers(
    (pr.requested_reviewers ?? []).map((r: any) => ({ login: r.login }))
  )

  const allPassed = branch.status === 'pass' && checks.status === 'pass' && threads.status === 'pass'
  const isDraft = pr.draft ?? false

  const draft = evaluateDraft(isDraft, allPassed)

  const chart = generateChart({
    branch,
    checks,
    threads,
    reviewers,
    draft,
    isDraft,
    prTitle: pr.title,
    headRef,
    baseRef,
    prNumber,
    prState: pr.state.toUpperCase(),
  })

  return { branch, checks, threads, reviewers, draft, isDraft, chart, allPassed, prTitle: pr.title, headRef, baseRef }
}
