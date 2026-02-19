import type { Octokit } from './types';
export declare function hideOldComments(octokit: Octokit, owner: string, repo: string, prNumber: number, tag: string): Promise<number>;
export declare function postComment(octokit: Octokit, owner: string, repo: string, prNumber: number, body: string): Promise<number>;
export declare function addReaction(octokit: Octokit, owner: string, repo: string, commentId: number): Promise<void>;
