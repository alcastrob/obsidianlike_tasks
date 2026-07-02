"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupDisplayHeading = void 0;
/**
 * Store the data needed to render one heading for a group of tasks.
 */
class GroupDisplayHeading {
    /**
     * Construct a {@link GroupDisplayHeading} object
     * @param {number} nestingLevel - See {@link nestingLevel} for details
     * @param {string} displayName - The text to be displayed for the group
     * @param {string} property - The name, usually field name, in the 'group by' instruction,
     *                            for example 'due' or 'priority'. This may be useful in styling the group headings.
     */
    constructor(nestingLevel, displayName, property) {
        this.nestingLevel = nestingLevel;
        this.displayName = displayName;
        this.property = property;
    }
}
exports.GroupDisplayHeading = GroupDisplayHeading;
//# sourceMappingURL=GroupDisplayHeading.js.map