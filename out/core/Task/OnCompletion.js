"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnCompletion = void 0;
exports.parseOnCompletionValue = parseOnCompletionValue;
exports.handleOnCompletion = handleOnCompletion;
const StatusConfiguration_1 = require("../Statuses/StatusConfiguration");
var OnCompletion;
(function (OnCompletion) {
    OnCompletion["Ignore"] = "";
    OnCompletion["Keep"] = "keep";
    OnCompletion["Delete"] = "delete";
})(OnCompletion || (exports.OnCompletion = OnCompletion = {}));
function parseOnCompletionValue(inputOnCompletionValue) {
    const onCompletionString = inputOnCompletionValue.trim().toLowerCase();
    if (onCompletionString === 'delete') {
        return OnCompletion.Delete;
    }
    else if (onCompletionString === 'keep') {
        return OnCompletion.Keep;
    }
    else {
        return OnCompletion.Ignore;
    }
}
function returnWithoutCompletedInstance(tasks, changedStatusTask) {
    return tasks.filter((task) => task !== changedStatusTask);
}
function keepTasks(originalTask, changedStatusTask) {
    const startStatus = originalTask.status;
    const endStatus = changedStatusTask.status;
    const statusDidNotChange = endStatus.type === startStatus.type;
    const endStatusIsNotDone = endStatus.type !== StatusConfiguration_1.StatusType.DONE;
    return endStatusIsNotDone || statusDidNotChange;
}
function handleOnCompletion(originalTask, newTasks) {
    const tasksArrayLength = newTasks.length;
    if (originalTask.onCompletion === OnCompletion.Ignore ||
        originalTask.onCompletion === OnCompletion.Keep ||
        tasksArrayLength === 0) {
        return newTasks;
    }
    const changedStatusTask = newTasks[tasksArrayLength - 1];
    const keepAllTasks = keepTasks(originalTask, changedStatusTask);
    if (keepAllTasks) {
        return newTasks;
    }
    const ocAction = originalTask.onCompletion;
    if (ocAction === OnCompletion.Delete) {
        return returnWithoutCompletedInstance(newTasks, changedStatusTask);
    }
    console.warn(`OnCompletion action ${ocAction} not yet implemented.`);
    return newTasks;
}
//# sourceMappingURL=OnCompletion.js.map