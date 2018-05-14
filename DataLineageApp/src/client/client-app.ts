import * as $ from "jquery";
import * as d3 from "d3";
import {IDataPackage} from "../server/data-package";

interface INodeData extends d3.SimulationNodeDatum {
    package: IDataPackage;
}

interface ILinkData extends d3.SimulationLinkDatum<INodeData>{
    
}

enum NotifyType {
    Warning,
    Error
}

function notify(type: NotifyType, message: string) {
    alert(message);
}

class App {
    private readonly _svg: d3.Selection<HTMLElement, any, any, any>;
    private readonly _force: d3.Simulation<INodeData, ILinkData> | undefined;
    private readonly _nodesData: INodeData[];
    private readonly _linksData: d3.Link<App, ILinkData, INodeData>[];

    constructor(private readonly _rootPkgAddress: string, svgSelector: string) {
        this._svg = d3.select(svgSelector);
        this._force = d3.forceSimulation<INodeData>()
            .force("charge", d3.forceManyBody())
            .on("tick", this.onSimulationTicked.bind(this));
        this._nodesData = [];
        this._linksData = [];
    }

    private fetchPackage(address: string, all: boolean = false): Promise<IDataPackage> {
        return $.get(`/api/address/${address}${(all ? "/all" : "")}`);
    }

    get width(): number {
        const nsvg = this._svg.node();
        return nsvg ? nsvg.getBoundingClientRect().width : 0;
    }

    get height(): number {
        const nsvg = this._svg.node();
        return nsvg ? nsvg.getBoundingClientRect().height : 0;
    }

    /**
     * find the pacakge node data by the address
     * @param address, the iota address of the package
     */
    private findPackageNode(address: string): INodeData | undefined {
        const search = this._nodesData.filter(n => (n.package && n.package.iotaAddress === address));
        if (search && search.length > 0) {
            return search[0];
        }
        return undefined;
    }

    /**
     * find all package nodes the inputs of which contains the address
     * @param address, the pacakges addree that are contained in the inputs
     */
    private directInputsForNodes(address: string): INodeData[] {
        const nodes: INodeData[] = [];
        this._nodesData.forEach(n => {
            if (n.package && n.package.inputs && n.package.inputs.indexOf(address) >= 0) {
                nodes.push(n);
            }
        });
        return nodes;
    }

    private onSimulationTicked(): void {
        this._svg.selectAll(".node")
            .attr("cx", (d: INodeData) => (d.fx ? d.fx : d.x) as number)
            .attr("cy", (d: INodeData) => (d.fy ? d.fy : d.y) as number);
    }

    /*
     * update d3js nodes elements based on the latest _nodesData
     */
    private updateD3Nodes(): void {
        const nodesSelection = this._svg.selectAll(".node").data(this._nodesData);
        //as we only add new packages onto the graph, no pacakges remove or update, so needn't take care about the remove and update
        //nodesSelection.exit().remove();
        //for new package node, we create cirele and set class as .node and other attributes
        nodesSelection.enter().append("circle").attr("class", "node").attr("r", 5).attr("fill", 0);
        //.merge(nodesSelection)
    }

    /*
     * update d3js links data and links elements based on the latest _nodesData
     */
    private updateD3Links(): void {

    }

    async update(address?: string): Promise<void> {
        if (!address) {
            address = this._rootPkgAddress;
        }
        //The package node already exist, need do nothing
        if (this.findPackageNode(address)) return;
        //we only update when this is a root package or a pakcage is referenced as input, for the package has nothing to do with us, we ignore it
        if (address === this._rootPkgAddress || this.directInputsForNodes(address).length > 0) {
            const pkg = await this.fetchPackage(address);
            if (!pkg) {
                notify(NotifyType.Warning, `Can't find the package with the address ${address}`);
                return;
            }
            const nodeData: INodeData = {
                package: pkg
            };
            if (address === this._rootPkgAddress) {
                nodeData.fx = this.width / 2;
                nodeData.fy = 20;
            }
            this._nodesData.push(nodeData);
            this.updateD3Nodes();
            this.updateD3Links();
        }
    }
}

let app: App;
$("#searchBtn").on("click",
    () => {
        let address = $("#inputAddress").val() as string;
        if (!address) {
            address = $("#inputAddress").attr("placeholder") as string;
        }
        app = new App(address, "#mainGraphSvg");
        app.update();
    });
export default App;