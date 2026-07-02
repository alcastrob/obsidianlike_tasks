"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskFromLine = void 0;
const TasksFile_1 = require("../Scripting/TasksFile");
const Status_1 = require("../Statuses/Status");
const OnCompletion_1 = require("../Task/OnCompletion");
const Task_1 = require("../Task/Task");
const DateFallback_1 = require("../DateTime/DateFallback");
const StatusRegistry_1 = require("../Statuses/StatusRegistry");
const TaskLocation_1 = require("../Task/TaskLocation");
const Settings_1 = require("../Config/Settings");
const GlobalFilter_1 = require("../Config/GlobalFilter");
const Priority_1 = require("../Task/Priority");
const TaskRegularExpressions_1 = require("../Task/TaskRegularExpressions");
function getDefaultCreatedDate() {
    const { setCreatedDate } = (0, Settings_1.getSettings)();
    return setCreatedDate ? window.moment() : null;
}
function shouldUpdateCreatedDateForTask(task) {
    const { setCreatedDate } = (0, Settings_1.getSettings)();
    if (!setCreatedDate) {
        // Auto-adding of Created Date is disabled in settings.
        return false;
    }
    if (task.createdDate !== null) {
        // The task already had a created date, so don't change it.
        return false;
    }
    // If the description was empty, treat it as new and add a creation date.
    const descriptionIsEmpty = task.description === '';
    // If the global filter will be added when the task is saved, treat it as new and add a creation date.
    // See issue #2112.
    const globalFilterEnabled = !GlobalFilter_1.GlobalFilter.getInstance().isEmpty();
    const taskDoesNotContainGlobalFilter = !GlobalFilter_1.GlobalFilter.getInstance().includedIn(task.description);
    const needsGlobalFilterToBeAdded = globalFilterEnabled && taskDoesNotContainGlobalFilter;
    return descriptionIsEmpty || needsGlobalFilterToBeAdded;
}
/**
 * Read any markdown line and treat it as a task, for the purposes of
 * the 'Create or edit task' modal.
 *
 * Unlike {@link Task.fromLine}, which only processes tasks
 * already recognised by the Tasks plugin, this function processes any line.
 *
 * This is an implementation detail of that command, which has been separated
 * out to a different source file in order to allow its logic to be tested.
 *
 * @param line - The line the user had clicked on when running 'Create or edit task' command
 * @param path - The path of the file containing the line
 */
const taskFromLine = ({ line, path }) => {
    // We get all signifiers from the line, even if the Global Filter is missing.
    // This helps users who, for some reason, have data in a task line without the Global Filter.
    const task = Task_1.Task.parseTaskSignifiers(line, TaskLocation_1.TaskLocation.fromUnknownPosition(new TasksFile_1.TasksFile(path)), // We don't need precise location to toggle it here in the editor.
    DateFallback_1.DateFallback.fromPath(path));
    const createdDate = getDefaultCreatedDate();
    if (task !== null) {
        if (shouldUpdateCreatedDateForTask(task)) {
            return new Task_1.Task({ ...task, createdDate });
        }
        return task;
    }
    // If we are not on a line of a task, we take what we have.
    const nonTaskMatch = line.match(TaskRegularExpressions_1.TaskRegularExpressions.nonTaskRegex);
    if (nonTaskMatch === null) {
        // Should never happen; everything in the regex is optional.
        console.error('Tasks: Cannot create task on line:', line);
        return new Task_1.Task({
            // NEW_TASK_FIELD_EDIT_REQUIRED
            status: Status_1.Status.TODO,
            description: '',
            // We don't need the location fields except file to edit here in the editor.
            taskLocation: TaskLocation_1.TaskLocation.fromUnknownPosition(new TasksFile_1.TasksFile(path)),
            indentation: '',
            listMarker: '-',
            priority: Priority_1.Priority.None,
            createdDate,
            startDate: null,
            scheduledDate: null,
            dueDate: null,
            doneDate: null,
            cancelledDate: null,
            recurrence: null,
            onCompletion: OnCompletion_1.OnCompletion.Ignore,
            dependsOn: [],
            id: '',
            blockLink: '',
            tags: [],
            originalMarkdown: '',
            scheduledDateIsInferred: false,
        });
    }
    const indentation = nonTaskMatch[1];
    const listMarker = nonTaskMatch[2] ?? '-';
    const statusString = nonTaskMatch[4] ?? ' ';
    const status = StatusRegistry_1.StatusRegistry.getInstance().bySymbolOrCreate(statusString);
    let description = nonTaskMatch[5];
    const blockLinkMatch = line.match(TaskRegularExpressions_1.TaskRegularExpressions.blockLinkRegex);
    const blockLink = blockLinkMatch !== null ? blockLinkMatch[0] : '';
    if (blockLink !== '') {
        description = description.replace(TaskRegularExpressions_1.TaskRegularExpressions.blockLinkRegex, '');
    }
    return new Task_1.Task({
        // NEW_TASK_FIELD_EDIT_REQUIRED
        status,
        description,
        // We don't need the location fields except file to edit here in the editor.
        taskLocation: TaskLocation_1.TaskLocation.fromUnknownPosition(new TasksFile_1.TasksFile(path)),
        indentation,
        listMarker,
        blockLink,
        priority: Priority_1.Priority.None,
        createdDate,
        startDate: null,
        scheduledDate: null,
        dueDate: null,
        doneDate: null,
        cancelledDate: null,
        recurrence: null,
        onCompletion: OnCompletion_1.OnCompletion.Ignore,
        tags: [],
        originalMarkdown: '',
        // Not needed since the inferred status is always re-computed after submitting.
        scheduledDateIsInferred: false,
        id: '',
        dependsOn: [],
    });
};
exports.taskFromLine = taskFromLine;
//# sourceMappingURL=CreateOrEditTaskParser.js.map