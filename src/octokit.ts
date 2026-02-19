import { Octokit } from '@octokit/core'
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
import { paginateRest } from '@octokit/plugin-paginate-rest'

const OctokitWithPlugins = Octokit.plugin(restEndpointMethods, paginateRest)

export function createOctokit(token: string) {
  return new OctokitWithPlugins({ auth: token })
}
