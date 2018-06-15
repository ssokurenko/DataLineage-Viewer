import express = require("express");
import NodeCache = require("node-cache");
import uuid = require("uuid/v4");
import crypto = require("crypto");
import IOTAWriter from "../../cmds/IOTAWriter";
import serverConfig from "../server-config";
import { IDataPackage, ILightweightPackage, IStandardPackage } from "../data-package";
import { writersCache } from "../server-global-cache";
const routerUI = express.Router();
const routerApi = express.Router();

/* GET simulate UI. */
routerUI.get("/publisher", (req, res) => {
    res.render("simulate-publisher", { title: "Simulate - publisher" });
});

routerUI.get("/processor", (req, res) => {
    res.render("simulate-processor", { title: "Simulate - processor" });
});

interface IPackageSubmitData {
    inputs?: string[];
    value;
    dataPackageId?: string;
}

async function writeData(seed: string, data: IPackageSubmitData, lightweight: boolean): Promise<IDataPackage | undefined> {
    let writer = writersCache.get(seed) as IOTAWriter;
    if (!writer) {
        writer = new IOTAWriter(serverConfig.iotaProviders[0], seed);
        writersCache.set(seed, writer);
    }
    const pkg: IDataPackage = {
        timestamp: Date.now(),
        dataPackageId: data.dataPackageId ? data.dataPackageId : uuid(),
        inputs: data.inputs ? data.inputs : [],
        mamAddress: "",
        nextRootAddress: ""
    };
    
    if (lightweight) {
        (pkg as ILightweightPackage).data = data.value;
    } else {
        (pkg as IStandardPackage).signature = crypto.createHash("sha256")
            .update(`${pkg.dataPackageId} ${data.value} ${pkg.timestamp}`)
            .digest("hex");
    }
    delete pkg.mamAddress;
    delete pkg.nextRootAddress;
    const attachResult = await writer.attachNew(pkg);
    if (attachResult) {
        pkg.mamAddress = attachResult.address;
        pkg.nextRootAddress = attachResult.nextRoot;
    }
    
    if (!pkg.mamAddress) {
        console.error(`failed to attach the pacakge ${JSON.stringify(pkg)} with seed ${seed}`);
        return undefined;
    }
    
    return pkg;
}

/**
 * api for add package
 */
routerApi.post("/lightweight/:seed/",
        async (req, res) => {
            const seed = req.params["seed"];
            if (!seed) {
                res.end(400);
                return;
            }
            
            res.json(await writeData(seed, req.body, true));
        })
    .post("/standard/:seed/",
        async (req, res) => {
            const seed = req.params["seed"];
            if (!seed) {
                res.end(400);
                return;
            }
            res.json(await writeData(seed, req.body, false));
        });

export {routerUI, routerApi};
