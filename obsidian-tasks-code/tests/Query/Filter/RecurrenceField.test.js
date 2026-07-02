"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const RecurrenceField_1 = require("../../../src/Query/Filter/RecurrenceField");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const RecurrenceBuilder_1 = require("../../TestingTools/RecurrenceBuilder");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
window.moment = moment_1.default;
describe('recurrence', () => {
    // Note: We don't need to check all behaviours that are implemented in the base class.
    // These are minimal tests to confirm that the filters are correctly wired up,
    // to guard against possible future coding errors.
    // Easy construction of Tasks with given rule text
    function with_recurrence(ruleText) {
        const recurrence = new RecurrenceBuilder_1.RecurrenceBuilder().rule(ruleText).startDate('2022-07-14').build();
        return new TaskBuilder_1.TaskBuilder().recurrence(recurrence).build();
    }
    it('value', () => {
        const field = new RecurrenceField_1.RecurrenceField();
        expect(field.value(new TaskBuilder_1.TaskBuilder().build())).toStrictEqual('');
        expect(field.value(with_recurrence('every Sunday when done'))).toStrictEqual('every week on Sunday when done');
        expect(field.value(with_recurrence('every 6 months on the 2nd Wednesday'))).toStrictEqual('every 6 months on the 2nd Wednesday');
    });
    it('by recurrence (includes)', () => {
        // Arrange
        const filter = new RecurrenceField_1.RecurrenceField().createFilterOrErrorMessage('recurrence includes wednesday');
        // Assert
        expect(filter).toBeValid();
        expect(filter).toMatchTask(with_recurrence('every Wednesday'));
        expect(filter).not.toMatchTask(new TaskBuilder_1.TaskBuilder().build());
    });
    it('by recurrence (does not include)', () => {
        // Arrange
        const filter = new RecurrenceField_1.RecurrenceField().createFilterOrErrorMessage('recurrence does not include when done');
        // Assert
        expect(filter).toBeValid();
        expect(filter).toMatchTask(new TaskBuilder_1.TaskBuilder().build());
        expect(filter).toMatchTask(with_recurrence('every week on Sunday'));
        expect(filter).not.toMatchTask(with_recurrence('every 10 days when done'));
    });
    it('by recurrence (regex matches)', () => {
        // Arrange
        const filter = new RecurrenceField_1.RecurrenceField().createFilterOrErrorMessage(String.raw `recurrence regex matches /\d/`); // any digit present
        // Assert
        expect(filter).toBeValid();
        expect(filter).toMatchTask(with_recurrence('every month on the 31st'));
        expect(filter).not.toMatchTask(new TaskBuilder_1.TaskBuilder().build());
        expect(filter).not.toMatchTask(with_recurrence('every month on the last'));
    });
    it('by recurrence (regex does not match)', () => {
        // Arrange
        const filter = new RecurrenceField_1.RecurrenceField().createFilterOrErrorMessage(String.raw `recurrence regex does not match /\d/`);
        // Assert
        expect(filter).toBeValid();
        expect(filter).not.toMatchTask(with_recurrence('every month on the 31st'));
        expect(filter).toMatchTask(new TaskBuilder_1.TaskBuilder().build());
        expect(filter).toMatchTask(with_recurrence('every month on the last'));
    });
});
describe('grouping by recurrence', () => {
    it('supports grouping methods correctly', () => {
        expect(new RecurrenceField_1.RecurrenceField()).toSupportGroupingWithProperty('recurrence');
    });
    it.each([
        ['- [ ] a', ['None']],
        ['- [ ] a 🔁 every Sunday', ['every week on Sunday']],
        ['- [ ] a 🔁 every Sunday when done', ['every week on Sunday when done']],
        ['- [ ] a 🔁 every 6 months on the 2nd Wednesday', ['every 6 months on the 2nd Wednesday']],
    ])('task "%s" should have groups: %s', (taskLine, groups) => {
        // Arrange
        const grouper = new RecurrenceField_1.RecurrenceField().createNormalGrouper();
        // Assert
        const tasks = [(0, TestHelpers_1.fromLine)({ line: taskLine })];
        expect({ grouper, tasks }).groupHeadingsToBe(groups);
    });
    it('should sort groups for RecurrenceField', () => {
        const grouper = new RecurrenceField_1.RecurrenceField().createNormalGrouper();
        const tasks = SampleTasks_1.SampleTasks.withAllRecurrences();
        expect({ grouper, tasks }).groupHeadingsToBe([
            'every 3 weeks on Thursday',
            'every 4 months on the 3rd Wednesday',
            'every 4 weeks',
            'every 6 days',
            'every 8 days',
            'every 8 days when done',
            'every day',
            'every month',
            'every month on the 2nd',
            'every month on the 2nd when done',
            'every week',
            'every week on Tuesday',
            'every week on Tuesday when done',
            'None',
        ]);
    });
});
//# sourceMappingURL=RecurrenceField.test.js.map