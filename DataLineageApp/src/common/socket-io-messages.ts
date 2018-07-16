export interface ITestResult {
    provider: string;
    totalSeconds: number;
}

export interface IPerformanceTestMessage {
    message: string;
    testResult?: ITestResult;
}