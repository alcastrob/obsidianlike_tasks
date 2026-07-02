"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListItem = void 0;
const TaskRegularExpressions_1 = require("./TaskRegularExpressions");
const Link_1 = require("./Link");
class ListItem {
    constructor({ originalMarkdown, indentation, listMarker, statusCharacter, description, parent, taskLocation, }) {
        this.children = [];
        this.indentation = indentation;
        this.listMarker = listMarker;
        this.statusCharacter = statusCharacter;
        this.description = description;
        this.originalMarkdown = originalMarkdown;
        this.parent = parent;
        if (parent !== null) {
            parent.children.push(this);
        }
        this.taskLocation = taskLocation;
    }
    /**
     * Takes the given line from an Obsidian note and returns a ListItem object.
     *
     * @static
     * @param {string} originalMarkdown - The full line in the note to parse.
     * @param {ListItem | null} parent - The optional parent Task or ListItem of the new instance.
     * @param {TaskLocation} taskLocation - The location of the ListItem.
     * @return {ListItem | null}
     * @see Task.fromLine
     */
    static fromListItemLine(originalMarkdown, parent, taskLocation) {
        const nonTaskMatch = RegExp(TaskRegularExpressions_1.TaskRegularExpressions.nonTaskRegex).exec(originalMarkdown);
        if (!nonTaskMatch) {
            // In practice we never reach here, because the regexp matches any text even '', but the compiler doesn't know that.
            return null;
        }
        const listMarker = nonTaskMatch[2];
        if (listMarker === undefined) {
            return null;
        }
        return new ListItem({
            originalMarkdown,
            indentation: nonTaskMatch[1],
            listMarker,
            statusCharacter: nonTaskMatch[4] ?? null,
            description: nonTaskMatch[5].trim(),
            taskLocation,
            parent,
        });
    }
    /**
     * Return the top-level parent of this list item or task,
     * which will not be indented.
     *
     * The root of an unintended item is itself.
     *
     * This is useful because the Tasks plugin currently only stores a flat list of {@link Task} objects,
     * and does not provide direct access to all the parsed {@link ListItem} objects.
     *
     * @see isRoot
     */
    get root() {
        if (this.parent === null) {
            return this;
        }
        return this.parent.root;
    }
    /**
     * Returns whether this is a top-level (unindented) list item or task.
     *
     * @see root
     */
    get isRoot() {
        return this.parent === null;
    }
    /**
     * Find to find the closest parent that is a {@link Task}
     */
    findClosestParentTask() {
        let closestParentTask = this.parent;
        while (closestParentTask !== null) {
            // Lazy load the Task class to avoid circular dependencies
            const { Task } = require('./Task');
            if (closestParentTask instanceof Task) {
                return closestParentTask;
            }
            closestParentTask = closestParentTask.parent;
        }
        return null;
    }
    get isTask() {
        return false;
    }
    /**
     * Compare all the fields in another ListItem, to detect any differences from this one.
     *
     * If any field is different in any way, it will return false.
     *
     * @note Use {@link Task.identicalTo} to compare {@link Task} objects.
     *
     * @param other - if this is in fact a {@link Task}, the result of false.
     */
    identicalTo(other) {
        if (this.constructor.name !== other.constructor.name) {
            return false;
        }
        // Note: taskLocation changes every time a line is added or deleted before
        //       any of the tasks in a file. This does mean that redrawing of tasks blocks
        //       happens more often than is ideal.
        const args = ['description', 'statusCharacter', 'indentation', 'listMarker'];
        for (const el of args) {
            if (this[el]?.toString() !== other[el]?.toString())
                return false;
        }
        if (!this.taskLocation.identicalTo(other.taskLocation))
            return false;
        return ListItem.listsAreIdentical(this.children, other.children);
    }
    /**
     * Compare two lists of ListItem objects, and report whether their
     * contents, including any children, are identical and in the same order.
     *
     * This can be useful for optimising code if it is guaranteed that
     * there are no possible differences in the tasks in a file
     * after an edit, for example.
     *
     * If any field is different in any task or list item, it will return false.
     *
     * @param list1
     * @param list2
     */
    static listsAreIdentical(list1, list2) {
        if (list1.length !== list2.length) {
            return false;
        }
        return list1.every((item, index) => item.identicalTo(list2[index]));
    }
    get path() {
        return this.taskLocation.path;
    }
    get file() {
        return this.taskLocation.tasksFile;
    }
    /**
     * Return a list of links in the body of the file containing
     * the task or list item.
     *
     * The data contest is documented here:
     * https://docs.obsidian.md/Reference/TypeScript+API/LinkCache
     */
    get rawLinksInFileBody() {
        return this.file.cachedMetadata?.links ?? [];
    }
    /**
     * Return a list of links in the task or list item's line.
     */
    get outlinks() {
        return this.rawLinksInFileBody
            .filter((link) => link.position.start.line === this.lineNumber)
            .map((link) => new Link_1.Link(link, this.file.path));
    }
    /**
     * Return the name of the file containing this object, with the .md extension removed.
     */
    get filename() {
        const fileNameMatch = this.path.match(/([^/]+)\.md$/);
        if (fileNameMatch !== null) {
            return fileNameMatch[1];
        }
        else {
            return null;
        }
    }
    get lineNumber() {
        return this.taskLocation.lineNumber;
    }
    get sectionStart() {
        return this.taskLocation.sectionStart;
    }
    get sectionIndex() {
        return this.taskLocation.sectionIndex;
    }
    get precedingHeader() {
        return this.taskLocation.precedingHeader;
    }
    checkOrUncheck() {
        if (this.statusCharacter === null) {
            return this;
        }
        const newStatusCharacter = this.statusCharacter === ' ' ? 'x' : ' ';
        const newMarkdown = this.originalMarkdown.replace(RegExp(TaskRegularExpressions_1.TaskRegularExpressions.checkboxRegex), `[${newStatusCharacter}]`);
        return new ListItem({
            ...this,
            originalMarkdown: newMarkdown,
            statusCharacter: newStatusCharacter,
            // The purpose of this method is just to update the status character on one single line in the file.
            // This will trigger an update, making Cache re-read the whole file,
            // which will then identify and re-create any parent-child relationships.
            parent: null,
        });
    }
    toFileLineString() {
        const statusCharacterToString = this.statusCharacter ? `[${this.statusCharacter}] ` : '';
        return `${this.indentation}${this.listMarker} ${statusCharacterToString}${this.description}`;
    }
}
exports.ListItem = ListItem;
//# sourceMappingURL=ListItem.js.map