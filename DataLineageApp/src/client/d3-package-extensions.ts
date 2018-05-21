import * as d3 from "d3";
import * as bootstrap from "bootstrap";

import { IDataPackage, PacakgeHelper, ILightweightPackage, IStandardPackage } from "../server/data-package";

function packageDescriptionHtml(pkg: IDataPackage | ILightweightPackage | IStandardPackage): string {
    let content = "";
    let listContent = "";
    let dataContent = "";
    if (pkg) {
        content = '<h5 class="card-title">Package Information</h5>';
        listContent = `<li class="list-group-item">Id: ${pkg.dataPackageId}</li>` +
            `<li class="list-group-item">Time: ${new Date(pkg.timestamp)}</li>`;
        if (PacakgeHelper.isStandard(pkg)) {
            content += + `<li class="list-group-item">signature: ${pkg.signature}</li>`;
        }

        if (PacakgeHelper.isLightWeight(pkg) && pkg.data) {
            dataContent = `<div class="card-body"><h6 class="card-subtitle mb-2 text-muted">Package Data:</h6><p class="card-text">${pkg.data}</p></div>`;
        }
    }

    const html = `<div class="card pacakge-tooltip bg-light"><div class="card-body">${content}</div><ul class="list-group list-group-flush">${listContent}</ul>${dataContent}</div>`;
    return html;
}

class DrawConfig {
    get nodeRadius() { return 8; }

    get nodeCssClass() { return "node"; }

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

const drawConfig = new DrawConfig();
export default drawConfig;

d3.selection.prototype.defs = function() {
    const s = this as d3.Selection<any, any, any, any>;
    return s.selectAll("svg").append("defs")
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
            $(groups[index]).popover({ delay: { "show": 100, "hide": 500 } });
        });
};

d3.selection.prototype.removePopover = function() {
    const s = this as d3.Selection<any, any, any, any>;
    return s.each((data: any, index, groups) => { $(groups[index]).popover("hide"); });
};

d3.selection.prototype.packageNode = function() {
    const s = this as d3.Selection<any, any, any, any>;
    return s.append("circle")
        .attr("class", `${drawConfig.nodeCssClass}`)
        .attr("r", drawConfig.nodeRadius)
        .attr("fill", (d: any) => drawConfig.colors(((d.index ? d.index : 0) % drawConfig.colorSeries.length).toString()));
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

d3.selection.prototype.selectAllLinks = function () {
    const s = this as d3.Selection<any, any, any, any>;
    return s.selectAll(`.${drawConfig.linkCssClass}`);
};