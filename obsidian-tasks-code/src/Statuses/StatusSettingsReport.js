"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrintableSymbol = getPrintableSymbol;
exports.tabulateStatusSettings = tabulateStatusSettings;
exports.sampleTaskLinesForValidStatuses = sampleTaskLinesForValidStatuses;
const StatusSettings_1 = require("../Config/StatusSettings");
const MarkdownTable_1 = require("../lib/MarkdownTable");
const i18n_1 = require("../i18n/i18n");
const GlobalFilter_1 = require("../Config/GlobalFilter");
const StatusConfiguration_1 = require("./StatusConfiguration");
const Status_1 = require("./Status");
const StatusRegistry_1 = require("./StatusRegistry");
function getFirstIndex(statusConfigurations, wantedSymbol) {
    return statusConfigurations.findIndex((s) => s.symbol === wantedSymbol);
}
function getPrintableSymbol(symbol) {
    // Do not put backticks around an empty symbol, as the two backticks are rendered
    // by Obsidian as ordinary characters and the meaning is unclear.
    // Better to just display nothing in this situation.
    if (symbol === '') {
        return symbol;
    }
    const result = symbol !== ' ' ? symbol : 'space';
    return '`' + result + '`';
}
function checkIfConventionalType(status, problems) {
    // Check if conventional type is being used:
    const conventionalType = Status_1.Status.getTypeForUnknownSymbol(status.symbol);
    if (status.type === conventionalType) {
        return;
    }
    if (conventionalType === StatusConfiguration_1.StatusType.TODO && status.symbol !== ' ') {
        // This was likely a default TODO - ignore it.
        return;
    }
    const symbol = getPrintableSymbol(status.symbol);
    const type = getPrintableSymbol(conventionalType);
    problems.push(i18n_1.i18n.t('reports.statusRegistry.messages.notConventionalType', { symbol, type }));
}
function checkNextStatusSymbol(statuses, status, problems) {
    // Check if next symbol is known
    const nextStatusSymbol = status.nextStatusSymbol;
    const indexOfNextSymbol = getFirstIndex(statuses, nextStatusSymbol);
    if (indexOfNextSymbol === -1) {
        const printableSymbol = getPrintableSymbol(nextStatusSymbol);
        problems.push(i18n_1.i18n.t('reports.statusRegistry.messages.nextSymbolUnknown', { symbol: printableSymbol }));
        return;
    }
    if (status.type !== StatusConfiguration_1.StatusType.DONE) {
        return;
    }
    // This type is DONE: check that next status type is TODO or IN_PROGRESS.
    // See issues #2089 and #2304.
    const nextStatus = statuses[indexOfNextSymbol];
    if (nextStatus) {
        if (nextStatus.type !== StatusConfiguration_1.StatusType.TODO && nextStatus.type !== StatusConfiguration_1.StatusType.IN_PROGRESS) {
            const helpURL = 'https://publish.obsidian.md/tasks/Getting+Started/Statuses/Recurring+Tasks+and+Custom+Statuses';
            const nextType = getPrintableSymbol(nextStatus.type);
            const message = [
                i18n_1.i18n.t('reports.statusRegistry.messages.wrongTypeAfterDone.line1', { nextType }),
                i18n_1.i18n.t('reports.statusRegistry.messages.wrongTypeAfterDone.line2'),
                i18n_1.i18n.t('reports.statusRegistry.messages.wrongTypeAfterDone.line3', { helpURL }),
            ].join('<br>');
            problems.push(message);
        }
    }
    else {
        problems.push(i18n_1.i18n.t('reports.statusRegistry.messages.cannotFindNextStatus'));
    }
}
function getProblemsForStatus(statuses, status, index) {
    const problems = [];
    if (status.symbol === Status_1.Status.EMPTY.symbol) {
        problems.push(i18n_1.i18n.t('reports.statusRegistry.messages.emptySymbol'));
        return problems;
    }
    const firstIndex = getFirstIndex(statuses, status.symbol);
    if (firstIndex != index) {
        const symbol = getPrintableSymbol(status.symbol);
        problems.push(i18n_1.i18n.t('reports.statusRegistry.messages.duplicateSymbol', { symbol: symbol }));
        return problems;
    }
    checkIfConventionalType(status, problems);
    checkNextStatusSymbol(statuses, status, problems);
    return problems;
}
function tabulateStatusSettings(statusSettings) {
    // Note: There is very similar code in verifyStatusesAsMarkdownTable() in DocsSamplesForStatuses.test.ts.
    //       Maybe try unifying the common code one day?
    const table = new MarkdownTable_1.MarkdownTable([
        i18n_1.i18n.t('reports.statusRegistry.columnHeadings.statusSymbol'),
        i18n_1.i18n.t('reports.statusRegistry.columnHeadings.nextStatusSymbol'),
        i18n_1.i18n.t('reports.statusRegistry.columnHeadings.statusName'),
        i18n_1.i18n.t('reports.statusRegistry.columnHeadings.statusType'),
        i18n_1.i18n.t('reports.statusRegistry.columnHeadings.problems'),
    ]);
    const statuses = StatusSettings_1.StatusSettings.allStatuses(statusSettings);
    statuses.forEach((status, index) => {
        table.addRow([
            getPrintableSymbol(status.symbol),
            getPrintableSymbol(status.nextStatusSymbol),
            status.name,
            getPrintableSymbol(status.type),
            getProblemsForStatus(statuses, status, index).join('<br>'),
        ]);
    });
    return table.markdown;
}
/**
 * Generates a list of Markdown lines, containing sample tasks based on the given status settings.
 *
 * @param {StatusSettings} statusSettings - The settings object containing custom and core statuses.
 *
 * @returns {string[]} An array of markdown strings representing sample tasks.
 * Each task includes a symbol, an introductory text, and the name of the status.
 * Only the actually registered symbols are used; duplicate and empty symbols are ignored.
 * The Global Filter will be added, if it is non-empty.
 */
function sampleTaskLinesForValidStatuses(statusSettings) {
    const statusRegistry = new StatusRegistry_1.StatusRegistry();
    StatusSettings_1.StatusSettings.applyToStatusRegistry(statusSettings, statusRegistry);
    const registeredStatuses = statusRegistry.registeredStatuses;
    return registeredStatuses.map((status, index) => {
        const globalFilter = GlobalFilter_1.GlobalFilter.getInstance();
        const globalFilterIfSet = globalFilter.isEmpty() ? '' : globalFilter.get() + ' ';
        const intro = `Sample task ${index + 1}`;
        const symbol = `status symbol=${getPrintableSymbol(status.symbol)}`;
        const name = `status name='${status.name}'`;
        return `- [${status.symbol}] ${globalFilterIfSet}${intro}: ${symbol} ${name}`;
    });
}
//# sourceMappingURL=StatusSettingsReport.js.map