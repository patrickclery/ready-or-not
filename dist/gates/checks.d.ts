import { GateResult } from './types';
interface CheckItem {
    name: string;
    conclusion: string | null;
    status: string;
}
export declare function evaluateChecks(checks: CheckItem[]): GateResult;
export {};
