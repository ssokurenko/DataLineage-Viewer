import * as $ from "jquery";
import * as d3 from "d3";
import { drawConfig, packageDescriptionHtml } from "./d3-package-extensions";

import { IDataPackage } from "../server/data-package";
import { PacakgesCollection } from "./packages-collection";

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

    /**
     * 
     * @param data
     * @param index, accroding to d3js, index is fixed when listern registered, so don't use it
     * @param nodes
     */
    private onNodeClicked(data: d3.HierarchyPointNode<IPackageTreeData>, index, nodes): void {
        const pkg = data.data.data;
        //expand the node
        if (pkg && pkg.inputs) {
            pkg.inputs.forEach(address => this.update(address, false));
        }
        //remove the +
        d3.select(nodes[index]).selectAll(`text.${drawConfig.plusTxtCssClass}`).attr("class", `${drawConfig.plusTxtCssClass} ${drawConfig.plusExpandedCssClass}`);
        $(`#${pkgInfoContainerDivId}`).empty().append(packageDescriptionHtml(pkg));
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
        const nodes = this._treemap(this._nodesData);
        const g = this._svg.select("g");

        // adds the links between the nodes
        const link = g.selectAll(".link.tree")
            .data(nodes.descendants().slice(1))
            .enter().append("path")
            .attr("class", "link tree")
            //.attr("marker-end", "url(#arrow)")
            .attr("d", d => {
                const px = d.parent ? d.parent.x : 0;
                const py = d.parent ? d.parent.y : 0;
                return "M" + d.x + "," + d.y
                + "C" + d.x + "," + (d.y + py) / 2
                + " " + px + "," + (d.y + py) / 2
                    + " " + px + "," + py
            });

        // adds each node as a group, node is g collection
        const node = g.selectAll(".node")
            .data(nodes.descendants())
            .enter().append("g")
            .attr("class", d => `node tree${d.children ? " node--internal" : " node--leaf"}`)
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .on("click", this.onNodeClicked.bind(this));
            

        // adds the circle to the node
        node.append("circle")
            .attr("class", "package")
            .attr("fill", d => this._packages.pacakgeColor(d.data.data.mamAddress) as string);

        /*
        node.each((d, index: number, nodes: Element[]) => {
            const n = nodes[index];
            const pkg = d.data.data;
            const text = (pkg.inputs && pkg.inputs.length > 0) ? "+" : "";
            const txtElement = d3.select(n).append("text")
                .text(text).attr("class", drawConfig.plusTxtCssClass);
            //.attr("fill", color); css will do
            const rect: SVGRect = (txtElement.node() as any).getBBox();
            txtElement.attr("dy", (rect.height / 2) - 12).attr("dx", -(rect.width / 2));
        });*/

        // adds the text to the node
        //node.append("text")
        //    .attr("dy", ".35em")
        //    .attr("y", d => d.children ? -20 : 20)
        //    .style("text-anchor", "middle")
        //    .text(d => d.data.name);
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
        this._treemap = d3.tree<IPackageTreeData>().size([$svg.width() as number, 500]);
        /*
         * Define arraw marker
         */
        //this._svg.defs();
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