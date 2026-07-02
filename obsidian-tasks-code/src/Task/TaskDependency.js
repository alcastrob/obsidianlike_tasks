"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueId = generateUniqueId;
exports.ensureTaskHasId = ensureTaskHasId;
exports.setDependenciesOnTasksWithIds = setDependenciesOnTasksWithIds;
exports.addDependencyToParent = addDependencyToParent;
exports.addDependency = addDependency;
exports.removeDependency = removeDependency;
const Task_1 = require("./Task");
function generateUniqueId(existingIds) {
    let id = '';
    let keepGenerating = true;
    while (keepGenerating) {
        // from https://www.codemzy.com/blog/random-unique-id-javascript
        id = Math.random()
            .toString(36)
            .substring(2, 6 + 2);
        if (!existingIds.includes(id)) {
            keepGenerating = false;
        }
    }
    return id;
}
function ensureTaskHasId(child, existingIds) {
    if (child.id !== '')
        return child;
    return new Task_1.Task({ ...child, id: generateUniqueId(existingIds) });
}
function setDependenciesOnTasksWithIds(parent, childrenWithIds) {
    const newDependsOn = childrenWithIds.map((task) => {
        return task.id;
    });
    let newParent = parent;
    if (parent.dependsOn.toString() !== newDependsOn.toString()) {
        newParent = new Task_1.Task({ ...parent, dependsOn: newDependsOn });
    }
    return newParent;
}
function addDependencyToParent(parent, child) {
    let newParent = parent;
    if (!parent.dependsOn.includes(child.id)) {
        const newDependsOn = [...parent.dependsOn, child.id];
        newParent = new Task_1.Task({ ...parent, dependsOn: newDependsOn });
    }
    return newParent;
}
function addDependency(parent, child, existingIds) {
    const newChild = ensureTaskHasId(child, existingIds);
    return [addDependencyToParent(parent, newChild), newChild];
}
function removeDependency(parent, child) {
    let newParent = parent;
    if (parent.dependsOn.includes(child.id)) {
        const newDependsOn = parent.dependsOn.filter((dependsOn) => dependsOn !== child.id);
        newParent = new Task_1.Task({ ...parent, dependsOn: newDependsOn });
    }
    return newParent;
}
//# sourceMappingURL=TaskDependency.js.map