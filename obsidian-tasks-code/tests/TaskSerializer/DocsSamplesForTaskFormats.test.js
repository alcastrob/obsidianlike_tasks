"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const Settings_1 = require("../../src/Config/Settings");
const VerifyMarkdown_1 = require("../TestingTools/VerifyMarkdown");
const SampleTasks_1 = require("../TestingTools/SampleTasks");
const DefaultTaskSerializer_1 = require("../../src/TaskSerializer/DefaultTaskSerializer");
const MarkdownTable_1 = require("../../src/lib/MarkdownTable");
window.moment = moment_1.default;
afterEach(() => {
    (0, Settings_1.resetSettings)();
});
describe('Serializer', () => {
    describe('Emojis', () => {
        it('tabulate-emojis', () => {
            const table = new MarkdownTable_1.MarkdownTable(['Emoji', 'Codepoint']);
            const emojis = (0, DefaultTaskSerializer_1.allTaskPluginEmojis)();
            emojis
                .map((emoji) => {
                const hex = emoji.codePointAt(0)?.toString(16);
                const s = hex ? `U+${hex.toUpperCase()}` : 'undefined';
                return [emoji, s];
            })
                .sort((a, b) => {
                // Sort by the codepoint:
                return a[1].localeCompare(b[1]);
            })
                .forEach((row) => {
                table.addRow(row);
            });
            (0, VerifyMarkdown_1.verifyMarkdownForDocs)(table.markdown);
        });
    });
    describe('Dates', () => {
        function allDatesLines() {
            const tasks = SampleTasks_1.SampleTasks.withEachDateTypeAndCorrespondingStatus();
            return tasks.map((t) => t.toFileLineString()).join('\n');
        }
        it.each(Object.keys(Settings_1.TASK_FORMATS))('%s-snippet', (key) => {
            (0, Settings_1.updateSettings)({ taskFormat: key });
            (0, VerifyMarkdown_1.verifyMarkdown)(allDatesLines());
        });
        it.each(Object.keys(Settings_1.TASK_FORMATS))('%s-include', (key) => {
            (0, Settings_1.updateSettings)({ taskFormat: key });
            (0, VerifyMarkdown_1.verifyMarkdownForDocs)(allDatesLines());
        });
    });
    describe('Priorities', () => {
        function allPriorityLines() {
            const tasks = SampleTasks_1.SampleTasks.withAllPriorities().reverse();
            return tasks.map((t) => t.toFileLineString()).join('\n');
        }
        it.each(Object.keys(Settings_1.TASK_FORMATS))('%s-snippet', (key) => {
            (0, Settings_1.updateSettings)({ taskFormat: key });
            (0, VerifyMarkdown_1.verifyMarkdown)(allPriorityLines());
        });
        it.each(Object.keys(Settings_1.TASK_FORMATS))('%s-include', (key) => {
            (0, Settings_1.updateSettings)({ taskFormat: key });
            (0, VerifyMarkdown_1.verifyMarkdownForDocs)(allPriorityLines());
        });
    });
    describe('OnCompletion', () => {
        function allOnCompletionLines() {
            const tasks = SampleTasks_1.SampleTasks.withSampleOnCompletionValues();
            return tasks.map((t) => t.toFileLineString()).join('\n');
        }
        it.each(Object.keys(Settings_1.TASK_FORMATS))('%s-snippet', (key) => {
            (0, Settings_1.updateSettings)({ taskFormat: key });
            (0, VerifyMarkdown_1.verifyMarkdown)(allOnCompletionLines());
        });
        it.each(Object.keys(Settings_1.TASK_FORMATS))('%s-include', (key) => {
            (0, Settings_1.updateSettings)({ taskFormat: key });
            (0, VerifyMarkdown_1.verifyMarkdownForDocs)(allOnCompletionLines());
        });
    });
    describe('Dependencies', () => {
        function allDependencyLines() {
            const tasks = SampleTasks_1.SampleTasks.withAllRepresentativeDependencyFields();
            return tasks.map((t) => t.toFileLineString()).join('\n');
        }
        it.each(Object.keys(Settings_1.TASK_FORMATS))('%s-snippet', (key) => {
            (0, Settings_1.updateSettings)({ taskFormat: key });
            (0, VerifyMarkdown_1.verifyMarkdown)(allDependencyLines());
        });
        it.each(Object.keys(Settings_1.TASK_FORMATS))('%s-include', (key) => {
            (0, Settings_1.updateSettings)({ taskFormat: key });
            (0, VerifyMarkdown_1.verifyMarkdownForDocs)(allDependencyLines());
        });
    });
});
//# sourceMappingURL=DocsSamplesForTaskFormats.test.js.map