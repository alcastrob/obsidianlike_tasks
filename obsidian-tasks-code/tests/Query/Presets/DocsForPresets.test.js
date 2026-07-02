"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MarkdownTable_1 = require("../../../src/lib/MarkdownTable");
const Presets_1 = require("../../../src/Query/Presets/Presets");
const ScriptingTestHelpers_1 = require("../../Scripting/ScriptingTestHelpers");
const VerifyMarkdown_1 = require("../../TestingTools/VerifyMarkdown");
const Settings_1 = require("../../../src/Config/Settings");
function verifyPresetsMarkdownTable(entries) {
    const table = new MarkdownTable_1.MarkdownTable(['Name', 'Instruction(s)']);
    for (const [key, value] of entries) {
        table.addRow([
            (0, ScriptingTestHelpers_1.addBackticks)(key),
            value
                .split('\n')
                .map((line) => (0, ScriptingTestHelpers_1.addBackticks)(line))
                .join('<br>'),
        ]);
    }
    (0, VerifyMarkdown_1.verifyMarkdownForDocs)(table.markdown);
}
it('default-presets', () => {
    verifyPresetsMarkdownTable(Object.entries(Presets_1.defaultPresets));
});
it('daily-note-presets', () => {
    const dailyNotePresets = {
        daily_note_overdue: "# Tasks that should have been done before this day.\n# This preset requires a YYYY-MM-DD file name.\nnot done\nhappens before {{query.file.filenameWithoutExtension}}\ngroup by function task.happens.format('YYYY-MM')",
        daily_note_do_this_day: '# Tasks that should be done this day.\n# This preset requires a YYYY-MM-DD file name.\nnot done\nhappens {{query.file.filenameWithoutExtension}}',
        daily_note_done_this_day: '# Tasks that have been done this day.\n# This preset requires a YYYY-MM-DD file name.\ndone\ndone {{query.file.filenameWithoutExtension}}',
    };
    verifyPresetsMarkdownTable(Object.entries(dailyNotePresets));
});
it('presets help message', () => {
    const { presets } = (0, Settings_1.getSettings)();
    const help = (0, Presets_1.unknownPresetErrorMessage)('xxxx', presets);
    const markdown = ['```text', help, '```'].join('\n');
    (0, VerifyMarkdown_1.verifyMarkdownForDocs)(markdown);
});
//# sourceMappingURL=DocsForPresets.test.js.map