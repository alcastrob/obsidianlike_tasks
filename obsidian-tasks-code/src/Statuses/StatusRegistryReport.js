"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStatusRegistryReport = createStatusRegistryReport;
const i18n_1 = require("../i18n/i18n");
const StatusSettingsReport_1 = require("./StatusSettingsReport");
function createStatusRegistryReport(statusSettings, statusRegistry, buttonName, versionString) {
    // Ideas for further improvement
    // - Actually make it an informative report, that shows any issues in settings with duplicate symbols.
    // - Show any 'next status symbols' that are not known to the plugin.
    // - Show any status transitions that won't work with recurring tasks currently, as DONE not followed by TODO.
    const detailed = true;
    const settingsTable = (0, StatusSettingsReport_1.tabulateStatusSettings)(statusSettings);
    const mermaidText = statusRegistry.mermaidDiagram(detailed);
    const sampleTasksText = (0, StatusSettingsReport_1.sampleTaskLinesForValidStatuses)(statusSettings);
    return `# ${buttonName}

## ${i18n_1.i18n.t('reports.statusRegistry.about.title')}

${i18n_1.i18n.t('reports.statusRegistry.about.createdBy', { version: versionString })}

${i18n_1.i18n.t('reports.statusRegistry.about.updateReport.line1')}

- ${i18n_1.i18n.t('reports.statusRegistry.about.updateReport.line2')}
- ${i18n_1.i18n.t('reports.statusRegistry.about.updateReport.line3')}

${i18n_1.i18n.t('reports.statusRegistry.about.deleteFileAnyTime')}

## ${i18n_1.i18n.t('reports.statusRegistry.statusSettings.title')}

<!--
${i18n_1.i18n.t('reports.statusRegistry.statusSettings.comment.line1')}
${i18n_1.i18n.t('reports.statusRegistry.statusSettings.comment.line2')}
${i18n_1.i18n.t('reports.statusRegistry.statusSettings.comment.line3')}
-->

${i18n_1.i18n.t('reports.statusRegistry.statusSettings.theseAreStatusValues')}

${settingsTable}
## ${i18n_1.i18n.t('reports.statusRegistry.loadedSettings.title')}

<!-- ${i18n_1.i18n.t('reports.statusRegistry.loadedSettings.switchToLivePreview')} -->

${i18n_1.i18n.t('reports.statusRegistry.loadedSettings.settingsActuallyUsed')}
${mermaidText}

## ${i18n_1.i18n.t('reports.statusRegistry.sampleTasks.title')}

${i18n_1.i18n.t('reports.statusRegistry.sampleTasks.line1')}

${i18n_1.i18n.t('reports.statusRegistry.sampleTasks.line2')}

${i18n_1.i18n.t('reports.statusRegistry.sampleTasks.line3')}

> [!Tip] ${i18n_1.i18n.t('reports.statusRegistry.sampleTasks.tip.line1')}
> ${i18n_1.i18n.t('reports.statusRegistry.sampleTasks.tip.line2', {
        url: 'https://publish.obsidian.md/tasks/How+To/Style+custom+statuses',
    })}

${sampleTasksText.join('\n')}

## ${i18n_1.i18n.t('reports.statusRegistry.searchSampleTasks.title')}

${i18n_1.i18n.t('reports.statusRegistry.searchSampleTasks.line1')}

\`\`\`tasks
path includes {{query.file.path}}
group by status.type
group by status.name
sort by function task.lineNumber
hide postpone button
short mode
\`\`\`
`;
}
//# sourceMappingURL=StatusRegistryReport.js.map