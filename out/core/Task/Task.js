"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const moment_1 = __importDefault(require("moment"));
const Settings_1 = require("../Config/Settings");
const StatusRegistry_1 = require("../Statuses/StatusRegistry");
const DateTools_1 = require("../DateTime/DateTools");
const StatusConfiguration_1 = require("../Statuses/StatusConfiguration");
const Priority_1 = require("./Priority");
const TaskRegularExpressions_1 = require("./TaskRegularExpressions");
const OnCompletion_1 = require("./OnCompletion");
const DefaultTaskSerializer_1 = require("../TaskSerializer/DefaultTaskSerializer");
// `DefaultTaskSerializer` imports `Task` as a value (for `Task.extractHashtags`), so this is a
// deliberate circular import between the two modules. It is safe because both sides only touch
// the other module's exports from inside function bodies, never at module-evaluation time.
const taskSerializer = new DefaultTaskSerializer_1.DefaultTaskSerializer(DefaultTaskSerializer_1.DEFAULT_SYMBOLS);
/**
 * Task encapsulates the properties of a markdown checkbox line, following the same
 * field set and emoji-signifier format as Obsidian Tasks' `src/Task/Task.ts`.
 *
 * This is a trimmed port: it drops the `ListItem` parent/child hierarchy and the
 * Obsidian-file-cache-backed frontmatter/outlink features, since those have no
 * equivalent when working directly against files on disk instead of an Obsidian vault.
 * Parsing, serializing, and the toggle/recurrence state machine behave identically to
 * the original.
 */
class Task {
    /**
     * Note: The `args` parameter keeps a reference to the original object passed to the
     * constructor, so that private date fields survive `new Task({ ...task, id: newId })`
     * spreads (public getters aren't copied by object spread, but the private fields are).
     */
    constructor(args) {
        const { status, description, taskLocation, indentation, listMarker, priority, createdDate, startDate, scheduledDate, dueDate, doneDate, cancelledDate, recurrence, onCompletion, dependsOn, id, blockLink, tags, originalMarkdown, scheduledDateIsInferred, } = args;
        this.originalMarkdown = originalMarkdown;
        this.indentation = indentation;
        this.listMarker = listMarker;
        this.description = description;
        this.taskLocation = taskLocation;
        this.status = status;
        this.tags = tags;
        this.priority = priority;
        this._createdDate = this.resolveDate(createdDate, args._createdDate);
        this._startDate = this.resolveDate(startDate, args._startDate);
        this._scheduledDate = this.resolveDate(scheduledDate, args._scheduledDate);
        this._dueDate = this.resolveDate(dueDate, args._dueDate);
        this._doneDate = this.resolveDate(doneDate, args._doneDate);
        this._cancelledDate = this.resolveDate(cancelledDate, args._cancelledDate);
        this.recurrence = recurrence;
        this.onCompletion = onCompletion;
        this.dependsOn = dependsOn;
        this.id = id;
        this.blockLink = blockLink;
        this.scheduledDateIsInferred = scheduledDateIsInferred;
    }
    resolveDate(paramValue, recoveredValue) {
        const parameterSupplied = paramValue !== undefined;
        if (parameterSupplied) {
            return paramValue;
        }
        else {
            return recoveredValue ?? null;
        }
    }
    /**
     * Takes the given line from a markdown file and returns a Task object, or null if the
     * line is not a checkbox list item.
     */
    static fromLine({ line, taskLocation, }) {
        const taskComponents = Task.extractTaskComponents(line);
        if (taskComponents === null) {
            return null;
        }
        return Task.parseTaskSignifiers(line, taskLocation);
    }
    static parseTaskSignifiers(line, taskLocation) {
        const taskComponents = Task.extractTaskComponents(line);
        if (taskComponents === null) {
            return null;
        }
        const taskInfo = taskSerializer.deserialize(taskComponents.body);
        taskInfo.tags = taskInfo.tags.map((tag) => tag.trim());
        return new Task({
            ...taskComponents,
            ...taskInfo,
            taskLocation: taskLocation,
            originalMarkdown: line,
            scheduledDateIsInferred: false,
        });
    }
    /**
     * Extract the component parts of the task line.
     */
    static extractTaskComponents(line) {
        const regexMatch = line.match(TaskRegularExpressions_1.TaskRegularExpressions.taskRegex);
        if (regexMatch === null) {
            return null;
        }
        const indentation = regexMatch[1];
        const listMarker = regexMatch[2];
        const statusString = regexMatch[3];
        const status = StatusRegistry_1.StatusRegistry.getInstance().bySymbolOrCreate(statusString);
        let body = regexMatch[4].trim();
        const blockLinkMatch = body.match(TaskRegularExpressions_1.TaskRegularExpressions.blockLinkRegex);
        const blockLink = blockLinkMatch !== null ? blockLinkMatch[0] : '';
        if (blockLink !== '') {
            body = body.replace(TaskRegularExpressions_1.TaskRegularExpressions.blockLinkRegex, '').trim();
        }
        return { indentation, listMarker, status, body, blockLink };
    }
    /**
     * Flatten the task's fields (excluding checkbox/indentation) as a string.
     */
    toString() {
        return taskSerializer.serialize(this);
    }
    /**
     * Returns the Task as a list item with a checkbox.
     */
    toFileLineString() {
        return `${this.indentation}${this.listMarker} [${this.status.symbol}] ${this.toString()}`;
    }
    /**
     * Toggles this task and returns the resulting task(s).
     *
     * If the task is not recurring, it will return `[toggled]`.
     * If it is recurring, the toggled task and the next occurrence are both returned,
     * in the order `[next, toggled]`.
     */
    toggle() {
        const newStatus = StatusRegistry_1.StatusRegistry.getInstance().getNextStatusOrCreate(this.status);
        return this.handleNewStatus(newStatus);
    }
    /**
     * Edits the {@link status} of this task and returns the resulting task(s).
     *
     * @param today - Optional date representing the completion date. Defaults to today. Used
     *                for any new done date, and for the calculation of new dates on recurring
     *                tasks marked 'when done'.
     */
    handleNewStatus(newStatus, today = (0, moment_1.default)()) {
        if (newStatus.identicalTo(this.status)) {
            return [this];
        }
        const { setDoneDate } = (0, Settings_1.getSettings)();
        const newDoneDate = this.newDate(newStatus, StatusConfiguration_1.StatusType.DONE, this.doneDate, setDoneDate, today);
        const { setCancelledDate } = (0, Settings_1.getSettings)();
        const newCancelledDate = this.newDate(newStatus, StatusConfiguration_1.StatusType.CANCELLED, this.cancelledDate, setCancelledDate, today);
        const toggledTask = new Task({
            ...this,
            status: newStatus,
            doneDate: newDoneDate,
            cancelledDate: newCancelledDate,
        });
        const newStatusIsNotDone = !newStatus.isCompleted();
        const oldStatusWasDone = this.status.isCompleted();
        const noRecurrenceRule = this.recurrence === null;
        const noNewRecurrence = newStatusIsNotDone || oldStatusWasDone || noRecurrenceRule;
        if (noNewRecurrence) {
            return [toggledTask];
        }
        const nextOccurrence = this.recurrence.next(today);
        if (nextOccurrence === null) {
            return [toggledTask];
        }
        const nextTask = this.createNextOccurrence(newStatus, nextOccurrence);
        // Write next occurrence before previous occurrence.
        return [nextTask, toggledTask];
    }
    /**
     * Returns the new value to use for a date that tracks progress on tasks upon transition to
     * a different {@link StatusType} (currently used for Done Date and Cancelled Date).
     */
    newDate(newStatus, statusType, oldDate, dateEnabledInSettings, today) {
        let newDate = null;
        if (newStatus.type === statusType) {
            if (this.status.type !== statusType) {
                if (dateEnabledInSettings) {
                    newDate = today;
                }
            }
            else {
                newDate = oldDate;
            }
        }
        return newDate;
    }
    createNextOccurrence(newStatus, nextOccurrence) {
        const { setCreatedDate } = (0, Settings_1.getSettings)();
        let createdDate = null;
        if (setCreatedDate) {
            createdDate = (0, moment_1.default)();
        }
        const cancelledDate = null;
        const doneDate = null;
        const statusRegistry = StatusRegistry_1.StatusRegistry.getInstance();
        const nextStatus = statusRegistry.getNextRecurrenceStatusOrCreate(newStatus);
        return new Task({
            ...this,
            ...nextOccurrence,
            status: nextStatus,
            // New occurrences cannot have the same block link, and random block links don't help.
            blockLink: '',
            // New occurrences also cannot have the same dependency fields.
            id: '',
            dependsOn: [],
            createdDate,
            cancelledDate,
            doneDate,
        });
    }
    /**
     * Toggles this task and returns the resulting task(s), honouring the user setting that
     * controls the order the tasks should be saved in ({@link recurrenceOnNextLine}).
     */
    toggleWithRecurrenceInUsersOrder() {
        const newTasks = this.toggle();
        return this.putRecurrenceInUsersOrder(newTasks);
    }
    handleNewStatusWithRecurrenceInUsersOrder(newStatus, today = (0, moment_1.default)()) {
        const newTasks = this.handleNewStatus(newStatus, today);
        return this.putRecurrenceInUsersOrder(newTasks);
    }
    putRecurrenceInUsersOrder(newTasks) {
        const potentiallyPrunedTasks = (0, OnCompletion_1.handleOnCompletion)(this, newTasks);
        const { recurrenceOnNextLine } = (0, Settings_1.getSettings)();
        return recurrenceOnNextLine ? potentiallyPrunedTasks.reverse() : potentiallyPrunedTasks;
    }
    /**
     * Return whether the task is considered done.
     */
    get isDone() {
        return (this.status.type === StatusConfiguration_1.StatusType.DONE ||
            this.status.type === StatusConfiguration_1.StatusType.CANCELLED ||
            this.status.type === StatusConfiguration_1.StatusType.NON_TASK);
    }
    /**
     * A task is treated as blocked if it depends on any existing task ids on tasks that are
     * TODO or IN_PROGRESS. Only direct dependencies are considered.
     */
    isBlocked(allTasks) {
        if (this.dependsOn.length === 0) {
            return false;
        }
        if (this.isDone) {
            return false;
        }
        for (const depId of this.dependsOn) {
            const depTask = allTasks.find((task) => task.id === depId && !task.isDone);
            if (!depTask) {
                continue;
            }
            return true;
        }
        return false;
    }
    /**
     * A Task is blocking if there is any other not-done task with a `dependsOn` value with its id.
     */
    isBlocking(allTasks) {
        if (this.id === '') {
            return false;
        }
        if (this.isDone) {
            return false;
        }
        return allTasks.some((task) => {
            if (task.isDone) {
                return false;
            }
            return task.dependsOn.includes(this.id);
        });
    }
    /**
     * Return the number of the Task's priority. Highest = 0 ... Lowest = 5.
     */
    get priorityNumber() {
        return Number.parseInt(this.priority);
    }
    /**
     * Returns the text to be used to represent the {@link priority} in group headings.
     */
    get priorityNameGroupText() {
        const priorityName = (0, Priority_1.priorityNameUsingNormal)(this.priority);
        return `%%${this.priority}%%${priorityName} priority`;
    }
    /**
     * Return a copy of the description, with any tags removed.
     */
    get descriptionWithoutTags() {
        return this.description.replace(TaskRegularExpressions_1.TaskRegularExpressions.hashTags, '').trim();
    }
    /**
     * Return the name of the Task's priority. Note that the default priority is 'Normal', not 'None'.
     */
    get priorityName() {
        return (0, Priority_1.priorityNameUsingNormal)(this.priority);
    }
    get cancelledDate() {
        return this._cancelledDate?.clone() ?? null;
    }
    get createdDate() {
        return this._createdDate?.clone() ?? null;
    }
    get doneDate() {
        return this._doneDate?.clone() ?? null;
    }
    get dueDate() {
        return this._dueDate?.clone() ?? null;
    }
    get scheduledDate() {
        return this._scheduledDate?.clone() ?? null;
    }
    get startDate() {
        return this._startDate?.clone() ?? null;
    }
    /**
     * Return the date fields that contribute to 'happens' searches.
     */
    get happensDates() {
        return Array.of(this.startDate, this.scheduledDate, this.dueDate);
    }
    /**
     * Return the earliest of the dates used by 'happens' in this task, or null if none are set.
     */
    get happens() {
        const sortedHappensDates = Array.from(this.happensDates).sort(DateTools_1.compareByDate);
        for (const date of sortedHappensDates) {
            if (date?.isValid()) {
                return date;
            }
        }
        return null;
    }
    /**
     * Return true if the Task has a valid recurrence rule, and false otherwise.
     */
    get isRecurring() {
        return this.recurrence !== null;
    }
    /**
     * Return the text of the Task's recurrence rule, if it is supplied and is valid, and an
     * empty string otherwise.
     */
    get recurrenceRule() {
        return this.recurrence ? this.recurrence.toText() : '';
    }
    get path() {
        return this.taskLocation.path;
    }
    get lineNumber() {
        return this.taskLocation.lineNumber;
    }
    get heading() {
        return this.taskLocation.precedingHeader;
    }
    get hasHeading() {
        return this.taskLocation.precedingHeader !== null;
    }
    /**
     * Compare all the fields in another Task, to detect any differences from this one.
     *
     * If any field is different in any way, it will return false. This is used to avoid
     * needless re-rendering of tasks blocks when a file changes but no tasks in it did.
     */
    identicalTo(other) {
        const args = [
            'description',
            'indentation',
            'listMarker',
            'priority',
            'blockLink',
            'scheduledDateIsInferred',
            'id',
            'dependsOn',
            'onCompletion',
        ];
        for (const el of args) {
            if (this[el]?.toString() !== other[el]?.toString())
                return false;
        }
        if (!this.status.identicalTo(other.status)) {
            return false;
        }
        if (!this.taskLocation.identicalTo(other.taskLocation)) {
            return false;
        }
        if (this.tags.length !== other.tags.length) {
            return false;
        }
        if (!this.tags.every(function (element, index) {
            return element === other.tags[index];
        })) {
            return false;
        }
        for (const el of Task.allDateFields()) {
            const date1 = this[el];
            const date2 = other[el];
            if ((0, DateTools_1.compareByDate)(date1, date2) !== 0) {
                return false;
            }
        }
        return this.recurrenceIdenticalTo(other);
    }
    recurrenceIdenticalTo(other) {
        const recurrence1 = this.recurrence;
        const recurrence2 = other.recurrence;
        if (recurrence1 === null && recurrence2 !== null) {
            return false;
        }
        if (recurrence1 !== null && recurrence2 === null) {
            return false;
        }
        if (recurrence1 && recurrence2 && !recurrence1.identicalTo(recurrence2)) {
            return false;
        }
        return true;
    }
    static allDateFields() {
        return ['createdDate', 'startDate', 'scheduledDate', 'dueDate', 'doneDate', 'cancelledDate'];
    }
    /**
     * Returns an array of hashtags found in string.
     */
    static extractHashtags(description) {
        return description.match(TaskRegularExpressions_1.TaskRegularExpressions.hashTags)?.map((tag) => tag.trim()) ?? [];
    }
}
exports.Task = Task;
//# sourceMappingURL=Task.js.map