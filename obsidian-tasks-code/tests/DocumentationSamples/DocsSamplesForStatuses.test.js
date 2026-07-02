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
const Status_1 = require("../../src/Statuses/Status");
const StatusConfiguration_1 = require("../../src/Statuses/StatusConfiguration");
const Themes = __importStar(require("../../src/Config/Themes"));
const StatusValidator_1 = require("../../src/Statuses/StatusValidator");
const VerifyStatuses = __importStar(require("../TestingTools/VerifyStatuses"));
const StatusExamples = __importStar(require("../TestingTools/StatusExamples"));
const StatusesTestHelpers_1 = require("../TestingTools/StatusesTestHelpers");
describe('DefaultStatuses', () => {
    // These "test" write out a markdown representation of the default task statuses,
    // for embedding in the user docs.
    it('core-statuses', () => {
        VerifyStatuses.verifyStatusesInMultipleFormats([Status_1.Status.TODO, Status_1.Status.DONE], true);
    });
    it('custom-statuses', () => {
        VerifyStatuses.verifyStatusesInMultipleFormats([Status_1.Status.IN_PROGRESS, Status_1.Status.CANCELLED], true);
    });
    it('important-cycle', () => {
        const statuses = StatusExamples.importantCycle();
        VerifyStatuses.verifyStatusesInMultipleFormats((0, StatusesTestHelpers_1.constructStatuses)(statuses), false);
    });
    it('todo-in_progress-done', () => {
        const statuses = StatusExamples.todoToInProgressToDone();
        VerifyStatuses.verifyStatusesInMultipleFormats((0, StatusesTestHelpers_1.constructStatuses)(statuses), false);
        VerifyStatuses.verifyStatusesAsDetailedMermaidDiagram((0, StatusesTestHelpers_1.constructStatuses)(statuses));
    });
    it('pro-con-cycle', () => {
        const statuses = StatusExamples.proCon();
        VerifyStatuses.verifyStatusesInMultipleFormats((0, StatusesTestHelpers_1.constructStatuses)(statuses), false);
        VerifyStatuses.verifyStatusesAsDetailedMermaidDiagram((0, StatusesTestHelpers_1.constructStatuses)(statuses));
    });
    it('toggle-does-nothing', () => {
        const statuses = StatusExamples.variousNonTaskStatuses();
        VerifyStatuses.verifyStatusesInMultipleFormats((0, StatusesTestHelpers_1.constructStatuses)(statuses), false);
    });
    it('done-toggles-to-cancelled', () => {
        // See issue #2089.
        // DONE is followed by CANCELLED, which currently causes unexpected behaviour in recurrent tasks.
        // This uses the 4 default statuses, and just customises their order.
        const statuses = StatusExamples.doneTogglesToCancelled();
        VerifyStatuses.verifyStatusesAsDetailedMermaidDiagram((0, StatusesTestHelpers_1.constructStatuses)(statuses));
    });
    it('done-toggles-to-cancelled-with-unconventional-symbols', () => {
        // See issue #2304.
        // DONE is followed by CANCELLED, which currently causes unexpected behaviour in recurrent tasks.
        // This doesn't follow the standard convention of 'x' means DONE. It has 'x' means CANCELLED.
        const statuses = StatusExamples.doneTogglesToCancelledWithUnconventionalSymbols();
        VerifyStatuses.verifyStatusesAsDetailedMermaidDiagram((0, StatusesTestHelpers_1.constructStatuses)(statuses));
    });
});
describe('Theme', () => {
    const themes = [
        // Alphabetical order by name:
        ['AnuPpuccin', Themes.anuppuccinSupportedStatuses()],
        ['Aura', Themes.auraSupportedStatuses()],
        ['Border', Themes.borderSupportedStatuses()],
        ['Ebullientworks', Themes.ebullientworksSupportedStatuses()],
        ['ITS', Themes.itsSupportedStatuses()],
        ['LYT Mode', Themes.lytModeSupportedStatuses()],
        ['Minimal', Themes.minimalSupportedStatuses()],
        ['Things', Themes.thingsSupportedStatuses()],
    ];
    describe.each(themes)('%s', (_, statuses) => {
        it.each(statuses)('Validate status: "%s", "%s", "%s", "%s"', (symbol, name, nextSymbol, type) => {
            const statusValidator = new StatusValidator_1.StatusValidator();
            const entry = [symbol, name, nextSymbol, type];
            expect(statusValidator.validateStatusCollectionEntry(entry)).toEqual([]);
        });
        it('Table', () => {
            VerifyStatuses.verifyStatusesInMultipleFormats((0, StatusesTestHelpers_1.constructStatuses)(statuses), true);
        });
        it('Tasks', () => {
            VerifyStatuses.verifyStatusesAsTasksList((0, StatusesTestHelpers_1.constructStatuses)(statuses));
        });
        it('Text', () => {
            VerifyStatuses.verifyStatusesAsTasksText((0, StatusesTestHelpers_1.constructStatuses)(statuses));
        });
    });
});
describe('Status Transitions', () => {
    it('status-types', () => {
        const statuses = [
            Status_1.Status.TODO,
            Status_1.Status.IN_PROGRESS,
            Status_1.Status.ON_HOLD,
            Status_1.Status.DONE,
            Status_1.Status.CANCELLED,
            new Status_1.Status(new StatusConfiguration_1.StatusConfiguration('~', 'My custom status', ' ', false, StatusConfiguration_1.StatusType.NON_TASK)),
        ];
        VerifyStatuses.verifyTransitionsAsMarkdownTable(statuses);
    });
});
//# sourceMappingURL=DocsSamplesForStatuses.test.js.map