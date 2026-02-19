import { GateResult, GateStatus } from './gates/types'

interface ChartInput {
  branch: GateResult
  checks: GateResult
  threads: GateResult
  reviewers?: GateResult
  draft?: GateResult
  isDraft?: boolean
  prTitle: string
  headRef: string
  baseRef: string
  prNumber: number
  prState: string
}

const COLORS: Record<GateStatus | 'unreached', string> = {
  pass: '#2ea043',
  fail: '#cf222e',
  pending: '#848d97',
  warn: '#d29922',
  unreached: '#848d97',
}

function nodeStyle(id: string, status: GateStatus | 'unreached'): string {
  const textColor = status === 'warn' ? '#000' : '#fff'
  return `    style ${id} fill:${COLORS[status]},color:${textColor}`
}

function edgeLabel(status: GateStatus, detail: string, prefix: string): string {
  if (status === 'fail' && detail) {
    return `<b>${prefix}: ${detail}</b>`
  }
  return prefix
}

export function generateChart(input: ChartInput): string {
  const { branch, checks, threads, reviewers, draft, isDraft, prTitle, headRef, baseRef, prNumber, prState } = input

  // Determine combined checks+threads gate
  let checksGate: GateStatus = 'pass'
  const checksDetails: string[] = []
  if (checks.status === 'fail') {
    checksGate = 'fail'
    checksDetails.push(checks.detail)
  }
  if (threads.status === 'fail') {
    checksGate = 'fail'
    checksDetails.push(threads.detail)
  }
  if (checksGate !== 'fail' && checks.status === 'pending') {
    checksGate = 'pending'
    checksDetails.push(checks.detail)
  }

  // Determine which nodes are reachable
  const allGatesPassed = branch.status === 'pass' && checksGate === 'pass'
  const branchCheckStatus = branch.status
  const checksGateStatus = checksGate
  const allPassedStatus: GateStatus | 'unreached' = allGatesPassed ? 'pass' : 'unreached'

  // Draft check determines final ready status
  const prIsDraft = isDraft ?? false
  const draftNeedsAction = allGatesPassed && prIsDraft
  const notDraftWarning = !allGatesPassed && !prIsDraft && draft?.status === 'warn'
  const readyStatus: GateStatus | 'unreached' = allGatesPassed && !prIsDraft ? 'pass' : 'unreached'

  // Branch edge labels
  const branchNo = edgeLabel(branch.status, branch.detail, 'No')
  const branchYes = 'Yes'

  // Checks edge labels
  const checksNo = edgeLabel(checksGate, checksDetails.join(', '), 'No')
  const checksPending = checks.status === 'pending' ? edgeLabel('fail', checks.detail, 'Some pending') : 'Some pending'

  // Build the chart
  const header = `## PR #${prNumber}: ${prTitle}\n\n\`${headRef}\` -> \`${baseRef}\` | State: ${prState}\n`

  // Draft node section
  let draftSection = ''
  let draftStyles = ''
  if (draftNeedsAction) {
    // Gates passed but PR is still a draft — show action needed
    draftSection = `
    CIPassed ==> DraftCheck{PR is still a draft}
    DraftCheck ==>|Mark as Ready| ReadyForReview
`
    draftStyles = `\n    ${nodeStyle('DraftCheck', 'fail')}`
  } else {
    draftSection = `
    CIPassed(All gates passed) ==> ReadyForReview([Ready for Review])
`
  }

  // Warning if not draft while gates are failing
  let notDraftSection = ''
  let notDraftStyles = ''
  if (notDraftWarning) {
    notDraftSection = `
    Start -.-x DraftWarn[/"\u26a0\ufe0f ${draft!.detail}"\\/]
`
    notDraftStyles = `\n    ${nodeStyle('DraftWarn', 'warn')}`
  }

  // Reviewer warning section
  let reviewerSection = ''
  let reviewerStyles = ''
  if (reviewers?.status === 'warn') {
    reviewerSection = `
    ReadyForReview -.-x ReviewerWarn[/"\u26a0\ufe0f ${reviewers.detail}"\\/]
`
    reviewerStyles = `\n    ${nodeStyle('ReviewerWarn', 'warn')}`
  }

  const mermaid = `\`\`\`mermaid
flowchart TD
    Start([Code Complete]) ==> WaitForCI[Wait for CI to run]
${notDraftSection}
    WaitForCI ==> BranchCheck{Is the branch up to date<br/>with the target branch?}
    WaitForCI ==> ChecksGate{All CI checks passed<br/>and review comments<br/>resolved?}

    BranchCheck ==>|${branchNo}| UpdateBranch[Update the branch from<br/>GitHub or the CLI]
    UpdateBranch ==> WaitForCI
    BranchCheck -.->|${branchYes}| CIPassed

    ChecksGate -.->|${checksPending}| WaitForCI
    ChecksGate -.->|${checksNo}| FixChecks[Fix failing checks<br/>and resolve comments]
    FixChecks ==> WaitForCI
    ChecksGate -.->|Yes| CIPassed
${draftSection}${reviewerSection}
    style Start fill:${COLORS.pass},color:#fff
    ${nodeStyle('WaitForCI', 'pending')}
    ${nodeStyle('BranchCheck', branchCheckStatus)}
    ${nodeStyle('ChecksGate', checksGateStatus)}
    ${nodeStyle('UpdateBranch', branch.status === 'fail' ? 'fail' : 'unreached')}
    ${nodeStyle('FixChecks', checksGate === 'fail' ? 'fail' : 'unreached')}
    ${nodeStyle('CIPassed', allPassedStatus)}
    ${nodeStyle('ReadyForReview', readyStatus)}${draftStyles}${notDraftStyles}${reviewerStyles}
\`\`\``

  return `${header}\n${mermaid}`
}
