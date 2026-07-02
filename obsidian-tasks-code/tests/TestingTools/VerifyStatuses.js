"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyStatusesAsTasksList = verifyStatusesAsTasksList;
exports.verifyStatusesAsTasksText = verifyStatusesAsTasksText;
exports.verifyStatusesInMultipleFormats = verifyStatusesInMultipleFormats;
exports.verifyStatusesAsDetailedMermaidDiagram = verifyStatusesAsDetailedMermaidDiagram;
exports.verifyTransitionsAsMarkdownTable = verifyTransitionsAsMarkdownTable;
const JestApprovals_1 = require("approvals/lib/Providers/Jest/JestApprovals");
const MarkdownTable_1 = require("../../src/lib/MarkdownTable");
const SearchInfo_1 = require("../../src/Query/SearchInfo");
const FilterParser = __importStar(require("../../src/Query/FilterParser"));
const StatusField_1 = require("../../src/Query/Filter/StatusField");
const StatusTypeField_1 = require("../../src/Query/Filter/StatusTypeField");
const StatusNameField_1 = require("../../src/Query/Filter/StatusNameField");
const StatusRegistry_1 = require("../../src/Statuses/StatusRegistry");
const StatusSettingsReport_1 = require("../../src/Statuses/StatusSettingsReport");
const TaskBuilder_1 = require("./TaskBuilder");
const VerifyMarkdown_1 = require("./VerifyMarkdown");
const ApprovalTestHelpers_1 = require("./ApprovalTestHelpers");
function verifyStatusesAsMarkdownTable(statuses, showQueryInstructions) {
    // Note: There is very similar code in tabulateStatusSettings() in StatusRegistryReport.ts.
    //       Maybe try unifying the common code one day?
    let statusName = 'Status Name';
    let statusType = 'Status Type';
    if (showQueryInstructions) {
        statusName += '<br>`status.name includes...`<br>`sort by status.name`<br>`group by status.name`';
        statusType += '<br>`status.type is...`<br>`sort by status.type`<br>`group by status.type`';
    }
    const table = new MarkdownTable_1.MarkdownTable([
        'Status Symbol',
        'Next Status Symbol',
        statusName,
        statusType,
        'Needs Custom Styling',
    ]);
    for (const status of statuses) {
        const statusCharacter = (0, StatusSettingsReport_1.getPrintableSymbol)(status.symbol);
        const nextStatusCharacter = (0, StatusSettingsReport_1.getPrintableSymbol)(status.nextStatusSymbol);
        const type = (0, StatusSettingsReport_1.getPrintableSymbol)(status.type);
        const needsCustomStyling = status.symbol !== ' ' && status.symbol !== 'x' ? 'Yes' : 'No';
        table.addRow([statusCharacter, nextStatusCharacter, status.name, type, needsCustomStyling]);
    }
    (0, VerifyMarkdown_1.verifyMarkdownForDocs)(table.markdown);
}
function verifyStatusesAsTasksList(statuses) {
    let markdown = '';
    for (const status of statuses) {
        const statusCharacter = (0, StatusSettingsReport_1.getPrintableSymbol)(status.symbol);
        markdown += `- [${status.symbol}] #task ${statusCharacter} ${status.name}\n`;
    }
    (0, VerifyMarkdown_1.verifyMarkdownForDocs)(markdown);
}
function verifyStatusesAsTasksText(statuses) {
    let markdown = '';
    for (const status of statuses) {
        const statusCharacter = (0, StatusSettingsReport_1.getPrintableSymbol)(status.symbol);
        markdown += `- [${status.symbol}] #task ${statusCharacter} ${status.name}\n`;
    }
    (0, JestApprovals_1.verify)(markdown);
}
function verifyStatusesInMultipleFormats(statuses, showQueryInstructions) {
    verifyStatusesAsMarkdownTable(statuses, showQueryInstructions);
    verifyStatusesAsMermaidDiagram(statuses);
}
function verifyStatusesAsMermaidDiagramImpl(statuses, detailed, extensionWithoutDot) {
    // Set the registry up to exactly match the supplied statuses
    const registry = new StatusRegistry_1.StatusRegistry();
    registry.set(statuses);
    const markdown = registry.mermaidDiagram(detailed);
    (0, ApprovalTestHelpers_1.verifyWithFileExtension)(markdown, extensionWithoutDot);
}
function verifyStatusesAsMermaidDiagram(statuses) {
    verifyStatusesAsMermaidDiagramImpl(statuses, false, 'mermaid.md');
}
function verifyStatusesAsDetailedMermaidDiagram(statuses) {
    verifyStatusesAsMermaidDiagramImpl(statuses, true, 'detailed.mermaid.md');
}
function verifyTransitionsAsMarkdownTable(statuses) {
    const columnNames = ['Operation and status.type'];
    statuses.forEach((s) => {
        const title = s.type;
        columnNames.push(title);
    });
    const table = new MarkdownTable_1.MarkdownTable(columnNames);
    const tasks = [];
    {
        const cells = ['Example Task'];
        statuses.forEach((s) => {
            const task = new TaskBuilder_1.TaskBuilder().status(s).description('demo').build();
            tasks.push(task);
            cells.push('`' + task.toFileLineString() + '`');
        });
        table.addRow(cells);
    }
    function filterAllStatuses(filter) {
        const cells = [`Matches \`${filter.instruction}\``];
        const searchInfo = SearchInfo_1.SearchInfo.fromAllTasks(tasks);
        tasks.forEach((task) => {
            const matchedText = filter.filter?.filterFunction(task, searchInfo) ? 'YES' : 'no';
            cells.push(matchedText);
        });
        table.addRow(cells);
    }
    filterAllStatuses(FilterParser.parseFilter('not done'));
    filterAllStatuses(FilterParser.parseFilter('done'));
    filterAllStatuses(FilterParser.parseFilter('status.type is TODO'));
    filterAllStatuses(FilterParser.parseFilter('status.type is IN_PROGRESS'));
    filterAllStatuses(FilterParser.parseFilter('status.type is ON_HOLD'));
    filterAllStatuses(FilterParser.parseFilter('status.type is DONE'));
    filterAllStatuses(FilterParser.parseFilter('status.type is CANCELLED'));
    filterAllStatuses(FilterParser.parseFilter('status.type is NON_TASK'));
    filterAllStatuses(FilterParser.parseFilter('status.name includes todo'));
    filterAllStatuses(FilterParser.parseFilter('status.name includes in progress'));
    filterAllStatuses(FilterParser.parseFilter('status.name includes on hold'));
    filterAllStatuses(FilterParser.parseFilter('status.name includes done'));
    filterAllStatuses(FilterParser.parseFilter('status.name includes cancelled'));
    function showGroupNamesForAllTasks(groupName, grouperFunction) {
        const cells = ['Name for `group by ' + groupName + '`'];
        tasks.forEach((task) => {
            const groupNamesForTask = grouperFunction(task, SearchInfo_1.SearchInfo.fromAllTasks([task]));
            const names = groupNamesForTask.join(',');
            cells.push(names);
        });
        table.addRow(cells);
    }
    showGroupNamesForAllTasks('status', new StatusField_1.StatusField().createNormalGrouper().grouper);
    showGroupNamesForAllTasks('status.type', new StatusTypeField_1.StatusTypeField().createNormalGrouper().grouper);
    showGroupNamesForAllTasks('status.name', new StatusNameField_1.StatusNameField().createNormalGrouper().grouper);
    (0, VerifyMarkdown_1.verifyMarkdownForDocs)(table.markdown);
}
//# sourceMappingURL=VerifyStatuses.js.map