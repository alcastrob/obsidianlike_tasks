/**
 * The type used for a single entry in bulk imports of pre-created sets of statuses.
 * The values are: symbol, name, next symbol, status type (must be one of the values in {@link StatusType})
 */
export type StatusCollectionEntry = [string, string, string, string];

/**
 * The type used for bulk imports of pre-created sets of statuses.
 * See {@link Status.createFromImportedValue}
 */
export type StatusCollection = Array<StatusCollectionEntry>;
