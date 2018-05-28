import {IDataPackage, PacakgeHelper } from "../server/data-package";

export class PacakgesCollection {
    private _packages: IDataPackage[];
    /**
     * used as a quick dict for looking the package index in this._packages
     * key is the package address
     */
    private _packagesIndex: {[address:string]:number};
    constructor(private readonly _colorsSeries: ReadonlyArray<string>|undefined) {
        this._packages = [];
        this._packagesIndex = {};
    }

    private static isRealPackage(pkg: IDataPackage): boolean {
        return PacakgeHelper.isRealPackage(pkg);
    }

    addOrUpdate(pkg: IDataPackage): void {
        if (this.packageExist(pkg.mamAddress, false)) {
            //we only upldate when pkg is a real pacakge data
            if (!PacakgesCollection.isRealPackage(pkg)) return;
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
        if (PacakgesCollection.isRealPackage(pkg)) {
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

    getAllPackages(onlyRealPkg: boolean = true): IDataPackage[] {
        const result: IDataPackage[] = [];
        for (let i = 0; i < this._packages.length; i++) {
            if (!onlyRealPkg || PacakgesCollection.isRealPackage(this._packages[i])) {
                result.push(this._packages[i]);
            }
        }
        return result;
    }

    getPackagesCount(onlyRealPkg: boolean = true): number {
        return this.getAllPackages(onlyRealPkg).length;
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
            if (!this._colorsSeries) {
                return undefined;
            }
            return this._colorsSeries[(index % this._colorsSeries.length)];
        }
        return undefined;
    }

    clear(): void {
        this._packages = [];
        this._packagesIndex = {};
    }
}