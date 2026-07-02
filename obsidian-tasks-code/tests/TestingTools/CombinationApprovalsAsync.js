"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmt = fmt;
exports.verifyAllCombinations2Async = verifyAllCombinations2Async;
exports.verifyAllCombinations3Async = verifyAllCombinations3Async;
exports.verifyAllCombinations4Async = verifyAllCombinations4Async;
exports.verifyAllCombinations5Async = verifyAllCombinations5Async;
exports.verifyAllCombinations6Async = verifyAllCombinations6Async;
exports.verifyAllCombinations7Async = verifyAllCombinations7Async;
exports.verifyAllCombinations8Async = verifyAllCombinations8Async;
exports.verifyAllCombinations9Async = verifyAllCombinations9Async;
const JestApprovals_1 = require("approvals/lib/Providers/Jest/JestApprovals");
const Printers_1 = require("approvals/lib/Utilities/Printers");
const ScriptingTestHelpers_1 = require("../Scripting/ScriptingTestHelpers");
const RunCombinations_1 = require("./RunCombinations");
/**
 * Add quotes around any string values.
 *
 * If the code in this file is ever published up-stream to Approvals.NodeJS, we can always copy
 * formatToRepresentType() over too.
 * @param x
 */
function fmt(x) {
    return (0, ScriptingTestHelpers_1.formatToRepresentType)(x);
}
function verifyAllCombinations2Async(name, title, func, params1, params2) {
    let output = title + '\n';
    (0, RunCombinations_1.runCombinations9)((t1, t2, _t3, _t4, _t5, _t6, _t7, _t8, _t9) => {
        it(`${name} ${fmt(t1)} ${fmt(t2)}`, async () => {
            output += (await func(t1, t2)) + '\n';
        });
    }, params1, params2, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY);
    it(name, () => {
        (0, JestApprovals_1.verify)(output);
    });
}
function verifyAllCombinations3Async(name, title, func, params1, params2, params3) {
    let output = title + '\n';
    (0, RunCombinations_1.runCombinations9)((t1, t2, t3, _t4, _t5, _t6, _t7, _t8, _t9) => {
        it(`${name} ${fmt(t1)} ${fmt(t2)} ${fmt(t3)}`, async () => {
            output += (await func(t1, t2, t3)) + '\n';
        });
    }, params1, params2, params3, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY);
    it(name, () => {
        (0, JestApprovals_1.verify)(output);
    });
}
function verifyAllCombinations4Async(name, title, func, params1, params2, params3, params4) {
    let output = title + '\n';
    (0, RunCombinations_1.runCombinations9)((t1, t2, t3, t4, _t5, _t6, _t7, _t8, _t9) => {
        it(`${name} ${fmt(t1)} ${fmt(t2)} ${fmt(t3)} ${fmt(t4)}`, async () => {
            output += (await func(t1, t2, t3, t4)) + '\n';
        });
    }, params1, params2, params3, params4, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY);
    it(name, () => {
        (0, JestApprovals_1.verify)(output);
    });
}
function verifyAllCombinations5Async(name, title, func, params1, params2, params3, params4, params5) {
    let output = title + '\n';
    (0, RunCombinations_1.runCombinations9)((t1, t2, t3, t4, t5, _t6, _t7, _t8, _t9) => {
        it(`${name} ${fmt(t1)} ${fmt(t2)} ${fmt(t3)} ${fmt(t4)} ${fmt(t5)}`, async () => {
            output += (await func(t1, t2, t3, t4, t5)) + '\n';
        });
    }, params1, params2, params3, params4, params5, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY);
    it(name, () => {
        (0, JestApprovals_1.verify)(output);
    });
}
function verifyAllCombinations6Async(name, title, func, params1, params2, params3, params4, params5, params6) {
    let output = title + '\n';
    (0, RunCombinations_1.runCombinations9)((t1, t2, t3, t4, t5, t6, _t7, _t8, _t9) => {
        it(`${name} ${fmt(t1)} ${fmt(t2)} ${fmt(t3)} ${fmt(t4)} ${fmt(t5)} ${fmt(t6)}`, async () => {
            output += (await func(t1, t2, t3, t4, t5, t6)) + '\n';
        });
    }, params1, params2, params3, params4, params5, params6, Printers_1.EMPTY, Printers_1.EMPTY, Printers_1.EMPTY);
    it(name, () => {
        (0, JestApprovals_1.verify)(output);
    });
}
function verifyAllCombinations7Async(name, title, func, params1, params2, params3, params4, params5, params6, params7) {
    let output = title + '\n';
    (0, RunCombinations_1.runCombinations9)((t1, t2, t3, t4, t5, t6, t7, _t8, _t9) => {
        it(`${name} ${fmt(t1)} ${fmt(t2)} ${fmt(t3)} ${fmt(t4)} ${fmt(t5)} ${fmt(t6)} ${fmt(t7)}`, async () => {
            output += (await func(t1, t2, t3, t4, t5, t6, t7)) + '\n';
        });
    }, params1, params2, params3, params4, params5, params6, params7, Printers_1.EMPTY, Printers_1.EMPTY);
    it(name, () => {
        (0, JestApprovals_1.verify)(output);
    });
}
function verifyAllCombinations8Async(name, title, func, params1, params2, params3, params4, params5, params6, params7, params8) {
    let output = title + '\n';
    (0, RunCombinations_1.runCombinations9)((t1, t2, t3, t4, t5, t6, t7, t8, _t9) => {
        it(`${name} ${fmt(t1)} ${fmt(t2)} ${fmt(t3)} ${fmt(t4)} ${fmt(t5)} ${fmt(t6)} ${fmt(t7)} ${fmt(t8)}`, async () => {
            output += (await func(t1, t2, t3, t4, t5, t6, t7, t8)) + '\n';
        });
    }, params1, params2, params3, params4, params5, params6, params7, params8, Printers_1.EMPTY);
    it(name, () => {
        (0, JestApprovals_1.verify)(output);
    });
}
function verifyAllCombinations9Async(name, title, func, params1, params2, params3, params4, params5, params6, params7, params8, params9) {
    let output = title + '\n';
    (0, RunCombinations_1.runCombinations9)((t1, t2, t3, t4, t5, t6, t7, t8, t9) => {
        it(`${name} ${fmt(t1)} ${fmt(t2)} ${fmt(t3)} ${fmt(t4)} ${fmt(t5)} ${fmt(t6)} ${fmt(t7)} ${fmt(t8)} ${fmt(t9)}`, async () => {
            output += (await func(t1, t2, t3, t4, t5, t6, t7, t8, t9)) + '\n';
        });
    }, params1, params2, params3, params4, params5, params6, params7, params8, params9);
    it(name, () => {
        (0, JestApprovals_1.verify)(output);
    });
}
//# sourceMappingURL=CombinationApprovalsAsync.js.map