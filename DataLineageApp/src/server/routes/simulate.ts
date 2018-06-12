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


const writersCache = new NodeCache({ stdTTL: 3600 * 3 });

async function writeData(seed: string, value: any, simple: boolean): Promise<string | undefined> {
    alert("test");
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
    return await writer.attachNew(pkg);
}

/**
 * api for add package
 */
routerApi.post("/simple/:seed/:value", async (req, res) => {
        const seed = req.params["seed"];
        const value = req.param["value"];
        if (!seed || !value) {
            res.end(400);
            return;
        }
        res.json({ address: await writeData(seed, value, true) });
})
    .post("/standard/:seed/:value", async (req, res) => {
        const seed = req.params["seed"];
        const value = req.param["value"];
        if (!seed || !value) {
            res.end(400);
            return;
        }
        res.json({ address: await writeData(seed, value, false) });
    });

export {routerUI, routerApi};
