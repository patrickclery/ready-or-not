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

type EdgeColor = 'green' | 'red' | 'grey' | 'yellow' | 'none'

interface Edge {
  line: string
  color: EdgeColor
}

function solidEdge(from: string, label: string, to: string, color: EdgeColor): Edge {
  return { line: `    ${from} ==>|<b>${label}</b>| ${to}`, color }
}

function dottedEdge(from: string, label: string, to: string): Edge {
  return { line: `    ${from} -.->|${label}| ${to}`, color: 'grey' }
}

function plainEdge(from: string, to: string, color: EdgeColor = 'none'): Edge {
  return { line: `    ${from} ==> ${to}`, color }
}

const EDGE_COLORS: Record<EdgeColor, string> = {
  green: '#2ea043',
  red: '#cf222e',
  grey: '#848d97',
  yellow: '#d29922',
  none: '',
}

function linkStyles(edges: Edge[]): string {
  return edges
    .map((e, i) => {
      if (e.color === 'none') return null
      const c = EDGE_COLORS[e.color]
      if (e.color === 'grey') return `    linkStyle ${i} stroke:${c},stroke-width:1px`
      return `    linkStyle ${i} stroke:${c},stroke-width:3px`
    })
    .filter(Boolean)
    .join('\n')
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

  const checksDetailStr = checksDetails.join(', ')

  // Collect edges in order — linkStyle indices match this array
  const edges: Edge[] = []

  // Edge 0: Start ==> WaitForCI
  edges.push(plainEdge('Start([Code Complete])', 'WaitForCI[Wait for CI to run]'))

  // Optional: draft warning edge
  if (notDraftWarning) {
    edges.push({ line: `    Start -.-x DraftWarn[/"\u26a0\ufe0f ${draft!.detail}"\\/]`, color: 'yellow' })
  }

  // Edge: WaitForCI ==> BranchCheck
  edges.push(plainEdge('WaitForCI', 'BranchCheck{Is the branch up to date<br/>with the target branch?}'))
  // Edge: WaitForCI ==> ChecksGate
  edges.push(plainEdge('WaitForCI', 'ChecksGate{All CI checks passed<br/>and review comments<br/>resolved?}'))

  // Branch edges
  if (branch.status === 'pass') {
    edges.push(dottedEdge('BranchCheck', 'No', 'UpdateBranch[Update the branch from<br/>GitHub or the CLI]'))
    edges.push(plainEdge('UpdateBranch', 'WaitForCI'))
    edges.push(solidEdge('BranchCheck', 'Yes', 'CIPassed', 'green'))
  } else {
    edges.push(solidEdge('BranchCheck', `No: ${branch.detail}`, 'UpdateBranch[Update the branch from<br/>GitHub or the CLI]', 'red'))
    edges.push(plainEdge('UpdateBranch', 'WaitForCI'))
    edges.push(dottedEdge('BranchCheck', 'Yes', 'CIPassed'))
  }

  // Checks edges
  if (checksGate === 'pass') {
    edges.push(dottedEdge('ChecksGate', 'Some pending', 'WaitForCI'))
    edges.push(dottedEdge('ChecksGate', 'No', 'FixChecks[Fix failing checks<br/>and resolve comments]'))
    edges.push(plainEdge('FixChecks', 'WaitForCI'))
    edges.push(solidEdge('ChecksGate', 'Yes', 'CIPassed', 'green'))
  } else if (checksGate === 'pending') {
    edges.push(solidEdge('ChecksGate', `Some pending: ${checksDetailStr}`, 'WaitForCI', 'grey'))
    edges.push(dottedEdge('ChecksGate', 'No', 'FixChecks[Fix failing checks<br/>and resolve comments]'))
    edges.push(plainEdge('FixChecks', 'WaitForCI'))
    edges.push(dottedEdge('ChecksGate', 'Yes', 'CIPassed'))
  } else {
    edges.push(dottedEdge('ChecksGate', 'Some pending', 'WaitForCI'))
    edges.push(solidEdge('ChecksGate', `No: ${checksDetailStr}`, 'FixChecks[Fix failing checks<br/>and resolve comments]', 'red'))
    edges.push(plainEdge('FixChecks', 'WaitForCI'))
    edges.push(dottedEdge('ChecksGate', 'Yes', 'CIPassed'))
  }

  // Draft / final edges
  if (draftNeedsAction) {
    edges.push(plainEdge('CIPassed', 'DraftCheck{PR is still a draft}', 'red'))
    edges.push(solidEdge('DraftCheck', 'Mark as Ready', 'ReadyForReview', 'red'))
  } else {
    edges.push(plainEdge('CIPassed(All gates passed)', 'ReadyForReview([Ready for Review])', allGatesPassed ? 'green' : 'none'))
  }

  // Reviewer warning
  if (reviewers?.status === 'warn') {
    edges.push({ line: `    ReadyForReview -.-x ReviewerWarn[/"\u26a0\ufe0f ${reviewers.detail}"\\/]`, color: 'yellow' })
  }

  // Build the mermaid source
  const header = `## PR #${prNumber}: ${prTitle}\n\n\`${headRef}\` -> \`${baseRef}\` | State: ${prState}\n`

  const edgeLines = edges.map((e) => e.line).join('\n')
  const edgeStyles = linkStyles(edges)

  let draftStyles = ''
  let notDraftStyles = ''
  let reviewerStyles = ''
  if (draftNeedsAction) draftStyles = `\n    ${nodeStyle('DraftCheck', 'fail')}`
  if (notDraftWarning) notDraftStyles = `\n    ${nodeStyle('DraftWarn', 'warn')}`
  if (reviewers?.status === 'warn') reviewerStyles = `\n    ${nodeStyle('ReviewerWarn', 'warn')}`

  const mermaid = `\`\`\`mermaid
flowchart TD
${edgeLines}

    style Start fill:${COLORS.pass},color:#fff
    ${nodeStyle('WaitForCI', 'pending')}
    ${nodeStyle('BranchCheck', branchCheckStatus)}
    ${nodeStyle('ChecksGate', checksGateStatus)}
    ${nodeStyle('UpdateBranch', branch.status === 'fail' ? 'fail' : 'unreached')}
    ${nodeStyle('FixChecks', checksGate === 'fail' ? 'fail' : 'unreached')}
    ${nodeStyle('CIPassed', allPassedStatus)}
    ${nodeStyle('ReadyForReview', readyStatus)}${draftStyles}${notDraftStyles}${reviewerStyles}
${edgeStyles}
\`\`\``

  return `${header}\n${mermaid}`
}
