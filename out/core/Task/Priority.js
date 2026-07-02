"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Priority = void 0;
exports.priorityNameUsingNormal = priorityNameUsingNormal;
/**
 * When sorting, make sure low always comes after none. This way any tasks with low will be below any exiting
 * tasks that have no priority which would be the default.
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
const priorityNameMap = {
    [Priority.Highest]: 'Highest',
    [Priority.High]: 'High',
    [Priority.Medium]: 'Medium',
    [Priority.None]: 'Normal',
    [Priority.Low]: 'Low',
    [Priority.Lowest]: 'Lowest',
};
function priorityNameUsingNormal(priority) {
    return priorityNameMap[priority] ?? 'Normal';
}
//# sourceMappingURL=Priority.js.map