import IOTA = require("iota.lib.js");
import * as Mam from "../server/mam.node.js";
import Utilities from "../common/utilities";

export default class IOTAWriter {
    private readonly _iota: IOTA;
    private _lastMamState;

    constructor(iotaProvider: string, private readonly _seed?: string) {
        if (!_seed) {
            console.log("seed is not provided, random generate it.");
            this._seed = Utilities.randomSeed();
        }
        console.log(`seed is ${this._seed}`);
        this._iota = new IOTA({ provider: iotaProvider });
    }

    /**
     * make sure the _lastMamState represend to the last pos of the attached node in the channel, so that the new add node can be attached successfully
     */
    private async initLastMamState(): Promise<void> {
        if (this._lastMamState) {
            return;
        }
        console.log("finding last node in the channel...");
        let mamState = Mam.init(this._iota, this._seed);
        //as the seed may already exist, and after Mam.init, mamState always points to the root of the channel, we need to make mamState point to the last
        let rootAddress = Mam.getRoot(mamState);
        let preAddress: string | undefined = undefined; //if keep undefined, means 
        while (true) {
            const one: { nextRoot: string, payload: string } = await Mam.fetchSingle(rootAddress, "public");
            const used = one && one.payload;
            console.log(`address ${rootAddress} is ${used ? "used" : "last"}`);
            if (!used) break;
            preAddress = rootAddress;
            rootAddress = one.nextRoot;
        }

        let message: { payload: string, address: string, state: any };
        //loop until message is point to the last attahced node
        //if preAddress not defined, means the channel is empty (previous "while" loop stopped at used check for the first time)
        while (preAddress) {
            message = Mam.create(mamState, this._iota.utils.toTrytes(JSON.stringify({ "data":"This is a fake messaget to find last" })));
            if (message.address === preAddress) {
                break;
            }
            mamState = message.state;
        }
        
        this._lastMamState = mamState;
    }

    /**
     * @returns if success, renturn the address of the package and the next root address in the same channel, otherwise return undefined
     * @param newPackage
     */
    public async attachNew(newPackage): Promise<{ address: string; nextRoot: string } | undefined> {
        try {
            await this.initLastMamState();
        } catch (e) {
            console.error(`check the last address for seed ${this._seed} failed, exception is ${e}`);
            return undefined;
        } 
        
        const json = JSON.stringify(newPackage);
        console.log(`submitting new package ${json} ...`);
        // Create Trytes
        const trytes = this._iota.utils.toTrytes(json);
        // Get MAM payload
        const message: { payload: string, address: string, state: any } = Mam.create(this._lastMamState, trytes);
        
        try {
            // Attach the payload.
            await Mam.attach(message.payload, message.address);
            // update mamState as new mamState
            this._lastMamState = message.state;
            console.log(`package ${json} is submitted, the address is ${message.address}`);
            return { address: message.address, nextRoot: message.state.channel.next_root };
        } catch (e) {
            console.error(`submitting package ${json} failed, the error is ${e}`);
            return undefined;
        }
    }

}