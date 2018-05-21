/// <reference path="../../node_modules/@types/d3-selection/index.d.ts"/>
import {IDataPackage} from "../server/data-package";

declare module "d3-selection" {
    export interface Selection<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
        popover(getPackage: (nodeData: any) => IDataPackage);
    }
}