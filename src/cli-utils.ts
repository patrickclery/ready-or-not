import { execSync } from 'node:child_process'

export interface CliArgs {
  repo?: string
  pr?: number
  post: boolean
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { post: false }
  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--repo':
        args.repo = argv[++i]
        break
      case '--pr':
        args.pr = parseInt(argv[++i], 10)
        break
      case '--post':
        args.post = true
        break
      case '--help':
      case '-h':
        printUsage()
        process.exit(0)
    }
  }
  return args
}

export function printUsage(): void {
  console.log(`
Usage: ready-or-not [options]

Options:
  --repo owner/repo   GitHub repository (auto-detected from git remote)
  --pr NUMBER         PR number (auto-detected from current branch)
  --post              Post chart as a PR comment (default: print to stdout)
  -h, --help          Show this help message

Examples:
  ready-or-not                          # Auto-detect repo and PR from current branch
  ready-or-not --pr 123                 # Check PR #123 in auto-detected repo
  ready-or-not --repo owner/repo --pr 5 # Explicit repo and PR
  ready-or-not --post                   # Post chart as PR comment
`)
}

export function getToken(): string {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
  try {
    return execSync('gh auth token', { encoding: 'utf-8' }).trim()
  } catch {
    throw new Error('No GitHub token found. Set GITHUB_TOKEN or run `gh auth login`.')
  }
}

export function detectRepo(): string {
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim()
    const match = remote.match(/github\.com[:/](.+?)(?:\.git)?$/)
    if (match) return match[1]
  } catch { /* fall through */ }
  throw new Error('Could not detect repo from git remote. Use --repo owner/repo.')
}

export function detectPR(): number {
  try {
    const json = execSync('gh pr view --json number -q .number', { encoding: 'utf-8' }).trim()
    const num = parseInt(json, 10)
    if (!isNaN(num)) return num
  } catch { /* fall through */ }
  throw new Error('Could not detect PR for current branch. Use --pr NUMBER.')
}
