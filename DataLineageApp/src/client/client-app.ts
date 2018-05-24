import * as $ from "jquery";
import * as d3 from "d3";
import drawConfig from "./d3-package-extensions";

import { IDataPackage } from "../server/data-package";
import {PacakgesCollection} from "./packages-collection";

interface INodeData extends d3.SimulationNodeDatum {
    package: IDataPackage;
}

interface ILinkData extends d3.SimulationLinkDatum<INodeData> {

}

enum NotifyType {
    Warning,
    Error
}

function notify(type: NotifyType, message: string) {
    alert(message);
}

/*
 * Define all force names we will be used to draw the graph
 */
class ForceNames {
    static readonly Collision = "Collision";
    static readonly Charge = "Charge";
    static readonly Gravity = "Gravity";
    static readonly Link = "Link";
}

class App {
    private readonly _svg: d3.Selection<HTMLElement, any, any, any>;
    private readonly _simulation: d3.Simulation<INodeData, ILinkData>;
    private readonly _nodesData: INodeData[];
    private readonly _linksData: ILinkData[];
    private readonly _packages: PacakgesCollection;
    private _nodesAddingHandle: number|undefined;
    /*
     * The nodes that will be added 
     */
    private _pendingPackages: IDataPackage[];
    
    constructor(private readonly _rootPkgAddress: string, svgSelector: string) {
        this._svg = d3.select(svgSelector);
        //clear
        this._svg.selectAll("*").remove();

        /*
         * Define arraw marker
         */
        this._svg.defs();

        //initialize forces
        this._simulation = d3.forceSimulation<INodeData>()
            .force(ForceNames.Collision, d3.forceCollide(drawConfig.nodeRadius * 3))
            //make nodes repel each other
            .force(ForceNames.Charge, d3.forceManyBody().strength(-20))
            //make nodes have gravity, so they will be apt to go down
            .force(ForceNames.Gravity, d3.forceY(this.height * 10).strength(0.005))
            .force(ForceNames.Link, d3.forceLink<INodeData, ILinkData>().id(d => d.package.mamAddress).distance(drawConfig.nodeRadius * 3))
            .on("tick", this.onSimulationTicked.bind(this));
        this._packages = new PacakgesCollection();
        this._nodesData = [];
        this._linksData = [];
    }

    private async fetchPackage(address: string, all: boolean = false): Promise<IDataPackage[]> {
        return await $.get(`/api/address/${address}${(all ? "/all" : "")}`);
    }

    get width(): number {
        const nsvg = this._svg.node();
        return nsvg ? nsvg.getBoundingClientRect().width : 0;
    }

    get height(): number {
        const nsvg = this._svg.node();
        return nsvg ? nsvg.getBoundingClientRect().height : 0;
    }

    get nodesSelection(): d3.Selection<HTMLElement, INodeData, HTMLElement, INodeData> {
        return this._svg.selectAllNodes();
    }

    get linkssSelection(): d3.Selection<HTMLElement, ILinkData, HTMLElement, ILinkData> {
        return this._svg.selectAllLinks();
    }

    private onSimulationTicked(): void {
        this._svg.nodesOnSimulationTicked();
        this._svg.linkssOnSimulationTicked();
    }

    /**
     * 
     * @param data
     * @param index, accroding to d3js, index is fixed when listern registered, so don't use it
     * @param nodes
     */
    private onNodeClicked(data: INodeData, index, nodes): void {
        if (data.package && data.package.inputs) {
            data.package.inputs.forEach(address => this.update(address, false));
        }
    }

    /*
     * update d3js nodes elements based on the latest _nodesData
     */
    private updateD3Nodes(): void {
        this._simulation.nodes(this._nodesData);
        const nodesSelection = this.nodesSelection.data(this._nodesData);
        //as we only add new packages onto the graph, no pacakges remove or update, so needn't take care about the remove and update
        //and before reomve the element from dom, tooltip must be hidden
        nodesSelection.exit().removePopover().remove();

        //for new package node, we create cirele and set class as .node and other attributes
        nodesSelection.enter()
            .packageNode<INodeData>(d => d.package,
                d => this._packages.pacakgeColor(d.package.mamAddress), undefined
                /*d => d.package.inputs ? d.package.inputs.map(address => this._packages.pacakgeColor(address)) : []*/)
            .popover((d: INodeData) => d.package).on("click", this.onNodeClicked.bind(this));
        //.merge(nodesSelection)
    }

    /*
     * update d3js links data and links elements based on the latest _nodesData
     */
    private updateD3Links(): void {
        const f = this._simulation.force(ForceNames.Link) as d3.ForceLink<INodeData, ILinkData>;
        f.links(this._linksData);
        const linksSelection = this.linkssSelection.data(this._linksData);
        linksSelection.enter().packageLink();
    }

    private addOnePackage(p: IDataPackage | undefined): void {
        //check again to make usre no duplicated nodes added
        if (!p || this._packages.packageExist(p.mamAddress)) return;
        this._packages.addOrUpdate(p);
        if (p.inputs) {
            //we add inputs as a fake package to get them colors
            p.inputs.forEach(address => this._packages.addOrUpdate({ mamAddress: address } as any));
        }
        const nodeData: INodeData = {
            package: p
        };
        const directInputNodes = this._packages.getInputTo(p.mamAddress)
            .map(pkg => this._nodesData.filter(n => n.package.mamAddress === pkg.mamAddress)[0]);
        if (p.mamAddress === this._rootPkgAddress) {
            nodeData.fx = this.width / 2;
            nodeData.fy = drawConfig.nodeRadius*3;
        } else {
            if (directInputNodes.length > 0) {
                nodeData.x = (directInputNodes[0].x as number) +
                    (Math.random() * 2 * drawConfig.nodeRadius - drawConfig.nodeRadius);
                nodeData.y = (directInputNodes[0].y as number) + drawConfig.nodeRadius;
            }
        }
        this._nodesData.push(nodeData);
        directInputNodes.map((n: INodeData) => ({
            source: p.mamAddress as string,
            target: n.package.mamAddress
        })).forEach(l => this._linksData.push(l));
        //must draw nodes first, then draw links, so that links and arrow can on top of nodes
        this.updateD3Nodes();
        this.updateD3Links();
        this._simulation.restart();
    }

    /**
     * for each package node to check if all the inputs are all loaded on svg, if so , hide the expand "+"
     */
    private checkAndUpdateNodeExpandStatus() {
        this.nodesSelection.each((data, index, nodes) => {
            //for no input package, they already no expand plus chart, so needn't do anything
            if (!data.package.inputs || data.package.inputs.length <= 0) return;
            //all inputs are exist, so we think this pacakge is alread expanded
            if (data.package.inputs.filter(address => !this._packages.packageExist(address, true)).length <= 0) {
                d3.select(nodes[index]).packageExpanded();
            }
        });
    }

    updateByData(packages: IDataPackage[]): void {
        if (!packages || packages.length <= 0) {
            return;
        }
        if (!this._pendingPackages) {
            this._pendingPackages = [];
        }
        packages.forEach(p => {
            //as the node real append is not a onetime action, there is a possibility that the updateByData is called two times with same nodes, and the second time, the node already appended to the system
            //so we need to check again to prevent
            if (this._packages.packageExist(p.mamAddress)) return;
            this._pendingPackages.push(p);
        });
        if (!this._nodesAddingHandle) {
            this._nodesAddingHandle = window.setInterval(
                () => {
                    //all pending package are created on svg
                    if (this._pendingPackages.length <= 0) {
                        clearInterval(this._nodesAddingHandle);
                        this._nodesAddingHandle = undefined;
                        this.checkAndUpdateNodeExpandStatus();
                        return;
                    }
                    const p = this._pendingPackages.shift();
                    this.addOnePackage(p);
                },
                300);
        }
    }

    /**
     * 
     * @param address
     * @param expandAll
     */
    async update(address?: string, expandAll?: boolean): Promise<void> {
        if (!address) {
            address = this._rootPkgAddress;
        }
        //The package node already exist, need do nothing
        if (this._packages.packageExist(address)) return;
        //we only update when this is a root package or a pakcage is referenced as input, for the package has nothing to do with us, we ignore it
        if (address === this._rootPkgAddress || this._packages.getInputTo(address).length > 0) {
            const pkg = await this.fetchPackage(address, expandAll);
            if (!pkg || pkg.length <= 0) {
                notify(NotifyType.Warning, `Can't find the package with the address ${address}`);
                return;
            }
            this.updateByData(pkg);
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
        app.update(undefined, $("#expandAllCheck").is(":checked") );
    });
export default App;