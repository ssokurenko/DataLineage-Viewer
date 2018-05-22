import {IDataPackage} from "../server/data-package";
import drawConfig from "./d3-package-extensions";

export class PacakgesCollection {
    private readonly _packages: IDataPackage[];
    /**
     * used as a quick dict for looking the package index in this._packages
     * key is the package address
     */
    private readonly _packagesIndex: {[address:string]:number};
    constructor() {
        this._packages = [];
        this._packagesIndex = {};
    }

    private static isReadPackage(pkg: IDataPackage): boolean {
        return typeof pkg.inputs !== "undefined" ||
            typeof pkg.dataPackageId !== "undefined" ||
            typeof pkg.timestamp !== "undefined";
    }

    addOrUpdate(pkg: IDataPackage): void {
        if (this.packageExist(pkg.mamAddress, false)) {
            //we only upldate when pkg is a real pacakge data
            if (!PacakgesCollection.isReadPackage(pkg)) return;
            this._packages[this._packagesIndex[pkg.mamAddress]] = pkg;
        } else {
            this._packages.push(pkg);
            this._packagesIndex[pkg.mamAddress] = this._packages.length - 1;
        }
    }

    /**
     * the collection not only contains the real pacakge, but also contains package from inputs (i.e. package only has mamAddress no other fields)
     * @param pkgAddress
     * @param onlyRealPkg, if true, means only a pakcage with other fields is think as the real and only this kind of package exist then the fucntion will return true
     * if false, then as long as an package with mamAddress same as the pkgAddress, then function will return true
     */
    packageExist(pkgAddress: string, onlyRealPkg: boolean = true): boolean {
        //not in array
        if (typeof this._packagesIndex[pkgAddress] === "undefined") return false;
        const pkg = this._packages[this._packagesIndex[pkgAddress]];
        //has fields so is a real
        if (PacakgesCollection.isReadPackage(pkg)) {
            return true;
        }
        //only has address, is a fake package
        if (onlyRealPkg) {
            return false;
        } else {
            return true;
        }
    }

    getPackage(pkgAddress: string): IDataPackage | undefined {
        if (this.packageExist(pkgAddress, true)) {
            return this._packages[this._packagesIndex[pkgAddress]];
        }
        return undefined;
    }

    /**
     * return all the packages that the pkgAddress is in the inputs of these packages
     * @param pkgAddress
     */
    getInputTo(pkgAddress: string): IDataPackage[] {
        const packages: IDataPackage[] = [];
        this._packages.forEach(n => {
            if (n.inputs && n.inputs.indexOf(pkgAddress) >= 0) {
                packages.push(n);
            }
        });
        return packages;
    }

    pacakgeColor(pkgAddress: string): string | undefined {
        if (this.packageExist(pkgAddress, false)) {
            const index = this._packagesIndex[pkgAddress];
            return drawConfig.colors((index % drawConfig.colorSeries.length).toString());
        }
        return undefined;
    }
}