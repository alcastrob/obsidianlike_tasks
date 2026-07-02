"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockingField = void 0;
const FilterInstructionsBasedField_1 = require("./FilterInstructionsBasedField");
class BlockingField extends FilterInstructionsBasedField_1.FilterInstructionsBasedField {
    constructor() {
        super();
        this._filters.add('is blocking', (task, searchInfo) => {
            return task.isBlocking(searchInfo.allTasks);
        });
        this._filters.add('is not blocking', (task, searchInfo) => {
            return !task.isBlocking(searchInfo.allTasks);
        });
        this._filters.add('is blocked', (task, searchInfo) => {
            return task.isBlocked(searchInfo.allTasks);
        });
        this._filters.add('is not blocked', (task, searchInfo) => {
            return !task.isBlocked(searchInfo.allTasks);
        });
    }
    fieldName() {
        return 'blocking';
    }
}
exports.BlockingField = BlockingField;
//# sourceMappingURL=BlockingField.js.map