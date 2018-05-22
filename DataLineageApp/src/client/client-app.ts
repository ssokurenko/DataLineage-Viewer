import * as $ from "jquery";
import * as d3 from "d3";
import drawConfig from "./d3-package-extensions";

import { IDataPackage } from "../server/data-package";

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
            .force(ForceNames.Collision, d3.forceCollide(drawConfig.nodeRadius * 2))
            //make nodes repel each other
            .force(ForceNames.Charge, d3.forceManyBody().strength(-20))
            //make nodes have gravity, so they will be apt to go down
            .force(ForceNames.Gravity, d3.forceY(this.height * 10).strength(0.005))
            .force(ForceNames.Link, d3.forceLink<INodeData, ILinkData>().id(d => d.package.mamAddress).distance(drawConfig.nodeRadius * 3))
            .on("tick", this.onSimulationTicked.bind(this));
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

    /**
     * find the pacakge node data by the address
     * @param address, the iota address of the package
     */
    private findPackageNodeData(address: string): INodeData | undefined {
        const search = this._nodesData.filter(n => (n.package && n.package.mamAddress === address));
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

        /**
         * return the value directly when d is undefined, number or string
         * return undefined if d is INodeData
         * @param d
         */
        const v = (d: INodeData | undefined | string | number): number | undefined => {
            if (!d) return 0;
            if (typeof (d) === "number") {
                return d;
            }
            if (typeof (d) === "string") {
                return parseFloat(d);
            }
            return undefined;
        }
        /**
         * return fx if fx has value, otherwise return x
         * @param d
         */
        const x = (d: INodeData | undefined | string | number): number => {
            const temp = v(d);
            if (typeof temp !== "undefined") {
                return temp;
            }
            const nd = d as INodeData;
            return (nd.fx ? nd.fx : nd.x) as number;
        };

        /**
         * return fy if fy has value, otherwise return y
         * @param d
         */
        const y = (d: INodeData | undefined | string | number): number => {
            const temp = v(d);
            if (typeof temp !== "undefined") {
                return temp;
            }
            const nd = d as INodeData;
            return (nd.fy ? nd.fy : nd.y) as number;
        };

        this.nodesSelection
            .attr("cx",
                (d: INodeData) => {
                    return x(d);
                })
            .attr("cy",
                (d: INodeData) => {
                    return y(d);
                });

        this.linkssSelection
            .attr("x1",
                (d: ILinkData) => {
                    return x(d.source);
                })
            .attr("y1",
                (d: ILinkData) => {
                    return y(d.source);
                })
            .attr("x2",
                (d: ILinkData) => {
                    return x(d.target);
                })
            .attr("y2",
                (d: ILinkData) => {
                    return y(d.target);
                });
    }

    /**
     * 
     * @param data
     * @param index, accroding to d3js, index is fixed when listern registered, so don't use it
     * @param nodes
     */
    private onNodeClicked(data: INodeData, index, nodes): void {
        if (data.package && data.package.inputs) {
            //to make it simple, we just set the iniial xy of the new input package right under the current node(data param)
            //and the Collision and other forces will make they are seperated
            const y = data.y ? (data.y + drawConfig.nodeRadius * 5) : undefined;
            let x = data.x ? (data.x - data.package.inputs.length * drawConfig.nodeRadius * 2 / 2) : undefined;
            data.package.inputs.forEach(address => {
                this.update(address, false);
                if (typeof x !== "undefined") {
                    x += drawConfig.nodeRadius * 2;
                }
            });
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
        nodesSelection.enter().packageNode().popover((d: INodeData)=>d.package).on("click", this.onNodeClicked.bind(this));
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
        if (!p || this.findPackageNodeData(p.mamAddress)) return;
        const nodeData: INodeData = {
            package: p
        };
        const directInputNodes = this.directInputsForNodes(p.mamAddress);
        if (p.mamAddress === this._rootPkgAddress) {
            nodeData.fx = this.width / 2;
            nodeData.fy = 20;
        } else {
            if (directInputNodes.length > 0) {
                nodeData.x = directInputNodes[0].x;
                nodeData.y = directInputNodes[0].y;
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
            if (this.findPackageNodeData(p.mamAddress)) return;
            this._pendingPackages.push(p);
        });
        if (!this._nodesAddingHandle) {
            this._nodesAddingHandle = window.setInterval(
                () => {
                    if (this._pendingPackages.length <= 0) {
                        clearInterval(this._nodesAddingHandle);
                        this._nodesAddingHandle = undefined;
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
        if (this.findPackageNodeData(address)) return;
        //we only update when this is a root package or a pakcage is referenced as input, for the package has nothing to do with us, we ignore it
        if (address === this._rootPkgAddress || this.directInputsForNodes(address).length > 0) {
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