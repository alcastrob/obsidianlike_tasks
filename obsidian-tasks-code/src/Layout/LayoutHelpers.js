"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHiddenClassForTaskList = generateHiddenClassForTaskList;
function generateHiddenClassForTaskList(hiddenClasses, hide, component) {
    if (hide) {
        hiddenClasses.push(hiddenComponentClassName(component));
    }
}
function hiddenComponentClassName(component) {
    return `tasks-layout-hide-${component}`;
}
//# sourceMappingURL=LayoutHelpers.js.map