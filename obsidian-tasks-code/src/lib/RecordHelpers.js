"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameKeyInRecordPreservingOrder = renameKeyInRecordPreservingOrder;
function renameKeyInRecordPreservingOrder(record, oldKey, newKey) {
    if (oldKey === newKey || !Object.prototype.hasOwnProperty.call(record, oldKey)) {
        return { ...record };
    }
    const newRecord = {};
    for (const [key, value] of Object.entries(record)) {
        if (key === oldKey) {
            newRecord[newKey] = value;
        }
        else {
            newRecord[key] = value;
        }
    }
    return newRecord;
}
//# sourceMappingURL=RecordHelpers.js.map