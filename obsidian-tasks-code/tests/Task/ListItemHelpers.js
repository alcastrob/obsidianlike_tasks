"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChildListItem = createChildListItem;
const ListItem_1 = require("../../src/Task/ListItem");
const TaskLocation_1 = require("../../src/Task/TaskLocation");
function createChildListItem(originalMarkdown, parent) {
    // This exists purely to silence WebStorm about typescript:S1848
    // See https://sonarcloud.io/organizations/obsidian-tasks-group/rules?open=typescript%3AS1848&rule_key=typescript%3AS1848
    const taskLocation = TaskLocation_1.TaskLocation.fromUnknownPosition(parent.taskLocation.tasksFile);
    ListItem_1.ListItem.fromListItemLine(originalMarkdown, parent, taskLocation);
}
//# sourceMappingURL=ListItemHelpers.js.map