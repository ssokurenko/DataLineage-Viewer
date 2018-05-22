import NodeCache = require("node-cache");
import exitHook = require("exit-hook");
import flatCache = require("flat-cache");
import path = require("path");
import config from "./server-config";
import { IDataPackage } from "./data-package";

interface IFileCacheData {
    /*
     * the value of the expired date, millsecond
     */
    ttl: number;
    data: IDataPackage;
}

const savePath = path.resolve(__dirname, "./data/");
const fileCacheId = "package.cache";

class PackageCache {
    private _memoryCache: NodeCache;

    constructor() {
        this.createMemoryCache();
    }

    private createMemoryCache(): void {
        this._memoryCache = new NodeCache({
            stdTTL: config.pacakgeCacheSeconds
        });
    }

    loadFromFile(): void {
        this.createMemoryCache();
        const fileCache = flatCache.load(fileCacheId, savePath);
        const all = fileCache.all();
        const now = Date.now();
        for (const key in all) {
            if (all.hasOwnProperty(key)) {
                const d: IFileCacheData = fileCache.getKey(key);
                const expired = new Date(d.ttl);
                if (d.ttl !== 0 && d.ttl <= now) continue;
                this._memoryCache.set(key, d.data, d.ttl / 1000);
            }
        }
    }

    saveToFile(): void {
        if (!this._memoryCache) return;
        const fileCache = flatCache.load(fileCacheId, savePath);
        const keys = this._memoryCache.keys();
        for (let i = 0; i < keys.length; i++) {
            const value = this._memoryCache.get<IDataPackage>(keys[i]);
            if (!value) continue;
            const ttl = this._memoryCache.getTtl(keys[i]);
            if(typeof ttl === "undefined") continue;
            const d: IFileCacheData = {
                ttl: ttl,
                data: value
            };
            fileCache.setKey(keys[i], d);
        }
        //will remove not visited, so only direct setKey will be saved
        fileCache.save();
    }

    get(address: string): IDataPackage | undefined {
        if (!this._memoryCache) return undefined;
        return this._memoryCache.get<IDataPackage>(address);
    }

    set(address: string, pkg: IDataPackage): void {
        if (!this._memoryCache) this.createMemoryCache();
        this._memoryCache.set(address, pkg);
    }
}

const packageCache = new PackageCache();

//save package information memory cache to file, this is fix for hosting on IISNode, which will terminate the nodejs application where no request for a while
exitHook(() => {
    packageCache.saveToFile();
});

//every 3 minutes to save the cache, as IISNode terminate the nodejs process won't trigger exitHook
setInterval(() => packageCache.saveToFile(), 1000 * 60 * 3);

export default packageCache;