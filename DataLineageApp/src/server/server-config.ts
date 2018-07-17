import globalTunnel = require("global-tunnel");
import flatCache = require("flat-cache");
import path = require("path");

export interface IConfig {
    /**
     * This supports multi iota nodes, when query an address, the request will be sent to all the providers, and the first returned result from any nodes will be used
     */
    iotaProviders: string[];
    /**
     * Determin how long the package information will be keep in memonry cache (in seconds), 0 means not expired.
     */
    readonly pacakgeCacheSeconds: number;
    readonly iotaWriterStateCacheSeconds: number;
    /**
     * Proxy used on server side, as iota nodes can't be accessed or network speed is not stable when being accessed from China, so we have to support proxy on server
     * The api call to iota nodes will go throguh this proxy, if the network from the server to iota is good, then this configraton can be removed, and backend server will access iota directly
     */
    proxy?: { host: string; port: number; },
    useProxyIfConfigured(): void;
    readonly dataFolder: string;
}

class Config implements IConfig {
    private readonly _fileData = flatCache.load("server-config", this.dataFolder);

    private _iotaProviders: string[];
    get iotaProviders(): string[] {
        if (!this._iotaProviders) {
            console.log("Reading iotaProviders and internal field is undefined, trying to load from data file cache");
            this._iotaProviders = this._fileData.getKey("iotaProviders");
            if (!this._iotaProviders) {
                console.log("iotaProviders loaded from data file cache, but has no data, use an empty array to initialize it");
                this._iotaProviders = [];
            } else {
                console.log(`iotaProviders loaded from data file cache with the data ${JSON.stringify(this._iotaProviders, null, 4)}`);
            }
        }
        if (this._iotaProviders.length <= 0) {
            return ["https://nodes.iota.fm", "https://iotanode.us:443"];
        }
        return this._iotaProviders;
    }

    set iotaProviders(values: string[]) {
        this._iotaProviders = values;
        if (!this._iotaProviders) {
            this._iotaProviders = [];
        }
        console.log(`iotaProviders is changed to ${JSON.stringify(this._iotaProviders, null, 4)}`);
        this._fileData.setKey("iotaProviders", this._iotaProviders);
        console.log("save iotaProviders to data file");
        this._fileData.save();
    }

    readonly pacakgeCacheSeconds = 3600 * 24 * 2;
    readonly iotaWriterStateCacheSeconds = 3600 * 24;
    
    /*proxy: {
        host: "127.0.0.1",
        port: 1080
    },*/

    useProxyIfConfigured() {
        if (isUsingProxy) return;
        const
            c = config as IConfig;

        if (c.proxy) {
            console.log("server-config is configured with a proxy, use it for all http(s) request from server");
            globalTunnel.initialize({
                host: c.proxy.host,
                port: c.proxy.port
            });

            isUsingProxy = true;
        }
    }

    get dataFolder(): string {
        return path.resolve(__dirname, "./data/");
    }
}

const config = new Config();

let isUsingProxy = false;

export default config as IConfig;