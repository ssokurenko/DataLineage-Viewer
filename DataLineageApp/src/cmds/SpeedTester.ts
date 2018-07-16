import IOTAReader from "./IOTAReader";
import { ITestResult } from "../common/socket-io-messages";


const defaultTestAddress = "CBVXWVGB9EJQYRRXNNTYEIGFVRFCLP9UUNCCGOARE9EJZXDFD9FDQZCQJNBCAMPRUESQSGYCMRJNOEWMV";
export default class SpeedTester {
    static async test(iotaProviders: string[], onOneTested?: (result: ITestResult) => void, testAddress?: string): Promise<ITestResult[]> {
        const result: ITestResult[] = [];
        for (let i = 0; i < iotaProviders.length; i++) {
            const p = iotaProviders[i];
            const reader = new IOTAReader(p);
            console.log(`Testing provider ${p}`);
            const startTime = Date.now();
            const oneTestResult: ITestResult = { provider: p, totalSeconds: -1 };
            try {
                const pkg = await reader.fetchPacakgeInfo(testAddress ? testAddress : defaultTestAddress, false);
                const endtime = Date.now();
                if (pkg) {
                    oneTestResult.totalSeconds = (endtime.valueOf() - startTime.valueOf()) / 1000;
                    console.log(`Fetch from provide ${p} successfully, time use ${oneTestResult.totalSeconds} seconds`);
                } else {
                    console.log(`Fetch from provide ${p} failed with no result`);
                }
            } catch (e) {
                console.log(`Fetch from provide ${p} failed, with error ${JSON.stringify(e, null, 4)}`);
            }
            result.push(oneTestResult);
            if (onOneTested) {
                try {
                    onOneTested(oneTestResult);
                } catch (e) {} 
            }
        }
        return result;
    }
}