import * as $ from "jquery";
import * as d3 from "d3";
import { drawConfig, packageDescriptionHtml } from "./d3-package-extensions";

import { IDataPackage } from "../server/data-package";
import { PacakgesCollection } from "./packages-collection";
import dataOperations, { DataOperationCategory, DataOperation } from "./process-operation";

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
    private _svg: d3.Selection<HTMLElement, any, any, any>;
    private _treemap: d3.TreeLayout<IPackageTreeData>;
    private _nodesData: d3.HierarchyNode<IPackageTreeData>|undefined;
    private readonly _packages: PacakgesCollection<IDataPackage>;
    private _rootPkgAddress: string;

    constructor(private readonly _svgId: string) {
        this._packages = new PacakgesCollection(drawConfig.colorSeries);
        this.reset();
    }

    private get svgSelector() {
        return `#${this._svgId}`;
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
    private async onNodeClicked(data: d3.HierarchyPointNode<IPackageTreeData>, index, nodes): Promise<void> {
        const pkg = data.data.data;
        //expand the node
        if (pkg && pkg.inputs) {
            const notExists = pkg.inputs.filter(ia => !this._packages.packageExist(ia, true));
            if (notExists.length > 0) {
                for (let i = 0; i < notExists.length; i++) {
                    const newPkgs = await this.fetchPackage(notExists[i], false);
                    if (newPkgs.length>0) {
                        this._packages.addOrUpdate(newPkgs[0]);
                    }
                }
            }
            //ToDo: currently we didn't implement dynamically add new package, so we have to all new pkg data and redraw
            this.reset();
        }
        //remove the +
        //d3.select(nodes[index]).selectAll(`text.${drawConfig.plusTxtCssClass}`).attr("class", `${drawConfig.plusTxtCssClass} ${drawConfig.plusExpandedCssClass}`);
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
                    + " " + px + "," + py;
            });

        // adds each node as a group, node is g collection
        const node = g.selectAll(".node")
            .data(nodes.descendants())
            .enter().append("g")
            .attr("class", d => `node tree${d.children ? " node--internal" : " node--leaf"}`)
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .on("click", this.onNodeClicked.bind(this));
            

        // adds the circle to the node
        const circle = node.append("circle")
            .attr("class", "package")
            .attr("fill", d => this._packages.pacakgeColor(d.data.data.mamAddress) as string);

        
        node.each((d, index: number, nodes: Element[]) => {
            const n = nodes[index];
            const pkg = d.data.data;
            //only when the pkg has the inputs and at least one input doesn't in the this._packages, then we will show "+", otherwise all its inputs are exist and will be drawn, so we needn't show "+"
            const canExpand = pkg.inputs &&
                pkg.inputs.length > 0 &&
                pkg.inputs.filter(ia => !this._packages.packageExist(ia, true)).length > 0;
            const operation = DataOperation.findOperation(pkg.operation);
            const text = operation ? operation.iocnFontText : (canExpand ? "\uf067" : "");
            const txtElement = d3.select(n).append("text")
                .text(text as string)
                .attr("font-family", "Font Awesome 5 Free")
            //always add fas, as the plus text is also an font awsome
                .attr("class", `fas ${drawConfig.plusTxtCssClass} ${canExpand ? "" : `${drawConfig.expandedCssClass}`} ${operation ? operation.iconCss : ""}`);
           
            //.attr("fill", color); css will do
            const rect: SVGRect = (circle.node() as any).getBBox();
            txtElement.attr("dy", (rect.height / 2) * 0.6).attr("dx", -(rect.width / 2) * 0.65);

            d3.select(n).append("text")
                .attr("dx", drawConfig.nodeRadius * 1.5)
                .attr("dy", drawConfig.nodeRadius * 0.5)
                .text(`Owner: ${pkg.ownerMetadata ? pkg.ownerMetadata :"Unkown"}`);
        });

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
     * This method will clear all data and useing address to get all data to draw, unlike updateByData which will only add or update data and draw
     */
    async update(address: string, expandAll?: boolean): Promise<void> {
        this._rootPkgAddress = address;
        //The package node already exist, need do nothing
        if (this._packages.packageExist(address)) return;
        this._packages.clear();
        this.close();
        this.reset();
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
        if (!this._svg) {
            this._svg = d3.select(this.svgSelector);
        }
        const size = this.prepareSize();
        const $svg = $(this.svgSelector);
        this._treemap = d3.tree<IPackageTreeData>().size([size.treeWidth, size.treeHeight]);
        /*
         * Define arraw marker
         */
        //this._svg.defs();
        this._svg//.attr("width", 500)
            .attr("height", size.height)
            .append("g")
            .attr("transform", `translate(${size.marginLeft}, ${size.marginTop})`);
        this._nodesData = undefined;
        if (this._packages) {
            const pkgs = this._packages.getAllPackages();
            this._packages.clear();
            this.updateByData(pkgs);
        }
    }

    close(): void {
        //clear all
        const parent = $(this.svgSelector).parent();
        $(this.svgSelector).remove();
        parent.append(`<svg width="100%" id="${this._svgId}">`);
        this._svg = undefined as any;
    }

    private static restWndHeight(): number {
        //calculate the left space without the heard block, so we will make the svg take the whole height of the left space in the windows
        //please note, after the d3 simulation finished, an event will be triggered and we will resize the svg to have the size just show all the nodes (maybe smaller then the initial size or larger)
        return ($(window).height() as number) - ($("#headerDiv").height() as number) - ($("#operationsExampleDiv").height() as number) - 50;
    }

    private prepareSize(): { width: number; height: number; treeWidth:number; treeHeight:number; marginLeft:number; marginTop: number } {
        // set the dimensions and margins of the diagram
        const margin = { top: 20, right: 40, bottom: 20, left: 40 };
        const width = $(this.svgSelector).width() as number;
        const height = App.restWndHeight();
        return {
            width: width,
            height: height,
            treeWidth: width - margin.left - margin.right,
            treeHeight: height - margin.top - margin.bottom,
            marginLeft: margin.left,
            marginTop: margin.top
        };
    }
}

let app: App = new App(mainGraphSvgId);
$("#searchBtn").on("click",
    () => {
        $("#operationsExampleDiv").show();
        //get address from search input or placehoder
        let address = $("#inputAddress").val() as string;
        if (!address) {
            address = $("#inputAddress").attr("placeholder") as string;
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
            app.close();
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
    let desc = "";
    dataOperations.forEach(o => {
        desc += `<span class="badge badge-light"><i class="${o.iconCss}"></i>${DataOperationCategory[o.category]}</span>`;
    });
    $("#operationsExampleDiv > div").append($(desc));
    const address = getParameterByName("address");
    const expandAll = getParameterByName("expandAll");
    if (expandAll == "true"||typeof (expandAll) === undefined||expandAll === ""||expandAll === null) {
        $("#expandAllCheck").attr("checked", "checked");
    } else {
        $("#expandAllCheck").removeAttr("checked");
    }
    if (address) {
        $("#inputAddress").val(address);
        $("#operationsExampleDiv").show();
        app.reset();
        app.update(address, expandAll !== "false");
    }
});
export default App;