"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestTasksFile = createTestTasksFile;
const TasksFile_1 = require("../../src/Scripting/TasksFile");
function createTestTasksFile(path, cachedMetadata = {}) {
    return new TasksFile_1.TasksFile(path, cachedMetadata);
}
//# sourceMappingURL=TasksFileHelpers.js.map