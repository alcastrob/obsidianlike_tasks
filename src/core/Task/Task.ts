import moment from 'moment';
import type { Moment } from 'moment';
import { getSettings } from '../Config/Settings';
import { StatusRegistry } from '../Statuses/StatusRegistry';
import type { Status } from '../Statuses/Status';
import { compareByDate } from '../DateTime/DateTools';
import { StatusType } from '../Statuses/StatusConfiguration';
import { priorityNameUsingNormal } from './Priority';
import type { Occurrence } from './Occurrence';
import type { Recurrence } from './Recurrence';
import { TaskLocation } from './TaskLocation';
import type { Priority } from './Priority';
import { TaskRegularExpressions } from './TaskRegularExpressions';
import { OnCompletion, handleOnCompletion } from './OnCompletion';
import { DefaultTaskSerializer, DEFAULT_SYMBOLS } from '../TaskSerializer/DefaultTaskSerializer';

// `DefaultTaskSerializer` imports `Task` as a value (for `Task.extractHashtags`), so this is a
// deliberate circular import between the two modules. It is safe because both sides only touch
// the other module's exports from inside function bodies, never at module-evaluation time.
const taskSerializer = new DefaultTaskSerializer(DEFAULT_SYMBOLS);

/**
 * Storage for the task line, broken down in to sections.
 * See {@link Task.extractTaskComponents} for use.
 */
interface TaskComponents {
    indentation: string;
    listMarker: string;
    status: Status;
    body: string;
    blockLink: string;
}

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
export class Task {
    public readonly originalMarkdown: string;
    public readonly indentation: string;
    public readonly listMarker: string;
    public readonly description: string;
    public readonly taskLocation: TaskLocation;

    public readonly status: Status;
    public readonly tags: string[];
    public readonly priority: Priority;

    private readonly _createdDate: Moment | null;
    private readonly _startDate: Moment | null;
    private readonly _scheduledDate: Moment | null;
    private readonly _dueDate: Moment | null;
    private readonly _doneDate: Moment | null;
    private readonly _cancelledDate: Moment | null;

    public readonly recurrence: Recurrence | null;
    public readonly onCompletion: OnCompletion;

    public readonly dependsOn: string[];
    public readonly id: string;

    /** The blockLink is a "^" annotation after the dates/recurrence rules. */
    public readonly blockLink: string;

    public readonly scheduledDateIsInferred: boolean;

    /**
     * Note: The `args` parameter keeps a reference to the original object passed to the
     * constructor, so that private date fields survive `new Task({ ...task, id: newId })`
     * spreads (public getters aren't copied by object spread, but the private fields are).
     */
    constructor(args: {
        status: Status;
        description: string;
        taskLocation: TaskLocation;
        indentation: string;
        listMarker: string;
        priority: Priority;
        createdDate?: Moment | null;
        startDate?: Moment | null;
        scheduledDate?: Moment | null;
        dueDate?: Moment | null;
        doneDate?: Moment | null;
        cancelledDate?: Moment | null;
        recurrence: Recurrence | null;
        onCompletion: OnCompletion;
        dependsOn: string[] | [];
        id: string;
        blockLink: string;
        tags: string[] | [];
        originalMarkdown: string;
        scheduledDateIsInferred: boolean;
        [key: string]: any; // Allows access to spread private fields like _dueDate
    }) {
        const {
            status,
            description,
            taskLocation,
            indentation,
            listMarker,
            priority,
            createdDate,
            startDate,
            scheduledDate,
            dueDate,
            doneDate,
            cancelledDate,
            recurrence,
            onCompletion,
            dependsOn,
            id,
            blockLink,
            tags,
            originalMarkdown,
            scheduledDateIsInferred,
        } = args;

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

    private resolveDate(paramValue: Moment | null | undefined, recoveredValue: any): any {
        const parameterSupplied = paramValue !== undefined;
        if (parameterSupplied) {
            return paramValue;
        } else {
            return recoveredValue ?? null;
        }
    }

    /**
     * Takes the given line from a markdown file and returns a Task object, or null if the
     * line is not a checkbox list item.
     */
    public static fromLine({
        line,
        taskLocation,
    }: {
        line: string;
        taskLocation: TaskLocation;
    }): Task | null {
        const taskComponents = Task.extractTaskComponents(line);
        if (taskComponents === null) {
            return null;
        }

        return Task.parseTaskSignifiers(line, taskLocation);
    }

    public static parseTaskSignifiers(line: string, taskLocation: TaskLocation): Task | null {
        const taskComponents = Task.extractTaskComponents(line);
        if (taskComponents === null) {
            return null;
        }

        const taskInfo = taskSerializer.deserialize(taskComponents.body);

        taskInfo.tags = taskInfo.tags.map((tag: string) => tag.trim());

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
    static extractTaskComponents(line: string): TaskComponents | null {
        const regexMatch = line.match(TaskRegularExpressions.taskRegex);
        if (regexMatch === null) {
            return null;
        }

        const indentation = regexMatch[1];
        const listMarker = regexMatch[2];

        const statusString = regexMatch[3];
        const status = StatusRegistry.getInstance().bySymbolOrCreate(statusString);

        let body = regexMatch[4].trim();

        const blockLinkMatch = body.match(TaskRegularExpressions.blockLinkRegex);
        const blockLink = blockLinkMatch !== null ? blockLinkMatch[0] : '';

        if (blockLink !== '') {
            body = body.replace(TaskRegularExpressions.blockLinkRegex, '').trim();
        }
        return { indentation, listMarker, status, body, blockLink };
    }

    /**
     * Flatten the task's fields (excluding checkbox/indentation) as a string.
     */
    public toString(): string {
        return taskSerializer.serialize(this);
    }

    /**
     * Returns the Task as a list item with a checkbox.
     */
    public toFileLineString(): string {
        return `${this.indentation}${this.listMarker} [${this.status.symbol}] ${this.toString()}`;
    }

    /**
     * Toggles this task and returns the resulting task(s).
     *
     * If the task is not recurring, it will return `[toggled]`.
     * If it is recurring, the toggled task and the next occurrence are both returned,
     * in the order `[next, toggled]`.
     */
    public toggle(): Task[] {
        const newStatus = StatusRegistry.getInstance().getNextStatusOrCreate(this.status);
        return this.handleNewStatus(newStatus);
    }

    /**
     * Edits the {@link status} of this task and returns the resulting task(s).
     *
     * @param today - Optional date representing the completion date. Defaults to today. Used
     *                for any new done date, and for the calculation of new dates on recurring
     *                tasks marked 'when done'.
     */
    public handleNewStatus(newStatus: Status, today: Moment = moment()): Task[] {
        if (newStatus.identicalTo(this.status)) {
            return [this];
        }

        const { setDoneDate } = getSettings();
        const newDoneDate = this.newDate(newStatus, StatusType.DONE, this.doneDate, setDoneDate, today);

        const { setCancelledDate } = getSettings();
        const newCancelledDate = this.newDate(
            newStatus,
            StatusType.CANCELLED,
            this.cancelledDate,
            setCancelledDate,
            today,
        );

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

        const nextOccurrence = this.recurrence!.next(today);
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
    private newDate(
        newStatus: Status,
        statusType: StatusType,
        oldDate: Moment | null,
        dateEnabledInSettings: boolean,
        today: Moment,
    ) {
        let newDate = null;
        if (newStatus.type === statusType) {
            if (this.status.type !== statusType) {
                if (dateEnabledInSettings) {
                    newDate = today;
                }
            } else {
                newDate = oldDate;
            }
        }
        return newDate;
    }

    private createNextOccurrence(newStatus: Status, nextOccurrence: Occurrence) {
        const { setCreatedDate } = getSettings();
        let createdDate: Moment | null = null;
        if (setCreatedDate) {
            createdDate = moment();
        }
        const cancelledDate = null;
        const doneDate = null;

        const statusRegistry = StatusRegistry.getInstance();
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
    public toggleWithRecurrenceInUsersOrder(): Task[] {
        const newTasks = this.toggle();
        return this.putRecurrenceInUsersOrder(newTasks);
    }

    public handleNewStatusWithRecurrenceInUsersOrder(newStatus: Status, today: Moment = moment()): Task[] {
        const newTasks = this.handleNewStatus(newStatus, today);
        return this.putRecurrenceInUsersOrder(newTasks);
    }

    private putRecurrenceInUsersOrder(newTasks: Task[]) {
        const potentiallyPrunedTasks = handleOnCompletion(this, newTasks);
        const { recurrenceOnNextLine } = getSettings();
        return recurrenceOnNextLine ? potentiallyPrunedTasks.reverse() : potentiallyPrunedTasks;
    }

    /**
     * Return whether the task is considered done.
     */
    public get isDone(): boolean {
        return (
            this.status.type === StatusType.DONE ||
            this.status.type === StatusType.CANCELLED ||
            this.status.type === StatusType.NON_TASK
        );
    }

    /**
     * A task is treated as blocked if it depends on any existing task ids on tasks that are
     * TODO or IN_PROGRESS. Only direct dependencies are considered.
     */
    public isBlocked(allTasks: Readonly<Task[]>) {
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
    public isBlocking(allTasks: Readonly<Task[]>) {
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
    public get priorityNumber(): number {
        return Number.parseInt(this.priority);
    }

    /**
     * Returns the text to be used to represent the {@link priority} in group headings.
     */
    public get priorityNameGroupText(): string {
        const priorityName = priorityNameUsingNormal(this.priority);
        return `%%${this.priority}%%${priorityName} priority`;
    }

    /**
     * Return a copy of the description, with any tags removed.
     */
    public get descriptionWithoutTags(): string {
        return this.description.replace(TaskRegularExpressions.hashTags, '').trim();
    }

    /**
     * Return the name of the Task's priority. Note that the default priority is 'Normal', not 'None'.
     */
    public get priorityName(): string {
        return priorityNameUsingNormal(this.priority);
    }

    public get cancelledDate(): Moment | null {
        return this._cancelledDate?.clone() ?? null;
    }

    public get createdDate(): Moment | null {
        return this._createdDate?.clone() ?? null;
    }

    public get doneDate(): Moment | null {
        return this._doneDate?.clone() ?? null;
    }

    public get dueDate(): Moment | null {
        return this._dueDate?.clone() ?? null;
    }

    public get scheduledDate(): Moment | null {
        return this._scheduledDate?.clone() ?? null;
    }

    public get startDate(): Moment | null {
        return this._startDate?.clone() ?? null;
    }

    /**
     * Return the date fields that contribute to 'happens' searches.
     */
    public get happensDates(): (Moment | null)[] {
        return Array.of(this.startDate, this.scheduledDate, this.dueDate);
    }

    /**
     * Return the earliest of the dates used by 'happens' in this task, or null if none are set.
     */
    public get happens(): Moment | null {
        const sortedHappensDates = Array.from(this.happensDates).sort(compareByDate);

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
    public get isRecurring(): boolean {
        return this.recurrence !== null;
    }

    /**
     * Return the text of the Task's recurrence rule, if it is supplied and is valid, and an
     * empty string otherwise.
     */
    public get recurrenceRule(): string {
        return this.recurrence ? this.recurrence.toText() : '';
    }

    public get path(): string {
        return this.taskLocation.path;
    }

    public get lineNumber(): number {
        return this.taskLocation.lineNumber;
    }

    public get heading(): string | null {
        return this.taskLocation.precedingHeader;
    }

    public get hasHeading(): boolean {
        return this.taskLocation.precedingHeader !== null;
    }

    /**
     * Compare all the fields in another Task, to detect any differences from this one.
     *
     * If any field is different in any way, it will return false. This is used to avoid
     * needless re-rendering of tasks blocks when a file changes but no tasks in it did.
     */
    public identicalTo(other: Task) {
        const args: Array<keyof Task> = [
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
            if (this[el]?.toString() !== other[el]?.toString()) return false;
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
        if (
            !this.tags.every(function (element, index) {
                return element === other.tags[index];
            })
        ) {
            return false;
        }

        for (const el of Task.allDateFields()) {
            const date1 = this[el] as Moment | null;
            const date2 = other[el] as Moment | null;
            if (compareByDate(date1, date2) !== 0) {
                return false;
            }
        }

        return this.recurrenceIdenticalTo(other);
    }

    private recurrenceIdenticalTo(other: Task) {
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

    public static allDateFields(): (keyof Task)[] {
        return ['createdDate', 'startDate', 'scheduledDate', 'dueDate', 'doneDate', 'cancelledDate'];
    }

    /**
     * Returns an array of hashtags found in string.
     */
    public static extractHashtags(description: string): string[] {
        return description.match(TaskRegularExpressions.hashTags)?.map((tag) => tag.trim()) ?? [];
    }
}
