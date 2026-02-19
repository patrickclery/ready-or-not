export interface CliArgs {
    repo?: string;
    pr?: number;
    post: boolean;
}
export declare function parseArgs(argv: string[]): CliArgs;
export declare function printUsage(): void;
export declare function getToken(): string;
export declare function detectRepo(): string;
export declare function detectPR(): number;
