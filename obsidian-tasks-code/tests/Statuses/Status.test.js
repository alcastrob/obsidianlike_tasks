"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const Status_1 = require("../../src/Statuses/Status");
const StatusConfiguration_1 = require("../../src/Statuses/StatusConfiguration");
jest.mock('obsidian');
window.moment = moment_1.default;
describe('Status', () => {
    it('preview text', () => {
        const configuration = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration('P', 'Pro', 'C', true, StatusConfiguration_1.StatusType.TODO));
        expect(configuration.previewText()).toEqual("- [P] => [C], name: 'Pro', type: 'TODO'.");
    });
    it('default configurations', () => {
        expect(Status_1.Status.DONE.previewText()).toEqual("- [x] => [ ], name: 'Done', type: 'DONE'.");
        expect(Status_1.Status.EMPTY.previewText()).toEqual("- [] => [], name: 'EMPTY', type: 'EMPTY'.");
        expect(Status_1.Status.TODO.previewText()).toEqual("- [ ] => [x], name: 'Todo', type: 'TODO'.");
    });
    it('factory methods for default statuses', () => {
        expect(Status_1.Status.DONE.previewText()).toEqual("- [x] => [ ], name: 'Done', type: 'DONE'.");
        expect(Status_1.Status.EMPTY.previewText()).toEqual("- [] => [], name: 'EMPTY', type: 'EMPTY'.");
        expect(Status_1.Status.TODO.previewText()).toEqual("- [ ] => [x], name: 'Todo', type: 'TODO'.");
        expect(Status_1.Status.CANCELLED.previewText()).toEqual("- [-] => [ ], name: 'Cancelled', type: 'CANCELLED'.");
        expect(Status_1.Status.IN_PROGRESS.previewText()).toEqual("- [/] => [x], name: 'In Progress', type: 'IN_PROGRESS'.");
        expect(Status_1.Status.NON_TASK.previewText()).toEqual("- [Q] => [A], name: 'Non-Task', type: 'NON_TASK'.");
    });
    it('should initialize with valid properties', () => {
        // Arrange
        const symbol = '/';
        const name = 'In Progress';
        const next = 'x';
        // Act
        const status = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration(symbol, name, next, false, StatusConfiguration_1.StatusType.IN_PROGRESS));
        // Assert
        expect(status).not.toBeNull();
        expect(status.symbol).toEqual(symbol);
        expect(status.name).toEqual(name);
        expect(status.nextStatusSymbol).toEqual(next);
        expect(status.type).toEqual(StatusConfiguration_1.StatusType.IN_PROGRESS);
        expect(status.isCompleted()).toEqual(false);
    });
    it('should be complete when symbol is "x"', () => {
        // Arrange
        const symbol = 'x';
        const name = 'Done';
        const next = ' ';
        // Act
        const status = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration(symbol, name, next, false, StatusConfiguration_1.StatusType.DONE));
        // Assert
        expect(status).not.toBeNull();
        expect(status.symbol).toEqual(symbol);
        expect(status.name).toEqual(name);
        expect(status.nextStatusSymbol).toEqual(next);
        expect(status.isCompleted()).toEqual(true);
    });
    it('should deduce type for unknown symbols', () => {
        expect(Status_1.Status.getTypeForUnknownSymbol(' ')).toEqual(StatusConfiguration_1.StatusType.TODO);
        expect(Status_1.Status.getTypeForUnknownSymbol('!')).toEqual(StatusConfiguration_1.StatusType.TODO); // Unknown character treated as TODO
        expect(Status_1.Status.getTypeForUnknownSymbol('x')).toEqual(StatusConfiguration_1.StatusType.DONE);
        expect(Status_1.Status.getTypeForUnknownSymbol('X')).toEqual(StatusConfiguration_1.StatusType.DONE);
        expect(Status_1.Status.getTypeForUnknownSymbol('/')).toEqual(StatusConfiguration_1.StatusType.IN_PROGRESS);
        expect(Status_1.Status.getTypeForUnknownSymbol('-')).toEqual(StatusConfiguration_1.StatusType.CANCELLED);
        expect(Status_1.Status.getTypeForUnknownSymbol('')).toEqual(StatusConfiguration_1.StatusType.EMPTY);
    });
    it('should deduce type from StatusType text', () => {
        expect(Status_1.Status.getTypeFromStatusTypeString('TODO')).toEqual(StatusConfiguration_1.StatusType.TODO);
        expect(Status_1.Status.getTypeFromStatusTypeString('DONE')).toEqual(StatusConfiguration_1.StatusType.DONE);
        expect(Status_1.Status.getTypeFromStatusTypeString('IN_PROGRESS')).toEqual(StatusConfiguration_1.StatusType.IN_PROGRESS);
        expect(Status_1.Status.getTypeFromStatusTypeString('CANCELLED')).toEqual(StatusConfiguration_1.StatusType.CANCELLED);
        expect(Status_1.Status.getTypeFromStatusTypeString('NON_TASK')).toEqual(StatusConfiguration_1.StatusType.NON_TASK);
        expect(Status_1.Status.getTypeFromStatusTypeString('EMPTY')).toEqual(StatusConfiguration_1.StatusType.EMPTY);
        expect(Status_1.Status.getTypeFromStatusTypeString('i do not exist')).toEqual(StatusConfiguration_1.StatusType.TODO);
    });
    it('should construct a Status for unknown symbol', () => {
        // Arrange
        const symbol = '/';
        // Act
        const status = Status_1.Status.createUnknownStatus(symbol);
        // Assert
        expect(status).not.toBeNull();
        expect(status.symbol).toEqual(symbol);
        expect(status.name).toEqual('Unknown');
        expect(status.nextStatusSymbol).toEqual('x');
        // Even though the type *could* be deduced as IN_PROGRESS, createUnknownStatus() is used when
        // the user has not defined the meaning of a status symbol, so treat everything as TODO.
        expect(status.type).toEqual(StatusConfiguration_1.StatusType.TODO);
        expect(status.isCompleted()).toEqual(false);
    });
    it('should construct a Status from a core imported value', () => {
        const imported = ['/', 'in progress', 'x', 'IN_PROGRESS'];
        const status = Status_1.Status.createFromImportedValue(imported);
        expect(status.symbol).toEqual('/');
        expect(status.name).toEqual('in progress');
        expect(status.nextStatusSymbol).toEqual('x');
        expect(status.type).toEqual(StatusConfiguration_1.StatusType.IN_PROGRESS); // should deduce IN_PROGRESS from symbol '/'
        expect(status.availableAsCommand).toEqual(false);
    });
    it('should construct a Status from a custom imported value', () => {
        const imported = ['P', 'Pro', 'C', 'NON_TASK'];
        const status = Status_1.Status.createFromImportedValue(imported);
        expect(status.symbol).toEqual('P');
        expect(status.name).toEqual('Pro');
        expect(status.nextStatusSymbol).toEqual('C');
        expect(status.type).toEqual(StatusConfiguration_1.StatusType.NON_TASK);
        expect(status.availableAsCommand).toEqual(false);
    });
    it('should provide text with sorting comments for convenience of custom grouping', () => {
        const status = Status_1.Status.CANCELLED;
        expect(status.typeGroupText).toEqual('%%5%%CANCELLED');
    });
});
describe('identicalTo', () => {
    const symbol = 'P';
    const name = 'Pro';
    const nextStatusSymbol = 'C';
    const availableAsCommand = true;
    const type = StatusConfiguration_1.StatusType.TODO;
    it('should detect identical objects', () => {
        const lhs = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration(symbol, name, nextStatusSymbol, availableAsCommand, type));
        const rhs = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration(symbol, name, nextStatusSymbol, availableAsCommand, type));
        expect(lhs.identicalTo(rhs)).toEqual(true);
    });
    it('should check symbol', () => {
        const lhs = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration(symbol, name, nextStatusSymbol, availableAsCommand, type));
        const rhs = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration('Q', name, nextStatusSymbol, availableAsCommand, type));
        expect(lhs.identicalTo(rhs)).toEqual(false);
    });
    it('should check name', () => {
        const lhs = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration(symbol, name, nextStatusSymbol, availableAsCommand, type));
        const rhs = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration(symbol, 'Con', nextStatusSymbol, availableAsCommand, type));
        expect(lhs.identicalTo(rhs)).toEqual(false);
    });
    it('should check nextStatusSymbol', () => {
        const lhs = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration(symbol, name, nextStatusSymbol, availableAsCommand, type));
        const rhs = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration(symbol, name, ' ', availableAsCommand, type));
        expect(lhs.identicalTo(rhs)).toEqual(false);
    });
    it('should check availableAsCommand', () => {
        const lhs = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration(symbol, name, nextStatusSymbol, availableAsCommand, type));
        const rhs = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration(symbol, name, nextStatusSymbol, false, type));
        expect(lhs.identicalTo(rhs)).toEqual(false);
    });
    it('should check type', () => {
        const lhs = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration(symbol, name, nextStatusSymbol, availableAsCommand, StatusConfiguration_1.StatusType.CANCELLED));
        const rhs = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration(symbol, name, nextStatusSymbol, availableAsCommand, type));
        expect(lhs.identicalTo(rhs)).toEqual(false);
    });
});
//# sourceMappingURL=Status.test.js.map