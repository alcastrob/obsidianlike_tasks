"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCombinations9 = runCombinations9;
const Printers_1 = require("approvals/lib/Utilities/Printers");
function runCombinations9(func, params1, params2, params3, params4, params5, params6, params7, params8, params9) {
    (0, Printers_1.printCombinations)((p1, p2, p3, p4, p5, p6, p7, p8, p9) => {
        func(p1, p2, p3, p4, p5, p6, p7, p8, p9);
        return '';
    }, params1, params2, params3, params4, params5, params6, params7, params8, params9);
}
//# sourceMappingURL=RunCombinations.js.map