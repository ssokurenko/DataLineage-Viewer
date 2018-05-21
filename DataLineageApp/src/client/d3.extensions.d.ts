/// <reference path="../../node_modules/@types/d3-selection/index.d.ts"/>
import {IDataPackage} from "../server/data-package";

declare module "d3-selection" {
    export interface Selection<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
        /*
         * create defs in svg element for arrow style and shape
         */
        defs(): this;
        /**
         * create popover feature on node when mouse hover to show the package inforamtion
         * @param getPackage
         */
        popover(getPackage: (nodeData: any) => IDataPackage): this;
        /*
         * remove the popover feature when node is removde, must be called when remove a node
         */
        removePopover(): this;
        /*
         * create the node for the package
         */
        packageNode(): this;
        packageLink(): this;
        selectAllNodes(): this;
        selectAllLinks(): this;
    }
}