"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const StatusTypeField_1 = require("../../../src/Query/Filter/StatusTypeField");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const StatusConfiguration_1 = require("../../../src/Statuses/StatusConfiguration");
const Status_1 = require("../../../src/Statuses/Status");
const FilterParser = __importStar(require("../../../src/Query/FilterParser"));
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
const ApprovalTestHelpers_1 = require("../../TestingTools/ApprovalTestHelpers");
// Abbreviated names so that the markdown text is aligned
const todoTask = (0, TestHelpers_1.fromLine)({ line: '- [ ] Todo' });
const inprTask = (0, TestHelpers_1.fromLine)({ line: '- [/] In progress' });
const doneTask = (0, TestHelpers_1.fromLine)({ line: '- [x] Done' });
const cancTask = (0, TestHelpers_1.fromLine)({ line: '- [-] Cancelled' });
const unknTask = (0, TestHelpers_1.fromLine)({ line: '- [%] Unknown' });
const non_Task = new TaskBuilder_1.TaskBuilder()
    .statusValues('^', 'non-task', 'x', false, StatusConfiguration_1.StatusType.NON_TASK)
    .description('Non-task')
    .build();
const emptTask = new TaskBuilder_1.TaskBuilder().status(Status_1.Status.EMPTY).description('Empty task').build();
describe('status.name', () => {
    it('value', () => {
        // Arrange
        const filter = new StatusTypeField_1.StatusTypeField();
        // Assert
        expect(filter.value(cancTask)).toStrictEqual('CANCELLED');
        expect(filter.value(doneTask)).toStrictEqual('DONE');
        expect(filter.value(inprTask)).toStrictEqual('IN_PROGRESS');
        expect(filter.value(non_Task)).toStrictEqual('NON_TASK');
        expect(filter.value(todoTask)).toStrictEqual('TODO');
        expect(filter.value(unknTask)).toStrictEqual('TODO');
    });
    it('status.type is', () => {
        // Arrange
        const filter = new StatusTypeField_1.StatusTypeField().createFilterOrErrorMessage('status.type is IN_PROGRESS');
        // Assert
        expect(filter).toBeValid();
        expect(filter).toMatchTask(inprTask);
        expect(filter).not.toMatchTask(todoTask);
    });
    it('status.type is not', () => {
        // Arrange
        const filter = new StatusTypeField_1.StatusTypeField().createFilterOrErrorMessage('status.type is not IN_PROGRESS');
        // Assert
        expect(filter).toBeValid();
        expect(filter).not.toMatchTask(inprTask);
        expect(filter).toMatchTask(todoTask);
    });
    it('status.type is - works with incorrect case', () => {
        // Arrange
        const filter = new StatusTypeField_1.StatusTypeField().createFilterOrErrorMessage('status.type is in_progress');
        // Assert
        expect(filter).toBeValid();
        expect(filter).toMatchTask(inprTask);
        expect(filter).not.toMatchTask(todoTask);
    });
    it('status-name is not valid', () => {
        // Arrange
        const filter = new StatusTypeField_1.StatusTypeField().createFilterOrErrorMessage('status-type is NON_TASK');
        // Assert
        // Check that the '.' in status.name is interpreted exactly as a dot.
        expect(filter).not.toBeValid();
    });
    it('status.name with invalid line is helpful', () => {
        // Arrange
        const filter = FilterParser.parseFilter('status.type in progress');
        // Assert
        expect(filter).not.toBeValid();
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)('Tasks query: ' + (filter?.error ?? 'Unexpectedly, no error message generated'), 'text');
    });
});
describe('sorting by status.name', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new StatusTypeField_1.StatusTypeField();
        expect(field.supportsSorting()).toEqual(true);
    });
    it('should parse sort line correctly', () => {
        expect(new StatusTypeField_1.StatusTypeField().createSorterFromLine('sort by status.type reverse')).not.toBeNull();
        expect(new StatusTypeField_1.StatusTypeField().createSorterFromLine('sort by status-type reverse')).toBeNull();
    });
    it('sort by status.name', () => {
        // Arrange
        const sorter = new StatusTypeField_1.StatusTypeField().createNormalSorter();
        // Assert
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, cancTask, cancTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, todoTask, unknTask); // Unknown treated as TODO
        // Most actionable type first..
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, inprTask, todoTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, todoTask, doneTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, doneTask, cancTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, cancTask, non_Task);
        // Users won't see empty tasks, but test them anyway
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, doneTask, emptTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, emptTask, inprTask);
    });
    it('sort by status.name reverse', () => {
        // Arrange
        const sorter = new StatusTypeField_1.StatusTypeField().createReverseSorter();
        // Assert
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, cancTask, cancTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, todoTask, unknTask); // Unknown treated as TODO
        // Reverse of  order by status name
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, inprTask, todoTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, todoTask, doneTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, doneTask, cancTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, cancTask, non_Task);
        // Users won't see empty tasks, but test them anyway
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, doneTask, emptTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, emptTask, inprTask);
    });
});
describe('grouping by status.type', () => {
    it('supports Field grouping methods correctly', () => {
        expect(new StatusTypeField_1.StatusTypeField()).toSupportGroupingWithProperty('status.type');
    });
    it('group by status.type', () => {
        // Arrange
        const grouper = new StatusTypeField_1.StatusTypeField().createNormalGrouper();
        // // Assert
        expect({ grouper, tasks: [inprTask] }).groupHeadingsToBe(['%%1%%IN_PROGRESS']);
        expect({ grouper, tasks: [todoTask] }).groupHeadingsToBe(['%%2%%TODO']);
        expect({ grouper, tasks: [unknTask] }).groupHeadingsToBe(['%%2%%TODO']);
        expect({ grouper, tasks: [doneTask] }).groupHeadingsToBe(['%%4%%DONE']);
        expect({ grouper, tasks: [cancTask] }).groupHeadingsToBe(['%%5%%CANCELLED']);
        expect({ grouper, tasks: [non_Task] }).groupHeadingsToBe(['%%6%%NON_TASK']);
        expect({ grouper, tasks: [emptTask] }).groupHeadingsToBe(['%%7%%EMPTY']); // won't be seen by users
    });
    it('should sort groups for StatusTypeField', () => {
        const grouper = new StatusTypeField_1.StatusTypeField().createNormalGrouper();
        const tasks = SampleTasks_1.SampleTasks.withAllStatusTypes();
        expect({ grouper, tasks }).groupHeadingsToBe([
            '%%1%%IN_PROGRESS',
            '%%2%%TODO',
            '%%4%%DONE',
            '%%5%%CANCELLED',
            '%%6%%NON_TASK',
            '%%7%%EMPTY',
        ]);
    });
});
//# sourceMappingURL=StatusTypeField.test.js.map