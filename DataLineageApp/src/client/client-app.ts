import * as $ from "jquery";
import * as d3 from "d3";
import {IDataPackage} from "../server/data-package";

class App {
    private readonly _svg: d3.Selection<any,any,any,any>;
    constructor(private _rootPkgAddress: string, svgSelector: string) {
       this._svg = d3.select(svgSelector);
    }

    private fetchPackage(address: string, all: boolean = false): Promise<IDataPackage> {
        return $.get(`/api/lineages/${address}${(all ? "/all" : "")}`);
    }
}

let app: App;
$("#searchBtn").on("click",
    () => {
        app = new App($("#inputAddress").val() as string, "#mainGraphSvg");
        alert("done");
    });
export default App;