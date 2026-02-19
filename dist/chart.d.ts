import { GateResult } from './gates/types';
interface ChartInput {
    branch: GateResult;
    checks: GateResult;
    threads: GateResult;
    reviewers?: GateResult;
    draft?: GateResult;
    isDraft?: boolean;
    prTitle: string;
    headRef: string;
    baseRef: string;
    prNumber: number;
    prState: string;
}
export declare function generateChart(input: ChartInput): string;
export {};
