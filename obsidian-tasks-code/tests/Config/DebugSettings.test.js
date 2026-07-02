"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DebugSettings_1 = require("../../src/Config/DebugSettings");
const Settings_1 = require("../../src/Config/Settings");
const Query_1 = require("../../src/Query/Query");
const TestHelpers_1 = require("../TestingTools/TestHelpers");
describe('DebugSettings', () => {
    afterEach(() => {
        (0, Settings_1.resetSettings)();
    });
    it('should disable sorting instructions if', () => {
        // Arrange
        const tasksAsMarkdown = `
- [x] Task 1 - should not appear in output
- [x] Task 2 - should not appear in output
- [ ] Task 3 - will be sorted to 1st place, so should pass limit
`;
        const tasks = (0, TestHelpers_1.createTasksFromMarkdown)(tasksAsMarkdown, 'some_markdown_file', 'Some Heading');
        const query = new Query_1.Query(`
            sort by status
            explain
        `); // Would put Task 3 first
        // Disable sort instructions
        (0, Settings_1.updateSettings)({ debugSettings: new DebugSettings_1.DebugSettings(true) });
        // Act
        const queryResult = query.applyQueryToTasks(tasks);
        // Assert
        expect(queryResult.groups.length).toEqual(1);
        const soleTaskGroup = queryResult.groups[0];
        // Check that the tasks are found in the original order, not the order in the sort instruction
        expect('\n' + soleTaskGroup.tasksAsStringOfLines()).toStrictEqual(tasksAsMarkdown);
        expect(query.explainQuery()).toMatchInlineSnapshot(`
            "No filters supplied. All tasks will match the query.

            sort by status

            NOTE: All sort instructions, including default sort order, are disabled, due to 'ignoreSortInstructions' setting.
            "
        `);
    });
});
//# sourceMappingURL=DebugSettings.test.js.map