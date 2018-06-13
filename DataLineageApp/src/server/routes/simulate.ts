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
    res.render("simulate-publisher", { title: "Simulate" });
});


const writersCache = new NodeCache({
    stdTTL: 3600 * 3,
    useClones: false //it's importanted, becasue the writer will update its internal mamstatus to track the last address
});

async function writeData(seed: string, value: any, simple: boolean): Promise<string | undefined> {
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
    //always save data as we need it for consumer simulate
    (pkg as ILightweightPackage).data = value;
    if (simple) {

    } else {
        (pkg as IStandardPackage).signature = crypto.createHash("sha256")
            .update(`${pkg.dataPackageId} ${value} ${pkg.timestamp}`)
            .digest("hex");
    }
    delete pkg.mamAddress;
    const address = await writer.attachNew(pkg);
    
    if (!address) {
        console.error(`failed to attach the pacakge ${JSON.stringify(pkg)} with seed ${seed}`);
    }
    return address;
}

/**
 * api for add package
 */
routerApi.post("/simple/:seed/:value", async (req, res) => {
        const seed = req.params["seed"];
        const value = req.params["value"];
        if (!seed || !value) {
            res.end(400);
            return;
        }
        res.json({ address: await writeData(seed, value, true) });
})
    .post("/standard/:seed/:value", async (req, res) => {
        const seed = req.params["seed"];
        const value = req.params["value"];
        if (!seed || !value) {
            res.end(400);
            return;
        }
        res.json({ address: await writeData(seed, value, false) });
    });

export {routerUI, routerApi};
