"use strict";
/**
 * @jest-environment jsdom
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment/moment"));
const Status_1 = require("../../../src/Statuses/Status");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const StatusInstructions_1 = require("../../../src/ui/EditInstructions/StatusInstructions");
const StatusExamples = __importStar(require("../../TestingTools/StatusExamples"));
const StatusesTestHelpers_1 = require("../../TestingTools/StatusesTestHelpers");
const StatusRegistry_1 = require("../../../src/Statuses/StatusRegistry");
window.moment = moment_1.default;
const today = '2023-12-03';
beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(today));
});
afterEach(() => {
    jest.useRealTimers();
});
describe('SetStatus', () => {
    const todoTask = new TaskBuilder_1.TaskBuilder().status(Status_1.Status.TODO).build();
    const doneTask = new TaskBuilder_1.TaskBuilder().status(Status_1.Status.DONE).build();
    it('should provide information to set up a menu item for setting status', () => {
        // Arrange
        const status = Status_1.Status.TODO;
        const instruction = new StatusInstructions_1.SetStatus(status);
        // Assert
        expect(instruction.instructionDisplayName()).toEqual('Change status to: [ ] Todo');
        expect(instruction.isCheckedForTask(todoTask)).toEqual(true);
        expect(instruction.isCheckedForTask(doneTask)).toEqual(false);
    });
    it('should edit status', () => {
        // Arrange
        const instruction = new StatusInstructions_1.SetStatus(Status_1.Status.DONE);
        // Act
        const newTasks = instruction.apply(todoTask);
        // Assert
        expect(newTasks.length).toEqual(1);
        expect(newTasks[0].status.symbol).toEqual('x');
    });
    it('should not edit task if already has chosen status', () => {
        // Arrange
        const instruction = new StatusInstructions_1.SetStatus(Status_1.Status.TODO);
        // Act
        const newTasks = instruction.apply(todoTask);
        // Assert
        expect(newTasks.length).toEqual(1);
        // Expect it is the same object
        expect(Object.is(newTasks[0], todoTask)).toBe(true);
    });
});
describe('All Status Instructions', () => {
    it('should supply all status instructions', () => {
        // Arrange
        // We reverse the order, to put core statuses at the end - so we can test the instructions
        // correctly put core statuses first.
        const reversedStatuses = (0, StatusesTestHelpers_1.constructStatuses)(StatusExamples.doneTogglesToCancelled()).reverse();
        const statusRegistry = new StatusRegistry_1.StatusRegistry();
        statusRegistry.set(reversedStatuses);
        // Confirm the order of statuses:
        const statusSymbolsAsRegistered = statusRegistry.registeredStatuses.map((status) => status.symbol);
        expect(statusSymbolsAsRegistered).toStrictEqual(['-', '/', 'x', ' ']);
        // Act
        const allInstructions = (0, StatusInstructions_1.allStatusInstructions)(statusRegistry);
        // Assert
        expect(allInstructions.length).toBe(4);
        const statusSymbolsInInstructions = allInstructions.map((instruction) => instruction.newStatus.symbol);
        // Check core statuses are before others:
        expect(statusSymbolsInInstructions).toStrictEqual(['x', ' ', '-', '/']);
    });
});
//# sourceMappingURL=StatusInstructions.test.js.map