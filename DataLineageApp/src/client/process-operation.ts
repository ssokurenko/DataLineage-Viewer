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
    constructor(public readonly category: DataOperationCategory,
        public readonly description,
        public readonly iconCss?: string,
        public readonly iocnFontText?: string) {

    }

    public static findOperation(operation: string | undefined): DataOperation | undefined {
        if (!operation) {
            return undefined;
        }
        const found = dataOperations.filter(o => DataOperationCategory[o.category] === operation);
        return found.length > 0 ? found[0] : undefined;
    }
}

const dataOperations = [
    new DataOperation(DataOperationCategory.Extraction,
        "A fragment of a dataset is extracted (or copied) and stored as an independent new dataset",
        "fas fa-external-link-alt",
        "\uf35d"),
    new DataOperation(DataOperationCategory.Derivation,
        "One (or more) new dataset is produced as a result of deriving new calculated values from the original dataset. The values of the original dataset are not preserved in the new dataset. For instance, this might include a data quality assessment, statistics, a collection of results of formulas applied to the original data (aggregation), etc. Notice that in some derivations, the original data can be traced back (traceable derivation)",
        "fas fa-level-down-alt",
        "\uf3be"),
    new DataOperation(DataOperationCategory.Modification,
        "A dataset is (partially) modified but the original data is preserved without adding new data. This might include data cleansing, transposing, pivoting, ordering, encoding and translating",
        "fas fa-edit",
        "\uf044"),
    new DataOperation(DataOperationCategory.Extension,
        "A dataset is extended with new data. The new dataset combines data of the original dataset and new data resulting of a derivation process or an integration process",
        "fas fa-expand-arrows-alt",
        "\uf31e"),
    new DataOperation(DataOperationCategory.Integration,
        "Specific case of extension, where several existent datasets are (partially) combined into a new dataset",
        "fas fa-sign-in-alt",
        "\uf2f6"),
    new DataOperation(DataOperationCategory.Sanitization,
        "Specific case of extraction, modification or extension where sensitive information from a dataset is removed. This  includes anonymization",
        "fas fa-file-export",
        "\uf56e"),
    new DataOperation(DataOperationCategory.Cleansing,
        "Specific case of modification or extension where corrupt or inaccurate data is corrected or removed from the original dataset",
        "fas fa-filter",
        "\uf0b0")
];
export default dataOperations;
