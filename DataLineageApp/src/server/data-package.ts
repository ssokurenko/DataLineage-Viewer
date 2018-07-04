export interface IDataPackage {
    /*
     * A number representing the milliseconds elapsed since the UNIX epoch in Utc
     */
    timestamp: number;
    dataPackageId: string;
    /*
     * mam address of the package
     */
    mamAddress: string;
    /**
     * Next root address in the same channel
     */
    nextRootAddress: string;
    /*
     * The address of MAM for each input of the data package
     */
    inputs: string[];
    operation?: string;
    ownerMetadata?: any;
}

export interface ILightweightPackage extends IDataPackage {
    data: any;
}

export interface IStandardPackage extends IDataPackage {
    signature: string;
}

export class PacakgeHelper {
    static isLightWeight(pkg: IDataPackage): pkg is ILightweightPackage {
        if ("data" in pkg) {
            return true;
        }
        return false;
    }

    static isStandard(pkg: IDataPackage): pkg is IStandardPackage {
        if ("signature" in pkg) {
            return true;
        }
        return false;
    }

    static isRealPackage(pkg: IDataPackage): boolean {
        return typeof pkg.inputs !== "undefined" ||
            typeof pkg.dataPackageId !== "undefined" ||
            typeof pkg.timestamp !== "undefined";
    }
}