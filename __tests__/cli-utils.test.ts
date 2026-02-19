import { describe, test, expect } from 'vitest'
import { parseArgs } from '../src/cli-utils'

describe('parseArgs', () => {
  test('parses --repo and --pr', () => {
    const result = parseArgs(['node', 'cli', '--repo', 'owner/repo', '--pr', '42'])
    expect(result).toEqual({ repo: 'owner/repo', pr: 42, post: false })
  })

  test('parses --post flag', () => {
    const result = parseArgs(['node', 'cli', '--post'])
    expect(result).toEqual({ post: true })
  })

  test('defaults to no flags', () => {
    const result = parseArgs(['node', 'cli'])
    expect(result).toEqual({ post: false })
  })

  test('parses all flags together', () => {
    const result = parseArgs(['node', 'cli', '--repo', 'a/b', '--pr', '7', '--post'])
    expect(result).toEqual({ repo: 'a/b', pr: 7, post: true })
  })
})
