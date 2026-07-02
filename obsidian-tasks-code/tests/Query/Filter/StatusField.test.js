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
const StatusField_1 = require("../../../src/Query/Filter/StatusField");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const Status_1 = require("../../../src/Statuses/Status");
const TestHelpers = __importStar(require("../../TestingTools/TestHelpers"));
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const StatusConfiguration_1 = require("../../../src/Statuses/StatusConfiguration");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const StatusRegistry_1 = require("../../../src/Statuses/StatusRegistry");
beforeAll(() => {
    StatusRegistry_1.StatusRegistry.getInstance().resetToDefaultStatuses();
    const importantCycle = [
        ['!', 'todo', 'X', 'TODO'],
        ['X', 'done', '!', 'DONE'],
    ];
    importantCycle.forEach((entry) => {
        const status = Status_1.Status.createFromImportedValue(entry);
        StatusRegistry_1.StatusRegistry.getInstance().add(status);
    });
});
afterAll(() => {
    StatusRegistry_1.StatusRegistry.getInstance().resetToDefaultStatuses();
});
describe('status', () => {
    it('done', () => {
        // Arrange
        const filter = new StatusField_1.StatusField().createFilterOrErrorMessage('done');
        // Assert
        expect(filter).not.toMatchTaskWithStatus(Status_1.Status.TODO.configuration);
        expect(filter).toMatchTaskWithStatus(Status_1.Status.DONE.configuration);
        expect(filter).toMatchTaskWithStatus(new StatusConfiguration_1.StatusConfiguration('X', 'Really Done', 'x', true, StatusConfiguration_1.StatusType.DONE));
        expect(filter).not.toMatchTaskWithStatus(Status_1.Status.IN_PROGRESS.configuration);
        expect(filter).not.toMatchTaskWithStatus(Status_1.Status.ON_HOLD.configuration);
        expect(filter).toMatchTaskWithStatus(Status_1.Status.CANCELLED.configuration);
        expect(filter).not.toMatchTaskWithStatus(new StatusConfiguration_1.StatusConfiguration('!', 'Todo', 'x', true, StatusConfiguration_1.StatusType.TODO)); // 'done' checks type.
        expect(filter).toMatchTaskWithStatus(new StatusConfiguration_1.StatusConfiguration('^', 'Non', 'x', true, StatusConfiguration_1.StatusType.NON_TASK));
    });
    it('not done', () => {
        // Arrange
        const filter = new StatusField_1.StatusField().createFilterOrErrorMessage('not done');
        // Assert
        expect(filter).toMatchTaskWithStatus(Status_1.Status.TODO.configuration);
        expect(filter).not.toMatchTaskWithStatus(Status_1.Status.DONE.configuration);
        expect(filter).not.toMatchTaskWithStatus(new StatusConfiguration_1.StatusConfiguration('X', 'Really Done', 'x', true, StatusConfiguration_1.StatusType.DONE));
        expect(filter).toMatchTaskWithStatus(Status_1.Status.IN_PROGRESS.configuration);
        expect(filter).toMatchTaskWithStatus(Status_1.Status.ON_HOLD.configuration);
        expect(filter).not.toMatchTaskWithStatus(Status_1.Status.CANCELLED.configuration);
        expect(filter).toMatchTaskWithStatus(new StatusConfiguration_1.StatusConfiguration('!', 'Todo', 'x', true, StatusConfiguration_1.StatusType.TODO)); // 'not done' type.
        expect(filter).not.toMatchTaskWithStatus(new StatusConfiguration_1.StatusConfiguration('^', 'Non', 'x', true, StatusConfiguration_1.StatusType.NON_TASK));
    });
    it('should honour original case, when explaining simple filters', () => {
        const filter = new StatusField_1.StatusField().createFilterOrErrorMessage('NOT done');
        expect(filter).toHaveExplanation('NOT done');
    });
});
describe('sorting by status', () => {
    const doneTask = new TaskBuilder_1.TaskBuilder().status(Status_1.Status.DONE).build();
    const todoTask = new TaskBuilder_1.TaskBuilder().status(Status_1.Status.TODO).build();
    it('supports Field sorting methods correctly', () => {
        const field = new StatusField_1.StatusField();
        expect(field.supportsSorting()).toEqual(true);
    });
    it('sort by status', () => {
        // Arrange
        const sorter = new StatusField_1.StatusField().createNormalSorter();
        // Assert
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, doneTask, todoTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, todoTask, doneTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, todoTask, TestHelpers.fromLine({ line: '- [-] Z' }));
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, todoTask, TestHelpers.fromLine({ line: '- [x] Z' }));
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, todoTask, TestHelpers.fromLine({ line: '- [X] Z' }));
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, todoTask, TestHelpers.fromLine({ line: '- [!] Z' }));
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, doneTask, doneTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, doneTask, TestHelpers.fromLine({ line: '- [-] Z' }));
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, doneTask, TestHelpers.fromLine({ line: '- [x] Z' }));
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, doneTask, TestHelpers.fromLine({ line: '- [X] Z' }));
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, doneTask, TestHelpers.fromLine({ line: '- [!] Z' }));
    });
    it('sort by status reverse', () => {
        // Arrange
        const sorter = new StatusField_1.StatusField().createReverseSorter();
        // Assert
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, doneTask, todoTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, todoTask, doneTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, doneTask, doneTask);
    });
});
describe('grouping by status', () => {
    it('supports grouping methods correctly', () => {
        expect(new StatusField_1.StatusField()).toSupportGroupingWithProperty('status');
    });
    it.each([
        ['- [ ] a', ['Todo']],
        ['- [x] a', ['Done']],
        ['- [X] a', ['Done']],
        ['- [/] a', ['Todo']],
        ['- [-] a', ['Done']],
        ['- [!] a', ['Todo']],
    ])('task "%s" should have groups: %s', (taskLine, groups) => {
        // Arrange
        const grouper = new StatusField_1.StatusField().createNormalGrouper();
        // Assert
        const tasks = [(0, TestHelpers_1.fromLine)({ line: taskLine })];
        // Check this symbol has been registered, so we are not passing by luck:
        const symbol = tasks[0].status.symbol;
        expect(StatusRegistry_1.StatusRegistry.getInstance().bySymbol(symbol).type).not.toEqual(StatusConfiguration_1.StatusType.EMPTY);
        expect({ grouper, tasks }).groupHeadingsToBe(groups);
    });
    it('should sort groups for StatusField', () => {
        const grouper = new StatusField_1.StatusField().createNormalGrouper();
        const taskLines = ['- [ ] a', '- [x] a'];
        const tasks = taskLines.map((taskLine) => (0, TestHelpers_1.fromLine)({ line: taskLine }));
        expect({ grouper, tasks }).groupHeadingsToBe(['Done', 'Todo']);
    });
});
//# sourceMappingURL=StatusField.test.js.map