"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const ListItem_1 = require("../../src/Task/ListItem");
const TaskLocation_1 = require("../../src/Task/TaskLocation");
const TaskBuilder_1 = require("./TaskBuilder");
const MockDataLoader_1 = require("./MockDataLoader");
const TasksFileHelpers_1 = require("./TasksFileHelpers");
window.moment = moment_1.default;
describe('TaskBuilder', () => {
    it('should add the tags to the description', () => {
        const builder = new TaskBuilder_1.TaskBuilder().description('hello').tags(['#tag1', '#tag2']);
        const task = builder.build();
        expect(task.toFileLineString()).toStrictEqual('- [ ] hello #tag1 #tag2');
    });
    it('should populate originalMarkdown', () => {
        const builder = new TaskBuilder_1.TaskBuilder();
        const task = builder.description('hello').build();
        expect(task.originalMarkdown).toEqual('- [ ] hello');
    });
    it('should allow parent to be supplied', () => {
        const location = TaskLocation_1.TaskLocation.fromUnknownPosition((0, TasksFileHelpers_1.createTestTasksFile)('somewhere.md'));
        const parent = ListItem_1.ListItem.fromListItemLine('- any old list item', null, location);
        const builder = new TaskBuilder_1.TaskBuilder();
        const task = builder.parent(parent).build();
        expect(task.parent).toEqual(parent);
    });
    it('should populate CachedMetadata', () => {
        const builder = new TaskBuilder_1.TaskBuilder().mockData('example_kanban');
        const task = builder.build();
        expect(task.file.cachedMetadata).toBe(MockDataLoader_1.MockDataLoader.get('example_kanban').cachedMetadata);
    });
    it('should populate CachedMetadata in two different TaskBuilder objects simultaneously', () => {
        const builder1 = new TaskBuilder_1.TaskBuilder().mockData('example_kanban');
        const builder2 = new TaskBuilder_1.TaskBuilder().mockData('jason_properties');
        const task1 = builder1.build();
        const task2 = builder2.build();
        expect(task1.file.property('kanban-plugin')).toEqual('basic');
        expect(task2.file.property('publish')).toEqual(false);
    });
    function hasValue(value) {
        if (typeof value === 'boolean') {
            // false is valid for booleans...
            return true;
        }
        if (Array.isArray(value)) {
            // Check for empty arrays:
            return value.length > 0;
        }
        // Check that values are non-null, strings are not empty...
        return !!value;
    }
    function getNullOrUnsetFields(type) {
        // @ts-ignore
        const args = Object.getOwnPropertyDescriptors(type);
        const nullOrUnsetFields = [];
        for (const key in args) {
            const value = type[key];
            if (!hasValue(value)) {
                nullOrUnsetFields.push(key);
            }
        }
        return nullOrUnsetFields.sort((a, b) => a.localeCompare(b));
    }
    it('createFullyPopulatedTask() should populate every field', () => {
        const task = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask();
        expect(getNullOrUnsetFields(task)).toEqual(['children', 'parent']);
        expect(getNullOrUnsetFields(task.taskLocation)).toEqual([]);
        expect(task.originalMarkdown).toEqual('  - [ ] Do exercises #todo #health 🆔 abcdef ⛔ 123456,abc123 🔼 🔁 every day when done 🏁 delete ➕ 2023-07-01 🛫 2023-07-02 ⏳ 2023-07-03 📅 2023-07-04 ❌ 2023-07-06 ✅ 2023-07-05 ^dcf64c');
    });
});
//# sourceMappingURL=TaskBuilder.test.js.map