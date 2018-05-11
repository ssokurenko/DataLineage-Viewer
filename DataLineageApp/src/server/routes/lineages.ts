import * as express from "express";
import NodeCache =  require("node-cache");
import IOTA = require("iota.lib.js");
import * as Mam from "../mam.node.js";
import config from "../server-config";
import {IDataPackage} from "../data-package";

const router = express.Router();
const packageCache = new NodeCache({
    stdTTL: config.pacakgeCacheSeconds
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

/* GET package information by address api
 supported urls:
 api/lineages/OAZUEUIFHISXGUFCBBRTJBRLIJJEJFFEIVSFHPNQRRHIXXKUCXVQNDIVXVNOICUWLLYEZVADHHULIEOFY         -> only get this pacakge inforamtion
 api/lineages/OAZUEUIFHISXGUFCBBRTJBRLIJJEJFFEIVSFHPNQRRHIXXKUCXVQNDIVXVNOICUWLLYEZVADHHULIEOFY/all     -> get pcakge and all it's inputs recursively
 */
router.get("/:address/:all?", async (req, res) => {
    const allPacakges: IDataPackage[] = [];
    const fetchAddresses: string[] = [];
    let address = req.params["address"];
    if (address) {
        fetchAddresses.push(address);
    }
    while (fetchAddresses.length > 0) {
        address = fetchAddresses.shift();
        const pkg = await fetchPacakgeInfoWithCache(address);
        if (pkg) {
            allPacakges.push(pkg);
            if (req.params.all && pkg.inputs && pkg.inputs.length > 0) {
                pkg.inputs.forEach(a => fetchAddresses.push(a));
            }
        }
    }
    
    res.json(allPacakges);
});

export default router;