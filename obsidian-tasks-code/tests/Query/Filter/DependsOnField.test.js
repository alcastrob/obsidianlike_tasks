"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FilterTestHelpers_1 = require("../../TestingTools/FilterTestHelpers");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const DependsOnField_1 = require("../../../src/Query/Filter/DependsOnField");
describe('id', () => {
    const blockedByField = new DependsOnField_1.DependsOnField();
    it('should supply field name', () => {
        expect(blockedByField.fieldName()).toEqual('blocked by');
    });
    it('by blocked by presence', () => {
        // Arrange
        const filter = new DependsOnField_1.DependsOnField().createFilterOrErrorMessage('has depends on');
        // Act, Assert
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().dependsOn([]), false);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().dependsOn(['abcdef']), true);
    });
    it('by blocked by absence', () => {
        // Arrange
        const line = 'no depends on';
        const filter = new DependsOnField_1.DependsOnField().createFilterOrErrorMessage(line);
        expect(blockedByField.canCreateFilterForLine(line)).toEqual(true);
        // Act, Assert
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().dependsOn([]), true);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().dependsOn(['abcdef']), false);
    });
});
//# sourceMappingURL=DependsOnField.test.js.map