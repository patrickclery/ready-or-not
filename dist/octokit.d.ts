import { Octokit } from '@octokit/core';
export declare function createOctokit(token: string): Octokit & import("@octokit/plugin-rest-endpoint-methods/dist-types/types").Api & {
    paginate: import("@octokit/plugin-paginate-rest").PaginateInterface;
};
