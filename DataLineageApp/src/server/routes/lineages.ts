import * as express from "express";
import NodeCache =  require("node-cache");
import IOTA = require("iota.lib.js");
import * as Mam from "../mam.node.js";
import config from "../server-config";
import {IDataPackage} from "../data-package";

const router = express.Router();
const packageCache = new NodeCache({
    stdTTL: 3600 * 24 * 3
});

/**
 * wait until one promese resolved or all promise rejected
 * @param promises
 */
function waitAny<T>(promises: Promise<T>[]): Promise<T> {
    const promiseOp: {
        resolve: (value?: any) => void;
        reject: (reason?: any) => void;
    } = {} as any;
    const result = new Promise<T>((resolve, reject) => {
        promiseOp.resolve = resolve;
        promiseOp.reject = reject;
    });
    if (!promises || promises.length <= 0) {
        promiseOp.resolve(null);
        return result;
    }
    let resolved = false;
    let finishedPromisesCount = 0;
    promises.forEach(p => {
        p
            .then(value => {
                finishedPromisesCount++;
                if (!resolved && value) {
                    promiseOp.resolve(value);
                    resolved = true;
                }
            })
            .catch(reason => {
                //ToDo: Log the reason
                finishedPromisesCount++;
                if (!resolved && finishedPromisesCount >= promises.length) {
                    promiseOp.reject(reason);
                }
            });
    });
    return result;
}

async function fetchPacakgeInfoWithCache(address: string): Promise<IDataPackage | null> {
    if (!address) {
        return null;
    }
    const cached = packageCache.get<IDataPackage>(address);
    if (cached) {
        return cached;
    }
    const allApiCalls = config.iotaProviders.map(async (p) => {
        const iota = new IOTA({ provider: p });
        const mamState = Mam.init(iota);
        //ToDo: if fetchSingle get exception, what will happen
        const mamResult: { payload: string, nextRoot: string } = await Mam.fetchSingle(address, "public", null);
        return iota.utils.fromTrytes(mamResult.payload);
    });

    try {
        const firstFoundJson = await waitAny(allApiCalls);
        if (firstFoundJson) {
            const found = JSON.parse(firstFoundJson);
            packageCache.set(address, found);
            return found;
        }
        return null;
    } catch (e) {
        //ToDo: Log
        //if all not foudn, then will reject, so get the exception
        //we return an empty object to indicate it no result
        return null;
    }
}

/* GET home page. */
router.get("/:address", async (req, res) => {
    res.json(await fetchPacakgeInfoWithCache(req.params("address")));
});

export default router;