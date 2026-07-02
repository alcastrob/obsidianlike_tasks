"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const Task_1 = require("../../src/Task/Task");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const OnCompletion_1 = require("../../src/Task/OnCompletion");
const Priority_1 = require("../../src/Task/Priority");
const TaskRegularExpressions_1 = require("../../src/Task/TaskRegularExpressions");
jest.mock('obsidian');
window.moment = moment_1.default;
/**
 @summary
 This file contains a tested, end-to-end example for implementing and using a
 {@link TaskSerializer}.
 <br>
 This file should also contain any {@link TaskSerializer} tests that should be tested
 against all the {@link TaskSerializer}s defined in this repo. Tests that only
 apply to one should be housed in that serializer's specific test file
*/
describe('TaskSerializer Example', () => {
    /**
     * A toy {@link TaskSerializer} meant to illustrate the implementation and use of
     * the {@link TaskSerializer} interface.
     *
     * The format that it recognizes is a priority and due date in that order, then a description.
     * Priority and due date are optional
     */
    class TestingTaskSerializer {
        /* Attempts to parse a string into a TaskDetails */
        deserialize(line) {
            // Parse tokens
            const parsedTokens = line.trim().split(/\s+/);
            const [priorityString, dueDateString, ...descriptionParts] = parsedTokens;
            // Validate dueDate
            let dueDate = null;
            if (dueDateString) {
                const parsedDueDate = (0, moment_1.default)(dueDateString, TaskRegularExpressions_1.TaskRegularExpressions.dateFormat);
                if (parsedDueDate.isValid()) {
                    dueDate = parsedDueDate;
                }
                else {
                    // Add back to description if invalid
                    descriptionParts.unshift(dueDateString);
                }
            }
            // Validate priority
            let priority = Priority_1.Priority.None;
            if (priorityString) {
                if (Object.values(Priority_1.Priority).includes(priorityString)) {
                    priority = priorityString;
                }
                else {
                    // Add back to description if invalid
                    descriptionParts.unshift(priorityString);
                }
            }
            const description = descriptionParts.join(' ');
            return {
                // NEW_TASK_FIELD_EDIT_REQUIRED
                description,
                tags: Task_1.Task.extractHashtags(description),
                dueDate,
                priority,
                startDate: null,
                createdDate: null,
                scheduledDate: null,
                doneDate: null,
                cancelledDate: null,
                recurrence: null,
                onCompletion: OnCompletion_1.OnCompletion.Ignore,
                dependsOn: [],
                id: '',
            };
        }
        /* Represents task as a string */
        serialize(task) {
            return [task.priority, task.dueDate?.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat), task.description]
                .filter((x) => x)
                .join(' ');
        }
    }
    const ts = new TestingTaskSerializer();
    describe('deserialize', () => {
        it('should parse the empty string', () => {
            expect(ts.deserialize('')).toMatchTaskDetails({});
        });
        it('should parse just a priority', () => {
            expect(ts.deserialize('1')).toMatchTaskDetails({ priority: Priority_1.Priority.High });
        });
        it('should parse just a description', () => {
            expect(ts.deserialize('Hello World, this is a task description')).toMatchTaskDetails({
                description: 'Hello World, this is a task description',
            });
        });
        it('should parse a priority and dueDate', () => {
            expect(ts.deserialize('1 1978-09-21')).toMatchTaskDetails({
                priority: Priority_1.Priority.High,
                dueDate: (0, moment_1.default)('1978-09-21', 'YYYY-MM-DD'),
            });
        });
        it('should parse a priority and description', () => {
            expect(ts.deserialize('1 Wobble')).toMatchTaskDetails({ priority: Priority_1.Priority.High, description: 'Wobble' });
        });
        it('should parse a full task', () => {
            expect(ts.deserialize('1 1978-09-21 Wobble')).toMatchTaskDetails({
                priority: Priority_1.Priority.High,
                description: 'Wobble',
                dueDate: (0, moment_1.default)('1978-09-21', 'YYYY-MM-DD'),
            });
        });
    });
    describe('serialize', () => {
        it('should serialize a task', () => {
            const tb = new TaskBuilder_1.TaskBuilder().description('');
            expect(ts.serialize(tb.priority(Priority_1.Priority.High).build())).toEqual('1');
            expect(ts.serialize(tb.description('Wobble').build())).toEqual('1 Wobble');
            expect(ts.serialize(tb.dueDate('1978-09-21').build())).toEqual('1 1978-09-21 Wobble');
        });
    });
});
//# sourceMappingURL=TaskSerializer.test.js.map