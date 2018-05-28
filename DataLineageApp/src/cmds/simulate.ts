import readline = require("readline");
import {IDataPackage, PacakgeHelper } from "../server/data-package";
import {PacakgesCollection} from "../client/packages-collection";

export default class Simulate {
    run() {
        console.log("Start simulate mam data tool...");
        console.log("input package data json line by line, and if all finished, input submit");
        console.log(
            "if a pacakge has the input of another package, just that package's id instead, it will be converted to address after submitted");
        console.log("input package:1 data or submit to finish");

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const pkgs: PacakgesCollection = new PacakgesCollection(undefined);
        let finished = false;

        const prompt = () => console.log(`input package:${pkgs.getPackagesCount() + 1} data or submit to finish\r\n`);

        rl.on("line",
                line => {
                    if (!line) {
                        prompt();
                        return;
                    }
                    if (line.toLowerCase() === "submit") {
                        finished = true;
                        rl.close();
                        return;
                    }

                    try {
                        const p: IDataPackage = JSON.parse(line);
                        if (!PacakgeHelper.isRealPackage(p) || !p.dataPackageId) {
                            console.error("The pacakge data missing required fileds");
                            prompt();
                            return;
                        }
                        if (p.mamAddress) {
                            console.warn(
                                "The pacakge data has a mamAddress field which shouldn't be provided, this filed will be ignored.");
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
                    if (pkgs.getPackagesCount() <= 0) {
                        console.warn("No packages provided, exit");
                        return;
                    }
                    this.submitPackages(pkgs);
                });
    }

    private submitPackages(pkgs: PacakgesCollection) {

    }
}