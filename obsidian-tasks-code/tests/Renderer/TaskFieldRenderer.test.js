"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const TaskLayoutOptions_1 = require("../../src/Layout/TaskLayoutOptions");
const TaskFieldRenderer_1 = require("../../src/Renderer/TaskFieldRenderer");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
window.moment = moment_1.default;
const fieldRenderer = new TaskFieldRenderer_1.TaskFieldRenderer();
describe('Field Layouts Container tests', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-11-19'));
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    it('should add a data attribute for an existing component (date)', () => {
        const task = new TaskBuilder_1.TaskBuilder().dueDate('2023-11-20').build();
        const span = document.createElement('span');
        fieldRenderer.addDataAttribute(span, task, TaskLayoutOptions_1.TaskLayoutComponent.DueDate);
        expect(span).toHaveDataAttributes('taskDue: future-1d');
    });
    it('should add a data attribute for an existing component (not date)', () => {
        const task = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask();
        const span = document.createElement('span');
        fieldRenderer.addDataAttribute(span, task, TaskLayoutOptions_1.TaskLayoutComponent.Priority);
        expect(span).toHaveDataAttributes('taskPriority: medium');
    });
    it('should not add any data attributes for a missing component', () => {
        const task = new TaskBuilder_1.TaskBuilder().build();
        const span = document.createElement('span');
        fieldRenderer.addDataAttribute(span, task, TaskLayoutOptions_1.TaskLayoutComponent.RecurrenceRule);
        expect(span).toHaveDataAttributes('');
    });
    it('should add a class name for a component', () => {
        const span = document.createElement('span');
        fieldRenderer.addClassName(span, TaskLayoutOptions_1.TaskLayoutComponent.StartDate);
        expect(span.classList.toString()).toEqual('task-start');
    });
});
describe('Field Layout Detail tests', () => {
    it('should supply a class name', () => {
        const fieldLayoutDetail = new TaskFieldRenderer_1.TaskFieldHTMLData('task-description', '', () => {
            return '';
        });
        expect(fieldLayoutDetail.className).toEqual('task-description');
    });
    it('should add a data attribute with a value and a name', () => {
        const fieldLayoutDetail = new TaskFieldRenderer_1.TaskFieldHTMLData('task-priority', 'taskPriority', () => {
            return 'highest';
        });
        const span = document.createElement('span');
        fieldLayoutDetail.addDataAttribute(span, new TaskBuilder_1.TaskBuilder().build(), TaskLayoutOptions_1.TaskLayoutComponent.Priority);
        expect(span).toHaveDataAttributes('taskPriority: highest');
    });
    it('should not add a data attribute without a name', () => {
        const fieldLayoutDetail = new TaskFieldRenderer_1.TaskFieldHTMLData('task-due', '', () => {
            return 'past-far';
        });
        const span = document.createElement('span');
        fieldLayoutDetail.addDataAttribute(span, new TaskBuilder_1.TaskBuilder().build(), TaskLayoutOptions_1.TaskLayoutComponent.DueDate);
        expect(span).toHaveDataAttributes('');
    });
    it('should not add a data attribute with a name but without value', () => {
        const fieldLayoutDetail = new TaskFieldRenderer_1.TaskFieldHTMLData('task-start', 'taskStart', () => {
            return '';
        });
        const span = document.createElement('span');
        fieldLayoutDetail.addDataAttribute(span, new TaskBuilder_1.TaskBuilder().build(), TaskLayoutOptions_1.TaskLayoutComponent.StartDate);
        expect(span).toHaveDataAttributes('');
    });
});
//# sourceMappingURL=TaskFieldRenderer.test.js.map