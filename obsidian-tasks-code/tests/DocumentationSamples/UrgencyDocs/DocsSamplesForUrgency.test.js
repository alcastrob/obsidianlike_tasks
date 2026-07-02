"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const VerifyMarkdown_1 = require("../../TestingTools/VerifyMarkdown");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const Urgency_1 = require("../../../src/Task/Urgency");
const Priority_1 = require("../../../src/Task/Priority");
window.moment = moment_1.default;
const today = '2023-05-10';
beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(today));
});
afterEach(() => {
    jest.useRealTimers();
});
/**
 * This test generates the HTML table in the user docs that shows how various Task
 * signifiers affect the Urgency calculate:
 * https://publish.obsidian.md/tasks/Advanced/Urgency
 */
describe('UrgencyTable', () => {
    function cell(text, span = 0) {
        if (span !== 0) {
            return `<td rowspan="${span}">${text}</td>`;
        }
        else {
            return `<td>${text}</td>`;
        }
    }
    function urgencyValue(urgency, dps = 1) {
        return `<code>${urgency.toFixed(dps)}</code>`;
    }
    function urgencyCell(urgency, dps = 1) {
        return cell(`${urgencyValue(urgency, dps)}`);
    }
    function row(cells) {
        let result = '';
        result += '  <tr>\n';
        for (const cell of cells) {
            result += `    ${cell}\n`;
        }
        result += '  </tr>\n';
        return result;
    }
    function property(rows) {
        let result = '';
        for (const rowCells of rows) {
            result += row(rowCells);
        }
        return result;
    }
    function calcForPriority(priority) {
        const task = new TaskBuilder_1.TaskBuilder().priority(priority).build();
        return Urgency_1.Urgency.calculate(task);
    }
    function dueCell(date) {
        const task = new TaskBuilder_1.TaskBuilder().dueDate(date).priority(Priority_1.Priority.Low).build();
        return urgencyCell(Urgency_1.Urgency.calculate(task), 5);
    }
    function scheduledCell(date) {
        const task = new TaskBuilder_1.TaskBuilder().scheduledDate(date).priority(Priority_1.Priority.Low).build();
        return urgencyCell(Urgency_1.Urgency.calculate(task), 1);
    }
    function startsCell(date) {
        const task = new TaskBuilder_1.TaskBuilder().startDate(date).priority(Priority_1.Priority.Low).build();
        return urgencyCell(Urgency_1.Urgency.calculate(task), 1);
    }
    it('urgency-html-table', () => {
        const heading = `
<table>
<thead>
  <tr>
    <th colspan="2">Property</th>
    <th>Score</th>
  </tr>
</thead>
<tbody>
`;
        let table = '';
        table += heading;
        table += property([
            [cell('Due', 25), cell('due more than 7 days ago'), dueCell('2023-05-02')],
            [cell('due 7 days ago'), dueCell('2023-05-03')],
            [cell('due 6 days ago'), dueCell('2023-05-04')],
            [cell('due 5 days ago'), dueCell('2023-05-05')],
            [cell('due 4 days ago'), dueCell('2023-05-06')],
            [cell('due 3 days ago'), dueCell('2023-05-07')],
            [cell('due 2 days ago'), dueCell('2023-05-08')],
            [cell('due 1 day ago'), dueCell('2023-05-09')],
            [cell('Today'), dueCell('2023-05-10')],
            [cell('1 day until due'), dueCell('2023-05-11')],
            [cell('2 days until due'), dueCell('2023-05-12')],
            [cell('3 days until due'), dueCell('2023-05-13')],
            [cell('4 days until due'), dueCell('2023-05-14')],
            [cell('5 days until due'), dueCell('2023-05-15')],
            [cell('6 days until due'), dueCell('2023-05-16')],
            [cell('7 days until due'), dueCell('2023-05-17')],
            [cell('8 days until due'), dueCell('2023-05-18')],
            [cell('9 days until due'), dueCell('2023-05-19')],
            [cell('10 days until due'), dueCell('2023-05-20')],
            [cell('11 days until due'), dueCell('2023-05-21')],
            [cell('12 days until due'), dueCell('2023-05-22')],
            [cell('13 days until due'), dueCell('2023-05-23')],
            [cell('14 days until due'), dueCell('2023-05-24')],
            [cell('More than 14 days until due'), dueCell('2023-05-25')],
            [cell('None'), dueCell('')],
        ]);
        table += property([
            [cell('Priority', 6), cell('Highest'), urgencyCell(calcForPriority(Priority_1.Priority.Highest))],
            [cell('High'), urgencyCell(calcForPriority(Priority_1.Priority.High))],
            [cell('Medium'), urgencyCell(calcForPriority(Priority_1.Priority.Medium))],
            [cell('None'), urgencyCell(calcForPriority(Priority_1.Priority.None), 2)],
            [cell('Low'), urgencyCell(calcForPriority(Priority_1.Priority.Low))],
            [cell('Lowest'), urgencyCell(calcForPriority(Priority_1.Priority.Lowest))],
        ]);
        table += property([
            [cell('Scheduled', 3), cell('Today or earlier'), scheduledCell('2023-05-10')],
            [cell('Tomorrow or later'), scheduledCell('2023-05-11')],
            [cell('None'), scheduledCell('')],
        ]);
        table += property([
            [cell('Start', 3), cell('Today or earlier'), startsCell('2023-05-10')],
            [cell('Tomorrow or later'), startsCell('2023-05-11')],
            [cell('None'), startsCell('')],
        ]);
        table += `</tbody>
</table>
`;
        (0, VerifyMarkdown_1.verifyMarkdownForDocs)(table);
    });
});
//# sourceMappingURL=DocsSamplesForUrgency.test.js.map