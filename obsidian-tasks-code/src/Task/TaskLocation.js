"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskLocation = void 0;
/**
 * TaskLocation is the place where all information about a task line's location
 * in a markdown file is stored, so that testable algorithms can then be added here.
 */
class TaskLocation {
    constructor(tasksFile, lineNumber, sectionStart, sectionIndex, precedingHeader) {
        this._tasksFile = tasksFile;
        this._lineNumber = lineNumber;
        this._sectionStart = sectionStart;
        this._sectionIndex = sectionIndex;
        this._precedingHeader = precedingHeader;
    }
    /**
     * Constructor, for use when the Task's exact location in a file is either unknown, or not needed.
     * @param tasksFile
     */
    static fromUnknownPosition(tasksFile) {
        return new TaskLocation(tasksFile, 0, 0, 0, null);
    }
    /**
     * Constructor, for when the file has been renamed, and all other data remains the same.
     * @param newTasksFile
     */
    fromRenamedFile(newTasksFile) {
        return new TaskLocation(newTasksFile, this.lineNumber, this.sectionStart, this.sectionIndex, this.precedingHeader);
    }
    get tasksFile() {
        return this._tasksFile;
    }
    get path() {
        return this._tasksFile.path;
    }
    get lineNumber() {
        return this._lineNumber;
    }
    /** Line number where the section starts that contains this task. */
    get sectionStart() {
        return this._sectionStart;
    }
    /** The index of the nth task in its section. */
    get sectionIndex() {
        return this._sectionIndex;
    }
    get precedingHeader() {
        return this._precedingHeader;
    }
    /**
     * Whether the path is known, that-is, non-empty.
     *
     * This doesn't check whether the path points to an existing file.
     *
     * It was written to allow detection of tasks in Canvas cards, but note
     * that some editing code in this plugin does not bother to set the location
     * of the task, if not needed.
     */
    get hasKnownPath() {
        return this.path !== '';
    }
    allFieldsExceptTasksFileForTesting() {
        const { _tasksFile, ...rest } = { ...this };
        return rest;
    }
    /**
     * Compare all the fields in another TaskLocation, to detect any differences from this one.
     *
     * If any field is different in any way, it will return false.
     *
     * @param other
     */
    identicalTo(other) {
        const args = ['lineNumber', 'sectionStart', 'sectionIndex', 'precedingHeader'];
        for (const el of args) {
            if (this[el] !== other[el])
                return false;
        }
        // We do this at the end because TasksFile objects are more expensive
        // to compare, due to their storing potentially complext Properties data.
        return this._tasksFile.identicalTo(other._tasksFile);
    }
}
exports.TaskLocation = TaskLocation;
//# sourceMappingURL=TaskLocation.js.map