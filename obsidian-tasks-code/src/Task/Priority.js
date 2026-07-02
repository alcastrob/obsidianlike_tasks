"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Priority = void 0;
/**
 * When sorting, make sure low always comes after none. This way any tasks with low will be below any exiting
 * tasks that have no priority which would be the default.
 *
 * Values can be converted to strings with:
 * - {@link priorityNameUsingNone} in {@link PriorityTools}
 * - {@link priorityNameUsingNormal} in {@link PriorityTools}
 *
 * @enum {number}
 */
var Priority;
(function (Priority) {
    Priority["Highest"] = "0";
    Priority["High"] = "1";
    Priority["Medium"] = "2";
    Priority["None"] = "3";
    Priority["Low"] = "4";
    Priority["Lowest"] = "5";
})(Priority || (exports.Priority = Priority = {}));
//# sourceMappingURL=Priority.js.map