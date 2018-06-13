import * as express from "express";
import IOTA = require("iota.lib.js");
import * as Mam from "../mam.node.js";
import config from "../server-config";
import { IDataPackage } from "../data-package";
import packageCache from "../package-cache";

packageCache.loadFromFile();

const router = express.Router();

interface IDataPackageEx extends IDataPackage {
    nextRoot: string;
}

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

async function fetchPacakgeInfoWithCache(address: string): Promise<IDataPackageEx | null> {
    if (!address) {
        return null;
    }
    const cached = packageCache.get<IDataPackageEx>(address);
    //for old cache, there is no nextRoot, so we need to check this and update them
    if (cached && cached.nextRoot) {
        return cached;
    }
    const allApiCalls = config.iotaProviders.map(async (p) => {
        const iota = new IOTA({ provider: p });
        const mamState = Mam.init(iota);
        //ToDo: if fetchSingle get exception, what will happen
        const mamResult: { payload: string, nextRoot: string } = await Mam.fetchSingle(address, "public", null);
        return {
            json: iota.utils.fromTrytes(mamResult.payload),
            nextRoot: mamResult.nextRoot
        };
    });

    try {
        const firstFound = await waitAny(allApiCalls);
        if (firstFound) {
            const found: IDataPackageEx = { ...JSON.parse(firstFound.json), mamAddress: address, nextRoot: firstFound.nextRoot } as IDataPackageEx;
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
 api/address/OAZUEUIFHISXGUFCBBRTJBRLIJJEJFFEIVSFHPNQRRHIXXKUCXVQNDIVXVNOICUWLLYEZVADHHULIEOFY         -> only get this pacakge inforamtion
 api/address/OAZUEUIFHISXGUFCBBRTJBRLIJJEJFFEIVSFHPNQRRHIXXKUCXVQNDIVXVNOICUWLLYEZVADHHULIEOFY/all     -> get pcakge and all it's inputs recursively
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
        let pkg = await fetchPacakgeInfoWithCache(address);
        if (pkg) {
            //copy it
            pkg = { ...pkg };
            //remove nextRoot
            delete pkg.nextRoot;
            allPacakges.push(pkg);
            if (req.params.all && pkg.inputs && pkg.inputs.length > 0) {
                pkg.inputs.forEach(a => fetchAddresses.push(a));
            }
        }
    }
    
    res.json(allPacakges);
})
/*
 * Get all packages in the channel
 */
    .get("/channel/:rootAddress", async (req, res) => {
        const allPacakges: IDataPackage[] = [];
        let rootAddress = req.params["rootAddress"];
        if (!rootAddress) {
            res.end(400);
            return;
        }
        while (true) {
            let pkg = await fetchPacakgeInfoWithCache(rootAddress);
            if (!pkg) {
                break;
            }
            rootAddress = pkg.nextRoot;
            pkg = { ...pkg };
            delete pkg.nextRoot;
            allPacakges.push(pkg);
            if (!rootAddress) {
                break;
            }
        }
        res.json(allPacakges);
    });

export default router;