"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const RandomField_1 = require("../../../src/Query/Filter/RandomField");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
window.moment = moment_1.default;
const field = new RandomField_1.RandomField();
beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-23'));
});
afterAll(() => {
    jest.useRealTimers();
});
describe('filtering by random', () => {
    it('should be named random', () => {
        expect(field.fieldName()).toEqual('random');
    });
});
describe('sorting by random', () => {
    it('should support sorting', () => {
        expect(field.supportsSorting()).toEqual(true);
    });
    it('should sort identical tasks the same', () => {
        const sorter = field.createNormalSorter();
        const task1 = (0, TestHelpers_1.fromLine)({ line: '- [ ] Some description' });
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, task1, task1);
    });
    it('sort key should ignore task properties except description', () => {
        const fullyPopulatedTask = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask();
        const taskWithSameDescription = new TaskBuilder_1.TaskBuilder().description(fullyPopulatedTask.description).build();
        expect(field.sortKey(fullyPopulatedTask)).toEqual(field.sortKey(taskWithSameDescription));
    });
    it('sort key should not change, at different times', () => {
        const task1 = (0, TestHelpers_1.fromLine)({ line: '- [ ] My sort key should be same, regardless of time' });
        jest.setSystemTime(new Date('2024-10-19 10:42'));
        const sortKeyAtTime1 = field.sortKey(task1);
        jest.setSystemTime(new Date('2024-10-19 21:05'));
        const sortKeyAtTime2 = field.sortKey(task1);
        expect(sortKeyAtTime1).toEqual(sortKeyAtTime2);
    });
    it('sort key should change on different dates', () => {
        const task1 = (0, TestHelpers_1.fromLine)({ line: '- [ ] My sort key should differ on different dates' });
        jest.setSystemTime(new Date('2024-01-23'));
        const sortKeyOnDay1 = field.sortKey(task1);
        jest.setSystemTime(new Date('2024-01-24'));
        const sortKeyOnDay2 = field.sortKey(task1);
        expect(sortKeyOnDay1).not.toEqual(sortKeyOnDay2);
    });
});
describe('grouping by random', () => {
    it('should not support grouping', () => {
        expect(field.supportsGrouping()).toEqual(false);
    });
});
//# sourceMappingURL=RandomField.test.js.map