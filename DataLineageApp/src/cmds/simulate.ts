import readline = require("readline");
import * as crypto from "crypto";
import {IDataPackage, PacakgeHelper } from "../server/data-package";
import { PacakgesCollection } from "../client/packages-collection";
import config from "../server/server-config";
import IOTA = require("iota.lib.js");
import * as Mam from "../server/mam.node.js";

interface IBlockChainProvider {
    /**
     * @returns if success, renturn the address of the package, otherwise return undefined
     * @param package
     */
    (p: IDataPackage): Promise<string | undefined>;
}

export default class Simulate {
    run() {
        console.log("Start simulate mam data tool...");
        console.log("input package data json line by line, and if all finished, input submit");
        console.warn(
            "if a pacakge has the input of another package, just use that package's dataPackageId instead, it will be converted to address after submitted");
        console.log("input package:1 data or submit to finish");

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const pkgs: PacakgesCollection = new PacakgesCollection(undefined);
        const prompt = () => console.log(`input package:${pkgs.getPackagesCount() + 1} data or submit to finish\r\n`);
        let finished = false;
        rl.on("line",
            line => {
                    if (finished) return;
                    if (!line) {
                        prompt();
                        return;
                    }
                    if (line.toLowerCase() === "submit") {
                        finished = true;
                        this.processAllPackages(pkgs).then(success => {
                            rl.close();
                        }).catch(() => rl.close());
                        return;
                    }

                    try {
                        const p: IDataPackage = JSON.parse(line);
                        if (!PacakgeHelper.isRealPackage(p) || !p.dataPackageId) {
                            console.error("The pacakge data missing required fileds");
                            prompt();
                            return;
                        }
                        if (!p.timestamp) {
                            console.warn(
                                "The pacakge data has no timestamp, current time will be used as the timestamp.");
                            p.timestamp = Date.now();
                        }
                        if (p.mamAddress) {
                            console.warn(
                                "The pacakge data has a mamAddress field which shouldn't be provided, this filed will be ignored and set as the dataPackageId temporary.");
                        }
                        //use id simulate as the address so that we can resolve the input reference
                        p.mamAddress = p.dataPackageId;
                        if (pkgs.packageExist(p.mamAddress, false)) {
                            console.warn(
                                "The pacakge data with same dataPackageId exists, it will be updated with the new value.");
                        }
                        pkgs.addOrUpdate(p);
                    } catch (e) {
                        console.error(`The pacakge data is invalid, the error is {${e}}`);
                    }
                    prompt();
                })
            .on("close",
                () => {
                    
                });
    }

    private async processAllPackages(pkgs: PacakgesCollection): Promise<boolean> {
        if (pkgs.getPackagesCount() <= 0) {
            console.warn("No packages provided, exit");
            return false;
        }
        const root = this.findRoot(pkgs);
        if (!root) {
            return false;
        }
        config.useProxyIfConfigured();
        const provider = Simulate.getBlockchainProvider();
        if (!provider) return false;
        return await this.submitPackages(provider, pkgs, root, []);
    }

    private findRoot(pkgs: PacakgesCollection): IDataPackage | undefined {
        // root package is the package that doesn't be used as input for any package
        const roots = pkgs.getAllPackages(true).filter(p => pkgs.getInputTo(p.mamAddress).length <= 0);
        if (roots.length <= 0) {
            console.error(
                "No root package, the data are invalid, please make sure there is one and only one root package.");
            return undefined;
        }
        if (roots.length > 1) {
            console.warn(
                "There are more than one package that is not in any inputs of the other pacakges, we will take the first one as the root package, and othere will be ignored");
        }
        const root = roots[0];
        console.log(`package ${root.mamAddress} is taken as the root pacakge`);

        return root;
    }

    private static keyGen(length:number): string {
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ9";
        const values = crypto.randomBytes(length);
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = charset[values[i] % charset.length];
        }
        return result.join("");
    }

    private static getBlockchainProvider(): IBlockChainProvider|undefined {
        if (!config.iotaProviders || config.iotaProviders.length <= 0) {
            console.error("IOTA nodes are not configured, please config it in 'server-config.js'");
            return undefined;
        }
        console.log(`using ${config.iotaProviders[0]} as the node.`);
        const iota = new IOTA({ provider: config.iotaProviders[0] });
        let mamState = Mam.init(iota, Simulate.keyGen(81));

        /**
         * @returns the submitted data address
         */
        async function submit(p: IDataPackage): Promise<string | undefined> {
            const copied: IDataPackage = { ...p };
            delete copied.mamAddress;
            // Create Trytes
            const trytes = iota.utils.toTrytes(JSON.stringify(copied));
            // Get MAM payload
            const message = Mam.create(mamState, trytes);
            try {
                // Attach the payload.
                await Mam.attach(message.payload, message.address);
                // update mamState as new mamState
                mamState = message.state;
                return message.address;
            } catch (e) {
                return undefined;
            }
        }
        
        return submit;
    }

    /**
     * 
     * @param pkgs
     * @param current, the node that will be submitted to IOTA
     * @param visited, we use this array put all visited package from root to check there is no circle in the reference
     */
    private async submitPackages(provider:IBlockChainProvider, pkgs: PacakgesCollection, current: IDataPackage, visited: IDataPackage[]): Promise<boolean> {
        visited.push(current);
        throw "Not Implemented";
    }
}