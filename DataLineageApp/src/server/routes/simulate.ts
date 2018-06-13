import express = require("express");
import NodeCache = require("node-cache");
import uuid = require("uuid/v4");
import crypto = require("crypto");
import IOTAWriter from "../../cmds/IOTAWriter";
import serverConfig from "../server-config";
import { IDataPackage, ILightweightPackage, IStandardPackage } from "../data-package";
const routerUI = express.Router();
const routerApi = express.Router();

/* GET simulate UI. */
routerUI.get("/publisher", (req, res) => {
    res.render("simulate-publisher", { title: "Simulate - publisher" });
});

routerUI.get("/processor", (req, res) => {
    res.render("simulate-processor", { title: "Simulate - processor" });
});


const writersCache = new NodeCache({
    stdTTL: 3600 * 3,
    useClones: false //it's importanted, becasue the writer will update its internal mamstatus to track the last address
});

async function writeData(seed: string, value: any, lightweight: boolean): Promise<IDataPackage | undefined> {
    let writer = writersCache.get(seed) as IOTAWriter;
    if (!writer) {
        writer = new IOTAWriter(serverConfig.iotaProviders[0], seed);
        writersCache.set(seed, writer);
    }
    const pkg: IDataPackage = {
        timestamp: Date.now(),
        dataPackageId: uuid(),
        inputs: [],
        mamAddress: ""
    };
    
    if (lightweight) {
        (pkg as ILightweightPackage).data = value;
    } else {
        (pkg as IStandardPackage).signature = crypto.createHash("sha256")
            .update(`${pkg.dataPackageId} ${value} ${pkg.timestamp}`)
            .digest("hex");
    }
    delete pkg.mamAddress;
    pkg.mamAddress = (await writer.attachNew(pkg)) as any;
    
    if (!pkg.mamAddress) {
        console.error(`failed to attach the pacakge ${JSON.stringify(pkg)} with seed ${seed}`);
        return undefined;
    }
    
    return pkg;
}

/**
 * api for add package
 */
routerApi.post("/lightweight/:seed/:value",
        async (req, res) => {
            const seed = req.params["seed"];
            const value = req.params["value"];
            if (!seed || !value) {
                res.end(400);
                return;
            }
            res.json(await writeData(seed, value, true));
        })
    .post("/standard/:seed/:value",
        async (req, res) => {
            const seed = req.params["seed"];
            const value = req.params["value"];
            if (!seed || !value) {
                res.end(400);
                return;
            }
            res.json(await writeData(seed, value, false));
        });

export {routerUI, routerApi};
