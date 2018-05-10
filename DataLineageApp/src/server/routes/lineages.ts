import * as express from "express";
import IOTA = require("iota.lib.js");
import * as Mam from "../mam.node.js";
import config from "../server-config";

const router = express.Router();

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
                finishedPromisesCount++;
                if (!resolved && finishedPromisesCount >= promises.length) {
                    promiseOp.reject(reason);
                }
            });
    });
    return result;
}

/* GET home page. */
router.get("/:address", async (req, res) => {
    const address = req.param("address");
    if (!address) {
        res.json({});
        return;
    }
    const allApiCalls = config.iotaProviders.map(async (p) => {
        const iota = new IOTA({ provider: p });
        const mamState = Mam.init(iota);
        //ToDo: if fetchSingle get exception, what will happen
        const mamResult: { payload: string, nextRoot: string } = await Mam.fetchSingle(address, "public", null);
        return iota.utils.fromTrytes(mamResult.payload);
    });

    try {
        const firstFound = await waitAny(allApiCalls);
        res.json(JSON.parse(firstFound));
    } catch (e) {
        //if all not foudn, then will reject, so get the exception
        //we return an empty object to indicate it no result
        res.json({});
    }
});

export default router;