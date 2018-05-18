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



d3.selection.prototype.popover = <TNodeData>(getPackage: (nodeData: TNodeData) => IDataPackage) => {
    const s = this as d3.Selection<any, any, any, any>;
    s
        .attr("data-toggle", "popover")
        .attr("data-html", true)
        .attr("data-trigger", "hover focus")
        .attr("data-placement", "auto")
        .attr("data-template",
            `<div class="popover pacakge-tooltip" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>`)
        .attr("data-content", nodeData => packageDescriptionHtml(getPackage(nodeData)))
        .each((nodeData, index, groups: Element[]) => {
            $(groups[index]).popover({ delay: { "show": 100, "hide": 1000 } });
        });
    return s;
}

//declare module "d3" {
//    export interface Selection<GElement extends d3.BaseType, Datum, PElement extends d3.BaseType, PDatum> {
//        popover<TNodeData>(getPackage: (nodeData: TNodeData) => IDataPackage): Selection<GElement, Datum, PElement, PDatum>;
//    }
//}