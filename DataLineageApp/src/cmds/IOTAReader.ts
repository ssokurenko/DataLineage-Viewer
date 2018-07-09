import { IDataPackage } from "../server/data-package";
import { packageCache } from "../server/server-global-cache";
import IOTA = require("iota.lib.js");
import * as Mam from "../../../mam.client.js/lib/mam.client";

interface IIOTAFetchResult {
    json: string;
    nextRootAddress: string;
}

export default class IOTAReader {
    constructor(private readonly _iotaProvider: string) {}

    private fetchMam(address: string): Promise<IIOTAFetchResult | null> {
        console.log(`trying to fetch package of address '${address}' from provider ${this._iotaProvider}`);
        const iota = new IOTA({ provider: this._iotaProvider });
        const mamState = Mam.init(iota);
        //ToDo: if fetchSingle get exception, what will happen
        return Mam.fetchSingle(address, "public", null)
            .then((mamResult: { payload: string, nextRoot: string }) => {
                console.log(`Package of address '${address}' is fetached from provider ${this._iotaProvider}`);
                return {
                    json: iota.utils.fromTrytes(mamResult.payload),
                    nextRootAddress: mamResult.nextRoot
                };
            }).catch(reason => {
                console.error(
                    `Fetch package of address '${address}' failed with error ${JSON.stringify(reason)} from ${this._iotaProvider}`);
                return null;
            });
    }

    async fetchPacakgeInfo(address: string, useCache: boolean = true): Promise<IDataPackage | null> {
        if (!address) {
            return null;
        }

        if (useCache) {
            const cached = packageCache.get(address);
            //for old cache, there is no nextRootAddress, so we need to check this and update them
            if (cached && cached.nextRootAddress) {
                console.log(`Package of address '${address}' is found from cache, just return it`);
                return cached;
            }
        }

        let firstFound: IIOTAFetchResult | null = null;
        try {
            firstFound = await this.fetchMam(address);
        } catch (e) {
            console.error(`Fetch package of address '${address}' failed with error ${JSON.stringify(e)} from ${this._iotaProvider}`);
        }

        try {
            if (firstFound) {
                console.log(`package of address ${address} is fetched from this provider ${this._iotaProvider}`);
                const found: IDataPackage = {
                    ...JSON.parse(firstFound.json),
                    mamAddress: address,
                    nextRootAddress: firstFound.nextRootAddress
                } as IDataPackage;
                packageCache.set(address, found);
                return found;
            }
            return null;
        } catch (e) {
            //ToDo: Log
            console.error(`Fetch package of address '${address}' failed with error ${JSON.stringify(e)} when use provider ${this._iotaProvider}`);
            //if all not foudn, then will reject, so get the exception
            //we return an empty object to indicate it no result
            return null;
        }
    }
}