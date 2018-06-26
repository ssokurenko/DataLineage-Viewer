import NodeCache = require("node-cache");
import flatCache = require("flat-cache");

interface IFileCacheData<T> {
    /*
     * the value of the expired date, millsecond
     */
    ttl: number;
    data: T;
}


export class MemoryFileCacheSingleType<T> {
    private _memoryCache: NodeCache;

    /**
     * 
     * @param _stdTTL default ttl in seconds
     */
    constructor(private readonly _stdTTL: number, private readonly _useClones: boolean) {
        this.createMemoryCache();
    }

    private createMemoryCache(): void {
        this._memoryCache = new NodeCache({
            stdTTL: this._stdTTL,
            useClones: this._useClones
        });
    }

    /**
     * 
     * @param savePath
     * @param fileCacheId
     * @param initializer, after the data saved to file, it is jsoned, so when load, only get the plain object, if the T is a custom class, need to new this class with the loaded data
     */
    loadFromFile(savePath: string, fileCacheId: string, initializer?: (loaded: T) => T | undefined): void {
        this.createMemoryCache();
        const fileCache = flatCache.load(fileCacheId, savePath);
        const all = fileCache.all();
        const now = Date.now();
        for (const key in all) {
            if (all.hasOwnProperty(key)) {
                const d: IFileCacheData<T> = fileCache.getKey(key);
                if (d.ttl !== 0 && d.ttl <= now) continue;
                if (initializer) {
                    d.data = initializer(d.data) as any;
                }
                if (typeof(d.data) === "undefined") {
                    continue;
                }
                this._memoryCache.set(key, d.data, d.ttl / 1000);
            }
        }
    }

    saveToFile(savePath: string, fileCacheId: string): void {
        if (!this._memoryCache) return;
        const fileCache = flatCache.load(fileCacheId, savePath);
        const keys = this._memoryCache.keys();
        for (let i = 0; i < keys.length; i++) {
            const value = this._memoryCache.get<T>(keys[i]);
            if (!value) continue;
            const ttl = this._memoryCache.getTtl(keys[i]);
            if (typeof ttl === "undefined") continue;
            const d: IFileCacheData<T> = {
                ttl: ttl,
                data: value
            };
            fileCache.setKey(keys[i], d);
        }
        //will remove not visited, so only direct setKey will be saved
        fileCache.save();
    }

    get(key: string): T | undefined {
        if (!this._memoryCache) return undefined;
        return this._memoryCache.get(key);
    }

    set(key: string, data: T): void {
        if (!this._memoryCache) this.createMemoryCache();
        this._memoryCache.set(key, data);
    }
}

export class MemoryFileCache extends MemoryFileCacheSingleType<any> {

}