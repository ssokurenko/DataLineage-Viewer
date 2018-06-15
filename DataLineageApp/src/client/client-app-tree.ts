import * as $ from "jquery";
import * as d3 from "d3";
import { drawConfig, packageDescriptionHtml } from "./d3-package-extensions";

import { IDataPackage } from "../server/data-package";
import { PacakgesCollection } from "./packages-collection";

interface INodeData extends d3.SimulationNodeDatum {
    package: IDataPackage;
}

interface ILinkData extends d3.SimulationLinkDatum<INodeData> {

}

interface IPackageTreeData {
    name: string;
    data: IDataPackage;
    children: IPackageTreeData[] | undefined;
}

enum NotifyType {
    Warning,
    Error
}

function notify(type: NotifyType, message: string) {
    alert(message);
}

const mainGraphSvgId = "mainGraphSvg";
const pkgInfoContainerDivId = "pkgInfoContainerDiv";

class App {
    private readonly _svg: d3.Selection<HTMLElement, any, any, any>;
    private _treemap: d3.TreeLayout<IPackageTreeData>;
    private _nodesData: d3.HierarchyNode<IPackageTreeData>|undefined;
    private readonly _packages: PacakgesCollection<IDataPackage>;
    private _rootPkgAddress: string;

    constructor(private readonly svgSelector: string) {
        this._svg = d3.select(svgSelector);
        this._packages = new PacakgesCollection(drawConfig.colorSeries);
        this.reset();
    }

    private async fetchPackage(address: string, all: boolean = false): Promise<IDataPackage[]> {
        const alertId = "#loadingAlert";
        try {
            $(alertId).show();
            const result = await $.get(`/api/address/${address}${(all ? "/all" : "")}`);
            $(alertId).hide();
            return result;
        } catch (e) {
            $(alertId).hide();
            throw e;
        }
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

    private onSimulationEnd(): void {
        let maxY: number = 0;
        this._nodesData.forEach(d => {
            if (d.y && d.y > maxY) {
                maxY = d.y;
            }
        });
        $(`#${mainGraphSvgId}`).height(maxY + 40);
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
        $(`#${pkgInfoContainerDivId}`).empty().append(packageDescriptionHtml(data.package));
    }

    /*
     * update d3js nodes elements based on the latest _nodesData
     */
    private updateD3Nodes(): void {
        this._simulation.nodes(this._nodesData);
        const nodesSelection = this.nodesSelection.data(this._nodesData);
        //as we only add new packages onto the graph, no pacakges remove or update, so needn't take care about the remove and update
        //and before reomve the element from dom, tooltip must be hidden
        nodesSelection.exit()
            //.removePopover()
            .remove();

        //for new package node, we create cirele and set class as .node and other attributes
        nodesSelection.enter()
            .packageNode<INodeData>(d => d.package,
                d => this._packages.pacakgeColor(d.package.mamAddress),
                undefined /*d => d.package.inputs ? d.package.inputs.map(address => this._packages.pacakgeColor(address)) : []*/)
            //.popover((d: INodeData) => d.package) if enable popover, the removePopover should be enabled also
            .on("click", this.onNodeClicked.bind(this));
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

            //there is a possibility that one of this node's input already added before this node is added, so at the time the input node is added,
            //as this node hasn't been added, so the link from that input node to this node won't be added, so we need to check and add all missing links
            p.inputs
                //find missing address from the p.inputs
                .filter(address => {
                    if (!this._packages.packageExist(address, true)) return false;
                    //the input pkg exist, so check if the link is missing
                    //if not exit, then we should renturn true to make the link add to "missingLinks"
                    return this._linksData.filter(l => l.source === address && l.target === p.mamAddress).length <= 0;
                })
                //create the link for missing address
                .map(missingInputAddress => ({
                    source: missingInputAddress,
                    target: p.mamAddress
                }))
                //add links to linkdata
                .forEach(l => this._linksData.push(l));
        }
        const nodeData: INodeData = {
            package: p
        };
        const directInputNodes = this._packages.getInputTo(p.mamAddress)
            .map(pkg => this._nodesData.filter(n => n.package.mamAddress === pkg.mamAddress)[0]);
        if (p.mamAddress === this._rootPkgAddress) {
            nodeData.fx = this.width / 2;
            nodeData.fy = drawConfig.nodeRadius * 4;
        } else {
            if (directInputNodes.length > 0) {
                nodeData.x = (directInputNodes[0].x as number) +
                    (Math.random() * 2 * drawConfig.nodeRadius - drawConfig.nodeRadius);
                nodeData.y = (directInputNodes[0].y as number) + drawConfig.nodeRadius * 3;
            }
        }
        this._nodesData.push(nodeData);
        //as this node is a new added node, so we will add all links that this pacakge as a input
        directInputNodes.map((n: INodeData) => ({
            source: p.mamAddress as string,
            target: n.package.mamAddress
        })).forEach(l => this._linksData.push(l));

        //must draw nodes first, then draw links, so that links and arrow can on top of nodes
        this.updateD3Links();
        this.updateD3Nodes();
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

    private toTreeData(pkg: IDataPackage | undefined): IPackageTreeData | undefined {
        if (!pkg) return undefined;
        return {
            name: pkg.dataPackageId,
            data: pkg,
            //if pkg input doesn't loaded, then map will map it to undefined, so we need to filter to make sure only valid pkg tree data is in arry
            children: pkg.inputs
                ? pkg.inputs.map(address => this.toTreeData(this._packages.getPackage(address))).filter(p => p) as IPackageTreeData[]
                : undefined
        };
    }

    updateByData(packages: IDataPackage[]): void {
        if (!packages || packages.length <= 0) {
            return;
        }
        
        packages.forEach(p => {
            this._packages.addOrUpdate(p);
        });
        //convert to tree structure data
        const root = this._packages.getPackage(this._rootPkgAddress);
        if (!root) return;
        this._nodesData = d3.hierarchy(this.toTreeData(root) as IPackageTreeData);
    }

    /**
     * 
     * @param address
     * @param expandAll
     */
    async update(address: string, expandAll?: boolean): Promise<void> {
        this._rootPkgAddress = address;
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

    reset(): void {
        this.close();
        const $svg = $(this.svgSelector);
        this._treemap = d3.tree().size([$svg.width() as number, 500]);
        
        this._svg//.attr("width", 500)
            .attr("height", 500)
            .append("g")
            .attr("transform", "translate(50, 50)");
        this._nodesData = undefined;
        if (this._packages) {
            const pkgs = this._packages.getAllPackages();
            this._packages.clear();
            this.updateByData(pkgs);
        }
    }

    close(): void {
        //clear all
        this._svg.selectAll("*").remove();
    }
}

let app: App = new App(`#${mainGraphSvgId}`);
$("#searchBtn").on("click",
    () => {
        app.reset();
        //get address from search input or placehoder
        let address = $("#inputAddress").val() as string;
        if (!address) {
            address = $("#inputAddress").attr("placeholder") as string;
        }
        //calculate the left space without the heard block, so we will make the svg take the whole height of the left space in the windows
        //please note, after the d3 simulation finished, an event will be triggered and we will resize the svg to have the size just show all the nodes (maybe smaller then the initial size or larger)
        const restHeight = ($(window).height() as number) - ($("#headerDiv").height() as number);
        if (restHeight) {
            $(`#${mainGraphSvgId}`).height(restHeight - 10);
        }
        $(`#${pkgInfoContainerDivId}`).empty();
        const expandAll = $("#expandAllCheck").is(":checked");
        app.update(address, expandAll);
        //after search, change the url to the format with the address so when user refresh the page will show the pacakge automatically
        window.history.pushState("new address", `Query Package ${address}`, `/?address=${address}&expandAll=${expandAll}`);
    });

/**
 * when window size is changed, we need to redraw all the nodes, becasue only change the svg size won't change the nodes position
 */
$(window).on("resize",
    () => {
        if (app) {
            app.reset();
        }
    });

//Support to get params from url, for now, we support urls:
//1. /, show the page with a serach input, and user need to input the address of the package
//2. /address=****&expandAll=true or false, show the page and the root package is specified by the address from param, and if expandAll is true, then will auto exapnd all nodes
function getParameterByName(name: string) {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

$(document as any).ready(() => {
    const address = getParameterByName("address");
    const expandAll = getParameterByName("expandAll");
    if (address) {
        app.reset();
        app.update(address, expandAll !== "false");
    }
});
export default App;