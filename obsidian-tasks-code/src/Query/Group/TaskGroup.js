"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskGroup = void 0;
/**
 * Store a single group of tasks, that all share the same group names.
 * {@link TaskGroup} objects are stored in a {@link TaskGroups} object.
 *
 * For example, if the user supplied these 'group by' lines:
 *   group by folder
 *   group by filename
 *   group by heading
 * Then the names of one {@link TaskGroup} might be this:
 *   Some/Folder/In/The/Vault
 *   A Particular File Name
 *   My lovely heading
 * And the {@link TaskGroup} would store all the tasks from that location
 * that match the task block's filters, in the task block's sort order
 */
class TaskGroup {
    /**
     * Constructor
     * @param {string[]} groups - See {@link groups} for details
     * @param tasks {Task[]} - See {@link tasks} for details
     */
    constructor(groups, tasks) {
        this.groups = groups;
        this.groupHeadings = [];
        this.tasks = tasks;
    }
    setGroupHeadings(headingsForTaskGroup) {
        for (const groupDisplayHeading of headingsForTaskGroup) {
            this.groupHeadings.push(groupDisplayHeading);
        }
    }
    /**
     * Limits {@link tasks} array to a certain number. Tasks exceeding
     * the limit will be removed from the end, shall be called on sorted tasks.
     *
     * @param limit number of tasks for the group to have. If greater
     * than the task count, no action will be taken.
     *
     */
    applyTaskLimit(limit) {
        this.tasks = this.tasks.slice(0, limit);
    }
    /**
     * A markdown-format representation of all the tasks in this group.
     *
     * Useful for testing.
     */
    tasksAsStringOfLines() {
        let output = '';
        for (const task of this.tasks) {
            output += task.toFileLineString() + '\n';
        }
        return output;
    }
    /**
     * A human-readable representation of this task group, including names
     * and headings that should be displayed.
     *
     * Note that this is used in the 'Copy results' facility and snapshot testing, so if the format is
     * changed, the documentation and snapshots will need to be updated.
     */
    toString() {
        let output = '\n';
        for (const heading of this.groupHeadings) {
            // These headings mimic the behaviour of QueryRenderer,
            // which uses 'h4', 'h5' and 'h6' for nested groups.
            const headingPrefix = '#'.repeat(Math.min(4 + heading.nestingLevel, 6));
            output += `${headingPrefix} ${heading.displayName}\n\n`;
        }
        output += this.tasksAsStringOfLines();
        return output;
    }
}
exports.TaskGroup = TaskGroup;
//# sourceMappingURL=TaskGroup.js.map