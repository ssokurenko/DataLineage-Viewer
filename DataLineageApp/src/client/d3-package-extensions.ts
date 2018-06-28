import * as d3 from "d3";
import * as bootstrap from "bootstrap";

import { IDataPackage, ILightweightPackage, IStandardPackage } from "../server/data-package";
import dataOperations, {DataOperationCategory} from "./process-operation";


export function packageDescriptionHtml(pkg: IDataPackage | ILightweightPackage | IStandardPackage): string {
    let listContent = "";
    let hasOpertaion = false;
    if (pkg) {
        for (let f in pkg) {
            if (pkg.hasOwnProperty(f) && f !== "nextRootAddress") {
                let icon: string | undefined = undefined;
                if (f === nameof<IDataPackage>(p => p.operation)) {
                    const found = dataOperations.filter(o => DataOperationCategory[o.category] === pkg[f]);
                    if (found.length > 0) {
                        icon = found[0].iconCss;
                        hasOpertaion = true;
                    }
                }
                listContent += `<li class="list-group-item">${f}: ${icon ? `<i class="${icon}"></i>` : ""} ${pkg[f]}</li>`;
            }
        }
    }
    let footer = "";
    if (hasOpertaion) {
        dataOperations.forEach(o => {
            footer += `<span class="badge badge-light"><i class="${o.iconCss}"></i>&nbsp${DataOperationCategory[o.category]}</span>`;
        });
        footer = `<div class="card-footer text-muted">${footer}</div>`;
    }
    const html = `<div class="card bg-light"><div class="card-body"><h5 class="card-title">Package Information</h5></div><ul class="list-group list-group-flush">${listContent}</ul>${footer}</div>`;
    return html;
}

class DrawConfig {
    private _nodeRadius: number | undefined;

    get nodeRadius() {
        //will try to get the circle.r from style (effected by css), if can't get, then will use default value of 8
        if (this._nodeRadius) return this._nodeRadius;
        const $svg = $("svg");
        if ($svg.length > 0) {
            const d3Svg = d3.select($svg[0] as any);
            const radiu = (): number | undefined => {
                try {
                    return parseFloat(d3Svg.selectAll("circle").style("r"));
                } catch (e) {
                    return undefined;
                }
            }
            this._nodeRadius = radiu();

            //if !_nodeRadius means there is no circle, we need to draw a hidden circle and then get the style and then remove it
            if (!this._nodeRadius) {
                const tmpNode = d3Svg.packageNode(() => ({
                        timestamp: Date.now(),
                        dataPackageId: "temp-data-package-id",
                        mamAddress: "empty-address",
                        nextRootAddress: "",
                        inputs: []
                    }),
                    () => "#ffffff",
                    null);
                this._nodeRadius = radiu();
                tmpNode.remove();
            }
        }
        //8 is default value
        
        return this._nodeRadius ? this._nodeRadius : 8;
    }

    get nodeCssClass() { return "node"; }

    get nodePkgCircleCssClass() { return "package"; }

    get nodeInputPieCssClass() { return "input-pie"; }
    get plusTxtCssClass() { return "expand-plus"; }
    get plusExpandedCssClass() { return "expanded"; }

    get linkCssClass() { return "link"; }

    get arrowMarkerId() { return "arrow"; }

    /**
     * this must be same as the "6" in the path.d that defined in svg > defs > marker/#arrow
     * @returns {} 
     */
    get arrowXOffset() {
        return 6;
    }

    /**
     * must be same as the color of .line in main.css
     * @returns {} 
     */
    get arrowColor() { return "#696969"; }

    get colorSeries() { return d3.schemePaired; }
    private _color = d3.scaleOrdinal(this.colorSeries);

    get colors() { return this._color; }
}

export const drawConfig = new DrawConfig();

d3.selection.prototype.defs = function() {
    const s = this as d3.Selection<any, any, any, any>;
    return s.append("defs")
        .append("marker")
        .attr("id", drawConfig.arrowMarkerId)
        .attr("markerUnits", "strokeWidth")
        .attr("markerWidth", "25")
        .attr("markerHeight", "25")
        .attr("viewBox", "0 0 12 12")
        .attr("refX", drawConfig.arrowXOffset + drawConfig.nodeRadius)
        .attr("refY", "6")
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M2,2 L10,6 L2,10 L6,6 L2,2")
        .attr("fill", drawConfig.arrowColor);
};

//must use function not =>, as we need to access the real caller "this"
d3.selection.prototype.popover = function<TNodeData>(getPackage: (nodeData: TNodeData) => IDataPackage) {
    const s = this as d3.Selection<any, any, any, any>;
    return s
        .attr("data-toggle", "popover")
        .attr("data-html", true)
        .attr("data-trigger", "hover focus")
        .attr("data-placement", "auto")
        .attr("data-template",
            `<div class="popover pacakge-tooltip" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>`)
        .attr("data-content", nodeData => packageDescriptionHtml(getPackage(nodeData)))
        .each((nodeData, index, groups: Element[]) => {
            $(groups[index]).popover({ delay: { "show": 100, "hide": 500 }, offset: drawConfig.nodeRadius });
        });
};

d3.selection.prototype.removePopover = function() {
    const s = this as d3.Selection<any, any, any, any>;
    return s.each((data: any, index, groups) => { $(groups[index]).popover("hide"); });
};

/**
 * 
 * @param pieColors: a function that will returns an colors array, and these colors will be used to draw the nodes as the pie chart
 * @param nodeColor: a function will return the color for the node (represent a package)
 * @param packageInfo: a function will return the IDataPackage for current node
 * @returns {} 
 */
d3.selection.prototype.packageNode =
    function<TNodeData extends d3.SimulationNodeDatum>(packageInfo: (nodeDate: TNodeData) => IDataPackage,
        nodeColor: (nodeDate: TNodeData) => any,
        pieColors: ((nodeDate: TNodeData) => any[]) | null | undefined) {
        function pkgCircleId(p: IDataPackage): string {
            return `pkg-${p.mamAddress}`;
        }

        /**
         * draw the package itself 
         * @param node
         * @param pkgColor
         */
        function drawNodeCircle(pkg: IDataPackage, node: Element, pkgColor) {
            d3.select(node)
                .insert("circle")
                .attr("id", pkgCircleId(pkg))
                .attr("class", `${drawConfig.nodePkgCircleCssClass}`)
                //.attr("r", radius) css will set
                .attr("fill", pkgColor)
                .attr("stroke", pkgColor);
            //.attr("stroke-width", outerStrokeWidth); css will set
        }

        /**
         * Draw the package node content as a pie chart
         * each part in the pie chart represent a input
         * @param colors: the colors for each part of the pie
         */
        function drawNodePieChart(pkg: IDataPackage, node: Element, colors: any[]) {
            if (!colors || colors.length <= 0) {
                return;
            }
            const halfRadius = drawConfig.nodeRadius / 2;
            const halfCircumference = 2 * Math.PI * halfRadius;
            for (let i = 0; i < colors.length; i++) {
                const percentToDraw = (i + 1) / colors.length;
                d3.select(node)
                    .insert("circle", `#${pkgCircleId(pkg)} + *`)
                    .attr("class", drawConfig.nodeInputPieCssClass)
                    .attr("fill", "transparent")
                    .style("stroke", colors[i])
                    //.style("stroke-width", radius) css will set
                    .style("stroke-dasharray", halfCircumference * percentToDraw + " " + halfCircumference);
            }
        }

        function drawNodeText(pkg: IDataPackage, node: Element) {
            const text = (pkg.inputs && pkg.inputs.length > 0) ? "+" : "";
            const txtElement = d3.select(node).append("text")
                .text(text).attr("class", drawConfig.plusTxtCssClass);
                //.attr("fill", color); css will do
            const rect: SVGRect = (txtElement.node() as any).getBBox();
            return txtElement.attr("dy", (rect.height / 2) - drawConfig.nodeRadius).attr("dx", -(rect.width / 2));
        }

        const s = this as d3.Selection<any, any, any, any>;
        return s.append("g")
            .attr("class", `${drawConfig.nodeCssClass}`)
            .each((d: TNodeData, index: number, nodes: Element[]) => {
                const n = nodes[index];
                const pkg = packageInfo(d);
                //draw the package circle and the outer stroke
                drawNodeCircle(pkg, n, nodeColor(d));
                //no input, then need't draw the pie chart
                if (pkg.inputs && pkg.inputs.length > 0 && pieColors) {
                    drawNodePieChart(pkg, n, pieColors(d));
                }
                drawNodeText(pkg, n);
            });
    };

d3.selection.prototype.packageExpanded = function() {
    const s = this as d3.Selection<any, any, any, any>;
    return s.selectAll(`text.${drawConfig.plusTxtCssClass}`).attr("class", `${drawConfig.plusTxtCssClass} ${drawConfig.plusExpandedCssClass}`);
};

d3.selection.prototype.packageLink = function() {
    const s = this as d3.Selection<any, any, any, any>;
    return s.append("line")
        .attr("class", `${drawConfig.linkCssClass}`)
        .attr("marker-end", "url(#arrow)");
};

d3.selection.prototype.selectAllNodes = function() {
    const s = this as d3.Selection<any, any, any, any>;
    return s.selectAll(`.${drawConfig.nodeCssClass}`);
};

/**
 * return the value directly when d is undefined, number or string
 * return undefined if d is INodeData
 * @param d
 */
const v = (d: d3.SimulationNodeDatum | undefined | string | number): number | undefined => {
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
const x = (d: d3.SimulationNodeDatum | undefined | string | number): number => {
    const temp = v(d);
    if (typeof temp !== "undefined") {
        return temp;
    }
    const nd = d as d3.SimulationNodeDatum;
    return (nd.fx ? nd.fx : nd.x) as number;
};

/**
 * return fy if fy has value, otherwise return y
 * @param d
 */
const y = (d: d3.SimulationNodeDatum | undefined | string | number): number => {
    const temp = v(d);
    if (typeof temp !== "undefined") {
        return temp;
    }
    const nd = d as d3.SimulationNodeDatum;
    return (nd.fy ? nd.fy : nd.y) as number;
};

d3.selection.prototype.nodesOnSimulationTicked = function () {
    const s = this as d3.Selection<any, any, any, any>;
    return s.selectAllNodes()
        .each((d: d3.SimulationNodeDatum, index: number, nodes: Element[]) => {
            const n = nodes[index];
            d3.select(n).selectAll("circle")
                .attr("cx", () => x(d))
                .attr("cy", () => y(d));
            d3.select(n).selectAll("text").attr("x", () => x(d)).attr("y", () => y(d));
        });
};

d3.selection.prototype.selectAllLinks = function () {
    const s = this as d3.Selection<any, any, any, any>;
    return s.selectAll(`.${drawConfig.linkCssClass}`);
};

d3.selection.prototype.linkssOnSimulationTicked = function () {
    const s = this as d3.Selection<any, any, any, any>;
    return s.selectAllLinks()
        .attr("x1",
        (d: d3.SimulationLinkDatum<d3.SimulationNodeDatum>) => x(d.source))
        .attr("y1",
        (d: d3.SimulationLinkDatum<d3.SimulationNodeDatum>) => y(d.source))
        .attr("x2",
        (d: d3.SimulationLinkDatum<d3.SimulationNodeDatum>) => x(d.target))
        .attr("y2",
        (d: d3.SimulationLinkDatum<d3.SimulationNodeDatum>) => y(d.target));
};