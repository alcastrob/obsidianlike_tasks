"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareByDate = compareByDate;
function compareByDate(a, b) {
    if (a !== null && b === null) {
        return -1;
    }
    if (a === null && b !== null) {
        return 1;
    }
    if (!(a !== null && b !== null)) {
        return 0;
    }
    if (a.isValid() && !b.isValid()) {
        return 1;
    }
    else if (!a.isValid() && b.isValid()) {
        return -1;
    }
    if (a.isAfter(b)) {
        return 1;
    }
    else if (a.isBefore(b)) {
        return -1;
    }
    else {
        return 0;
    }
}
//# sourceMappingURL=DateTools.js.map