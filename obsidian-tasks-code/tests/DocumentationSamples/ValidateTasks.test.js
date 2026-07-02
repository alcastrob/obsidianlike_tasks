"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DefaultTaskSerializer_1 = require("../../src/TaskSerializer/DefaultTaskSerializer");
const ApprovalTestHelpers_1 = require("../TestingTools/ApprovalTestHelpers");
const Task_1 = require("../../src/Task/Task");
function createTasksValidationCodeBlock(filters) {
    return `
\`\`\`\`text
\`\`\`tasks
# These instructions need to be all on one line:
${filters.join(' OR ')}

# Optionally, uncomment this line and exclude your templates location
# path does not include _templates

group by path
\`\`\`
\`\`\`\`
`;
}
describe('validate-tasks', () => {
    it('all-emojis-emojis', () => {
        const allEmojis = (0, DefaultTaskSerializer_1.allTaskPluginEmojis)();
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(allEmojis.join(''), 'text');
    });
    it('find-unread-emojis', () => {
        const allEmojis = (0, DefaultTaskSerializer_1.allTaskPluginEmojis)();
        const descriptionInstructions = allEmojis.map((emoji) => `(description includes ${emoji})`);
        const output = createTasksValidationCodeBlock(descriptionInstructions);
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(output, 'text');
    });
    it('find problem dates', () => {
        const dateFields = Task_1.Task.allDateFields();
        const instructions = dateFields.sort().map((field) => `(${field.replace('Date', ' date')} is invalid)`);
        const output = createTasksValidationCodeBlock(instructions);
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(output, 'text');
    });
});
//# sourceMappingURL=ValidateTasks.test.js.map