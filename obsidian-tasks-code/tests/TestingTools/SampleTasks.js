"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SampleTasks = void 0;
const Occurrence_1 = require("../../src/Task/Occurrence");
const Task_1 = require("../../src/Task/Task");
const Recurrence_1 = require("../../src/Task/Recurrence");
const Status_1 = require("../../src/Statuses/Status");
const StatusConfiguration_1 = require("../../src/Statuses/StatusConfiguration");
const Priority_1 = require("../../src/Task/Priority");
const PriorityTools_1 = require("../../src/lib/PriorityTools");
const OnCompletion_1 = require("../../src/Task/OnCompletion");
const TaskBuilder_1 = require("./TaskBuilder");
const TestHelpers_1 = require("./TestHelpers");
const representativeDates = ['2023-05-30', '2023-05-31', '2023-06-01', '2023-06-02', '2023-02-32', null];
class SampleTasks {
    static withRepresentativeTags() {
        const sampleTags = [
            [],
            ['#tag'],
            ['#tag/subtag'],
            ['#tag/subtag/sub-sub-tag'],
            ['#multiple-tags1', '#multiple-tags2'],
            ['#project/project1'],
            ['#context/home'],
            ['#context/work'],
        ];
        return sampleTags.map((tags) => {
            return new TaskBuilder_1.TaskBuilder().tags(tags).build();
        });
    }
    static withAllRecurrences() {
        const recurrenceRules = [
            // Months
            'every 4 months on the 3rd Wednesday',
            'every month',
            'every month on the 2nd',
            'every month on the 2nd when done',
            // Weeks
            'every Tuesday',
            'every Tuesday when done',
            'every week',
            'every 3 weeks on Thursday',
            'every 4 weeks',
            // Days
            'every 6 days',
            'every 8 days',
            'every 8 days when done',
            'every day',
            '',
        ];
        return recurrenceRules.map((recurrenceRule) => {
            return new TaskBuilder_1.TaskBuilder()
                .recurrence(Recurrence_1.Recurrence.fromText({
                recurrenceRuleText: recurrenceRule,
                occurrence: new Occurrence_1.Occurrence({
                    startDate: null,
                    scheduledDate: null,
                    dueDate: null,
                }),
            }))
                .build();
        });
    }
    static withAllRootsPathsHeadings() {
        const allPathsAndHeadings = [
            ['', 'heading'],
            // no heading supplied
            ['a/b.md', null],
            ['a/b/c.md', null],
            // File and heading, nominal case
            ['a/d/c.md', 'heading'],
            ['e/d/c.md', 'heading'],
            // If file name and heading are identical, avoid duplication ('c > c')
            ['a/b/c.md', 'c'],
            // If file name and heading are identical, avoid duplication, even if there are underscores in the file name
            ['a_b_c.md', 'a_b_c'],
            // Underscores in file name component are escaped
            ['a/b/_c_.md', null],
            // But underscores in the heading component are not
            ['a/b/_c_.md', 'heading _italic text_'],
        ];
        const t = '- [ ] xyz';
        return allPathsAndHeadings.map(([path, heading]) => {
            return (0, TestHelpers_1.fromLine)({
                line: `${t} in '${path}' in heading '${heading}'`,
                path: path,
                precedingHeader: heading,
            });
        });
    }
    static withRepresentativeLineNumbers() {
        const taskBuilders = [
            new TaskBuilder_1.TaskBuilder().lineNumber(42).description('line 42'),
            new TaskBuilder_1.TaskBuilder().lineNumber(0).description('line 0'),
        ];
        return taskBuilders.map((builder) => builder.build());
    }
    static withRepresentativeListMarkers() {
        const taskBuilders = [
            new TaskBuilder_1.TaskBuilder().listMarker('-').description('hyphen'),
            new TaskBuilder_1.TaskBuilder().listMarker('*').description('asterisk'),
            new TaskBuilder_1.TaskBuilder().listMarker('+').description('plus'),
            new TaskBuilder_1.TaskBuilder().listMarker('1.').description('numbered task with full-stop'),
            new TaskBuilder_1.TaskBuilder().listMarker('2.').description('another numbered task with full-stop'),
            new TaskBuilder_1.TaskBuilder().listMarker('1)').description('numbered task with parenthesis'),
            new TaskBuilder_1.TaskBuilder().listMarker('2)').description('another numbered task with parenthesis'),
        ];
        return taskBuilders.map((builder) => builder.build());
    }
    static withAllRepresentativeCreatedDates() {
        return representativeDates.map((date) => {
            return new TaskBuilder_1.TaskBuilder().createdDate(date).build();
        });
    }
    static withAllRepresentativeDoneDates() {
        return representativeDates.map((date) => {
            return new TaskBuilder_1.TaskBuilder().doneDate(date).build();
        });
    }
    static withAllRepresentativeDueDates() {
        return representativeDates.map((date) => {
            return new TaskBuilder_1.TaskBuilder().dueDate(date).build();
        });
    }
    static withAllRepresentativeScheduledDates() {
        return representativeDates.map((date) => {
            return new TaskBuilder_1.TaskBuilder().scheduledDate(date).build();
        });
    }
    static withAllRepresentativeStartDates() {
        return representativeDates.map((date) => {
            return new TaskBuilder_1.TaskBuilder().startDate(date).build();
        });
    }
    static withAllRepresentativeCancelledDates() {
        return representativeDates.map((date) => {
            return new TaskBuilder_1.TaskBuilder().cancelledDate(date).build();
        });
    }
    static withEachDateTypeAndCorrespondingStatus() {
        function desc(fieldName) {
            return `#task Has a ${fieldName} date`;
        }
        const taskBuilders = [
            new TaskBuilder_1.TaskBuilder().status(Status_1.Status.TODO).description(desc('created')).createdDate('2023-04-13'),
            new TaskBuilder_1.TaskBuilder().status(Status_1.Status.TODO).description(desc('scheduled')).scheduledDate('2023-04-14'),
            new TaskBuilder_1.TaskBuilder().status(Status_1.Status.TODO).description(desc('start')).startDate('2023-04-15'),
            new TaskBuilder_1.TaskBuilder().status(Status_1.Status.TODO).description(desc('due')).dueDate('2023-04-16'),
            new TaskBuilder_1.TaskBuilder().status(Status_1.Status.DONE).description(desc('done')).doneDate('2023-04-17'),
            new TaskBuilder_1.TaskBuilder().status(Status_1.Status.CANCELLED).description(desc('cancelled')).cancelledDate('2023-04-18'),
        ];
        // If this test fails, a new date format is now supported, and needs to be added to the above list:
        const documentedDateFieldsCount = taskBuilders.length;
        const supportedDateFieldsCount = Task_1.Task.allDateFields().length;
        expect(documentedDateFieldsCount).toEqual(supportedDateFieldsCount);
        return taskBuilders.map((builder) => builder.build());
    }
    static withAllStatuses() {
        const statuses = [
            Status_1.Status.CANCELLED,
            Status_1.Status.DONE,
            Status_1.Status.EMPTY,
            Status_1.Status.IN_PROGRESS,
            Status_1.Status.ON_HOLD,
            Status_1.Status.TODO,
            Status_1.Status.NON_TASK,
        ];
        return statuses.map((status) => {
            return new TaskBuilder_1.TaskBuilder().status(status).description(`Status ${status.name}`).build();
        });
    }
    static withAllStatusTypes() {
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
        return [todoTask, inprTask, doneTask, cancTask, unknTask, non_Task, emptTask];
    }
    static withAllPriorities() {
        const tasks = [];
        const allPriorities = Object.values(Priority_1.Priority);
        allPriorities.forEach((priority) => {
            // This description is chosen to be useful for including tasks in user docs, so
            // changing it will change documentation and sample vault content.
            const priorityName = PriorityTools_1.PriorityTools.priorityNameUsingNormal(priority);
            const description = `#task ${priorityName} priority`;
            const task = new TaskBuilder_1.TaskBuilder().priority(priority).description(description).build();
            tasks.push(task);
        });
        return tasks;
    }
    static withAllRepresentativeDescriptions() {
        const descriptions = [
            'short description',
            'long description Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce quam ipsum, consectetur ut dolor nec, fringilla lobortis mi. Vestibulum gravida tincidunt urna nec ornare. Cras sit amet sagittis sapien, vitae mattis velit. Vestibulum sem tortor, blandit at ultrices eget, ultrices eget odio. Donec efficitur purus massa, vel molestie turpis tincidunt id. ',
        ];
        return descriptions.map((description) => {
            return new TaskBuilder_1.TaskBuilder().description(description).build();
        });
    }
    static withAllRepresentativeDependencyFields() {
        const id1 = 'dcf64c';
        const id2 = '0h17ye';
        return [
            new TaskBuilder_1.TaskBuilder().description('#task do this first').id(id1).build(),
            new TaskBuilder_1.TaskBuilder()
                .description('#task do this after first and some other task')
                .dependsOn([id1, id2])
                .build(),
        ];
    }
    static withWideSelectionOfDependencyScenarios() {
        const lines = [
            '- [ ] No dependency - TODO',
            '- [x] No dependency - DONE',
            //
            '- [ ] scenario 1 - TODO depends on TODO 🆔 scenario1',
            '- [ ] scenario 1 - TODO depends on TODO ⛔ scenario1',
            //
            '- [x] scenario 2 - TODO depends on DONE 🆔 scenario2',
            '- [ ] scenario 2 - TODO depends on DONE ⛔ scenario2',
            //
            '- [ ] scenario 3 - DONE depends on TODO 🆔 scenario3',
            '- [x] scenario 3 - DONE depends on TODO ⛔ scenario3',
            //
            '- [x] scenario 4 - DONE depends on DONE 🆔 scenario4',
            '- [x] scenario 4 - DONE depends on DONE ⛔ scenario4',
            //
            '- [ ] scenario 5 - TODO depends on non-existing ID ⛔ nosuchid',
            //
            '- [ ] scenario 6 - TODO depends on self 🆔 self ⛔ self',
            //
            '- [x] scenario 7 - task with duplicated id - this is DONE                                  - 🆔 scenario7',
            '- [ ] scenario 7 - task with duplicated id - this is TODO - and is blocking                - 🆔 scenario7',
            '- [ ] scenario 7 - TODO depends on id that is duplicated - ensure all tasks are checked    - ⛔ scenario7',
            //
            '- [ ] scenario 8 - mutually dependant 🆔 scenario8a ⛔ scenario8b',
            '- [ ] scenario 8 - mutually dependant 🆔 scenario8b ⛔ scenario8a',
            //
            '- [ ] scenario 9 - cyclic dependency 🆔 scenario9a ⛔ scenario9c',
            '- [ ] scenario 9 - cyclic dependency 🆔 scenario9b ⛔ scenario9a',
            '- [ ] scenario 9 - cyclic dependency 🆔 scenario9c ⛔ scenario9b',
            //
            '- [ ] scenario 10 - multiple dependencies TODO         - 🆔 scenario10a',
            '- [/] scenario 10 - multiple dependencies IN_PROGRESS  - 🆔 scenario10b',
            '- [x] scenario 10 - multiple dependencies DONE         - 🆔 scenario10c',
            '- [-] scenario 10 - multiple dependencies CANCELLED    - 🆔 scenario10d',
            '- [Q] scenario 10 - multiple dependencies NON_TASK     - 🆔 scenario10e',
            '- [ ] scenario 10 - multiple dependencies              - ⛔ scenario10a,scenario10b,scenario10c,scenario10d,scenario10e',
            //
            '- [ ] scenario 11 - indirect dependency - indirect blocking of scenario11c ignored - 🆔 scenario11a',
            '- [x] scenario 11 - indirect dependency - DONE                                     - 🆔 scenario11b ⛔ scenario11a',
            '- [ ] scenario 11 - indirect dependency - indirect blocking of scenario11a ignored - 🆔 scenario11c ⛔ scenario11b',
        ];
        return (0, TestHelpers_1.fromLines)({ lines });
    }
    static withAllRepresentativeBlockLinks() {
        const descriptions = ['', ' ^ca47c7', ' ^fromseparatefile'];
        return descriptions.map((blockLink) => {
            return new TaskBuilder_1.TaskBuilder().blockLink(blockLink).build();
        });
    }
    static withSampleOnCompletionValues() {
        const everyDay = Recurrence_1.Recurrence.fromText({
            recurrenceRuleText: 'every day',
            occurrence: new Occurrence_1.Occurrence({
                startDate: null,
                scheduledDate: null,
                dueDate: null,
            }),
        });
        return [
            new TaskBuilder_1.TaskBuilder().description('#task Keep this task when done').onCompletion(OnCompletion_1.OnCompletion.Ignore),
            new TaskBuilder_1.TaskBuilder().description('#task Keep this task when done too').onCompletion(OnCompletion_1.OnCompletion.Keep),
            new TaskBuilder_1.TaskBuilder().description('#task Remove this task when done').onCompletion(OnCompletion_1.OnCompletion.Delete),
            new TaskBuilder_1.TaskBuilder()
                .description('#task Remove completed instance of this recurring task when done')
                .onCompletion(OnCompletion_1.OnCompletion.Delete)
                .recurrence(everyDay),
        ].map((builder) => builder.build());
    }
}
exports.SampleTasks = SampleTasks;
//# sourceMappingURL=SampleTasks.js.map