import { GateResult } from './types';
interface Reviewer {
    login: string;
}
export declare function evaluateReviewers(reviewers: Reviewer[]): GateResult;
export {};
