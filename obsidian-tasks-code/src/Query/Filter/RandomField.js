"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomField = void 0;
const FilterInstructionsBasedField_1 = require("./FilterInstructionsBasedField");
/**
 * Sort tasks in a stable, random order.
 *
 * The sort order changes each day.
 */
class RandomField extends FilterInstructionsBasedField_1.FilterInstructionsBasedField {
    fieldName() {
        return 'random';
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Sorting
    // -----------------------------------------------------------------------------------------------------------------
    supportsSorting() {
        return true;
    }
    comparator() {
        return (a, b) => {
            return this.sortKey(a) - this.sortKey(b);
        };
    }
    sortKey(task) {
        // Credit:
        //   - @qelo https://github.com/obsidian-tasks-group/obsidian-tasks/discussions/330#discussioncomment-8902878
        //   - Based on TinySimpleHash in https://stackoverflow.com/a/52171480/104370
        const tinySimpleHash = (s) => {
            let i = 0; // Index for iterating over the string
            let h = 9; // Initial hash value
            while (i < s.length) {
                h = Math.imul(h ^ s.charCodeAt(i++), 9 ** 9);
            }
            return h ^ (h >>> 9);
        };
        const currentDate = window.moment().format('Y-MM-DD');
        return tinySimpleHash(currentDate + ' ' + task.description);
    }
}
exports.RandomField = RandomField;
//# sourceMappingURL=RandomField.js.map