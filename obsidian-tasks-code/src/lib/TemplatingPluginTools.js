"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatingPluginTools = void 0;
/**
 * Utility functions to help Tasks queries validate search instructions
 * for any unwanted template text.
 */
class TemplatingPluginTools {
    findUnexpandedDateText(line) {
        const templateTexts = ['<%', 'YYYY-MM-DD'];
        for (const templateText of templateTexts) {
            if (line.includes(templateText)) {
                return this.unexpandedDateTextMessage(templateText);
            }
        }
        return null;
    }
    unexpandedDateTextMessage(templateText) {
        return `Instruction contains unexpanded template text: "${templateText}" - and cannot be interpreted.

Possible causes:
- The query is an a template file, and is not intended to be searched.
- A command such as "Replace templates in the active file" needs to be run.
- The core "Daily notes" plugin is in use, and the template contained
  date calculations that it does not support.
- Some sample template text was accidentally pasted in to a tasks query,
  instead of in to a template file.

See: https://publish.obsidian.md/tasks/Advanced/Daily+Agenda#Instruction+contains+unexpanded+template+text
`;
    }
}
exports.TemplatingPluginTools = TemplatingPluginTools;
//# sourceMappingURL=TemplatingPluginTools.js.map