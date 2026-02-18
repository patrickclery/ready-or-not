import { GateResult } from './types';
interface CompareData {
    behind_by: number;
    ahead_by: number;
}
export declare function evaluateBranch(compare: CompareData): GateResult;
export {};
