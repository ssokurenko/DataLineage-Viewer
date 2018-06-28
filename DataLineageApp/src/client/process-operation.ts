export enum DataOperationCategory {
    Extraction,
    Derivation,
    Modification,
    Extension,
    Integration,
    Sanitization,
    Cleansing
}

export class DataOperation {
    constructor(public readonly category: DataOperationCategory, public readonly iconCss?: string) {}
}

const dataOperations = [
    new DataOperation(DataOperationCategory.Extraction, "fas fa-external-link-alt"),
    new DataOperation(DataOperationCategory.Derivation, "fas fa-level-down-alt"),
    new DataOperation(DataOperationCategory.Modification, "fas fa-edit"),
    new DataOperation(DataOperationCategory.Extension, "fas fa-expand-arrows-alt"),
    new DataOperation(DataOperationCategory.Integration, "fas fa-sign-in-alt"),
    new DataOperation(DataOperationCategory.Sanitization, "fas fa-file-export"),
    new DataOperation(DataOperationCategory.Cleansing, "fas fa-filter")
];
export default dataOperations;
