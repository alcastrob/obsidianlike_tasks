"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskBuilder = void 0;
const Status_1 = require("../../src/Statuses/Status");
const OnCompletion_1 = require("../../src/Task/OnCompletion");
const Occurrence_1 = require("../../src/Task/Occurrence");
const Task_1 = require("../../src/Task/Task");
const Recurrence_1 = require("../../src/Task/Recurrence");
const DateParser_1 = require("../../src/DateTime/DateParser");
const StatusConfiguration_1 = require("../../src/Statuses/StatusConfiguration");
const TaskLocation_1 = require("../../src/Task/TaskLocation");
const Priority_1 = require("../../src/Task/Priority");
const MockDataLoader_1 = require("./MockDataLoader");
const TasksFileHelpers_1 = require("./TasksFileHelpers");
/**
 * A fluent class for creating tasks for tests.
 *
 * This uses the Builder Pattern.
 *
 * See TaskBuilder.build() for an example of use.
 *
 * IMPORTANT: Changed values are retained after calls to .build()
 *            There is no way to reset a TaskBuilder to its default
 *            start currently.
 *            Create a new TaskBuilder object to start from a clean state,
 */
class TaskBuilder {
    constructor() {
        // NEW_TASK_FIELD_EDIT_REQUIRED
        this._parent = null;
        this._status = Status_1.Status.TODO;
        this._description = 'my description';
        this._path = '';
        this._indentation = '';
        this._listMarker = '-';
        this._lineNumber = 0;
        this._sectionStart = 0;
        this._sectionIndex = 0;
        this._precedingHeader = null;
        this._tags = [];
        this._priority = Priority_1.Priority.None;
        this._createdDate = null;
        this._startDate = null;
        this._scheduledDate = null;
        this._dueDate = null;
        this._doneDate = null;
        this._cancelledDate = null;
        this._recurrence = null;
        this._onCompletion = OnCompletion_1.OnCompletion.Ignore;
        this._blockLink = '';
        this._scheduledDateIsInferred = false;
        this._id = '';
        this._dependsOn = [];
        this._mockData = undefined;
    }
    /**
     * Build a Task
     *
     * Example of use:
     *
     *  const builder = new TaskBuilder();
     *  const task = builder
     *      .description('hello world')
     *      .priority(Priority.High)
     *      .path('root/dir 1/dir 2/file name')
     *      .build();
     */
    build() {
        let description = this._description;
        if (this._tags.length > 0) {
            description += ' ' + this._tags.join(' ');
        }
        const cachedMetadata = this._mockData?.cachedMetadata ?? {};
        const task = new Task_1.Task({
            // NEW_TASK_FIELD_EDIT_REQUIRED
            parent: this._parent,
            status: this._status,
            description: description,
            taskLocation: new TaskLocation_1.TaskLocation((0, TasksFileHelpers_1.createTestTasksFile)(this._path, cachedMetadata), this._lineNumber, this._sectionStart, this._sectionIndex, this._precedingHeader),
            indentation: this._indentation,
            listMarker: this._listMarker,
            priority: this._priority,
            createdDate: this._createdDate,
            startDate: this._startDate,
            scheduledDate: this._scheduledDate,
            dueDate: this._dueDate,
            doneDate: this._doneDate,
            cancelledDate: this._cancelledDate,
            recurrence: this._recurrence,
            onCompletion: this._onCompletion,
            dependsOn: this._dependsOn,
            id: this._id,
            blockLink: this._blockLink,
            tags: this._tags,
            originalMarkdown: '',
            scheduledDateIsInferred: this._scheduledDateIsInferred,
        });
        const markdown = task.toFileLineString();
        return new Task_1.Task({
            ...task,
            originalMarkdown: markdown,
        });
    }
    /**
     * Create a Task that has all fields populated.
     */
    static createFullyPopulatedTask() {
        const taskBuilder = new TaskBuilder()
            // NEW_TASK_FIELD_EDIT_REQUIRED
            .indentation('  ')
            .description('Do exercises')
            .tags(['#todo', '#health'])
            .priority(Priority_1.Priority.Medium)
            .createdDate('2023-07-01')
            .startDate('2023-07-02')
            .scheduledDate('2023-07-03')
            .dueDate('2023-07-04')
            .doneDate('2023-07-05')
            .cancelledDate('2023-07-06')
            .onCompletion(OnCompletion_1.OnCompletion.Delete)
            .dependsOn(['123456', 'abc123'])
            .id('abcdef')
            .blockLink(' ^dcf64c')
            // Values in TaskLocation:
            .path('some/folder/fileName.md')
            .lineNumber(17)
            .sectionStart(5)
            .sectionIndex(3)
            .precedingHeader('My Header');
        taskBuilder.recurrence(Recurrence_1.Recurrence.fromText({
            recurrenceRuleText: 'every day when done',
            occurrence: new Occurrence_1.Occurrence({
                startDate: taskBuilder._startDate,
                scheduledDate: taskBuilder._scheduledDate,
                dueDate: taskBuilder._dueDate,
            }),
        }));
        const task = taskBuilder.build();
        // Force urgency value to be cached:
        // @ts-ignore
        const unused = task.urgency;
        return task;
    }
    /**
     * Set the status.
     *
     * @param status
     */
    status(status) {
        this._status = status;
        return this;
    }
    statusValues(symbol, name, nextStatusSymbol, availableAsCommand, type) {
        const statusConfiguration = new StatusConfiguration_1.StatusConfiguration(symbol, name, nextStatusSymbol, availableAsCommand, type);
        return this.status(new Status_1.Status(statusConfiguration));
    }
    /**
     * Set the description.
     *
     * This is not parsed for tags. Tags should be added via the separate {@link tags} method.
     * @param description - description for the task, without tags
     */
    description(description) {
        this._description = description;
        return this;
    }
    /** Set the task's path on disc, including file name extension
     *
     * @param path Path to file, including file name extension. Use empty string to indicate 'unknown
     */
    path(path) {
        this._path = path;
        return this;
    }
    /**
     * See {@link MockDataName} for the list of available mock data files
     *
     * @example
     *      const builder = new TaskBuilder().mockData('example_kanban');
     * @param testDataName
     */
    mockData(testDataName) {
        this._mockData = testDataName ? MockDataLoader_1.MockDataLoader.get(testDataName) : undefined;
        return this;
    }
    indentation(indentation) {
        this._indentation = indentation;
        return this;
    }
    listMarker(listMarker) {
        this._listMarker = listMarker;
        return this;
    }
    lineNumber(lineNumber) {
        this._lineNumber = lineNumber;
        return this;
    }
    sectionStart(sectionStart) {
        this._sectionStart = sectionStart;
        return this;
    }
    sectionIndex(sectionIndex) {
        this._sectionIndex = sectionIndex;
        return this;
    }
    precedingHeader(precedingHeader) {
        this._precedingHeader = precedingHeader;
        return this;
    }
    tags(tags) {
        this._tags = tags;
        return this;
    }
    priority(priority) {
        this._priority = priority;
        return this;
    }
    createdDate(createdDate) {
        this._createdDate = TaskBuilder.parseDate(createdDate);
        return this;
    }
    startDate(startDate) {
        this._startDate = TaskBuilder.parseDate(startDate);
        return this;
    }
    scheduledDate(scheduledDate) {
        this._scheduledDate = TaskBuilder.parseDate(scheduledDate);
        return this;
    }
    dueDate(dueDate) {
        this._dueDate = TaskBuilder.parseDate(dueDate);
        return this;
    }
    doneDate(doneDate) {
        this._doneDate = TaskBuilder.parseDate(doneDate);
        return this;
    }
    cancelledDate(cancelledDate) {
        this._cancelledDate = TaskBuilder.parseDate(cancelledDate);
        return this;
    }
    /**
     * See {@link RecurrenceBuilder} for easy construction of {@link Recurrence} objects in tests.
     * @param recurrence
     */
    recurrence(recurrence) {
        this._recurrence = recurrence;
        return this;
    }
    onCompletion(onCompletion) {
        this._onCompletion = onCompletion;
        return this;
    }
    blockLink(blockLink) {
        this._blockLink = blockLink;
        return this;
    }
    scheduledDateIsInferred(isInferred) {
        this._scheduledDateIsInferred = isInferred;
        return this;
    }
    dependsOn(dependsOn) {
        this._dependsOn = dependsOn;
        return this;
    }
    id(id) {
        this._id = id;
        return this;
    }
    static parseDate(date) {
        if (date) {
            return DateParser_1.DateParser.parseDate(date);
        }
        else {
            return null;
        }
    }
    parent(parent) {
        this._parent = parent;
        return this;
    }
}
exports.TaskBuilder = TaskBuilder;
//# sourceMappingURL=TaskBuilder.js.map