import readline = require("readline");
import fs = require("fs");
import {IDataPackage, PacakgeHelper } from "../server/data-package";
import { PacakgesCollection } from "../client/packages-collection";
import config from "../server/server-config";
import IOTAWriter from "./IOTAWriter";

interface ISubmitIDataPackage extends IDataPackage {
    isSubmitted?: boolean;
}

export default class Simulate {
    private _iotaWriter: IOTAWriter;

    run(args: string[]) {
        console.log("Start simulate mam data tool...");
        const seedParamIndex = args.indexOf("-seed");
        let seed: string | undefined;
        if (seedParamIndex >= 0) {
            seed = args[seedParamIndex + 1];
            console.log("seed provided from arguments");
        } else {
            seed = undefined;
        }
        this._iotaWriter = new IOTAWriter(config.iotaProviders[0], seed);

        let stream: NodeJS.ReadableStream;
        
        const fileParamIndex = args.indexOf("--file");
        if (fileParamIndex >= 0) {
            stream = fs.createReadStream(args[fileParamIndex + 1]);
        } else {
            stream = process.stdin;
            console.log("input package data json line by line, and if all finished, input submit");
            console.warn("if a pacakge has the input of another package, just use that package's dataPackageId instead, it will be converted to address after submitted");
            console.log("input package:1 data or submit to finish");
        }
        const rl: readline.ReadLine = readline.createInterface({
            input: stream,
            output: process.stdout
        });

        this.inputDataPacakges(rl);
    }


    /**
     * check if the package read from console or file is valid or not
     * @param pkgs, alread loaded packages
     * @param pkg, package to be validated
     */
    private static validatePackage(pkgs: PacakgesCollection<ISubmitIDataPackage>, pkg: ISubmitIDataPackage): boolean {
        if (!PacakgeHelper.isRealPackage(pkg) || !pkg.dataPackageId) {
            console.error("The pacakge data missing required fileds");
            prompt();
            return false;
        }
        if (!pkg.timestamp) {
            console.warn(
                "The pacakge data has no timestamp, current time will be used as the timestamp.");
            pkg.timestamp = Date.now();
        }
        if (pkg.mamAddress) {
            console.warn(
                "The pacakge data has a mamAddress field which shouldn't be provided, this filed will be ignored and set as the dataPackageId temporary.");
        }
        //use id simulate as the address so that we can resolve the input reference
        pkg.mamAddress = pkg.dataPackageId;
        if (pkgs.packageExist(pkg.mamAddress, false)) {
            console.warn(
                "The pacakge data with same dataPackageId exists, it will be updated with the new value.");
        }
        pkgs.addOrUpdate(pkg);
        return true;
    }

    private inputDataPacakges(rl: readline.ReadLine): void {
        const pkgs = new PacakgesCollection<ISubmitIDataPackage>(undefined);
        const prompt = () => console.log(`input package:${pkgs.getPackagesCount() + 1} data or submit to finish\r\n`);
        let finished = false;
        rl.on("line",
            line => {
                if (finished) return;
                if (!line || !(line = line.trim())) {
                    prompt();
                    return;
                }

                if (line.toLowerCase() === "submit") {
                    finished = true;
                    this.processAllPackages(pkgs).then(success => {
                        if (success) {
                            console.log("All packages are processed");
                        } else {
                            console.error("Processing packages have error and stopped.");
                        }
                        rl.close();
                    }).catch(() => {
                        console.error("Processing packages have error and stopped.");
                        rl.close();
                    });
                    return;
                }

                try {
                    const p: IDataPackage = JSON.parse(line);
                    Simulate.validatePackage(pkgs, p);
                } catch (e) {
                    console.error(`The pacakge data is invalid, the error is {${e}}`);
                }
                prompt();
            })
            .on("close", () => {});
    }

    private async processAllPackages(pkgs: PacakgesCollection<ISubmitIDataPackage>): Promise<boolean> {
        if (pkgs.getPackagesCount() <= 0) {
            console.warn("No packages provided, exit");
            return false;
        }
        config.useProxyIfConfigured();
        
        while (true) {
            let leafNodes = Simulate.findLeafNodes(pkgs);
            if (leafNodes.length <= 0 && pkgs.getAllPackages().filter(p => !p.isSubmitted).length > 0) {
                //no leaf nodes but has the pacakges that are not submitted
                //means there is circle in the packges intput references
                console.error("There are circle in package input reference");
                return false;
            }
            if (leafNodes.length <= 0) return true; //all done
            for (let i = 0; i < leafNodes.length; i++) {
                const p = leafNodes[i];
                if (!await this.submitPackages(pkgs, p)) {
                    return false;
                }
            }
        }
    }

    private static findRoot(pkgs: PacakgesCollection<ISubmitIDataPackage>): ISubmitIDataPackage | undefined {
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

    /**
     * A leaf node is the package node that no inputs or all the inputs are already submitted
     */
    private static findLeafNodes(pkgs: PacakgesCollection<ISubmitIDataPackage>): ISubmitIDataPackage[] {
        const result = pkgs.getAllPackages(true).filter(p => {
            //ignore alrady submitted package
            if (p.isSubmitted) return false;
            //no inputs
            if (!p.inputs || p.inputs.length <= 0) {
                return true;
            }
            //has inputs, and check if all inputs package is already submitted
            for (let i = 0; i < p.inputs.length; i++) {
                //the package that is the input to this package "p"
                const inputPkg = pkgs.getPackage(p.inputs[i]);
                //the inputPkg exist and is not submitted, so is not a leaf node
                if (inputPkg && !inputPkg.isSubmitted) {
                    return false;
                }
            }
            return true;
        });
        return result;
    }

    /**
     * @returns if success, renturn the address of the package, otherwise return undefined
     * @param p
     */
    private async attachNew(p: ISubmitIDataPackage): Promise<string | undefined> {
        const copied: ISubmitIDataPackage = { ...p };
        if (typeof copied.isSubmitted !== "undefined") {
            delete copied.isSubmitted;
        }
        delete copied.mamAddress;
        const result = await this._iotaWriter.attachNew(copied);
        return result ? result.address : undefined;
    }

    /**
     * 
     * @param pkgs
     * @param current, the node that will be submitted to IOTA
     */
    private async submitPackages(pkgs: PacakgesCollection<ISubmitIDataPackage>, current: ISubmitIDataPackage): Promise<boolean> {
        if (current.isSubmitted) {
            return true;
        }
        const address = await this.attachNew(current);
        if (!address) {
            return false;
        }
        const inputTo = pkgs.getInputTo(current.mamAddress);
        inputTo.forEach(p => {
            //replace the fack mamAddress (value is package id) in the input array to be the real address
            p.inputs = p.inputs.map(inputAddress => inputAddress === current.mamAddress ? address : inputAddress);
        });
        current.mamAddress = address;
        return true;
    }
}