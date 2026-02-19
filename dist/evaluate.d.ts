import type { Octokit } from './types';
import type { GateResult } from './gates/types';
export interface EvaluateOptions {
    octokit: Octokit;
    owner: string;
    repo: string;
    prNumber: number;
    /** Name of the current check run to exclude (GHA self-filtering) */
    selfCheckName?: string;
}
export interface EvaluateResult {
    branch: GateResult;
    checks: GateResult;
    threads: GateResult;
    reviewers: GateResult;
    chart: string;
    allPassed: boolean;
    prTitle: string;
    headRef: string;
    baseRef: string;
}
export declare function evaluate(opts: EvaluateOptions): Promise<EvaluateResult>;
