"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const StatusConfiguration_1 = require("../../../src/Statuses/StatusConfiguration");
const StatusRegistry_1 = require("../../../src/Statuses/StatusRegistry");
const SearchInfo_1 = require("../../../src/Query/SearchInfo");
const FilterParser_1 = require("../../../src/Query/FilterParser");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
const FilterTestHelpers_1 = require("../../TestingTools/FilterTestHelpers");
const MarkdownTable_1 = require("../../../src/lib/MarkdownTable");
const VerifyMarkdown_1 = require("../../TestingTools/VerifyMarkdown");
const ScriptingTestHelpers_1 = require("../../Scripting/ScriptingTestHelpers");
window.moment = moment_1.default;
function makeFilters() {
    const instructions = [
        //
        'is blocking',
        'is blocked',
    ];
    return instructions.map((instruction) => {
        return (0, FilterParser_1.parseFilter)(instruction).filter;
    });
}
describe('blocking and blocked filters', () => {
    beforeEach(() => {
        const nonTaskStatus = new StatusConfiguration_1.StatusConfiguration('Q', 'Question', 'A', true, StatusConfiguration_1.StatusType.NON_TASK);
        StatusRegistry_1.StatusRegistry.getInstance().add(nonTaskStatus);
    });
    afterEach(() => {
        StatusRegistry_1.StatusRegistry.getInstance().resetToDefaultStatuses();
    });
    it('blocking and blocked', () => {
        const tasks = SampleTasks_1.SampleTasks.withWideSelectionOfDependencyScenarios();
        const filters = makeFilters();
        const searchInfo = SearchInfo_1.SearchInfo.fromAllTasks(tasks);
        const columnNames = ['Task'];
        filters.forEach((filter) => columnNames.push((0, ScriptingTestHelpers_1.addBackticks)(filter.instruction)));
        const table = new MarkdownTable_1.MarkdownTable(columnNames);
        tasks.forEach((task) => {
            const newRow = [(0, ScriptingTestHelpers_1.addBackticks)(task.toFileLineString())];
            filters.forEach((filter) => {
                const matches = filter.filterFunction(task, searchInfo);
                newRow.push((0, FilterTestHelpers_1.booleanToEmoji)(matches));
            });
            table.addRow(newRow);
        });
        (0, VerifyMarkdown_1.verifyMarkdownForDocs)(table.markdown);
    });
});
//# sourceMappingURL=DependencySamples.test.js.map